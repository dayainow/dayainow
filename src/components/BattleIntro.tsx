import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { opponentFor, stageInCapsule } from '../campaign/league';
import type { Stage } from '../campaign/stages';
import { strings } from '../i18n';
import { palette } from '../theme';
import { DialogBox } from '../ui/DialogBox';
import { GameButton } from '../ui/GameButton';
import { Panel } from '../ui/Panel';
import { PieceImage } from '../ui/PieceImage';
import { Text } from '../ui/Text';
import { fonts } from '../ui/fonts';
import { useModalPresence } from '../ui/modalPresence';

const NATIVE = Platform.OS !== 'web';

// VS 글자에 잉크 외곽선을 두르는 방법: 잉크 글자를 사방으로 조금씩 밀어 깔고 그 위에 노란 글자
const OUTLINE: [number, number][] = [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2], [0, 6]];

// 단계 시작 화면: 레드(상대)와 블루(나)가 양쪽에서 미끄러져 들어오고 VS가 튀어나옴
export function BattleIntro({ visible, stage, onStart }: { visible: boolean; stage: Stage; onStart: () => void }) {
  const { height } = useWindowDimensions();
  useModalPresence(visible);
  // 짧은 화면에서는 몬스터를 줄여 대사 상자와 겹치지 않게
  const hero = Math.max(96, Math.min(150, Math.round((height - 470) / 2.2)));
  const halo = { width: hero + 16, height: hero + 16, borderRadius: (hero + 16) / 2 };
  const enter = useRef(new Animated.Value(0)).current;
  const vs = useRef(new Animated.Value(0)).current;
  const opponent = opponentFor(stage);
  const name = strings.league.opponents[opponent.index];
  const lineup = stage.removed.length
    ? strings.league.without(stage.removed.map(code => strings.pieces[code[1] as keyof typeof strings.pieces]).join('·'))
    : strings.league.fullTeam;

  useEffect(() => {
    if (!visible) return;
    enter.setValue(0);
    vs.setValue(0);
    Animated.sequence([
      Animated.timing(enter, { toValue: 1, duration: 380, useNativeDriver: NATIVE }),
      Animated.spring(vs, { toValue: 1, friction: 4, tension: 120, useNativeDriver: NATIVE }),
    ]).start();
  }, [visible]);

  const slide = (from: number) => ({
    opacity: enter,
    transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onStart} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.root}>
        <View style={styles.redHalf} />

        <View style={styles.top}>
          <Panel style={styles.label}>
            <Text style={styles.labelText}>
              {strings.league.stageLabel(stage.world, stageInCapsule(stage))}
              {opponent.isMaster ? ` · ${strings.league.master}` : ''}
            </Text>
          </Panel>
        </View>

        {/* 위에서 아래로: 레드(오른쪽) → VS → 블루(왼쪽). 화면 높이가 달라도 겹치지 않게 차례로 쌓음 */}
        <View style={styles.stage}>
          <Animated.View style={[styles.red, slide(160)]}>
            <View style={[styles.halo, halo]}>
              <PieceImage piece={opponent.avatar} size={hero} />
            </View>
            <Panel style={styles.plate}>
              <Text style={styles.plateText}>
                {name} <Text style={[styles.plateText, { color: palette.redDark }]}>{strings.league.level(opponent.level)}</Text>
              </Text>
            </Panel>
          </Animated.View>

          <Animated.View style={[styles.vs, { transform: [{ rotate: '-8deg' }, { scale: vs }] }]}>
            {OUTLINE.map(([x, y], i) => (
              <Text key={i} style={[styles.vsText, styles.vsInk, { transform: [{ translateX: x }, { translateY: y }] }]}>
                VS
              </Text>
            ))}
            <Text style={styles.vsText}>VS</Text>
          </Animated.View>

          <Animated.View style={[styles.blue, slide(-160)]}>
            <View style={[styles.halo, halo]}>
              <PieceImage piece="wP" size={hero} />
            </View>
            <Panel style={styles.plate}>
              <Text style={styles.plateText}>{strings.battle.me}</Text>
            </Panel>
          </Animated.View>
        </View>

        <View style={styles.bottom}>
          <DialogBox text={`${strings.league.challenge(name)}\n${strings.league.condition(stage.par)}\n${lineup}`} />
          <GameButton label={strings.league.start} onPress={onStart} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.blue, overflow: 'hidden' },
  // 대각선으로 나뉜 레드 영역 (아래 테두리가 잉크 경계선)
  redHalf: { position: 'absolute', left: '-40%', width: '180%', top: '-45%', height: '92%', backgroundColor: palette.red, borderBottomWidth: 7, borderColor: palette.ink, transform: [{ rotate: '-12deg' }] },
  top: { alignItems: 'center', marginTop: 48 },
  label: { paddingHorizontal: 16, paddingVertical: 6 },
  labelText: { fontSize: 16 },
  stage: { flex: 1, justifyContent: 'center', paddingHorizontal: 18 },
  red: { alignSelf: 'flex-end', alignItems: 'center' },
  blue: { alignSelf: 'flex-start', alignItems: 'center' },
  halo: { backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  plate: { marginTop: -8, paddingHorizontal: 14, paddingVertical: 5 },
  plateText: { fontSize: 17 },
  // 위아래 몬스터와 살짝 겹치게 해서 맞붙는 느낌
  vs: { alignSelf: 'center', marginTop: -4, marginBottom: -36, zIndex: 2 },
  vsText: { fontFamily: fonts.number, fontSize: 76, lineHeight: 92, color: palette.sun },
  vsInk: { position: 'absolute', color: palette.ink },
  bottom: { paddingHorizontal: 16, paddingBottom: 36, gap: 14 },
});

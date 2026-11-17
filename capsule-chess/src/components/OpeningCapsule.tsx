import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { feedback } from '../feedback/feedback';
import { useStrings } from '../i18n/LanguageProvider';
import { palette } from '../theme';
import { DialogBox } from '../ui/DialogBox';
import { GameButton } from '../ui/GameButton';
import { PieceImage } from '../ui/PieceImage';
import { Text } from '../ui/Text';
import { useModalPresence } from '../ui/modalPresence';

const NATIVE = Platform.OS !== 'web';
const CAPSULE = 190;
const STAGE_W = CAPSULE * 2.2;
const STAGE_H = CAPSULE * 1.75;
const BOTTOM_H = 270; // 열린 뒤 대사 + 버튼 자리 (열기 전엔 안내 문구)
const RAYS = 10;
// 캡슐에서 튀어나와 반원으로 늘어서는 블루 팀 (5×5 판의 첫 줄 + 양옆 폰, 가운데가 킹)
const TEAM = ['wP', 'wR', 'wN', 'wK', 'wB', 'wQ', 'wP'];
const KING = TEAM.indexOf('wK');

type Props = {
  visible: boolean;
  onBattle: () => void; // 바로 첫 배틀 (가이드와 함께)
  onLearn: () => void; // 기초 레슨부터
  onLater: () => void;
};

// 첫 실행에서 캡슐을 한 번 누르면 블루 팀이 등장
export function OpeningCapsule({ visible, onBattle, onLearn, onLater }: Props) {
  const strings = useStrings();
  useModalPresence(visible);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // 작은 화면에서는 캡슐 무대를 통째로 줄임
  const scale = Math.max(0.6, Math.min(1, (width - 24) / STAGE_W, (height - insets.top - insets.bottom - BOTTOM_H - 110) / STAGE_H));

  const [opened, setOpened] = useState(false);
  const idle = useRef(new Animated.Value(0)).current;
  const lid = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const team = useRef(TEAM.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) return;
    const sway = Animated.loop(
      Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(idle, { toValue: -1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
        Animated.timing(idle, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE }),
      ])
    );
    const rays = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: NATIVE }));
    if (!opened) sway.start();
    rays.start();
    return () => {
      sway.stop();
      rays.stop();
    };
  }, [visible, opened]);

  const tap = () => {
    if (opened) return;
    setOpened(true);
    idle.setValue(0);
    // 팡! 뚜껑이 날아가고 빛이 번진 뒤 팀이 하나씩 튀어나옴 (킹이 마지막)
    feedback.badge();
    const order = TEAM.map((_, i) => i).sort((a, b) => Number(a === KING) - Number(b === KING));
    Animated.parallel([
      Animated.timing(lid, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
      Animated.timing(flash, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }),
      Animated.sequence([
        Animated.delay(120),
        Animated.stagger(
          80,
          order.map(i => Animated.spring(team[i], { toValue: 1, friction: 5, tension: 110, useNativeDriver: NATIVE }))
        ),
      ]),
    ]).start();
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onLater} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
        <Animated.View
          style={[styles.rays, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}
        >
          {Array.from({ length: RAYS }, (_, i) => (
            <View key={i} style={[styles.ray, { transform: [{ rotate: `${(i * 180) / RAYS}deg` }] }]} />
          ))}
        </Animated.View>

        <Text style={styles.welcome}>{strings.opening.welcome}</Text>

        <View style={styles.stageWrap}>
          <View style={[styles.stage, { transform: [{ scale }] }]}>
            {/* 열리는 순간 번지는 빛 */}
            <Animated.View
              style={[
                styles.flash,
                {
                  opacity: flash.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.95, 0] }),
                  transform: [{ scale: flash.interpolate({ inputRange: [0, 1], outputRange: [0.4, 3.2] }) }],
                },
              ]}
            />

            {/* 블루 팀: 캡슐 위로 반원을 그리며 등장 */}
            {TEAM.map((piece, i) => {
              const angle = Math.PI * (1.06 + (0.88 * i) / (TEAM.length - 1));
              const king = i === KING;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.member,
                    king && styles.memberKing,
                    {
                      opacity: team[i].interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
                      transform: [
                        { translateX: team[i].interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * CAPSULE * 0.92] }) },
                        {
                          translateY: team[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [CAPSULE * 0.2, Math.sin(angle) * CAPSULE * (king ? 0.9 : 0.72)],
                          }),
                        },
                        { scale: team[i].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
                      ],
                    },
                  ]}
                >
                  <PieceImage piece={piece} size={king ? 92 : 68} />
                </Animated.View>
              );
            })}

            <Pressable onPress={tap} disabled={opened} style={styles.capsuleHit} accessibilityRole="button" accessibilityLabel={strings.opening.tap}>
              <Animated.View
                style={[styles.capsule, { transform: [{ rotate: idle.interpolate({ inputRange: [-1, 1], outputRange: ['-3deg', '3deg'] }) }] }]}
              >
                {/* 아래 반쪽 (버터색) */}
                <View style={styles.bottomHalf}>
                  <View style={styles.bottomShine} />
                </View>
                {/* 뚜껑: 하늘색 돔 + 물음표. 열리면 위로 날아감 */}
                <Animated.View
                  style={[
                    styles.lid,
                    {
                      opacity: lid.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
                      transform: [
                        { translateY: lid.interpolate({ inputRange: [0, 1], outputRange: [0, -CAPSULE * 1.2] }) },
                        { rotate: lid.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-35deg'] }) },
                      ],
                    },
                  ]}
                >
                  <View style={styles.dome}>
                    <View style={styles.shine} />
                    <Text style={styles.question}>?</Text>
                  </View>
                  <View style={styles.band} />
                </Animated.View>
              </Animated.View>
            </Pressable>
          </View>
        </View>

        <View style={styles.bottom}>
          {!opened ? (
            <View style={styles.promptWrap}>
              <Animated.View style={{ transform: [{ translateY: idle.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] }) }] }}>
                <Text style={styles.prompt}>{strings.opening.tap} 👆</Text>
              </Animated.View>
            </View>
          ) : (
            <>
              <DialogBox text={`${strings.opening.teamTitle}\n${strings.opening.teamBody}`} />
              <GameButton label={strings.opening.battle} onPress={onBattle} />
              <GameButton label={strings.opening.learn} onPress={onLearn} variant="white" size="sm" />
            </>
          )}
          <Pressable onPress={onLater} style={styles.later} accessibilityRole="button">
            <Text style={styles.laterText}>{strings.opening.later}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const half = CAPSULE / 2;
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', overflow: 'hidden' },
  rays: { position: 'absolute', top: '42%', width: 1200, height: 1200, marginTop: -600, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 1200, height: 70, backgroundColor: 'rgba(255,255,255,0.5)' },
  welcome: { fontSize: 26, textAlign: 'center', paddingHorizontal: 24 },
  stageWrap: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  stage: { width: STAGE_W, height: STAGE_H, alignItems: 'center', justifyContent: 'flex-end' },
  flash: { position: 'absolute', bottom: half * 0.5, width: CAPSULE, height: CAPSULE, borderRadius: half, backgroundColor: palette.white },
  member: { position: 'absolute', bottom: half * 0.6, alignItems: 'center' },
  memberKing: { zIndex: 2 },
  capsule: { width: CAPSULE, height: CAPSULE },
  capsuleHit: { borderRadius: half }, // 웹 포커스 테두리도 동그랗게
  bottomHalf: {
    position: 'absolute',
    bottom: 0,
    width: CAPSULE,
    height: half + 6,
    backgroundColor: palette.sun,
    borderWidth: 6,
    borderTopWidth: 0,
    borderColor: palette.ink,
    borderBottomLeftRadius: half,
    borderBottomRightRadius: half,
    overflow: 'hidden',
  },
  bottomShine: { position: 'absolute', right: 30, top: 22, width: 16, height: 34, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.6)', transform: [{ rotate: '-30deg' }] },
  lid: { position: 'absolute', top: 0, width: CAPSULE, height: half + 12 },
  dome: {
    width: CAPSULE,
    height: half + 2,
    backgroundColor: '#EAF6FF',
    borderWidth: 6,
    borderBottomWidth: 0,
    borderColor: palette.ink,
    borderTopLeftRadius: half,
    borderTopRightRadius: half,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  shine: { position: 'absolute', left: 26, top: 28, width: 18, height: 44, borderRadius: 9, backgroundColor: palette.white, transform: [{ rotate: '35deg' }] },
  question: { fontSize: 60, lineHeight: 72, color: palette.blue, marginBottom: -4 },
  band: { position: 'absolute', left: -8, right: -8, top: half - 6, height: 18, borderRadius: 9, backgroundColor: '#FFE38A', borderWidth: 5, borderColor: palette.ink },
  bottom: { width: '100%', maxWidth: 480, minHeight: BOTTOM_H, paddingHorizontal: 16, gap: 10, justifyContent: 'flex-end' },
  promptWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  prompt: { fontSize: 22 },
  later: { alignSelf: 'center', minHeight: 44, paddingHorizontal: 12, justifyContent: 'center' },
  laterText: { fontSize: 15, color: palette.inkSoft },
});

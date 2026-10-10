import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, StyleSheet, View } from 'react-native';
import { feedback } from '../feedback/feedback';
import { strings } from '../i18n';
import { palette } from '../theme';
import { DialogBox } from '../ui/DialogBox';
import { GameButton } from '../ui/GameButton';
import { PieceImage } from '../ui/PieceImage';
import { Text } from '../ui/Text';
import { hardShadow } from '../ui/textShadow';

const NATIVE = Platform.OS !== 'web';
const STAGE = 200; // 가운데 몬스터 크기
const RAYS = 12;
const SPARKLES: [string, string][] = [['12%', '22%'], ['82%', '18%'], ['16%', '58%'], ['86%', '54%'], ['50%', '10%'], ['64%', '66%']];

// 폰이 끝 줄에 닿으면: 폰과 퀸 실루엣이 번갈아 깜빡이다가 퀸이 짠 하고 나타나는 진화 연출
export function EvolutionOverlay({ side, onClose }: { side: 'w' | 'b' | null; onClose: () => void }) {
  const flicker = useRef(new Animated.Value(0)).current; // 0: 폰 실루엣, 1: 퀸 실루엣
  const reveal = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!side) return;
    setRevealed(false);
    flicker.setValue(0);
    reveal.setValue(0);
    const toggle = (to: number, ms: number) => Animated.timing(flicker, { toValue: to, duration: ms, useNativeDriver: NATIVE });
    // 점점 빨라지는 깜빡임 → 퀸 등장
    Animated.sequence([
      Animated.delay(250),
      toggle(1, 180), toggle(0, 180),
      toggle(1, 130), toggle(0, 130),
      toggle(1, 90), toggle(0, 90),
      toggle(1, 70),
      Animated.spring(reveal, { toValue: 1, friction: 5, tension: 90, useNativeDriver: NATIVE }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setRevealed(true);
      feedback.clear();
    });
    const rays = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: NATIVE }));
    rays.start();
    return () => rays.stop();
  }, [side]);

  if (!side) return null;
  const team = side === 'w' ? { bg: palette.blue, dark: palette.blueDark } : { bg: palette.red, dark: palette.redDark };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.root, { backgroundColor: team.bg }]}>
        <Animated.View style={[styles.rays, { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}>
          {Array.from({ length: RAYS }, (_, i) => (
            <View key={i} style={[styles.ray, { transform: [{ rotate: `${(i * 180) / RAYS}deg` }] }]} />
          ))}
        </Animated.View>
        <View style={styles.glow} />
        {SPARKLES.map(([left, top], i) => (
          <Text key={i} style={[styles.sparkle, { left, top } as object]}>
            ✦
          </Text>
        ))}

        <Text style={[styles.title, hardShadow(team.dark, 3)]}>✨ {strings.evolution.title} ✨</Text>

        <View style={styles.stage}>
          <Animated.View style={[styles.layer, { opacity: Animated.multiply(flicker.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })) }]}>
            <PieceImage piece={`${side}P`} size={STAGE} silhouette={palette.white} />
          </Animated.View>
          <Animated.View style={[styles.layer, { opacity: Animated.multiply(flicker, reveal.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })) }]}>
            <PieceImage piece={`${side}Q`} size={STAGE} silhouette={palette.white} />
          </Animated.View>
          <Animated.View
            style={[styles.layer, { opacity: reveal, transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }]}
          >
            <PieceImage piece={`${side}Q`} size={STAGE} />
          </Animated.View>
        </View>

        {revealed && (
          <View style={styles.bottom}>
            <DialogBox text={strings.evolution.line(strings.side[side])} />
            <GameButton label={strings.evolution.continue} onPress={onClose} />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  rays: { position: 'absolute', width: 900, height: 900, alignItems: 'center', justifyContent: 'center' },
  ray: { position: 'absolute', width: 900, height: 46, backgroundColor: 'rgba(255,255,255,0.13)' },
  glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.28)' },
  sparkle: { position: 'absolute', fontSize: 22, color: palette.sun },
  title: { position: 'absolute', top: '13%', fontSize: 32, color: palette.white },
  stage: { width: STAGE, height: STAGE },
  layer: { position: 'absolute', left: 0, top: 0 },
  bottom: { position: 'absolute', left: 16, right: 16, bottom: 40, gap: 14, maxWidth: 480, alignSelf: 'center' },
});

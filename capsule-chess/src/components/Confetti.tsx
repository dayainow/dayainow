import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { palette } from '../theme';

const PIECES = 28;
const DURATION = 1400;
const GRAVITY = 520; // 아래로 떨어지는 정도 (애니메이션 전체 기준 px)
const COLORS = [palette.mint, palette.butter, '#FF8C94', '#8EC5FF', palette.coralLight];
const STEPS = [0, 0.25, 0.5, 0.75, 1];

// 승리했을 때 캡슐 모양 색종이가 가운데서 팡 터져 나와 떨어짐
export function Confetti({ run }: { run: boolean }) {
  const progress = useRef(new Animated.Value(0)).current;

  // 터질 때마다 방향을 새로 섞음
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
        const speed = 160 + Math.random() * 140;
        return {
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          spin: (Math.random() - 0.5) * 900,
          color: COLORS[i % COLORS.length],
        };
      }),
    [run]
  );

  useEffect(() => {
    if (!run) return;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: DURATION, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [run]);

  if (!run) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.passThrough]}>
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.piece,
            {
              backgroundColor: p.color,
              opacity: progress.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
              transform: [
                { translateX: progress.interpolate({ inputRange: STEPS, outputRange: STEPS.map(t => p.vx * t) }) },
                // 포물선: 위로 튀었다가 중력으로 떨어짐
                { translateY: progress.interpolate({ inputRange: STEPS, outputRange: STEPS.map(t => p.vy * t + GRAVITY * t * t) }) },
                { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  passThrough: { pointerEvents: 'none' },
  piece: { position: 'absolute', left: '50%', top: '42%', width: 9, height: 15, marginLeft: -4.5, borderRadius: 5, borderWidth: 1.5, borderColor: palette.ink },
});

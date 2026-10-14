import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';

const NATIVE = Platform.OS !== 'web';

type Props = {
  // hop: 가끔 콩 뛰어오름 · pulse: 두근두근 커졌다 작아짐 · bob: 천천히 둥실둥실
  kind: 'hop' | 'pulse' | 'bob';
  delay?: number; // 여러 개가 한꺼번에 움직이지 않도록 시작을 늦춤
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

// 홈 화면의 마스코트·NEW 딱지·상대 얼굴이 살아 있는 것처럼 움직이게 감싸는 상자
export function Alive({ kind, delay = 0, style, children }: Props) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const step = (toValue: number, duration: number, easing: (v: number) => number) =>
      Animated.timing(t, { toValue, duration, easing, useNativeDriver: NATIVE });
    const cycle =
      kind === 'hop'
        ? [step(1, 170, Easing.out(Easing.quad)), step(0, 380, Easing.bounce), Animated.delay(2600)]
        : kind === 'pulse'
          ? [step(1, 520, Easing.inOut(Easing.sin)), step(0, 520, Easing.inOut(Easing.sin))]
          : [step(1, 1600, Easing.inOut(Easing.sin)), step(0, 1600, Easing.inOut(Easing.sin))];
    const loop = Animated.loop(Animated.sequence(cycle));
    const start = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(start);
      loop.stop();
    };
  }, [kind, delay]);

  const transform =
    kind === 'hop'
      ? [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) }]
      : kind === 'pulse'
        ? [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }]
        : [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [2, -3] }) }];

  return <Animated.View style={[style, { transform }]}>{children}</Animated.View>;
}

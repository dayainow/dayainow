import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { palette } from '../theme';
import { Panel } from './Panel';
import { PieceImage } from './PieceImage';
import { PowerBar } from './PowerBar';
import { Text } from './Text';
import { fonts } from './fonts';
import { hardShadow } from './textShadow';

const NATIVE = Platform.OS !== 'web';
const HIT_DELAY_MS = 180; // 기물이 도착해 잡히는 순간에 맞춤

type Props = {
  side: 'w' | 'b';
  avatar: string; // 'bN' 같은 기물 코드
  name: string;
  detail?: string; // 오른쪽 작은 글자 (Lv., 둔 수 등)
  power: number;
  maxPower: number;
  active?: boolean; // 지금 이 팀 차례
};

// 배틀 화면 위·아래의 팀 정보 창: 얼굴 + 이름 + 전력 게이지
// 기물을 잃으면 창이 흔들리고 "-3"처럼 잃은 전력이 떠오름
export function TeamPanel({ side, avatar, name, detail, power, maxPower, active = false }: Props) {
  const previous = useRef(power);
  const shake = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(1)).current;
  const [lost, setLost] = useState(0);

  useEffect(() => {
    const drop = previous.current - power;
    previous.current = power;
    if (drop <= 0) return; // 무르기·새 판으로 늘어난 건 연출 없음
    setLost(drop);
    shake.setValue(0);
    float.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.delay(HIT_DELAY_MS),
        ...[1, -1, 0.6, -0.6, 0].map(to => Animated.timing(shake, { toValue: to, duration: 55, useNativeDriver: NATIVE })),
      ]),
      Animated.sequence([Animated.delay(HIT_DELAY_MS), Animated.timing(float, { toValue: 1, duration: 900, useNativeDriver: NATIVE })]),
    ]).start();
  }, [power]);

  return (
    <Animated.View style={{ transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] }) }] }}>
      <Panel style={[styles.panel, active && styles.active]}>
        <View style={[styles.avatar, { backgroundColor: side === 'w' ? palette.blueLight : palette.redLight }]}>
          <PieceImage piece={avatar} size={36} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {detail ? <Text style={styles.detail}>{detail}</Text> : null}
          </View>
          <PowerBar value={power} max={maxPower} />
        </View>
        {lost > 0 && (
          <Animated.Text
            style={[
              styles.damage,
              {
                opacity: float.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] }),
                transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [6, -26] }) }],
              },
            ]}
          >
            -{lost}
          </Animated.Text>
        )}
      </Panel>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 7 },
  // 차례인 팀은 연노랑 바탕으로 표시
  active: { borderColor: palette.ink, backgroundColor: palette.sunLight },
  avatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 2.5, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 },
  name: { flexShrink: 1, fontSize: 16 },
  detail: { fontSize: 13, color: palette.inkSoft },
  damage: { position: 'absolute', right: 14, top: 0, fontFamily: fonts.number, fontSize: 24, color: palette.red, ...hardShadow(palette.ink, 2), pointerEvents: 'none' },
});

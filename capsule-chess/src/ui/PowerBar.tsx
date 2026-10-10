import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { strings } from '../i18n';
import { palette } from '../theme';
import { Text } from './Text';
import { fonts } from './fonts';

// 전력 게이지: 기물을 잃으면 스르륵 줄어들고, 절반 아래면 노랑 → 4분의 1 아래면 빨강
export function PowerBar({ value, max }: { value: number; max: number }) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const width = useRef(new Animated.Value(ratio)).current;

  useEffect(() => {
    Animated.timing(width, { toValue: ratio, duration: 450, useNativeDriver: false }).start();
  }, [ratio]);

  const color = ratio > 0.5 ? palette.hpGreen : ratio > 0.25 ? palette.sun : palette.red;

  return (
    <View style={styles.row}>
      <View style={styles.label}>
        <Text style={styles.labelText}>{strings.battle.power}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[styles.fill, { backgroundColor: color, width: width.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { backgroundColor: palette.ink, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  labelText: { fontSize: 11, color: palette.sun },
  track: { flex: 1, height: 13, borderWidth: 2.5, borderColor: palette.ink, borderRadius: 7, backgroundColor: '#E9E4EF', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  value: { minWidth: 20, textAlign: 'right', fontSize: 13, fontFamily: fonts.number },
});

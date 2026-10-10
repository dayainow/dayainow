import React from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { palette } from '../theme';
import { Text } from './Text';

// 작은 알약 모양 표시 (🔥 6, ★ 23, 기물 특징 등)
export function Chip({ label, color = palette.white, style }: { label: string; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.chip, { backgroundColor: color }, style]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 2.5, borderColor: palette.ink, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  label: { fontSize: 15 },
});

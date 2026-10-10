import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { palette } from '../theme';

type Props = ViewProps & { color?: string };

// RPG 창: 굵은 잉크 외곽선 + 아래쪽 두꺼운 테두리로 살짝 떠 있는 느낌
export function Panel({ color = palette.white, style, ...props }: Props) {
  return <View {...props} style={[styles.panel, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  panel: { borderWidth: 3, borderBottomWidth: 6, borderColor: palette.ink, borderRadius: 18 },
});

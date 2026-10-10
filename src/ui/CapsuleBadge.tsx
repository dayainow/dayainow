import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CAPSULES } from '../campaign/league';
import { palette } from '../theme';
import { PieceImage } from './PieceImage';

// 캡슐 배지: 받기 전에는 회색 실루엣
export function CapsuleBadge({ capsule, earned, size = 52 }: { capsule: number; earned: boolean; size?: number }) {
  const info = CAPSULES[capsule - 1];
  return (
    <View
      style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: earned ? info.color : '#E6E3EC' }]}
    >
      <PieceImage piece={`w${info.badgePiece}`} size={size * 0.8} silhouette={earned ? undefined : '#C9C4D3'} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderWidth: 3, borderBottomWidth: 5, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { GameStatus } from '../engine/chessEngine';
import { strings } from '../i18n';
import { palette, sideColors } from '../theme';

// AI 대전에서는 "내 차례 / AI가 생각 중…", 2인 대전에서는 "블루 차례 / 레드 차례"
export function TurnBadge({ turn, status, vsAi }: { turn: 'w' | 'b'; status: GameStatus; vsAi: boolean }) {
  const label = vsAi ? (turn === 'w' ? strings.game.yourTurn : strings.game.aiThinking) : strings.game.sideTurn(strings.side[turn]);
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: sideColors[turn] }]} />
      <Text style={styles.text}>{label}</Text>
      {status === 'check' && <Text style={styles.check}>{strings.check}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: palette.white, borderRadius: 20, borderWidth: 1, borderColor: palette.line },
  dot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: palette.ink },
  text: { fontSize: 16, fontWeight: '700', color: palette.ink },
  check: { fontSize: 16, color: palette.danger, fontWeight: '900' },
});

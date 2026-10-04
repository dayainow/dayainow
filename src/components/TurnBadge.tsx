import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { GameStatus } from '../engine/chessEngine';
import { strings } from '../i18n';
import { palette, sideColors } from '../theme';

export function TurnBadge({ turn, status }: { turn: 'w' | 'b'; status: GameStatus }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        {strings.turnLabel}
        <Text style={{ color: sideColors[turn], fontWeight: 'bold' }}>{strings.side[turn]}</Text>
        {status === 'check' && <Text style={styles.check}>  {strings.check}</Text>}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: palette.white, borderRadius: 20, borderWidth: 1, borderColor: palette.line },
  text: { fontSize: 16, color: palette.ink },
  check: { color: palette.danger, fontWeight: '900' },
});

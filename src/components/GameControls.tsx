import React from 'react';
import { StyleSheet, View } from 'react-native';
import { strings } from '../i18n';
import { GameButton } from '../ui/GameButton';

// 보드 아래 버튼 줄: 무르기 + 처음부터
export function GameControls({ canUndo, onUndo, onRestart }: { canUndo: boolean; onUndo: () => void; onRestart: () => void }) {
  return (
    <View style={styles.row}>
      <GameButton label={strings.game.undo} onPress={onUndo} disabled={!canUndo} variant="white" size="sm" style={styles.button} />
      <GameButton label={strings.game.restart} onPress={onRestart} variant="white" size="sm" style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  button: { flex: 1 },
});

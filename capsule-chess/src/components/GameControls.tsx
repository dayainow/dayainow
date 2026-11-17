import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useStrings } from '../i18n/LanguageProvider';
import { GameButton } from '../ui/GameButton';

// 보드 아래 버튼 줄: 무르기 + 처음부터
export function GameControls({ canUndo, onUndo, onRestart, hint }: { canUndo: boolean; onUndo: () => void; onRestart: () => void; hint?: { label: string; disabled: boolean; onPress: () => void } }) {
  const strings = useStrings();
  return (
    <View style={styles.row}>
      {hint && <GameButton label={hint.label} onPress={hint.onPress} disabled={hint.disabled} variant="white" size="sm" style={styles.button} />}
      <GameButton label={strings.game.undo} onPress={onUndo} disabled={!canUndo} variant="white" size="sm" style={styles.button} />
      <GameButton label={strings.game.restart} onPress={onRestart} variant="white" size="sm" style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  button: { flex: 1, paddingHorizontal: 5 },
});

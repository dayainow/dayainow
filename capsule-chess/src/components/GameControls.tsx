import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { strings } from '../i18n';
import { palette } from '../theme';

// 보드 아래 버튼 줄: 무르기 + 처음부터
export function GameControls({ canUndo, onUndo, onRestart }: { canUndo: boolean; onUndo: () => void; onRestart: () => void }) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.button, !canUndo && styles.disabled]} onPress={onUndo} disabled={!canUndo}>
        <Text style={[styles.label, !canUndo && styles.labelDisabled]}>{strings.game.undo}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.dark]} onPress={onRestart}>
        <Text style={[styles.label, styles.labelLight]}>{strings.game.restart}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  button: { minWidth: 128, alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 26, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.white },
  dark: { backgroundColor: palette.ink },
  disabled: { borderColor: palette.line },
  label: { fontSize: 16, fontWeight: '800', color: palette.ink },
  labelLight: { color: palette.white },
  labelDisabled: { color: palette.line },
});

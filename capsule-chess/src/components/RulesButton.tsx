import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { strings } from '../i18n';
import { type RulesSource, useOpenRules } from '../rules/RulesProvider';
import { palette } from '../theme';
import { Text } from '../ui/Text';

// 규칙 안내를 여는 노란 ? 버튼 (홈 트레이너 카드와 모든 화면 헤더)
export function RulesButton({ source }: { source: RulesSource }) {
  const openRules = useOpenRules();

  return (
    <Pressable
      style={[styles.button, source === 'header' && styles.header]}
      onPress={() => openRules(source)}
      accessibilityRole="button"
      accessibilityLabel={strings.rules.open}
      hitSlop={6}
    >
      <Text style={styles.mark}>?</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 38, height: 38, borderRadius: 19, borderWidth: 2.5, borderBottomWidth: 4, borderColor: palette.ink, backgroundColor: palette.sun, alignItems: 'center', justifyContent: 'center' },
  // 웹 헤더는 오른쪽 여백이 없어서 직접 띄움
  header: { width: 34, height: 34, borderRadius: 17, marginRight: Platform.OS === 'web' ? 16 : 0 },
  mark: { fontSize: 18, lineHeight: 22 },
});

import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { strings } from '../i18n';
import { type RulesSource, useOpenRules } from '../rules/RulesProvider';
import { palette } from '../theme';

type Props = { source: RulesSource; labeled?: boolean };

// 규칙 안내를 여는 ? 버튼. 홈에서는 "? 규칙"으로 글자까지 보여 줌
export function RulesButton({ source, labeled = false }: Props) {
  const openRules = useOpenRules();

  return (
    <TouchableOpacity
      style={labeled ? styles.labeled : styles.round}
      onPress={() => openRules(source)}
      accessibilityRole="button"
      accessibilityLabel={strings.rules.open}
      hitSlop={6}
    >
      <View style={[styles.mark, labeled && styles.markLabeled]}>
        <Text style={[styles.markText, labeled && styles.markTextLabeled]}>?</Text>
      </View>
      {labeled && <Text style={styles.label}>{strings.rules.button}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // 헤더용 동그란 버튼 (웹 헤더는 오른쪽 여백이 없어서 직접 띄움)
  round: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.butter, alignItems: 'center', justifyContent: 'center', marginRight: Platform.OS === 'web' ? 16 : 0 },
  labeled: { height: 40, borderRadius: 20, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 6, paddingRight: 14 },
  mark: { alignItems: 'center', justifyContent: 'center' },
  markLabeled: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.butter, borderWidth: 2, borderColor: palette.ink },
  markText: { fontSize: 17, fontWeight: '900', color: palette.ink, lineHeight: 20 },
  markTextLabeled: { fontSize: 14, lineHeight: 17 },
  label: { fontSize: 15, fontWeight: '800', color: palette.ink },
});

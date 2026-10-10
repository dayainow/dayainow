import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme';

export type RuleItem = { icon: string; title: string; body: string };

type Props = { items: RuleItem[]; compact?: boolean };

// 아이콘 동그라미 + 제목 + 한 줄 설명 목록 (규칙 안내, 환영 안내, 배우기 화면에서 함께 씀)
export function RuleList({ items, compact = false }: Props) {
  return (
    <View style={[styles.list, compact && styles.listCompact]}>
      {items.map(item => (
        <View key={item.title} style={styles.item}>
          <View style={[styles.icon, compact && styles.iconCompact]}>
            <Text style={[styles.iconText, compact && styles.iconTextCompact]}>{item.icon}</Text>
          </View>
          <View style={styles.texts}>
            <Text style={[styles.title, compact && styles.titleCompact]}>{item.title}</Text>
            <Text style={[styles.body, compact && styles.bodyCompact]}>{item.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  listCompact: { gap: 9 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.mintLight, alignItems: 'center', justifyContent: 'center' },
  iconCompact: { width: 34, height: 34, borderRadius: 17 },
  iconText: { fontSize: 20 },
  iconTextCompact: { fontSize: 16 },
  texts: { flex: 1, gap: 1 },
  title: { fontSize: 15, fontWeight: '900', color: palette.ink },
  titleCompact: { fontSize: 14 },
  body: { fontSize: 13, color: palette.inkSoft, lineHeight: 18 },
  bodyCompact: { fontSize: 12, lineHeight: 17 },
});

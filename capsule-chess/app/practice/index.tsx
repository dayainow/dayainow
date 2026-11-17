import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBilling } from '../../src/billing/BillingProvider';
import { FREE_PUZZLES } from '../../src/billing/products';
import { useStrings } from '../../src/i18n/LanguageProvider';
import { PRACTICE_COUNT, PRACTICE_SECTIONS, isPracticeUnlocked, nextPracticeNumber } from '../../src/puzzles/practice';
import { type Progress, emptyProgress, loadProgress } from '../../src/storage/progress';
import { palette } from '../../src/theme';
import { GameButton } from '../../src/ui/GameButton';
import { Panel } from '../../src/ui/Panel';
import { Text } from '../../src/ui/Text';

// 퍼즐 도장 목록: 1수 → 2수 → 3수 구간별 번호 칸. 푼 것은 ✓, 다음 문제는 노랑, 아직 잠긴 것은 회색
export default function PracticeScreen() {
  const strings = useStrings();
  const { owned, supported } = useBilling();
  const [progress, setProgress] = useState<Progress>(emptyProgress);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const availableCount = owned ? PRACTICE_COUNT : FREE_PUZZLES;
  const solvedCount = Object.keys(progress.practice).filter(n => Number(n) <= availableCount).length;
  const candidate = nextPracticeNumber(progress.practice);
  const next = candidate && candidate <= availableCount ? candidate : null;

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Panel color={palette.sun} style={styles.summary}>
          <Text style={styles.summaryText}>{next ? strings.practice.tileInfo(solvedCount, availableCount) : owned ? strings.practice.allSolved : strings.billing.sampleSolved}</Text>
          {next ? <GameButton label={`#${next} ▶`} onPress={() => router.push(`/practice/${next}`)} variant="white" size="sm" /> : null}
        </Panel>

        {PRACTICE_SECTIONS.filter(section => section.from <= availableCount).map(section => {
          const end = Math.min(availableCount, section.to);
          return (
            <Panel key={section.mateIn} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {strings.practice.section(section.mateIn)} · {section.from}–{end}
              </Text>
              <View style={styles.grid}>
                {Array.from({ length: end - section.from + 1 }, (_, i) => {
                  const n = section.from + i;
                  const done = !!progress.practice[n];
                  const open = isPracticeUnlocked(progress.practice, n);
                  return (
                    <Pressable
                      key={n}
                      disabled={!open}
                      onPress={() => router.push(`/practice/${n}`)}
                      style={[styles.cell, done && styles.cellDone, n === next && styles.cellNext, !open && styles.cellLocked]}
                      accessibilityLabel={strings.practice.puzzleTitle(n)}
                    >
                      <Text style={[styles.cellText, !open && styles.cellTextLocked]}>{done ? '✓' : open ? n : '·'}</Text>
                    </Pressable>
                  );
              })}
            </View>
          </Panel>
          );
        })}
        {!owned && supported && (
          <GameButton label={strings.billing.morePuzzles} onPress={() => router.push('/unlock')} variant="mint" />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 14, alignSelf: 'center', width: '100%', maxWidth: 480 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  summaryText: { flexShrink: 1, fontSize: 18 },
  section: { padding: 12, gap: 10 },
  sectionTitle: { fontSize: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: 44, height: 44, borderRadius: 12, borderWidth: 2.5, borderBottomWidth: 4, borderColor: palette.ink, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  cellDone: { backgroundColor: palette.mintLight },
  cellNext: { backgroundColor: palette.sun },
  cellLocked: { backgroundColor: palette.line, borderColor: '#B9C3CF' },
  cellText: { fontSize: 16 },
  cellTextLocked: { color: '#9AA6B4' },
});

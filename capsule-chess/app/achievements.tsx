import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ACHIEVEMENTS } from '../src/achievements/list';
import { strings } from '../src/i18n';
import { type Progress, emptyProgress, loadProgress } from '../src/storage/progress';
import { palette } from '../src/theme';
import { Panel } from '../src/ui/Panel';
import { Text } from '../src/ui/Text';

// 업적 모음: 달성한 것은 색깔 스티커, 아직인 것은 회색 + 조건
export default function AchievementsScreen() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const done = ACHIEVEMENTS.filter(a => progress.achievements[a.id]).length;

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.summary}>{strings.achievements.progress(done, ACHIEVEMENTS.length)}</Text>
        <View style={styles.grid}>
          {ACHIEVEMENTS.map(a => {
            const date = progress.achievements[a.id];
            const text = strings.achievements.items[a.id];
            return (
              <Panel key={a.id} color={date ? palette.white : '#EEF2F7'} style={styles.card}>
                <View style={[styles.icon, { backgroundColor: date ? a.color : '#D9DEE6' }]}>
                  <Text style={[styles.iconText, !date && styles.iconLocked]}>{a.icon}</Text>
                </View>
                <Text style={[styles.title, !date && styles.titleLocked]} numberOfLines={1}>
                  {text.title}
                </Text>
                <Text style={styles.desc} numberOfLines={3}>
                  {text.desc}
                </Text>
                {date ? <Text style={styles.date}>{date}</Text> : null}
              </Panel>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 12, alignSelf: 'center', width: '100%', maxWidth: 480 },
  summary: { fontSize: 16, color: palette.inkSoft, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  card: { width: '48.5%', alignItems: 'center', paddingHorizontal: 10, paddingTop: 12, paddingBottom: 10, gap: 4 },
  icon: { width: 54, height: 54, borderRadius: 27, borderWidth: 3, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 26 },
  iconLocked: { opacity: 0.35 },
  title: { fontSize: 17, marginTop: 2 },
  titleLocked: { color: palette.inkSoft },
  desc: { fontSize: 12, color: palette.inkSoft, textAlign: 'center', lineHeight: 16 },
  date: { fontSize: 11, color: palette.mintDark },
});

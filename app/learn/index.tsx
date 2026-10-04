import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { strings } from '../../src/i18n';
import { type Progress, emptyProgress, loadProgress } from '../../src/storage/progress';
import { palette } from '../../src/theme';
import { LESSONS } from '../../src/tutorial/lessons';

type LessonId = keyof typeof strings.tutorial.lessons;

export default function LearnScreen() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>{strings.tutorial.rulesTitle}</Text>
          {strings.tutorial.rules.map(rule => (
            <Text key={rule} style={styles.rule}>
              • {rule}
            </Text>
          ))}
        </View>

        {LESSONS.map((lesson, i) => {
          const done = !!progress.tutorial[lesson.id];
          return (
            <TouchableOpacity key={lesson.id} style={[styles.lesson, done && styles.lessonDone]} onPress={() => router.push(`/learn/${lesson.id}`)}>
              <Text style={styles.lessonNumber}>{i + 1}</Text>
              <Text style={styles.lessonTitle}>{strings.tutorial.lessons[lesson.id as LessonId].title}</Text>
              <Text style={styles.lessonCheck}>{done ? '✓' : ''}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.mintMist },
  content: { padding: 20, gap: 10, alignItems: 'stretch', maxWidth: 460, width: '100%', alignSelf: 'center' },
  rulesCard: { backgroundColor: palette.white, borderRadius: 18, borderWidth: 2, borderColor: palette.ink, padding: 16, marginBottom: 6 },
  rulesTitle: { fontSize: 16, fontWeight: '800', color: palette.ink, marginBottom: 6 },
  rule: { fontSize: 14, color: palette.ink, lineHeight: 22 },
  lesson: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderRadius: 16, borderWidth: 2, borderColor: palette.ink, paddingVertical: 12, paddingHorizontal: 16 },
  lessonDone: { backgroundColor: palette.mintLight },
  lessonNumber: { width: 28, fontSize: 16, fontWeight: '900', color: palette.inkSoft },
  lessonTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: palette.ink },
  lessonCheck: { fontSize: 18, fontWeight: '900', color: palette.mintDark },
});

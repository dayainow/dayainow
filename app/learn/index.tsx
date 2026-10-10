import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RuleList } from '../../src/components/RuleList';
import { strings } from '../../src/i18n';
import { useOpenRules } from '../../src/rules/RulesProvider';
import { type Progress, emptyProgress, loadProgress } from '../../src/storage/progress';
import { palette } from '../../src/theme';
import { LESSONS, LESSON_PIECE } from '../../src/tutorial/lessons';
import { Panel } from '../../src/ui/Panel';
import { PieceImage } from '../../src/ui/PieceImage';
import { Text } from '../../src/ui/Text';

type LessonId = keyof typeof strings.tutorial.lessons;

export default function LearnScreen() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const openRules = useOpenRules();

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Panel style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>{strings.onboarding.rulesTitle}</Text>
          <RuleList items={strings.rules.diffs} compact />
          <Pressable style={styles.rulesLink} onPress={() => openRules('learn')}>
            <Text style={styles.rulesLinkText}>{strings.rules.viewAll} ›</Text>
          </Pressable>
        </Panel>

        {LESSONS.map((lesson, i) => {
          const done = !!progress.tutorial[lesson.id];
          return (
            <Pressable key={lesson.id} onPress={() => router.push(`/learn/${lesson.id}`)}>
              <Panel color={done ? palette.mintLight : palette.white} style={styles.lesson}>
                <Text style={styles.lessonNumber}>{i + 1}</Text>
                <PieceImage piece={LESSON_PIECE[lesson.id] ?? 'wK'} size={38} />
                <Text style={styles.lessonTitle}>{strings.tutorial.lessons[lesson.id as LessonId].title}</Text>
                <Text style={styles.lessonCheck}>{done ? '✓' : '›'}</Text>
              </Panel>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 10, alignSelf: 'center', width: '100%', maxWidth: 480 },
  rulesCard: { padding: 14, marginBottom: 6 },
  rulesTitle: { fontSize: 18, marginBottom: 10 },
  rulesLink: { alignSelf: 'flex-end', marginTop: 8 },
  rulesLinkText: { fontSize: 15, color: palette.blueDark },
  lesson: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, paddingHorizontal: 14 },
  lessonNumber: { width: 20, fontSize: 17, color: palette.inkSoft },
  lessonTitle: { flex: 1, fontSize: 18 },
  lessonCheck: { fontSize: 20, color: palette.mintDark },
});

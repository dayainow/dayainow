import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChessBoard } from '../../src/components/ChessBoard';
import { ResultModal } from '../../src/components/ResultModal';
import { type Move, findKing, isInCheck, simulateMove } from '../../src/engine/chessEngine';
import { isCheckmated } from '../../src/engine/mateSolver';
import { feedback } from '../../src/feedback/feedback';
import { strings } from '../../src/i18n';
import { recordLessonDone } from '../../src/storage/progress';
import { palette } from '../../src/theme';
import { LESSONS, type Lesson, getLesson, nextLesson } from '../../src/tutorial/lessons';

type LessonId = keyof typeof strings.tutorial.lessons;

export default function LessonRoute() {
  const { lesson: id } = useLocalSearchParams<{ lesson: string }>();
  const lesson = getLesson(String(id));
  if (!lesson) return <Redirect href="/learn" />;
  // 다음 레슨으로 넘어가면 상태가 새로 시작되도록 key로 다시 마운트
  return <LessonPlay key={lesson.id} lesson={lesson} />;
}

function LessonPlay({ lesson }: { lesson: Lesson }) {
  const text = strings.tutorial.lessons[lesson.id as LessonId];
  const next = nextLesson(lesson.id);
  const [board, setBoard] = useState(lesson.board);
  const [stars, setStars] = useState(lesson.stars);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [done, setDone] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const restart = () => {
    setBoard(lesson.board);
    setStars(lesson.stars);
    setLastMove(null);
    setDone(false);
    setMessage(null);
  };

  const complete = () => {
    setDone(true);
    recordLessonDone(lesson.id);
    // 마지막 레슨이면 졸업 축하, 아니면 짧은 통과음
    timer.current = setTimeout(() => {
      if (next) feedback.clear();
      else {
        feedback.win();
        setShowFinish(true);
      }
    }, 300);
  };

  // 튜토리얼에서는 블루만 계속 둠 (레드는 움직이지 않는 목표물)
  const handleMove = (move: Move) => {
    const after = simulateMove(board, move);
    setBoard(after);
    setLastMove(move);
    setMessage(null);

    if (lesson.kind === 'stars') {
      const left = stars.filter(s => !(s.r === move.toR && s.c === move.toC));
      if (left.length < stars.length) feedback.star();
      setStars(left);
      if (left.length === 0) complete();
    } else if (lesson.kind === 'escape') {
      // 둘 수 있는 수는 모두 체크를 벗어나는 수
      complete();
    } else if (isCheckmated('b', after)) {
      complete();
    } else {
      setMessage(strings.tutorial.notMate);
      feedback.wrong();
      timer.current = setTimeout(restart, 900);
    }
  };

  const checkedSide = isInCheck('w', board) ? 'w' : isInCheck('b', board) ? 'b' : null;

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen options={{ title: strings.tutorial.lessonLabel(LESSONS.indexOf(lesson) + 1, LESSONS.length) }} />
      <View style={styles.header}>
        <Text style={styles.title}>{text.title}</Text>
        <Text style={styles.body}>{text.body}</Text>
        {done ? (
          <Text style={styles.done}>{strings.tutorial.done}</Text>
        ) : message ? (
          <Text style={styles.message}>{message}</Text>
        ) : lesson.kind === 'stars' ? (
          <Text style={styles.status}>{strings.tutorial.starsLeft(stars.length)}</Text>
        ) : null}
      </View>

      <ChessBoard
        board={board}
        sideToMove="w"
        interactive={!done}
        lastMove={lastMove}
        checkedKing={checkedSide ? findKing(checkedSide, board) : null}
        onMove={handleMove}
        markers={stars}
      />

      {done && next ? (
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace(`/learn/${next.id}`)}>
          <Text style={styles.primaryText}>{strings.tutorial.next}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.secondaryButton} onPress={restart}>
          <Text style={styles.secondaryText}>{strings.tutorial.restart}</Text>
        </TouchableOpacity>
      )}

      <ResultModal
        visible={showFinish}
        emoji="🎓"
        celebrate
        title={strings.tutorial.finishTitle}
        detail={strings.tutorial.finishDetail}
        primary={{ label: strings.tutorial.toCampaign, onPress: () => router.replace('/campaign') }}
        secondary={{
          label: strings.home.learn,
          onPress: () => {
            setShowFinish(false);
            router.back();
          },
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.mintMist, alignItems: 'center', paddingBottom: 20 },
  header: { alignItems: 'center', marginTop: 4, paddingHorizontal: 24, gap: 6, maxWidth: 460 },
  title: { fontSize: 22, fontWeight: '900', color: palette.ink },
  body: { fontSize: 15, color: palette.ink, textAlign: 'center', lineHeight: 22 },
  status: { fontSize: 14, fontWeight: '700', color: palette.inkSoft },
  done: { fontSize: 16, fontWeight: '900', color: palette.mintDark },
  message: { fontSize: 14, fontWeight: '700', color: palette.danger, textAlign: 'center' },
  primaryButton: { backgroundColor: palette.butter, borderWidth: 2, borderColor: palette.ink, paddingHorizontal: 34, paddingVertical: 12, borderRadius: 30 },
  primaryText: { color: palette.ink, fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: palette.white, borderWidth: 2, borderColor: palette.line, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
  secondaryText: { color: palette.inkSoft, fontSize: 16, fontWeight: 'bold' },
});

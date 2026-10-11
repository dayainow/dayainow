import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChessBoard } from '../../src/components/ChessBoard';
import { EvolutionOverlay } from '../../src/components/EvolutionOverlay';
import { ResultModal } from '../../src/components/ResultModal';
import { type Move, findKing, isInCheck, simulateMove } from '../../src/engine/chessEngine';
import { isCheckmated } from '../../src/engine/mateSolver';
import { track } from '../../src/analytics';
import { feedback } from '../../src/feedback/feedback';
import { strings } from '../../src/i18n';
import { recordLessonDone, recordStat } from '../../src/storage/progress';
import { palette } from '../../src/theme';
import { DialogBox } from '../../src/ui/DialogBox';
import { GameButton } from '../../src/ui/GameButton';
import { MascotFace } from '../../src/ui/MascotFace';
import { Panel } from '../../src/ui/Panel';
import { PieceImage } from '../../src/ui/PieceImage';
import { Text } from '../../src/ui/Text';
import { LESSONS, LESSON_PIECE, type Lesson, getLesson, nextLesson } from '../../src/tutorial/lessons';

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
  const [evolving, setEvolving] = useState<'w' | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const evolveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      clearTimeout(evolveTimer.current);
    },
    []
  );

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
    track('lesson_complete', { lesson: lesson.id });
    if (!next) track('tutorial_complete', {});
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
    // 폰이 끝 줄에 닿으면 진화 연출 (폰 레슨의 마지막 ★)
    if (board[move.fromR][move.fromC] === 'wP' && move.toR === 0) {
      evolveTimer.current = setTimeout(() => setEvolving('w'), 420);
      recordStat('evolutions');
    }
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
      <View style={styles.column}>
        <Panel style={styles.header}>
          <PieceImage piece={LESSON_PIECE[lesson.id] ?? 'wK'} size={48} />
          <View style={styles.headerBody}>
            <Text style={styles.title}>{text.title}</Text>
            {done ? (
              <Text style={styles.done}>{strings.tutorial.done}</Text>
            ) : lesson.kind === 'stars' ? (
              <Text style={styles.status}>{strings.tutorial.starsLeft(stars.length)}</Text>
            ) : null}
          </View>
        </Panel>
        <DialogBox text={message ?? text.body} />
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

      <View style={styles.column}>
        {done && next ? (
          <GameButton label={`${strings.tutorial.next} ▶`} onPress={() => router.replace(`/learn/${next.id}`)} />
        ) : (
          <GameButton label={strings.tutorial.restart} onPress={restart} variant="white" />
        )}
      </View>

      <EvolutionOverlay side={evolving} onClose={() => setEvolving(null)} />

      <ResultModal
        visible={showFinish}
        art={<MascotFace mood="happy" size={100} />}
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
  container: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 16 },
  column: { alignSelf: 'stretch', width: '100%', maxWidth: 480, marginHorizontal: 'auto', paddingHorizontal: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 6 },
  headerBody: { flex: 1 },
  title: { fontSize: 22 },
  status: { fontSize: 14, color: palette.inkSoft },
  done: { fontSize: 15, color: palette.mintDark },
});

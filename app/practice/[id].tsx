import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { track } from '../../src/analytics';
import { ChessBoard } from '../../src/components/ChessBoard';
import { ResultModal } from '../../src/components/ResultModal';
import { usePuzzle } from '../../src/game/usePuzzle';
import { strings } from '../../src/i18n';
import { type PracticePuzzle, getPracticePuzzle, isPracticeUnlocked } from '../../src/puzzles/practice';
import { loadProgress, recordPracticeSolve } from '../../src/storage/progress';
import { palette } from '../../src/theme';
import { Chip } from '../../src/ui/Chip';
import { DialogBox } from '../../src/ui/DialogBox';
import { GameButton } from '../../src/ui/GameButton';
import { MascotFace } from '../../src/ui/MascotFace';
import { Panel } from '../../src/ui/Panel';
import { Text } from '../../src/ui/Text';

export default function PracticeRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const puzzle = getPracticePuzzle(Number(id));
  if (!puzzle) return <Redirect href="/practice" />;
  // 다음 퍼즐로 넘어가면 상태가 새로 시작되도록 key로 다시 마운트
  return <PracticePlay key={puzzle.number} puzzle={puzzle} />;
}

function PracticePlay({ puzzle }: { puzzle: PracticePuzzle }) {
  const [showResult, setShowResult] = useState(false);
  const [alreadySolved, setAlreadySolved] = useState(false);
  const next = getPracticePuzzle(puzzle.number + 1);

  const play = usePuzzle({
    board: puzzle.board,
    mateIn: puzzle.mateIn,
    onSolved: (attempts, hints) => {
      track('practice_solved', { number: puzzle.number, attempts, hints });
      recordPracticeSolve(puzzle.number, attempts, hints).then(() => setShowResult(true));
    },
  });

  useEffect(() => {
    track('practice_open', { number: puzzle.number });
    loadProgress().then(saved => {
      // 순서를 건너뛰어 잠긴 퍼즐로 들어오면 목록으로
      if (!isPracticeUnlocked(saved.practice, puzzle.number)) router.replace('/practice');
      setAlreadySolved(!!saved.practice[puzzle.number]);
    });
  }, []);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen options={{ title: strings.practice.puzzleTitle(puzzle.number) }} />
      <View style={styles.column}>
        <Panel color={palette.mintLight} style={styles.header}>
          <View style={styles.headerBody}>
            <Text style={styles.kicker}>{strings.practice.puzzleTitle(puzzle.number)}</Text>
            <Text style={styles.title}>{strings.daily.mateIn(puzzle.mateIn)}</Text>
          </View>
          {!play.solved && <Chip label={strings.daily.movesLeft(play.movesLeft)} />}
        </Panel>
      </View>

      <ChessBoard
        board={play.board}
        sideToMove="w"
        interactive={!play.solved && play.turn === 'w'}
        lastMove={play.lastMove}
        checkedKing={play.checkedKing}
        onMove={play.handleMove}
        hint={play.hintSquare}
      />

      <View style={styles.column}>
        <DialogBox
          text={
            play.message ??
            (alreadySolved ? strings.practice.alreadySolved : puzzle.mateIn === 1 ? strings.practice.instructionOne : strings.daily.instruction)
          }
        />
        {play.solved ? (
          <View style={styles.row}>
            {next && <GameButton label={`${strings.practice.next} ▶`} onPress={() => router.replace(`/practice/${next.number}`)} style={styles.flex} />}
            <GameButton label={strings.practice.list} onPress={() => router.back()} variant="white" style={styles.flex} />
          </View>
        ) : (
          <GameButton label={strings.daily.hint} onPress={play.showHint} variant="white" disabled={!play.canHint} />
        )}
      </View>

      <ResultModal
        visible={showResult}
        art={<MascotFace mood="happy" size={100} />}
        celebrate
        title={strings.practice.solved}
        detail={`${strings.daily.attempts(play.attempts)}${play.hints > 0 ? ` · 💡${play.hints}` : ''}`}
        detailColor={palette.ink}
        primary={
          next
            ? { label: `${strings.practice.next} ▶`, onPress: () => router.replace(`/practice/${next.number}`) }
            : { label: strings.practice.list, onPress: () => router.back() }
        }
        secondary={{ label: strings.daily.close, onPress: () => setShowResult(false) }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 16 },
  column: { alignSelf: 'stretch', width: '100%', maxWidth: 480, marginHorizontal: 'auto', paddingHorizontal: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  headerBody: { flex: 1 },
  kicker: { fontSize: 14, color: palette.mintDark },
  title: { fontSize: 22 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});

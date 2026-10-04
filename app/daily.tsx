import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChessBoard } from '../src/components/ChessBoard';
import { ResultModal } from '../src/components/ResultModal';
import { type Move, findKing, isInCheck, simulateMove } from '../src/engine/chessEngine';
import { forcesMate, isCheckmated, pickStubbornReply } from '../src/engine/mateSolver';
import { feedback } from '../src/feedback/feedback';
import { strings } from '../src/i18n';
import { getDailyPuzzle } from '../src/puzzles/daily';
import { type Progress, currentStreak, loadProgress, recordDailySolve } from '../src/storage/progress';
import { palette } from '../src/theme';

export default function DailyScreen() {
  const puzzle = useMemo(() => getDailyPuzzle(), []);
  const [board, setBoard] = useState(puzzle.board);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [movesLeft, setMovesLeft] = useState(puzzle.mateIn);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [attempts, setAttempts] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  useEffect(() => {
    loadProgress().then(saved => {
      setProgress(saved);
      const record = saved.daily.records[puzzle.dateKey];
      if (record?.solved) {
        setSolved(true);
        setAttempts(record.attempts);
      }
    });
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const restart = () => {
    setBoard(puzzle.board);
    setTurn('w');
    setMovesLeft(puzzle.mateIn);
    setLastMove(null);
  };

  const handleMove = (move: Move) => {
    const after = simulateMove(board, move);
    setBoard(after);
    setLastMove(move);
    setTurn('b');

    // 남은 수 안에 메이트를 강제하지 못하는 수면 오답: 잠깐 보여 준 뒤 처음부터
    if (!forcesMate(after, 'w', movesLeft)) {
      setMessage(strings.daily.wrong);
      later(feedback.wrong, 250);
      later(() => {
        setAttempts(n => n + 1);
        restart();
      }, 900);
      return;
    }

    setMessage(null);
    if (isCheckmated('b', after)) {
      later(feedback.win, 250);
      recordDailySolve(puzzle.dateKey, attempts).then(saved => {
        setProgress(saved);
        setSolved(true);
        setShowResult(true);
      });
      return;
    }

    // 레드는 가장 끈질기게 버티는 수로 응수
    later(() => {
      const reply = pickStubbornReply(after, 'w', movesLeft);
      if (!reply) return;
      setBoard(simulateMove(after, reply));
      setLastMove(reply);
      setTurn('w');
      setMovesLeft(n => n - 1);
    }, 600);
  };

  const streak = progress ? currentStreak(progress, puzzle.dateKey) : 0;

  const share = async () => {
    const text = strings.daily.shareText(puzzle.number, puzzle.mateIn, attempts, Math.max(streak, 1));
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) await navigator.share({ text });
        else {
          await navigator.clipboard.writeText(text);
          setMessage(strings.daily.copied);
        }
      } else {
        await Share.share({ message: text });
      }
    } catch {
      // 사용자가 공유를 취소한 경우 등
    }
  };

  const checkedKing = isInCheck(turn, board) ? findKing(turn, board) : null;

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {strings.daily.title(puzzle.number)} · {strings.daily.mateIn(puzzle.mateIn)}
        </Text>
        <Text style={styles.instruction}>{solved ? strings.daily.alreadySolved : strings.daily.instruction}</Text>
        {!solved && <Text style={styles.movesLeft}>{strings.daily.movesLeft(movesLeft)}</Text>}
        {message && <Text style={styles.message}>{message}</Text>}
      </View>

      <ChessBoard
        board={board}
        sideToMove="w"
        interactive={!solved && turn === 'w'}
        lastMove={lastMove}
        checkedKing={checkedKing}
        onMove={handleMove}
      />

      {solved && (
        <TouchableOpacity style={styles.shareButton} onPress={share}>
          <Text style={styles.shareText}>{strings.daily.share}</Text>
        </TouchableOpacity>
      )}

      <ResultModal
        visible={showResult}
        emoji="🎉"
        celebrate
        title={strings.daily.solved}
        detail={`${strings.daily.attempts(attempts)} · ${strings.daily.streak(Math.max(streak, 1))}`}
        detailColor={palette.ink}
        primary={{ label: strings.daily.share, onPress: share }}
        secondary={{
          label: strings.daily.home,
          onPress: () => {
            setShowResult(false);
            router.back();
          },
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.mintMist, alignItems: 'center', paddingBottom: 20 },
  header: { alignItems: 'center', marginTop: 4, paddingHorizontal: 24, gap: 4 },
  title: { fontSize: 18, fontWeight: '900', color: palette.ink },
  instruction: { fontSize: 14, color: palette.inkSoft, textAlign: 'center' },
  movesLeft: { fontSize: 14, fontWeight: '700', color: palette.mintDark },
  message: { fontSize: 14, fontWeight: '700', color: palette.danger, textAlign: 'center' },
  shareButton: { backgroundColor: palette.butter, borderWidth: 2, borderColor: palette.ink, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
  shareText: { color: palette.ink, fontSize: 16, fontWeight: 'bold' },
});

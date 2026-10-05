import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { nextStageId } from '../src/campaign/stages';
import { ChessBoard } from '../src/components/ChessBoard';
import { ResultModal } from '../src/components/ResultModal';
import { type Move, findKing, isInCheck, simulateMove } from '../src/engine/chessEngine';
import { findMatingMoves, forcesMate, isCheckmated, pickStubbornReply } from '../src/engine/mateSolver';
import { feedback } from '../src/feedback/feedback';
import { strings } from '../src/i18n';
import { enableDailyReminder, isReminderSupported } from '../src/notifications';
import { getDailyPuzzle } from '../src/puzzles/daily';
import { type Progress, currentStreak, loadProgress, recordDailySolve } from '../src/storage/progress';
import { DEFAULT_SETTINGS, type Settings, loadSettings, updateSettings } from '../src/storage/settings';
import { palette } from '../src/theme';
import { formatCountdown, msUntilNextDay } from '../src/utils/date';

export default function DailyScreen() {
  const puzzle = useMemo(() => getDailyPuzzle(), []);
  const [board, setBoard] = useState(puzzle.board);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [movesLeft, setMovesLeft] = useState(puzzle.mateIn);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [attempts, setAttempts] = useState(1);
  const [hints, setHints] = useState(0);
  const [hintSquare, setHintSquare] = useState<{ r: number; c: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [countdown, setCountdown] = useState(() => formatCountdown(msUntilNextDay(new Date())));
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
        setHints(record.hints ?? 0);
      }
    });
    loadSettings().then(setSettings);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // 다 풀었으면 다음 퍼즐까지 남은 시간을 1초마다 갱신
  useEffect(() => {
    if (!solved) return;
    const tick = setInterval(() => setCountdown(formatCountdown(msUntilNextDay(new Date()))), 1000);
    return () => clearInterval(tick);
  }, [solved]);

  const restart = () => {
    setBoard(puzzle.board);
    setTurn('w');
    setMovesLeft(puzzle.mateIn);
    setLastMove(null);
    setHintSquare(null);
  };

  // 힌트: 지금 움직여야 할 기물을 빛나게 (같은 위치에서 다시 눌러도 횟수는 한 번만)
  const showHint = () => {
    if (solved || turn !== 'w' || hintSquare) return;
    const [key] = findMatingMoves(board, 'w', movesLeft);
    if (!key) return;
    setHintSquare({ r: key.fromR, c: key.fromC });
    setHints(n => n + 1);
    setMessage(strings.daily.hintShown);
  };

  const handleMove = (move: Move) => {
    const after = simulateMove(board, move);
    setBoard(after);
    setLastMove(move);
    setTurn('b');
    setHintSquare(null);

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
      recordDailySolve(puzzle.dateKey, attempts, hints).then(saved => {
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
    const text = strings.daily.shareText(puzzle.number, puzzle.mateIn, attempts, Math.max(streak, 1), hints);
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

  const turnOnReminder = async () => {
    const enabled = await enableDailyReminder();
    setSettings(await updateSettings(enabled ? { reminderEnabled: true } : { reminderPromptDismissed: true }));
    setMessage(enabled ? strings.daily.reminderEnabled : strings.daily.reminderDenied);
  };

  const dismissReminder = async () => {
    setSettings(await updateSettings({ reminderPromptDismissed: true }));
  };

  const continueCampaign = () => {
    const next = progress ? nextStageId(progress.campaign) : 1;
    router.push(next ? `/campaign/${next}` : '/campaign');
  };

  const checkedKing = isInCheck(turn, board) ? findKing(turn, board) : null;
  const askReminder = solved && isReminderSupported && !settings.reminderEnabled && !settings.reminderPromptDismissed;

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {strings.daily.title(puzzle.number)} · {strings.daily.mateIn(puzzle.mateIn)}
        </Text>
        <Text style={styles.instruction}>{solved ? strings.daily.alreadySolved : strings.daily.instruction}</Text>
        {!solved && <Text style={styles.movesLeft}>{strings.daily.movesLeft(movesLeft)}</Text>}
        {message && <Text style={[styles.message, message === strings.daily.hintShown && styles.hintMessage]}>{message}</Text>}
      </View>

      <ChessBoard
        board={board}
        sideToMove="w"
        interactive={!solved && turn === 'w'}
        lastMove={lastMove}
        checkedKing={checkedKing}
        onMove={handleMove}
        hint={hintSquare}
      />

      {solved ? (
        <View style={styles.footer}>
          <Text style={styles.countdown}>{strings.daily.nextPuzzleIn(countdown)}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.primaryButton} onPress={share}>
              <Text style={styles.primaryText}>{strings.daily.share}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineButton} onPress={continueCampaign}>
              <Text style={styles.outlineText}>{strings.daily.continueCampaign}</Text>
            </TouchableOpacity>
          </View>
          {askReminder && (
            <View style={styles.reminderCard}>
              <Text style={styles.reminderTitle}>{strings.daily.reminderTitle}</Text>
              <Text style={styles.reminderBody}>{strings.daily.reminderBody}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.smallPrimary} onPress={turnOnReminder}>
                  <Text style={styles.smallPrimaryText}>{strings.daily.reminderOn}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallGhost} onPress={dismissReminder}>
                  <Text style={styles.smallGhostText}>{strings.daily.reminderLater}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity style={[styles.outlineButton, (turn !== 'w' || !!hintSquare) && styles.disabled]} onPress={showHint} disabled={turn !== 'w' || !!hintSquare}>
          <Text style={styles.outlineText}>{strings.daily.hint}</Text>
        </TouchableOpacity>
      )}

      <ResultModal
        visible={showResult}
        emoji="🎉"
        celebrate
        title={strings.daily.solved}
        detail={`${strings.daily.attempts(attempts)}${hints > 0 ? ` · 💡${hints}` : ''} · ${strings.daily.streak(Math.max(streak, 1))}`}
        detailColor={palette.ink}
        primary={{ label: strings.daily.share, onPress: share }}
        secondary={{ label: strings.daily.close, onPress: () => setShowResult(false) }}
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
  hintMessage: { color: palette.mintDark },
  footer: { alignItems: 'center', gap: 10, paddingHorizontal: 16, alignSelf: 'stretch' },
  countdown: { fontSize: 14, fontWeight: '700', color: palette.inkSoft },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  primaryButton: { backgroundColor: palette.butter, borderWidth: 2, borderColor: palette.ink, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 26 },
  primaryText: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  outlineButton: { backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 26 },
  outlineText: { color: palette.ink, fontSize: 16, fontWeight: '800' },
  disabled: { borderColor: palette.line, opacity: 0.6 },
  reminderCard: { alignSelf: 'stretch', maxWidth: 420, width: '100%', marginHorizontal: 'auto', backgroundColor: palette.white, borderRadius: 18, borderWidth: 2, borderColor: palette.ink, padding: 14, gap: 6, alignItems: 'center' },
  reminderTitle: { fontSize: 15, fontWeight: '800', color: palette.ink },
  reminderBody: { fontSize: 13, color: palette.inkSoft, textAlign: 'center', marginBottom: 4 },
  smallPrimary: { backgroundColor: palette.mint, borderWidth: 2, borderColor: palette.ink, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  smallPrimaryText: { color: palette.ink, fontSize: 14, fontWeight: '800' },
  smallGhost: { paddingHorizontal: 14, paddingVertical: 8 },
  smallGhostText: { color: palette.inkSoft, fontSize: 14, fontWeight: '700' },
});

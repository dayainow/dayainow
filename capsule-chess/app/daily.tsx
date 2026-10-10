import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { track } from '../src/analytics';
import { nextStageId } from '../src/campaign/stages';
import { ChessBoard } from '../src/components/ChessBoard';
import { ResultModal } from '../src/components/ResultModal';
import { ShareCardModal } from '../src/components/ShareCard';
import { type Move, findKing, isInCheck, simulateMove } from '../src/engine/chessEngine';
import { findMatingMoves, forcesMate, isCheckmated, pickStubbornReply } from '../src/engine/mateSolver';
import { feedback } from '../src/feedback/feedback';
import { strings } from '../src/i18n';
import { enableDailyReminder, isReminderSupported } from '../src/notifications';
import { getDailyPuzzle } from '../src/puzzles/daily';
import { type Progress, currentStreak, loadProgress, recordDailySolve } from '../src/storage/progress';
import { DEFAULT_SETTINGS, type Settings, loadSettings, updateSettings } from '../src/storage/settings';
import { palette } from '../src/theme';
import { Chip } from '../src/ui/Chip';
import { DialogBox } from '../src/ui/DialogBox';
import { GameButton } from '../src/ui/GameButton';
import { MascotFace } from '../src/ui/MascotFace';
import { Panel } from '../src/ui/Panel';
import { Text } from '../src/ui/Text';
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
  const [showShare, setShowShare] = useState(false);
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
      track('daily_open', { number: puzzle.number, solved: !!record?.solved });
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
    track('daily_hint', { number: puzzle.number });
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
      track('daily_wrong', { number: puzzle.number, attempt: attempts });
      later(() => {
        setAttempts(n => n + 1);
        restart();
      }, 900);
      return;
    }

    setMessage(null);
    if (isCheckmated('b', after)) {
      later(feedback.win, 250);
      track('daily_solved', { number: puzzle.number, attempts, hints });
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

  // 결과 카드 미리보기를 열어 이미지나 텍스트로 공유
  const share = () => {
    setShowResult(false);
    setShowShare(true);
  };
  const shareData = { number: puzzle.number, mateIn: puzzle.mateIn, attempts, hints, streak: Math.max(streak, 1) };

  const turnOnReminder = async () => {
    const enabled = await enableDailyReminder();
    track('reminder_prompt', { action: enabled ? 'enabled' : 'denied' });
    setSettings(await updateSettings(enabled ? { reminderEnabled: true } : { reminderPromptDismissed: true }));
    setMessage(enabled ? strings.daily.reminderEnabled : strings.daily.reminderDenied);
  };

  const dismissReminder = async () => {
    track('reminder_prompt', { action: 'dismissed' });
    setSettings(await updateSettings({ reminderPromptDismissed: true }));
  };

  const continueCampaign = () => {
    const next = progress ? nextStageId(progress.campaign) : 1;
    router.push(next ? `/campaign/${next}` : '/campaign');
  };

  const checkedKing = isInCheck(turn, board) ? findKing(turn, board) : null;
  const askReminder = solved && isReminderSupported && !settings.reminderEnabled && !settings.reminderPromptDismissed;

  useEffect(() => {
    if (askReminder) track('reminder_prompt', { action: 'shown' });
  }, [askReminder]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.column}>
        <Panel color={palette.sun} style={styles.header}>
          <View style={styles.headerBody}>
            <Text style={styles.kicker}>{strings.daily.title(puzzle.number)}</Text>
            <Text style={styles.title}>{strings.daily.mateIn(puzzle.mateIn)}</Text>
          </View>
          {!solved && <Chip label={strings.daily.movesLeft(movesLeft)} />}
          {solved && <Chip label={`🔥 ${Math.max(streak, 1)}`} />}
        </Panel>
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

      <View style={styles.column}>
        <DialogBox text={message ?? (solved ? strings.daily.alreadySolved : strings.daily.instruction)} />
        {solved ? (
          <>
            <Text style={styles.countdown}>{strings.daily.nextPuzzleIn(countdown)}</Text>
            <View style={styles.row}>
              <GameButton label={strings.daily.share} onPress={share} style={styles.flex} />
              <GameButton label={strings.daily.continueCampaign} onPress={continueCampaign} variant="white" style={styles.flex} />
            </View>
            {askReminder && (
              <Panel style={styles.reminder}>
                <Text style={styles.reminderTitle}>{strings.daily.reminderTitle}</Text>
                <Text style={styles.reminderBody}>{strings.daily.reminderBody}</Text>
                <View style={styles.row}>
                  <GameButton label={strings.daily.reminderOn} onPress={turnOnReminder} variant="mint" size="sm" />
                  <GameButton label={strings.daily.reminderLater} onPress={dismissReminder} variant="white" size="sm" />
                </View>
              </Panel>
            )}
          </>
        ) : (
          <GameButton label={strings.daily.hint} onPress={showHint} variant="white" disabled={turn !== 'w' || !!hintSquare} />
        )}
      </View>

      <ShareCardModal
        visible={showShare}
        onClose={() => setShowShare(false)}
        data={shareData}
        text={strings.daily.shareText(shareData.number, shareData.mateIn, shareData.attempts, shareData.streak, shareData.hints)}
        onCopied={() => {
          setShowShare(false);
          setMessage(strings.daily.copied);
        }}
      />

      <ResultModal
        visible={showResult}
        art={<MascotFace mood="happy" size={100} />}
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
  container: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 16 },
  column: { alignSelf: 'stretch', width: '100%', maxWidth: 480, marginHorizontal: 'auto', paddingHorizontal: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  headerBody: { flex: 1 },
  kicker: { fontSize: 14, color: '#7A5B00' },
  title: { fontSize: 22 },
  countdown: { fontSize: 15, color: palette.inkSoft, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  flex: { flex: 1 },
  reminder: { alignItems: 'center', gap: 6, padding: 12 },
  reminderTitle: { fontSize: 16 },
  reminderBody: { fontSize: 13, color: palette.inkSoft, textAlign: 'center', marginBottom: 4 },
});

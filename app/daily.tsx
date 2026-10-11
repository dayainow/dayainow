import { router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { track } from '../src/analytics';
import { nextStageId } from '../src/campaign/stages';
import { ChessBoard } from '../src/components/ChessBoard';
import { ResultModal } from '../src/components/ResultModal';
import { MODAL_SWAP_MS, ShareCardModal } from '../src/components/ShareCard';
import { usePuzzle } from '../src/game/usePuzzle';
import { strings } from '../src/i18n';
import { enableDailyReminder, isReminderSupported } from '../src/notifications';
import { getDailyPuzzle } from '../src/puzzles/daily';
import { type Progress, currentStreak, loadProgress, recordDailySolve } from '../src/storage/progress';
import { DEFAULT_SETTINGS, type Settings, loadSettings, updateSettings } from '../src/storage/settings';
import { isReviewStreak, requestReviewLater } from '../src/review';
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
  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [countdown, setCountdown] = useState(() => formatCountdown(msUntilNextDay(new Date())));
  const shareTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reviewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const play = usePuzzle({
    board: puzzle.board,
    mateIn: puzzle.mateIn,
    onHint: () => track('daily_hint', { number: puzzle.number }),
    onWrong: attempt => track('daily_wrong', { number: puzzle.number, attempt }),
    onSolved: (attempts, hints) => {
      track('daily_solved', { number: puzzle.number, attempts, hints });
      recordDailySolve(puzzle.dateKey, attempts, hints).then(saved => {
        setProgress(saved);
        setShowResult(true);
        if (isReviewStreak(currentStreak(saved, puzzle.dateKey))) reviewTimer.current = requestReviewLater('streak');
      });
    },
  });
  const { solved, attempts, hints, setMessage } = play;

  useEffect(() => {
    loadProgress().then(saved => {
      setProgress(saved);
      const record = saved.daily.records[puzzle.dateKey];
      track('daily_open', { number: puzzle.number, solved: !!record?.solved });
      if (record?.solved) play.restoreSolved(record.attempts, record.hints ?? 0);
    });
    loadSettings().then(setSettings);
    return () => {
      clearTimeout(shareTimer.current);
      clearTimeout(reviewTimer.current);
    };
  }, []);

  // 다 풀었으면 다음 퍼즐까지 남은 시간을 1초마다 갱신
  useEffect(() => {
    if (!solved) return;
    const tick = setInterval(() => setCountdown(formatCountdown(msUntilNextDay(new Date()))), 1000);
    return () => clearInterval(tick);
  }, [solved]);

  const streak = progress ? currentStreak(progress, puzzle.dateKey) : 0;

  // 결과 카드 미리보기를 열어 이미지나 텍스트로 공유
  // 결과 창이 닫히는 애니메이션이 끝난 뒤 공유 창을 띄움 (iOS는 두 창을 동시에 띄우지 못함)
  const share = () => {
    setShowResult(false);
    shareTimer.current = setTimeout(() => setShowShare(true), MODAL_SWAP_MS);
  };
  const shareContent = { kind: 'daily' as const, number: puzzle.number, mateIn: puzzle.mateIn, attempts, hints, streak: Math.max(streak, 1) };

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
          {!solved && <Chip label={strings.daily.movesLeft(play.movesLeft)} />}
          {solved && <Chip label={`🔥 ${Math.max(streak, 1)}`} />}
        </Panel>
      </View>

      <ChessBoard
        board={play.board}
        sideToMove="w"
        interactive={!solved && play.turn === 'w'}
        lastMove={play.lastMove}
        checkedKing={play.checkedKing}
        onMove={play.handleMove}
        hint={play.hintSquare}
      />

      <View style={styles.column}>
        <DialogBox text={play.message ?? (solved ? strings.daily.alreadySolved : strings.daily.instruction)} />
        {solved ? (
          <>
            <Text style={styles.countdown}>{strings.daily.nextPuzzleIn(countdown)}</Text>
            <View style={styles.row}>
              <GameButton label={strings.daily.share} onPress={share} style={styles.flex} />
              <GameButton label={strings.daily.continueCampaign} onPress={continueCampaign} variant="white" style={styles.flex} />
            </View>
            {/* 하루 한 판이 아쉬운 사람에게: 퍼즐 도장 */}
            <Pressable onPress={() => router.push('/practice')} hitSlop={8}>
              <Text style={styles.more}>{strings.practice.morePuzzles} ›</Text>
            </Pressable>
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
          <GameButton label={strings.daily.hint} onPress={play.showHint} variant="white" disabled={!play.canHint} />
        )}
      </View>

      <ShareCardModal
        visible={showShare}
        onClose={() => setShowShare(false)}
        content={shareContent}
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
  more: { fontSize: 15, color: palette.blueDark, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  flex: { flex: 1 },
  reminder: { alignItems: 'center', gap: 6, padding: 12 },
  reminderTitle: { fontSize: 16 },
  reminderBody: { fontSize: 13, color: palette.inkSoft, textAlign: 'center', marginBottom: 4 },
});

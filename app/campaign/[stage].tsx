import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { track } from '../../src/analytics';
import { earnedBadges, newBadge, opponentFor, stageInCapsule } from '../../src/campaign/league';
import { type Stage, buildStageBoard, getStage, starsFor } from '../../src/campaign/stages';
import { BattleIntro } from '../../src/components/BattleIntro';
import { ChessBoard } from '../../src/components/ChessBoard';
import { EvolutionOverlay } from '../../src/components/EvolutionOverlay';
import { GameControls } from '../../src/components/GameControls';
import { ResultModal } from '../../src/components/ResultModal';
import { MODAL_SWAP_MS, ShareCardModal, type ShareContent } from '../../src/components/ShareCard';
import type { Move } from '../../src/engine/chessEngine';
import { feedback } from '../../src/feedback/feedback';
import { battleText } from '../../src/game/battleText';
import { battleEvent } from '../../src/game/commentary';
import { powerOf } from '../../src/game/material';
import { useChessGame } from '../../src/game/useChessGame';
import { strings } from '../../src/i18n';
import { loadProgress, recordStageResult, recordStat } from '../../src/storage/progress';
import { palette } from '../../src/theme';
import { CapsuleBadge } from '../../src/ui/CapsuleBadge';
import { DialogBox } from '../../src/ui/DialogBox';
import { GameButton } from '../../src/ui/GameButton';
import { MascotFace } from '../../src/ui/MascotFace';
import { TeamPanel } from '../../src/ui/TeamPanel';
import { Text } from '../../src/ui/Text';

const EVOLVE_DELAY = 420; // 기물이 끝 줄에 미끄러져 도착한 뒤 진화 연출 시작

export default function StageRoute() {
  const { stage: stageParam } = useLocalSearchParams<{ stage: string }>();
  const stage = getStage(Number(stageParam));
  if (!stage) return <Redirect href="/campaign" />;
  // 다음 단계로 넘어가면 판 상태가 새로 시작되도록 key로 다시 마운트
  return <StagePlay key={stage.id} stage={stage} />;
}

function StagePlay({ stage }: { stage: Stage }) {
  const initialBoard = useMemo(() => buildStageBoard(stage), [stage]);
  const game = useChessGame({ initialBoard, ai: stage.ai });
  const [earnedStars, setEarnedStars] = useState(0);
  const [badge, setBadge] = useState<number | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [sharing, setSharing] = useState<ShareContent | null>(null);
  const [hideResult, setHideResult] = useState(false); // 공유 창을 보는 동안 결과 창을 잠깐 숨김
  const swapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [undos, setUndos] = useState(0); // 이번 판에서 무르기한 횟수 (다시 시작하면 0)
  const [notice, setNotice] = useState<string | null>(null); // 실황 대신 잠깐 보여 줄 안내
  const [showIntro, setShowIntro] = useState(true);
  const [evolving, setEvolving] = useState<'w' | null>(null);
  const evolveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const opponent = opponentFor(stage);
  const opponentName = strings.league.opponents[opponent.index];
  const maxPower = useMemo(() => ({ w: powerOf(initialBoard, 'w'), b: powerOf(initialBoard, 'b') }), [initialBoard]);
  const nextStage = getStage(stage.id + 1);
  const won = game.result?.winner === 'w';

  useEffect(() => {
    track('stage_start', { stage: stage.id });
    return () => {
      clearTimeout(evolveTimer.current);
      clearTimeout(swapTimer.current);
    };
  }, []);

  // 이기면 별 계산 후 저장 (최고 기록만 남음). 캡슐을 다 깼으면 배지
  useEffect(() => {
    if (!game.isGameOver || !game.result) return;
    const outcome = game.result.winner === 'w' ? 'win' : game.result.winner ? 'lose' : 'draw';
    const stars = outcome === 'win' ? starsFor(stage, game.result.blueMoves, undos) : 0;
    track('stage_end', { stage: stage.id, result: outcome, moves: game.result.blueMoves, stars, undos });
    if (outcome !== 'win') {
      feedback.lose();
      return;
    }
    feedback.win();
    setEarnedStars(stars);
    loadProgress().then(before =>
      recordStageResult(stage.id, stars).then(after => {
        setBadge(newBadge(before.campaign, after.campaign));
        setBadgeCount(earnedBadges(after.campaign).length);
      })
    );
  }, [game.isGameOver]);

  // 내 폰이 끝 줄에 닿으면 진화 연출
  const handleMove = (move: Move) => {
    const mover = game.board[move.fromR][move.fromC];
    setNotice(null);
    game.move(move);
    if (mover === 'wP' && move.toR === 0) {
      evolveTimer.current = setTimeout(() => setEvolving('w'), EVOLVE_DELAY);
      recordStat('evolutions');
    }
  };

  // 처음부터 다시: 무르기 횟수도 새로 셈
  // 결과 창 → 공유 창 (닫히는 애니메이션이 끝난 뒤 띄움)
  const openShare = (content: ShareContent) => {
    setHideResult(true);
    swapTimer.current = setTimeout(() => setSharing(content), MODAL_SWAP_MS);
  };
  const closeShare = () => {
    setSharing(null);
    swapTimer.current = setTimeout(() => setHideResult(false), MODAL_SWAP_MS);
  };

  const restart = () => {
    setHideResult(false);
    game.reset();
    setUndos(0);
    setNotice(null);
  };

  const line = battleText(
    battleEvent({
      vsAi: true,
      status: game.status,
      lastMover: game.lastMover,
      lastCaptured: game.lastCaptured,
      lastPromoted: game.lastPromoted,
      winner: game.isGameOver ? game.result?.winner ?? null : null,
      isGameOver: game.isGameOver,
    }),
    true,
    opponentName
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen options={{ title: strings.league.stageLabel(stage.world, stageInCapsule(stage)) }} />
      <View style={styles.column}>
        <TeamPanel
          side="b"
          avatar={opponent.avatar}
          name={opponentName}
          detail={strings.league.level(opponent.level)}
          power={powerOf(game.board, 'b')}
          maxPower={maxPower.b}
          active={game.turn === 'b' && !game.isGameOver}
        />
      </View>

      <ChessBoard
        board={game.board}
        sideToMove={game.turn}
        interactive={game.canPlayerMove && !showIntro}
        lastMove={game.lastMove}
        checkedKing={game.checkedKing}
        onMove={handleMove}
      />

      <View style={styles.column}>
        <TeamPanel
          side="w"
          avatar="wK"
          name={strings.battle.me}
          detail={`${strings.battle.movesUsed(game.blueMoves)} · ${undos > 0 ? '★★' : `★${stage.par}`}`}
          power={powerOf(game.board, 'w')}
          maxPower={maxPower.w}
          active={game.turn === 'w' && !game.isGameOver}
        />
        <DialogBox text={notice ?? line} />
        <GameControls
          canUndo={game.canUndo}
          onUndo={() => {
            game.undo();
            if (undos === 0) setNotice(strings.campaign.undoNotice);
            setUndos(n => n + 1);
            track('undo', { screen: 'stage' });
          }}
          onRestart={restart}
        />
      </View>

      <BattleIntro visible={showIntro} stage={stage} onStart={() => setShowIntro(false)} />
      <EvolutionOverlay side={evolving} onClose={() => setEvolving(null)} />

      <ResultModal
        visible={game.isGameOver && !evolving && !hideResult}
        art={<MascotFace mood={won ? 'happy' : 'sad'} size={100} />}
        celebrate={won}
        title={won ? (nextStage ? strings.campaign.cleared : strings.campaign.allCleared) : strings.campaign.failed}
        detail={won ? `${'★'.repeat(earnedStars)}${'☆'.repeat(3 - earnedStars)}` : strings.campaign.failedDetail}
        detailColor={won ? palette.star : palette.inkSoft}
        extra={
          won && badge ? (
            <View style={styles.extra}>
              <View style={styles.badgeAward}>
                <CapsuleBadge capsule={badge} earned size={56} />
                <Text style={styles.badgeText}>{strings.league.badgeEarned(strings.league.badgeNames[badge - 1])}</Text>
              </View>
              <GameButton
                label={strings.shareCard.shareBadge}
                onPress={() => openShare({ kind: 'badge', capsule: badge, earned: badgeCount })}
                variant="blue"
                size="sm"
              />
            </View>
          ) : won ? (
            <View style={styles.extra}>
              <Text style={styles.moves}>
                {strings.campaign.movesUsed(game.result?.blueMoves ?? 0)}
                {undos > 0 ? `\n${strings.campaign.undoCapped}` : ''}
              </Text>
              <GameButton
                label={strings.shareCard.share}
                onPress={() =>
                  openShare({
                    kind: 'stage',
                    capsule: stage.world,
                    step: stageInCapsule(stage),
                    stars: earnedStars,
                    moves: game.result?.blueMoves ?? 0,
                    opponent: opponentName,
                    avatar: opponent.avatar,
                  })
                }
                variant="blue"
                size="sm"
              />
            </View>
          ) : null
        }
        primary={
          won
            ? nextStage
              ? { label: strings.campaign.next, onPress: () => router.replace(`/campaign/${nextStage.id}`) }
              : { label: strings.campaign.list, onPress: () => router.back() }
            : { label: strings.campaign.retry, onPress: restart }
        }
        secondary={
          won
            ? { label: strings.campaign.retry, onPress: restart }
            : { label: strings.campaign.list, onPress: () => router.back() }
        }
      />

      {sharing && (
        <ShareCardModal
          visible
          onClose={closeShare}
          content={sharing}
          onCopied={() => {
            closeShare();
            setNotice(strings.daily.copied);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 16 },
  column: { alignSelf: 'stretch', width: '100%', maxWidth: 480, marginHorizontal: 'auto', paddingHorizontal: 14, gap: 10 },
  moves: { fontSize: 15, color: palette.inkSoft, marginTop: 4, textAlign: 'center' },
  extra: { alignItems: 'center', gap: 10, marginTop: 4 },
  badgeAward: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: palette.sunLight, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  badgeText: { flexShrink: 1, fontSize: 16 },
});

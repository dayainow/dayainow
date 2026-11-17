import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { track } from '../../src/analytics';
import { useBilling } from '../../src/billing/BillingProvider';
import { FullGameGate } from '../../src/billing/FullGameOffer';
import { FREE_STAGES } from '../../src/billing/products';
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
import { type GuideStep, captureGuideMove, firstGuideMove, suggestedBlueMove } from '../../src/game/guide';
import { powerOf } from '../../src/game/material';
import { useChessGame } from '../../src/game/useChessGame';
import { useStrings } from '../../src/i18n/LanguageProvider';
import { loadProgress, recordGuideDone, recordStageResult, recordStat } from '../../src/storage/progress';
import { requestReviewLater } from '../../src/review';
import { palette } from '../../src/theme';
import { CapsuleBadge } from '../../src/ui/CapsuleBadge';
import { DialogBox } from '../../src/ui/DialogBox';
import { GameButton } from '../../src/ui/GameButton';
import { MascotFace } from '../../src/ui/MascotFace';
import { TeamPanel } from '../../src/ui/TeamPanel';
import { useDelayedFlag } from '../../src/ui/useDelayedFlag';
import { Text } from '../../src/ui/Text';

const EVOLVE_DELAY = 420; // 기물이 끝 줄에 미끄러져 도착한 뒤 진화 연출 시작
const RESULT_DELAY_MS = 1100; // 체크메이트 도장을 보고 나서 결과 창

export default function StageRoute() {
  const { stage: stageParam, firstBattle } = useLocalSearchParams<{ stage: string; firstBattle?: string }>();
  const stage = getStage(Number(stageParam));
  if (!stage) return <Redirect href="/campaign" />;
  // 다음 단계로 넘어가면 판 상태가 새로 시작되도록 key로 다시 마운트
  const play = <StagePlay key={stage.id} stage={stage} quickStart={stage.id === 1 && firstBattle === '1'} />;
  return stage.id <= FREE_STAGES ? play : <FullGameGate backTo="/campaign">{play}</FullGameGate>;
}

function StagePlay({ stage, quickStart }: { stage: Stage; quickStart: boolean }) {
  const strings = useStrings();
  const { owned } = useBilling();
  const initialBoard = useMemo(() => buildStageBoard(stage), [stage]);
  const game = useChessGame({ initialBoard, ai: stage.ai });
  const [earnedStars, setEarnedStars] = useState(0);
  const [badge, setBadge] = useState<number | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [sharing, setSharing] = useState<ShareContent | null>(null);
  const [hideResult, setHideResult] = useState(false); // 공유 창을 보는 동안 결과 창을 잠깐 숨김
  const swapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [hint, setHint] = useState<Move | null>(null);
  const [hints, setHints] = useState(0);
  const [undos, setUndos] = useState(0); // 이번 판에서 무르기한 횟수 (다시 시작하면 0)
  const [notice, setNotice] = useState<string | null>(null); // 실황 대신 잠깐 보여 줄 안내
  const [showIntro, setShowIntro] = useState(!quickStart);
  // 첫 배틀 가이드: 1단계를 처음 하는 사람에게만 (한 번 끝내면 다시 안 나옴)
  const [guideEligible, setGuideEligible] = useState<boolean | null>(stage.id === 1 ? null : false);
  const [guide, setGuide] = useState<GuideStep | null>(null);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [evolving, setEvolving] = useState<'w' | null>(null);
  const evolveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const badgeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reviewTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const opponent = opponentFor(stage);
  const opponentName = strings.league.opponents[opponent.index];
  const maxPower = useMemo(() => ({ w: powerOf(initialBoard, 'w'), b: powerOf(initialBoard, 'b') }), [initialBoard]);
  const nextStage = getStage(stage.id + 1);
  const won = game.result?.winner === 'w';
  const resultReady = useDelayedFlag(game.isGameOver, RESULT_DELAY_MS);

  useEffect(() => {
    if (stage.id !== 1) return;
    let active = true;
    loadProgress().then(p => {
      if (!active) return;
      setGuideEligible(!p.guideDone && !(p.campaign[1] > 0));
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!showIntro && guideEligible) startGuide('move');
  }, [showIntro, guideEligible]);

  useEffect(() => {
    track('stage_start', { stage: stage.id });
    return () => {
      clearTimeout(evolveTimer.current);
      clearTimeout(swapTimer.current);
      clearTimeout(badgeTimer.current);
      clearTimeout(reviewTimer.current);
    };
  }, []);

  // 이기면 별 계산 후 저장 (최고 기록만 남음). 캡슐을 다 깼으면 배지
  useEffect(() => {
    if (!game.isGameOver || !game.result) return;
    const outcome = game.result.winner === 'w' ? 'win' : game.result.winner ? 'lose' : 'draw';
    const stars = outcome === 'win' ? starsFor(stage, game.result.blueMoves, undos + hints) : 0;
    track('stage_end', { stage: stage.id, result: outcome, moves: game.result.blueMoves, stars, undos });
    if (outcome !== 'win') {
      if (outcome === 'draw') feedback.clear();
      else feedback.lose();
      return;
    }
    feedback.win();
    setEarnedStars(stars);
    loadProgress().then(before =>
      recordStageResult(stage.id, stars).then(after => {
        const earned = newBadge(before.campaign, after.campaign);
        setBadge(earned);
        if (earned) {
          badgeTimer.current = setTimeout(feedback.badge, 900);
          reviewTimer.current = requestReviewLater('badge');
        }
        setBadgeCount(earnedBadges(after.campaign).length);
      })
    );
  }, [game.isGameOver]);

  // 가이드가 지금 추천하는 수 (내 차례일 때만)
  const guideMove =
    guide && guide !== 'done' && game.turn === 'w' && !game.isGameOver
      ? guide === 'move'
        ? game.lastMove
          ? null
          : firstGuideMove(game.board)
        : captureGuideMove(game.board)
      : null;

  // 잡을 기회가 없으면 잡기 안내는 건너뛰고 마무리
  useEffect(() => {
    if (guide === 'capture' && game.turn === 'w' && !game.isGameOver && !guideMove) finishGuide();
  }, [guide, game.turn, game.board]);

  const startGuide = (step: GuideStep) => {
    setGuide(step);
    track('guide_step', { step });
  };

  const finishGuide = () => {
    startGuide('done');
    recordGuideDone();
  };

  // 내 수가 들어오면 가이드를 다음 단계로
  const advanceGuide = () => {
    if (guide === 'move') startGuide('capture');
    else if (guide === 'capture') finishGuide();
    else if (guide === 'done') setGuide(null);
  };

  // 내 폰이 끝 줄에 닿으면 진화 연출
  const handleMove = (move: Move) => {
    const mover = game.board[move.fromR][move.fromC];
    setNotice(null);
    setHint(null);
    advanceGuide();
    game.move(move);
    if (mover === 'wP' && move.toR === 0) {
      evolveTimer.current = setTimeout(() => {
        setEvolving('w');
        recordStat('evolutions');
      }, EVOLVE_DELAY);
    }
  };

  // 결과 창 → 공유 창 (닫히는 애니메이션이 끝난 뒤 띄움)
  const openShare = (content: ShareContent) => {
    setHideResult(true);
    swapTimer.current = setTimeout(() => setSharing(content), MODAL_SWAP_MS);
  };
  const closeShare = () => {
    setSharing(null);
    swapTimer.current = setTimeout(() => setHideResult(false), MODAL_SWAP_MS);
  };

  // 처음부터 다시: 무르기 횟수, 지난 판 결과(별·배지), 대기 중인 연출·소리도 새로
  const restart = () => {
    clearTimeout(evolveTimer.current);
    clearTimeout(badgeTimer.current);
    setHideResult(false);
    setBadge(null);
    setEarnedStars(0);
    game.reset();
    setUndos(0);
    setHints(0);
    setHint(null);
    setSelected(null);
    setNotice(null);
    if (guide === 'move' || guide === 'capture') setGuide('move');
  };

  // 가이드 손가락 위치: 추천 기물 → (그 기물을 고르면) 도착 칸. 다른 기물을 고르면 숨김
  const pickedGuidePiece = !!guideMove && selected?.r === guideMove.fromR && selected?.c === guideMove.fromC;
  const hintSelected = !!hint && selected?.r === hint.fromR && selected?.c === hint.fromC;
  const pointer = hint
    ? hintSelected ? { r: hint.toR, c: hint.toC } : { r: hint.fromR, c: hint.fromC }
    : guideMove
    ? pickedGuidePiece
      ? { r: guideMove.toR, c: guideMove.toC }
      : selected
        ? null
        : { r: guideMove.fromR, c: guideMove.fromC }
    : null;
  const guideText = game.isGameOver
    ? null
    : guide === 'done'
      ? strings.guide.done
      : guideMove
        ? guide === 'move'
          ? pickedGuidePiece
            ? strings.guide.moveTarget
            : strings.guide.movePiece
          : pickedGuidePiece
            ? strings.guide.captureTarget
            : strings.guide.capturePiece
        : null;

  const line = battleText(
    strings,
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
        interactive={game.canPlayerMove && !showIntro && guideEligible !== null}
        lastMove={game.lastMove}
        checkedKing={game.checkedKing}
        onMove={handleMove}
        pointer={pointer}
        onSelect={setSelected}
      />

      <View style={styles.column}>
        <TeamPanel
          side="w"
          avatar="wK"
          name={strings.battle.me}
          detail={`${strings.battle.movesUsed(game.blueMoves)} · ${undos + hints > 0 ? strings.battle.goal(2, stage.par + 6) : strings.battle.goal(3, stage.par)}`}
          power={powerOf(game.board, 'w')}
          maxPower={maxPower.w}
          active={game.turn === 'w' && !game.isGameOver}
        />
        <DialogBox text={hint ? (hintSelected ? strings.campaign.hintTarget : strings.campaign.hintPiece) : notice ?? guideText ?? (game.isGameOver && game.result?.drawReason ? strings.endings[game.result.drawReason] : game.drawRemaining <= 8 ? strings.endings.warning(game.drawRemaining, game.drawCanReset) : line)} />
        <GameControls
          hint={{
            label: strings.campaign.hint,
            disabled: !game.canPlayerMove || showIntro || guideEligible === null || !!hint,
            onPress: () => {
              const move = suggestedBlueMove(game.board);
              if (!move) return;
              setHint(move);
              setHints(n => n + 1);
              setGuide(null);
              setNotice(null);
            },
          }}
          canUndo={game.canUndo}
          onUndo={() => {
            clearTimeout(evolveTimer.current);
            setHint(null);
            setSelected(null);
            game.undo();
            if (undos === 0) setNotice(strings.campaign.undoNotice);
            setUndos(n => n + 1);
            track('undo', { screen: 'stage' });
          }}
          onRestart={restart}
        />
      </View>

      <BattleIntro
        visible={showIntro}
        stage={stage}
        onStart={() => setShowIntro(false)}
      />
      <EvolutionOverlay side={evolving} onClose={() => setEvolving(null)} />

      <ResultModal
        visible={resultReady && !evolving && !hideResult}
        art={<MascotFace mood={won ? 'happy' : game.result?.winner ? 'sad' : 'thinking'} size={100} />}
        celebrate={won}
        title={won ? (nextStage ? strings.campaign.cleared : strings.campaign.allCleared) : game.result?.winner ? strings.campaign.failed : strings.result.draw}
        detail={won ? `${'★'.repeat(earnedStars)}${'☆'.repeat(3 - earnedStars)}` : game.result?.drawReason ? strings.endings[game.result.drawReason] : strings.campaign.lossHelp}
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
                {undos + hints > 0 ? `\n${strings.campaign.helpCapped}` : ''}
                {earnedStars < 3 ? `\n${strings.campaign.starTarget(stage.par)}` : ''}
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
          ) : (
            <GameButton label={strings.campaign.practiceFirst} variant="white" size="sm"
              onPress={() => router.replace('/practice/1')} />
          )
        }
        primary={
          won
            ? nextStage
              ? {
                  label: nextStage.id > FREE_STAGES && !owned ? strings.billing.nextCapsule : strings.campaign.next,
                  onPress: () => {
                    const path = `/campaign/${nextStage.id}` as const;
                    if (nextStage.id > FREE_STAGES && !owned) router.push(path);
                    else router.replace(path);
                  },
                }
              : { label: strings.campaign.list, onPress: () => router.back() }
            : { label: strings.campaign.retry, onPress: restart }
        }
        secondary={
          won
            ? { label: earnedStars < 3 ? strings.campaign.retryStars : strings.campaign.retry, onPress: restart }
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

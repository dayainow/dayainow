import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { track } from '../../src/analytics';
import { newBadge, opponentFor, stageInCapsule } from '../../src/campaign/league';
import { type Stage, buildStageBoard, getStage, starsFor } from '../../src/campaign/stages';
import { BattleIntro } from '../../src/components/BattleIntro';
import { ChessBoard } from '../../src/components/ChessBoard';
import { EvolutionOverlay } from '../../src/components/EvolutionOverlay';
import { GameControls } from '../../src/components/GameControls';
import { ResultModal } from '../../src/components/ResultModal';
import type { Move } from '../../src/engine/chessEngine';
import { feedback } from '../../src/feedback/feedback';
import { battleText } from '../../src/game/battleText';
import { battleEvent } from '../../src/game/commentary';
import { powerOf } from '../../src/game/material';
import { useChessGame } from '../../src/game/useChessGame';
import { strings } from '../../src/i18n';
import { loadProgress, recordStageResult } from '../../src/storage/progress';
import { palette } from '../../src/theme';
import { CapsuleBadge } from '../../src/ui/CapsuleBadge';
import { DialogBox } from '../../src/ui/DialogBox';
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
  const [undos, setUndos] = useState(0);
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
    return () => clearTimeout(evolveTimer.current);
  }, []);

  // 이기면 별 계산 후 저장 (최고 기록만 남음). 캡슐을 다 깼으면 배지
  useEffect(() => {
    if (!game.isGameOver || !game.result) return;
    const outcome = game.result.winner === 'w' ? 'win' : game.result.winner ? 'lose' : 'draw';
    const stars = outcome === 'win' ? starsFor(stage, game.result.blueMoves) : 0;
    track('stage_end', { stage: stage.id, result: outcome, moves: game.result.blueMoves, stars, undos });
    if (outcome !== 'win') {
      feedback.lose();
      return;
    }
    feedback.win();
    setEarnedStars(stars);
    loadProgress().then(before => recordStageResult(stage.id, stars).then(after => setBadge(newBadge(before.campaign, after.campaign))));
  }, [game.isGameOver]);

  // 내 폰이 끝 줄에 닿으면 진화 연출
  const handleMove = (move: Move) => {
    const mover = game.board[move.fromR][move.fromC];
    game.move(move);
    if (mover === 'wP' && move.toR === 0) evolveTimer.current = setTimeout(() => setEvolving('w'), EVOLVE_DELAY);
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
          detail={`${strings.battle.movesUsed(game.blueMoves)} · ★${stage.par}`}
          power={powerOf(game.board, 'w')}
          maxPower={maxPower.w}
          active={game.turn === 'w' && !game.isGameOver}
        />
        <DialogBox text={line} />
        <GameControls
          canUndo={game.canUndo}
          onUndo={() => {
            game.undo();
            setUndos(n => n + 1);
            track('undo', { screen: 'stage' });
          }}
          onRestart={() => game.reset()}
        />
      </View>

      <BattleIntro visible={showIntro} stage={stage} onStart={() => setShowIntro(false)} />
      <EvolutionOverlay side={evolving} onClose={() => setEvolving(null)} />

      <ResultModal
        visible={game.isGameOver && !evolving}
        art={<MascotFace mood={won ? 'happy' : 'sad'} size={100} />}
        celebrate={won}
        title={won ? (nextStage ? strings.campaign.cleared : strings.campaign.allCleared) : strings.campaign.failed}
        detail={won ? `${'★'.repeat(earnedStars)}${'☆'.repeat(3 - earnedStars)}` : strings.campaign.failedDetail}
        detailColor={won ? palette.star : palette.inkSoft}
        extra={
          won && badge ? (
            <View style={styles.badgeAward}>
              <CapsuleBadge capsule={badge} earned size={56} />
              <Text style={styles.badgeText}>{strings.league.badgeEarned(strings.league.badgeNames[badge - 1])}</Text>
            </View>
          ) : won ? (
            <Text style={styles.moves}>{strings.campaign.movesUsed(game.result?.blueMoves ?? 0)}</Text>
          ) : null
        }
        primary={
          won
            ? nextStage
              ? { label: strings.campaign.next, onPress: () => router.replace(`/campaign/${nextStage.id}`) }
              : { label: strings.campaign.list, onPress: () => router.back() }
            : { label: strings.campaign.retry, onPress: () => game.reset() }
        }
        secondary={
          won
            ? { label: strings.campaign.retry, onPress: () => game.reset() }
            : { label: strings.campaign.list, onPress: () => router.back() }
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 16 },
  column: { alignSelf: 'stretch', width: '100%', maxWidth: 480, marginHorizontal: 'auto', paddingHorizontal: 14, gap: 10 },
  moves: { fontSize: 15, color: palette.inkSoft, marginTop: 4 },
  badgeAward: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: palette.sunLight, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  badgeText: { flexShrink: 1, fontSize: 16 },
});

import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Stage, buildStageBoard, getStage, starsFor } from '../../src/campaign/stages';
import { ChessBoard } from '../../src/components/ChessBoard';
import { GameControls } from '../../src/components/GameControls';
import { ResultModal } from '../../src/components/ResultModal';
import { MascotBubble } from '../../src/components/MascotBubble';
import { useChessGame } from '../../src/game/useChessGame';
import { strings } from '../../src/i18n';
import { track } from '../../src/analytics';
import { feedback } from '../../src/feedback/feedback';
import { recordStageResult } from '../../src/storage/progress';
import { palette } from '../../src/theme';

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
  const [undos, setUndos] = useState(0);
  const nextStage = getStage(stage.id + 1);
  const won = game.result?.winner === 'w';

  useEffect(() => {
    track('stage_start', { stage: stage.id });
  }, []);

  // 이기면 별 계산 후 저장 (최고 기록만 남음)
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
    recordStageResult(stage.id, stars);
  }, [game.isGameOver]);

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen options={{ title: strings.campaign.stage(stage.id) }} />
      <View style={styles.header}>
        <Text style={styles.goal}>{strings.campaign.goal(stage.par)}</Text>
        <Text style={styles.moves}>{strings.campaign.movesUsed(game.blueMoves)}</Text>
        <View style={styles.turn}>
          <MascotBubble
            vsAi={true}
            turn={game.turn}
            status={game.status}
            lastMove={game.lastMove}
            lastCaptured={game.lastCaptured}
            winner={game.isGameOver ? game.result?.winner ?? null : null}
            isGameOver={game.isGameOver}
            moveCount={game.blueMoves * 2 + (game.turn === 'b' ? 1 : 0)}
          />
        </View>
      </View>

      <ChessBoard
        board={game.board}
        sideToMove={game.turn}
        interactive={game.canPlayerMove}
        lastMove={game.lastMove}
        checkedKing={game.checkedKing}
        onMove={game.move}
      />

      <GameControls
        canUndo={game.canUndo}
        onUndo={() => {
          game.undo();
          setUndos(n => n + 1);
          track('undo', { screen: 'stage' });
        }}
        onRestart={() => game.reset()}
      />

      <ResultModal
        visible={game.isGameOver}
        emoji={won ? '🎉' : '😵'}
        celebrate={won}
        title={won ? (nextStage ? strings.campaign.cleared : strings.campaign.allCleared) : strings.campaign.failed}
        detail={won ? `${'★'.repeat(earnedStars)}${'☆'.repeat(3 - earnedStars)}  ${strings.campaign.movesUsed(game.result?.blueMoves ?? 0)}` : strings.campaign.failedDetail}
        detailColor={palette.ink}
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
  container: { flex: 1, backgroundColor: palette.mintMist, alignItems: 'center', paddingBottom: 20 },
  header: { alignItems: 'center', marginTop: 4 },
  goal: { fontSize: 15, fontWeight: '700', color: palette.ink },
  moves: { fontSize: 13, color: palette.inkSoft, marginTop: 2 },
  turn: { marginTop: 10 },
});

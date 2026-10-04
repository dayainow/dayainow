import { Redirect, Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Stage, buildStageBoard, getStage, starsFor } from '../../src/campaign/stages';
import { ChessBoard } from '../../src/components/ChessBoard';
import { ResultModal } from '../../src/components/ResultModal';
import { TurnBadge } from '../../src/components/TurnBadge';
import { useChessGame } from '../../src/game/useChessGame';
import { strings } from '../../src/i18n';
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
  const nextStage = getStage(stage.id + 1);
  const won = game.result?.winner === 'w';

  // 이기면 별 계산 후 저장 (최고 기록만 남음)
  useEffect(() => {
    if (!game.isGameOver) return;
    if (game.result?.winner !== 'w') {
      feedback.lose();
      return;
    }
    feedback.win();
    const stars = starsFor(stage, game.result.blueMoves);
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
          <TurnBadge turn={game.turn} status={game.status} />
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

      <TouchableOpacity style={styles.button} onPress={() => game.reset()}>
        <Text style={styles.buttonText}>{strings.restart}</Text>
      </TouchableOpacity>

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
  button: { backgroundColor: palette.ink, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
  buttonText: { color: palette.white, fontSize: 16, fontWeight: 'bold' },
});

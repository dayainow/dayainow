import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { track } from '../src/analytics';
import { ChessBoard } from '../src/components/ChessBoard';
import { EvolutionOverlay } from '../src/components/EvolutionOverlay';
import { GameControls } from '../src/components/GameControls';
import { ResultModal } from '../src/components/ResultModal';
import { DIFFICULTY_DEPTH, type Difficulty } from '../src/engine/chessAI';
import { BOARD_SIZE, INITIAL_BOARD, type Move } from '../src/engine/chessEngine';
import { feedback } from '../src/feedback/feedback';
import { battleText } from '../src/game/battleText';
import { battleEvent } from '../src/game/commentary';
import { powerOf } from '../src/game/material';
import { useChessGame } from '../src/game/useChessGame';
import { strings } from '../src/i18n';
import { DEFAULT_SETTINGS, loadSettings, updateSettings } from '../src/storage/settings';
import { palette, sideColors } from '../src/theme';
import { DialogBox } from '../src/ui/DialogBox';
import { GameButton } from '../src/ui/GameButton';
import { MascotFace } from '../src/ui/MascotFace';
import { TeamPanel } from '../src/ui/TeamPanel';
import { Text } from '../src/ui/Text';

const LEVELS = Object.keys(DIFFICULTY_DEPTH) as Difficulty[];
const MAX_POWER = powerOf(INITIAL_BOARD, 'w');
const EVOLVE_DELAY = 420;

export default function FreePlayScreen() {
  const [gameMode, setGameMode] = useState<'pvp' | 'pve'>('pve');
  const [difficulty, setDifficulty] = useState<Difficulty>(DEFAULT_SETTINGS.difficulty); // 게임 중 바꾸면 AI의 다음 수부터 적용
  const [evolving, setEvolving] = useState<'w' | 'b' | null>(null);
  const evolveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const vsAi = gameMode === 'pve';
  const game = useChessGame({ ai: vsAi ? { depth: DIFFICULTY_DEPTH[difficulty] } : null });
  const { result } = game;

  useEffect(() => {
    loadSettings().then(settings => setDifficulty(settings.difficulty));
    return () => clearTimeout(evolveTimer.current);
  }, []);

  // 난이도 버튼은 누를 때마다 쉬움 → 보통 → 어려움 순서로 바뀜
  const cycleDifficulty = () => {
    const level = LEVELS[(LEVELS.indexOf(difficulty) + 1) % LEVELS.length];
    setDifficulty(level);
    updateSettings({ difficulty: level });
  };

  // AI에게 지면 패배음, 그 외 승리는 축하 (2인 대전은 누가 이기든 축하)
  const playerLost = vsAi && result?.winner === 'b';
  useEffect(() => {
    if (!game.isGameOver) return;
    track('free_play_end', { mode: gameMode, difficulty, result: !result?.winner ? 'draw' : playerLost ? 'lose' : 'win' });
    if (!result?.winner) feedback.clear();
    else if (playerLost) feedback.lose();
    else feedback.win();
  }, [game.isGameOver]);

  const switchMode = (mode: 'pvp' | 'pve') => {
    setGameMode(mode);
    game.reset();
  };

  // 사람이 둔 폰이 끝 줄에 닿으면 진화 연출 (AI의 진화는 대사로만)
  const handleMove = (move: Move) => {
    const mover = game.board[move.fromR][move.fromC];
    game.move(move);
    const lastRow = mover === 'wP' ? 0 : mover === 'bP' ? BOARD_SIZE - 1 : -1;
    if (move.toR === lastRow) evolveTimer.current = setTimeout(() => setEvolving(mover![0] as 'w' | 'b'), EVOLVE_DELAY);
  };

  const line = battleText(
    battleEvent({
      vsAi,
      status: game.status,
      lastMover: game.lastMover,
      lastCaptured: game.lastCaptured,
      lastPromoted: game.lastPromoted,
      winner: game.isGameOver ? result?.winner ?? null : null,
      isGameOver: game.isGameOver,
    }),
    vsAi
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.column}>
        <View style={styles.controls}>
          <View style={styles.segment}>
            {(['pve', 'pvp'] as const).map(mode => (
              <Pressable key={mode} style={[styles.segmentItem, gameMode === mode && styles.segmentActive]} onPress={() => switchMode(mode)}>
                <Text style={[styles.segmentText, gameMode !== mode && styles.segmentTextOff]}>{strings.mode[mode]}</Text>
              </Pressable>
            ))}
          </View>
          {vsAi && (
            <GameButton
              label={`AI · ${strings.difficulty[difficulty]}`}
              onPress={cycleDifficulty}
              variant="white"
              size="sm"
              accessibilityLabel={strings.difficultyLabel}
            />
          )}
        </View>
        <TeamPanel
          side="b"
          avatar="bK"
          name={strings.battle.redTeam}
          power={powerOf(game.board, 'b')}
          maxPower={MAX_POWER}
          active={game.turn === 'b' && !game.isGameOver}
        />
      </View>

      <ChessBoard
        board={game.board}
        sideToMove={game.turn}
        interactive={game.canPlayerMove}
        lastMove={game.lastMove}
        checkedKing={game.checkedKing}
        onMove={handleMove}
      />

      <View style={styles.column}>
        <TeamPanel
          side="w"
          avatar="wK"
          name={vsAi ? strings.battle.me : strings.battle.blueTeam}
          power={powerOf(game.board, 'w')}
          maxPower={MAX_POWER}
          active={game.turn === 'w' && !game.isGameOver}
        />
        <DialogBox text={line} />
        <GameControls
          canUndo={game.canUndo}
          onUndo={() => {
            game.undo();
            track('undo', { screen: 'play' });
          }}
          onRestart={() => game.reset()}
        />
      </View>

      <EvolutionOverlay side={evolving} onClose={() => setEvolving(null)} />

      <ResultModal
        visible={game.isGameOver && !evolving}
        art={<MascotFace mood={!result?.winner ? 'thinking' : playerLost ? 'sad' : 'happy'} size={100} />}
        celebrate={!!result?.winner && !playerLost}
        title={result?.status === 'checkmate' ? strings.result.checkmate : result?.status === 'stalemate' ? strings.result.stalemate : strings.result.draw}
        detail={
          result?.winner
            ? strings.result.winner[result.winner]
            : result?.status === 'stalemate'
              ? strings.result.stalemateDetail
              : strings.result.drawDetail
        }
        detailColor={result?.winner ? sideColors[result.winner] : palette.inkSoft}
        primary={{ label: strings.result.playAgain, onPress: () => game.reset() }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 16 },
  column: { alignSelf: 'stretch', width: '100%', maxWidth: 480, marginHorizontal: 'auto', paddingHorizontal: 14, gap: 10 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  segment: { flexDirection: 'row', flexShrink: 1, backgroundColor: palette.white, borderWidth: 3, borderColor: palette.ink, borderRadius: 16, padding: 3 },
  segmentItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 11 },
  segmentActive: { backgroundColor: palette.sun },
  segmentText: { fontSize: 15 },
  segmentTextOff: { color: palette.inkSoft },
});

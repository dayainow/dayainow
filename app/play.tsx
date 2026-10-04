import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChessBoard } from '../src/components/ChessBoard';
import { ResultModal } from '../src/components/ResultModal';
import { TurnBadge } from '../src/components/TurnBadge';
import { DIFFICULTY_DEPTH, type Difficulty } from '../src/engine/chessAI';
import { useChessGame } from '../src/game/useChessGame';
import { strings } from '../src/i18n';
import { feedback } from '../src/feedback/feedback';
import { DEFAULT_SETTINGS, loadSettings, updateSettings } from '../src/storage/settings';
import { palette, sideColors } from '../src/theme';

export default function FreePlayScreen() {
  const [gameMode, setGameMode] = useState<'pvp' | 'pve'>('pve');
  const [difficulty, setDifficulty] = useState<Difficulty>(DEFAULT_SETTINGS.difficulty); // 게임 중 바꾸면 AI의 다음 수부터 적용
  const game = useChessGame({ ai: gameMode === 'pve' ? { depth: DIFFICULTY_DEPTH[difficulty] } : null });
  const { result } = game;

  useEffect(() => {
    loadSettings().then(settings => setDifficulty(settings.difficulty));
  }, []);

  const changeDifficulty = (level: Difficulty) => {
    setDifficulty(level);
    updateSettings({ difficulty: level });
  };

  // AI에게 지면 패배음, 그 외 승리는 축하 (2인 대전은 누가 이기든 축하)
  const playerLost = gameMode === 'pve' && result?.winner === 'b';
  useEffect(() => {
    if (!game.isGameOver) return;
    if (!result?.winner) feedback.clear();
    else if (playerLost) feedback.lose();
    else feedback.win();
  }, [game.isGameOver]);

  const switchMode = (mode: 'pvp' | 'pve') => {
    setGameMode(mode);
    game.reset();
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.modeToggle}>
          {(['pve', 'pvp'] as const).map(mode => (
            <TouchableOpacity key={mode} style={[styles.modeBtn, gameMode === mode && styles.modeBtnActive]} onPress={() => switchMode(mode)}>
              <Text style={[styles.modeText, gameMode === mode && styles.modeTextActive]}>{strings.mode[mode]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {gameMode === 'pve' && (
          <View style={styles.difficultyRow}>
            <Text style={styles.difficultyLabel}>{strings.difficultyLabel}</Text>
            {(Object.keys(DIFFICULTY_DEPTH) as Difficulty[]).map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.difficultyBtn, difficulty === level && styles.difficultyBtnActive]}
                onPress={() => changeDifficulty(level)}
              >
                <Text style={[styles.difficultyText, difficulty === level && styles.difficultyTextActive]}>{strings.difficulty[level]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
        emoji={!result?.winner ? '🤝' : playerLost ? '😵' : '🎉'}
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
  container: { flex: 1, backgroundColor: palette.mintMist, alignItems: 'center', paddingBottom: 20 },
  header: { alignItems: 'center', marginTop: 4 },
  modeToggle: { flexDirection: 'row', backgroundColor: palette.line, borderRadius: 20, padding: 4 },
  modeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  modeBtnActive: { backgroundColor: palette.white },
  modeText: { fontSize: 14, color: palette.inkSoft, fontWeight: '600' },
  modeTextActive: { color: palette.ink },
  difficultyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  difficultyLabel: { fontSize: 13, color: palette.inkSoft, marginRight: 4 },
  difficultyBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.white },
  difficultyBtnActive: { backgroundColor: palette.mintLight, borderColor: palette.mint },
  difficultyText: { fontSize: 13, color: palette.inkSoft, fontWeight: '600' },
  difficultyTextActive: { color: palette.mintDark },
  turn: { marginTop: 12 },
  button: { backgroundColor: palette.ink, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 30 },
  buttonText: { color: palette.white, fontSize: 16, fontWeight: 'bold' },
});

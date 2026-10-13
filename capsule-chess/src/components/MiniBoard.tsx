import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette, sideColors } from '../theme';
import { PieceImage } from '../ui/PieceImage';
import { type BoardTheme, currentBoardTheme } from '../ui/boardThemes';

type Square = { r: number; c: number };

type Props = {
  board: (string | null)[][];
  size: number;
  moves?: Square[]; // 갈 수 있는 칸 (점)
  captures?: Square[]; // 잡을 수 있는 칸 (빨간 테두리)
  focus?: Square; // 눈에 띄게 할 칸 (설명하는 기물)
  theme?: BoardTheme; // 없으면 지금 고른 판
};

const has = (list: Square[], r: number, c: number) => list.some(sq => sq.r === r && sq.c === c);

// 규칙 안내용 작은 판 (누를 수 없음). 실제 게임 판과 같은 색을 씀
export function MiniBoard({ board, size, moves = [], captures = [], focus, theme = currentBoardTheme() }: Props) {
  const border = Math.max(2, Math.round(size / 60));
  const cell = (size - border * 2) / board.length;

  return (
    <View style={[styles.board, { width: size, height: size, borderWidth: border, borderRadius: Math.round(size / 14) }]}>
      {board.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((piece, c) => (
            <View key={c} style={[styles.cell, { backgroundColor: (r + c) % 2 === 0 ? theme.light : theme.dark }, focus?.r === r && focus?.c === c && styles.focus]}>
              {has(captures, r, c) && <View style={[styles.capture, { borderRadius: cell / 2, borderWidth: Math.max(2, cell / 14) }]} />}
              {has(moves, r, c) && <View style={[styles.dot, { width: cell * 0.3, height: cell * 0.3, borderRadius: cell * 0.15 }]} />}
              {piece && <PieceImage piece={piece} size={cell * 0.94} />}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { borderColor: palette.ink, overflow: 'hidden', backgroundColor: palette.white },
  row: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  focus: { backgroundColor: palette.butter },
  dot: { position: 'absolute', backgroundColor: palette.mintDark, opacity: 0.55 },
  capture: { position: 'absolute', top: '8%', left: '8%', right: '8%', bottom: '8%', borderColor: sideColors.b },
});

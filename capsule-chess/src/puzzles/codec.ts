import { BOARD_SIZE } from '../engine/chessEngine';

type Board = (string | null)[][];

// 보드 <-> 25글자 문자열. 위쪽 줄(레드 진영)부터 왼쪽→오른쪽 순서
// 대문자 = 블루(w), 소문자 = 레드(b), '.' = 빈칸.  예: 시작 위치 = "rnbqkppppp.....PPPPPRNBQK"
export const encodeBoard = (board: Board): string =>
  board
    .flat()
    .map(piece => (piece ? (piece.charAt(0) === 'w' ? piece.charAt(1) : piece.charAt(1).toLowerCase()) : '.'))
    .join('');

export const decodeBoard = (encoded: string): Board => {
  if (encoded.length !== BOARD_SIZE * BOARD_SIZE) throw new Error(`잘못된 보드 문자열: ${encoded}`);
  return Array.from({ length: BOARD_SIZE }, (_, r) =>
    Array.from({ length: BOARD_SIZE }, (_, c) => {
      const ch = encoded.charAt(r * BOARD_SIZE + c);
      if (ch === '.') return null;
      return ch === ch.toUpperCase() ? `w${ch}` : `b${ch.toUpperCase()}`;
    })
  );
};

// 위아래를 뒤집고 색을 바꿈 (레드 차례 퍼즐을 블루 차례로 바꿀 때)
export const mirrorBoard = (board: Board): Board =>
  board
    .slice()
    .reverse()
    .map(row => row.map(piece => (piece ? (piece.charAt(0) === 'w' ? 'b' : 'w') + piece.charAt(1) : null)));

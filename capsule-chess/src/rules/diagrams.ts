import { BOARD_SIZE, getValidMovesForPiece } from '../engine/chessEngine';

export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';
type Square = { r: number; c: number };

export type PieceDiagram = {
  board: (string | null)[][];
  from: Square; // 움직이는 기물 위치
  moves: Square[]; // 갈 수 있는 칸
  captures: Square[]; // 잡을 수 있는 칸
};

// 규칙 안내에 보여 줄 순서 (익숙한 것부터)
export const PIECE_ORDER: PieceType[] = ['K', 'Q', 'R', 'B', 'N', 'P'];

const emptyBoard = () => Array.from({ length: BOARD_SIZE }, () => Array<string | null>(BOARD_SIZE).fill(null));

// 기물 하나가 어디로 갈 수 있는지 보여 주는 작은 판
export const pieceDiagram = (type: PieceType): PieceDiagram => {
  const board = emptyBoard();
  // 폰은 앞으로 한 칸 + 대각선 앞의 레드 기물을 잡는 모습
  if (type === 'P') {
    board[3][2] = 'wP';
    board[2][1] = 'bP';
    board[2][3] = 'bN';
  } else {
    board[2][2] = `w${type}`;
  }
  const from = type === 'P' ? { r: 3, c: 2 } : { r: 2, c: 2 };
  const reachable = getValidMovesForPiece(from.r, from.c, board);
  return {
    board,
    from,
    moves: reachable.filter(sq => !board[sq.r][sq.c]),
    captures: reachable.filter(sq => !!board[sq.r][sq.c]),
  };
};

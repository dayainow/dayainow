import { BOARD_SIZE } from './chessEngine';

// { 'row,col': 'wK' } 형태로 테스트용 보드를 만든다
export const place = (pieces: Record<string, string>): (string | null)[][] => {
  const board: (string | null)[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  for (const [square, piece] of Object.entries(pieces)) {
    const [r, c] = square.split(',').map(Number);
    board[r][c] = piece;
  }
  return board;
};

import {
  type Move,
  BOARD_SIZE,
  getAllLegalMoves,
  getLegalMovesForPiece,
  isInCheck,
  simulateMove,
} from './chessEngine';

type Board = (string | null)[][];
type Color = 'w' | 'b';

const opponent = (color: Color): Color => (color === 'w' ? 'b' : 'w');

// 둘 수 있는 수가 하나라도 있는지 (전부 구하지 않고 찾는 즉시 멈춤)
const hasLegalMove = (color: Color, board: Board): boolean => {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const piece = board[r][c];
      if (piece && piece.charAt(0) === color && getLegalMovesForPiece(r, c, board).length > 0) return true;
    }
  }
  return false;
};

export const isCheckmated = (color: Color, board: Board): boolean =>
  isInCheck(color, board) && !hasLegalMove(color, board);

// attacker가 방금 둔 뒤의 판에서, 수비가 무엇을 두든 attacker가 남은 수(movesLeft - 1) 안에 메이트시키는지
export const forcesMate = (afterMove: Board, attacker: Color, movesLeft: number): boolean => {
  const defender = opponent(attacker);
  if (isCheckmated(defender, afterMove)) return true;
  if (movesLeft <= 1) return false;
  const replies = getAllLegalMoves(defender, afterMove);
  if (replies.length === 0) return false; // 스테일메이트는 실패
  return replies.every(reply => canForceMate(simulateMove(afterMove, reply), attacker, movesLeft - 1));
};

// attacker 차례인 판에서 n수(attacker 기준) 안에 반드시 메이트시킬 수 있는지
export const canForceMate = (board: Board, attacker: Color, n: number): boolean => {
  if (n <= 0) return false;
  const defender = opponent(attacker);
  for (const move of getAllLegalMoves(attacker, board)) {
    const after = simulateMove(board, move);
    // 마지막 한 수는 체크가 아니면 메이트가 될 수 없으므로 빠르게 건너뜀
    if (n === 1) {
      if (isInCheck(defender, after) && !hasLegalMove(defender, after)) return true;
      continue;
    }
    if (forcesMate(after, attacker, n)) return true;
  }
  return false;
};

// n수 안에 메이트를 강제하는 첫 수 목록
export const findMatingMoves = (board: Board, attacker: Color, n: number): Move[] =>
  getAllLegalMoves(attacker, board).filter(move => forcesMate(simulateMove(board, move), attacker, n));

// 메이트를 최대한 늦추는 수비 수 (퍼즐에서 상대가 가장 끈질기게 버티도록)
export const pickStubbornReply = (board: Board, attacker: Color, movesLeft: number): Move | null => {
  const defender = opponent(attacker);
  const replies = getAllLegalMoves(defender, board);
  if (replies.length === 0) return null;
  const stubborn = replies.filter(reply => !canForceMate(simulateMove(board, reply), attacker, movesLeft - 2));
  const pool = stubborn.length > 0 ? stubborn : replies;
  return pool[Math.floor(Math.random() * pool.length)];
};

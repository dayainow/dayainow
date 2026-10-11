import { type Move, getAllLegalMoves } from '../engine/chessEngine';
import { PIECE_POWER } from './material';

type Board = (string | null)[][];

// 첫 배틀 가이드 단계: 첫 수 → 잡기 → 마무리 한마디
export type GuideStep = 'move' | 'capture' | 'done';

// 첫 수 추천: 가운데 폰 한 칸 전진 (상대 폰과 맞닿아 바로 '잡기'를 배울 수 있음). 못 두면 아무 폰 전진
export const firstGuideMove = (board: Board): Move | null => {
  const pawnMoves = getAllLegalMoves('w', board).filter(m => board[m.fromR][m.fromC] === 'wP' && m.fromC === m.toC);
  return pawnMoves.find(m => m.fromR === 3 && m.fromC === 2) ?? pawnMoves[0] ?? null;
};

// 잡기 추천: 가장 값진 기물을, 그중에서도 가장 싼 기물로 잡는 수
export const captureGuideMove = (board: Board): Move | null => {
  const value = (piece: string | null) => (piece ? PIECE_POWER[piece[1]] ?? 0 : 0);
  const captures = getAllLegalMoves('w', board).filter(m => board[m.toR][m.toC]);
  captures.sort(
    (a, b) =>
      value(board[b.toR][b.toC]) - value(board[a.toR][a.toC]) || value(board[a.fromR][a.fromC]) - value(board[b.fromR][b.fromC])
  );
  return captures[0] ?? null;
};

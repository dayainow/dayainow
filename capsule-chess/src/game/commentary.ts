import type { GameStatus } from '../engine/chessEngine';

type Side = 'w' | 'b';
type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';

// 배틀 대사 상자에 보여 줄 상황 (실제 문구는 i18n strings.battle)
export type BattleEvent =
  | { kind: 'start' }
  | { kind: 'promote'; side: Side }
  | { kind: 'capture'; side: Side; mover: PieceType; captured: PieceType; check: boolean }
  | { kind: 'check'; side: Side; mover: PieceType }
  | { kind: 'move'; side: Side; mover: PieceType }
  | { kind: 'win' }
  | { kind: 'lose' }
  | { kind: 'pvpWin'; side: Side }
  | { kind: 'stalemate' }
  | { kind: 'draw' };

export type BattleState = {
  vsAi: boolean; // AI 대전이면 사용자는 블루(w)
  status: GameStatus;
  lastMover: string | null; // 마지막에 움직인 기물 (승급 전 모습)
  lastCaptured: string | null;
  lastPromoted: boolean;
  winner: Side | null;
  isGameOver: boolean;
};

// 판 상황 → 대사. 우선순위: 게임 끝 > 진화 > 잡기(+체크) > 체크 > 이동
export const battleEvent = (s: BattleState): BattleEvent => {
  if (s.isGameOver) {
    if (s.status === 'stalemate') return { kind: 'stalemate' };
    if (!s.winner) return { kind: 'draw' };
    if (!s.vsAi) return { kind: 'pvpWin', side: s.winner };
    return { kind: s.winner === 'w' ? 'win' : 'lose' };
  }
  if (!s.lastMover) return { kind: 'start' };

  const side = s.lastMover[0] as Side;
  const mover = s.lastMover[1] as PieceType;
  if (s.lastPromoted) return { kind: 'promote', side };
  if (s.lastCaptured) return { kind: 'capture', side, mover, captured: s.lastCaptured[1] as PieceType, check: s.status === 'check' };
  if (s.status === 'check') return { kind: 'check', side, mover };
  return { kind: 'move', side, mover };
};

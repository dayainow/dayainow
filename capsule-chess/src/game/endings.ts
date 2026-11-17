import { getGameStatus, type GameStatus } from '../engine/chessEngine';

export type Position = { board: (string | null)[][]; turn: 'w' | 'b' };
export type DrawReason = 'stalemate' | 'kings' | 'repetition' | 'noProgress' | 'moveLimit';
export const QUIET_LIMIT = 40;
export const MOVE_LIMIT = 80;
const key = ({ board, turn }: Position) => `${turn}:${board.flat().map(p => p ?? '.').join(',')}`;
const material = (p: Position) => p.board.flat().filter(Boolean).length;
const pawns = (p: Position) => p.board.flat().map(p => p?.[1] === 'P' ? p : '.').join(',');

// Capsule Chess's short-match rules. History contains positions BEFORE each move.
// Rebuilding counters from history makes undo and restart restore them naturally.
export function evaluateEnding(history: Position[], current: Position): {
  status: GameStatus; reason?: DrawReason; remaining: number;
} {
  const status = getGameStatus(current.turn, current.board);
  const positions = [...history, current];
  let quiet = 0;
  for (let i = positions.length - 1; i > 0; i--) {
    if (material(positions[i]) !== material(positions[i - 1]) || pawns(positions[i]) !== pawns(positions[i - 1])) break;
    quiet++;
  }
  const remaining = Math.max(0, Math.min(QUIET_LIMIT - quiet, MOVE_LIMIT - history.length));
  // A winning move on the boundary remains a win.
  if (status === 'checkmate') return { status, remaining };
  if (status === 'stalemate') return { status, reason: 'stalemate', remaining };
  if (status === 'draw') return { status, reason: 'kings', remaining };
  const repeats = positions.filter(p => key(p) === key(current)).length;
  const reason = repeats >= 3 ? 'repetition' : history.length >= MOVE_LIMIT ? 'moveLimit' : quiet >= QUIET_LIMIT ? 'noProgress' : undefined;
  return { status: reason ? 'draw' : status, reason, remaining };
}

import { INITIAL_BOARD } from '../../engine/chessEngine';
import { type Snapshot, undoTargetIndex } from '../useChessGame';

const snap = (turn: 'w' | 'b'): Snapshot => ({
  board: INITIAL_BOARD,
  turn,
  status: 'playing',
  lastMove: null,
  lastMover: null,
  lastCaptured: null,
  lastPromoted: false,
  blueMoves: 0,
});

describe('undoTargetIndex', () => {
  it('has nothing to undo at the start', () => {
    expect(undoTargetIndex([], true)).toBeNull();
  });

  it('vs AI goes back past the AI reply to my last move', () => {
    // [내 수 직전, AI 수 직전] → 내 수 직전으로
    expect(undoTargetIndex([snap('w'), snap('b')], true)).toBe(0);
    expect(undoTargetIndex([snap('w'), snap('b'), snap('w'), snap('b')], true)).toBe(2);
    // AI가 아직 생각 중이면 내 수만 되돌림
    expect(undoTargetIndex([snap('w'), snap('b'), snap('w')], true)).toBe(2);
  });

  it('pass & play undoes one move at a time', () => {
    expect(undoTargetIndex([snap('w'), snap('b')], false)).toBe(1);
  });
});

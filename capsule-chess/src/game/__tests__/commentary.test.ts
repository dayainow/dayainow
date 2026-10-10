import { type BattleState, battleEvent } from '../commentary';

const base: BattleState = {
  vsAi: true,
  status: 'playing',
  lastMover: null,
  lastCaptured: null,
  lastPromoted: false,
  winner: null,
  isGameOver: false,
};

describe('battleEvent', () => {
  it('opens the battle before the first move', () => {
    expect(battleEvent(base)).toEqual({ kind: 'start' });
  });

  it('describes plain moves, captures and checks by the side that moved', () => {
    expect(battleEvent({ ...base, lastMover: 'wN' })).toEqual({ kind: 'move', side: 'w', mover: 'N' });
    expect(battleEvent({ ...base, lastMover: 'bB', lastCaptured: 'wP' })).toEqual({ kind: 'capture', side: 'b', mover: 'B', captured: 'P', check: false });
    expect(battleEvent({ ...base, lastMover: 'wQ', lastCaptured: 'bR', status: 'check' })).toEqual({ kind: 'capture', side: 'w', mover: 'Q', captured: 'R', check: true });
    expect(battleEvent({ ...base, lastMover: 'wR', status: 'check' })).toEqual({ kind: 'check', side: 'w', mover: 'R' });
  });

  it('celebrates a pawn evolving even when it also captured', () => {
    expect(battleEvent({ ...base, lastMover: 'wP', lastCaptured: 'bN', lastPromoted: true })).toEqual({ kind: 'promote', side: 'w' });
  });

  it('ends with win, loss or draw', () => {
    const over = { ...base, isGameOver: true, lastMover: 'wQ', status: 'checkmate' as const };
    expect(battleEvent({ ...over, winner: 'w' })).toEqual({ kind: 'win' });
    expect(battleEvent({ ...over, winner: 'b' })).toEqual({ kind: 'lose' });
    expect(battleEvent({ ...over, vsAi: false, winner: 'b' })).toEqual({ kind: 'pvpWin', side: 'b' });
    expect(battleEvent({ ...over, status: 'stalemate', winner: null })).toEqual({ kind: 'stalemate' });
    expect(battleEvent({ ...over, status: 'draw', winner: null })).toEqual({ kind: 'draw' });
  });
});

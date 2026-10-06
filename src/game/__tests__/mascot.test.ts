import { type ReactionInput, mascotReaction, pickVariant } from '../mascot';

const base: ReactionInput = {
  vsAi: true,
  turn: 'w',
  status: 'playing',
  lastMove: null,
  lastCaptured: null,
  winner: null,
  isGameOver: false,
};
const move = { fromR: 3, fromC: 2, toR: 2, toC: 2 };

describe('mascotReaction (vs AI)', () => {
  it('greets at the start and nudges on my turn', () => {
    expect(mascotReaction(base)).toEqual({ mood: 'normal', line: 'start' });
    expect(mascotReaction({ ...base, lastMove: move })).toEqual({ mood: 'normal', line: 'yourTurn' });
  });

  it('thinks while the AI is to move', () => {
    expect(mascotReaction({ ...base, turn: 'b', lastMove: move })).toEqual({ mood: 'thinking', line: 'thinking' });
  });

  it('cheers my capture and gasps at the AI capture', () => {
    expect(mascotReaction({ ...base, turn: 'b', lastMove: move, lastCaptured: 'bP' })).toEqual({ mood: 'happy', line: 'goodCapture' });
    expect(mascotReaction({ ...base, turn: 'w', lastMove: move, lastCaptured: 'wN' })).toEqual({ mood: 'surprised', line: 'gotCaptured' });
  });

  it('puts check ahead of captures', () => {
    expect(mascotReaction({ ...base, turn: 'b', status: 'check', lastMove: move, lastCaptured: 'bP' })).toEqual({ mood: 'happy', line: 'giveCheck' });
    expect(mascotReaction({ ...base, turn: 'w', status: 'check', lastMove: move })).toEqual({ mood: 'surprised', line: 'inCheck' });
  });

  it('celebrates a win, comforts after a loss, and shrugs at a draw', () => {
    const over = { ...base, isGameOver: true, status: 'checkmate' as const };
    expect(mascotReaction({ ...over, winner: 'w' })).toEqual({ mood: 'happy', line: 'win' });
    expect(mascotReaction({ ...over, winner: 'b' })).toEqual({ mood: 'sad', line: 'lose' });
    expect(mascotReaction({ ...over, status: 'stalemate', winner: null })).toEqual({ mood: 'thinking', line: 'draw' });
  });
});

describe('mascotReaction (pass & play)', () => {
  it('stays neutral between two players', () => {
    const pvp = { ...base, vsAi: false };
    expect(mascotReaction(pvp)).toEqual({ mood: 'normal', line: 'pvpTurn' });
    expect(mascotReaction({ ...pvp, status: 'check', lastMove: move })).toEqual({ mood: 'surprised', line: 'pvpCheck' });
    expect(mascotReaction({ ...pvp, lastMove: move, lastCaptured: 'wP' })).toEqual({ mood: 'happy', line: 'pvpCapture' });
    expect(mascotReaction({ ...pvp, isGameOver: true, winner: 'b' })).toEqual({ mood: 'happy', line: 'pvpWin' });
  });
});

describe('pickVariant', () => {
  it('is deterministic and wraps around', () => {
    expect(pickVariant(['a', 'b', 'c'], 4)).toBe('b');
    expect(pickVariant(['a', 'b', 'c'], 4)).toBe(pickVariant(['a', 'b', 'c'], 4));
    expect(pickVariant(['a'], 99)).toBe('a');
  });
});

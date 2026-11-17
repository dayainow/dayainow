import { INITIAL_BOARD, getAllLegalMoves, simulateMove } from '../../engine/chessEngine';
import { place } from '../../engine/testing';
import { evaluateEnding, type Position } from '../endings';

const start: Position = { board: INITIAL_BOARD, turn: 'w' };
// Counter fixtures: distinct positions with unchanged material and pawn squares.
const quietPositions = (count: number): Position[] => Array.from({ length: count }, (_, i) => ({
  board: place({ '4,4': 'wK', '0,0': 'bK', [`${1 + Math.floor(i / 20)},${Math.floor(i / 4) % 5}`]: 'wR', [`0,${1 + i % 4}`]: 'bR' }),
  turn: i % 2 ? 'b' : 'w',
}));

describe('short-match endings', () => {
  it('ends a legal repeating knight cycle on the third occurrence, including the initial position', () => {
    let current = start;
    const history: Position[] = [];
    const cycle = [
      { fromR: 4, fromC: 1, toR: 2, toC: 2 },
      { fromR: 0, fromC: 1, toR: 2, toC: 0 },
      { fromR: 2, fromC: 2, toR: 4, toC: 1 },
      { fromR: 2, fromC: 0, toR: 0, toC: 1 },
    ];
    for (let i = 0; i < 8; i++) {
      const move = cycle[i % 4];
      expect(getAllLegalMoves(current.turn, current.board)).toContainEqual(move);
      history.push(current);
      current = { board: simulateMove(current.board, move), turn: current.turn === 'w' ? 'b' : 'w' };
      expect(evaluateEnding(history, current).reason).toBe(i === 7 ? 'repetition' : undefined);
    }
    // Undo removes future repetitions; a fresh game has no retained counts.
    expect(evaluateEnding(history.slice(0, 6), history[6]).reason).toBeUndefined();
    expect(evaluateEnding([], start).remaining).toBe(40);
  });
  it('includes side to move in repetition identity', () => {
    expect(evaluateEnding([{ ...start, turn: 'b' }, { ...start, turn: 'b' }], start).reason).toBeUndefined();
  });
  it('counts 40 quiet half-moves and warns before the limit', () => {
    const positions = quietPositions(41);
    expect(evaluateEnding(positions.slice(0, 39), positions[39]).remaining).toBe(1);
    expect(evaluateEnding(positions.slice(0, 40), positions[40]).reason).toBe('noProgress');
  });
  it('resets the quiet counter on a capture, pawn move or promotion', () => {
    const positions = quietPositions(39);
    const previous = positions[38];
    const captured = { ...previous, board: previous.board.map(row => row.map(p => p === 'bR' ? null : p)) };
    expect(evaluateEnding(positions, captured).remaining).toBe(40);
    const pawn = { board: place({ '4,4': 'wK', '0,0': 'bK', '1,2': 'wP' }), turn: 'w' as const };
    const moved = { board: place({ '4,4': 'wK', '0,0': 'bK', '2,2': 'wP' }), turn: 'b' as const };
    expect(evaluateEnding([pawn], moved).remaining).toBe(40);
    const promoted = { board: place({ '4,4': 'wK', '0,0': 'bK', '0,2': 'wQ' }), turn: 'b' as const };
    expect(evaluateEnding([pawn], promoted).remaining).toBe(40);
  });
  it('caps the whole game even if a pawn has just moved', () => {
    expect(evaluateEnding(quietPositions(80), start).reason).toBe('moveLimit');
  });
  it('keeps checkmate ahead of the move cap and distinguishes stalemate and kings', () => {
    const mate: Position = { board: place({ '4,4': 'wK', '2,2': 'bK', '3,3': 'bQ' }), turn: 'w' };
    expect(evaluateEnding(quietPositions(80), mate).status).toBe('checkmate');
    expect(evaluateEnding([], { board: place({ '4,4': 'wK', '2,3': 'bK', '3,2': 'bQ' }), turn: 'w' }).reason).toBe('stalemate');
    expect(evaluateEnding([], { board: place({ '4,4': 'wK', '0,0': 'bK' }), turn: 'w' }).reason).toBe('kings');
  });
});

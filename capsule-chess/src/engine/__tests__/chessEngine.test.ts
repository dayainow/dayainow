import {
  INITIAL_BOARD,
  findKing,
  getAllLegalMoves,
  getGameStatus,
  getLegalMovesForPiece,
  isInCheck,
  simulateMove,
} from '../chessEngine';
import { place } from '../testing';

describe('getGameStatus', () => {
  it('starts as playing with moves for white', () => {
    expect(getGameStatus('w', INITIAL_BOARD)).toBe('playing');
    expect(getAllLegalMoves('w', INITIAL_BOARD).length).toBeGreaterThan(0);
  });

  it('detects check from a rook on the same file', () => {
    const board = place({ '4,4': 'wK', '0,4': 'bR', '0,0': 'bK' });
    expect(isInCheck('w', board)).toBe(true);
    expect(getGameStatus('w', board)).toBe('check');
  });

  it('detects back-rank checkmate', () => {
    const board = place({ '4,0': 'wK', '3,0': 'wP', '3,1': 'wP', '4,4': 'bR', '0,4': 'bK' });
    expect(getGameStatus('w', board)).toBe('checkmate');
  });

  it('detects stalemate', () => {
    const board = place({ '0,0': 'bK', '2,1': 'wQ', '4,4': 'wK' });
    expect(isInCheck('b', board)).toBe(false);
    expect(getGameStatus('b', board)).toBe('stalemate');
  });

  it('calls a draw when only kings are left', () => {
    expect(getGameStatus('w', place({ '4,4': 'wK', '0,0': 'bK' }))).toBe('draw');
  });
});

describe('legal moves', () => {
  it('keeps a pinned rook on the pin line', () => {
    const board = place({ '4,4': 'wK', '3,4': 'wR', '0,4': 'bR', '0,0': 'bK' });
    const moves = getLegalMovesForPiece(3, 4, board);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every(m => m.c === 4)).toBe(true);
  });

  it('does not let the king step into an attacked square', () => {
    const board = place({ '4,4': 'wK', '0,3': 'bR', '0,0': 'bK' });
    expect(getLegalMovesForPiece(4, 4, board).some(m => m.c === 3)).toBe(false);
  });

  it('only allows pawns one step forward (no double step)', () => {
    expect(getLegalMovesForPiece(3, 2, INITIAL_BOARD)).toEqual([{ r: 2, c: 2 }]);
  });
});

describe('simulateMove', () => {
  it('promotes a pawn to a queen on the last rank', () => {
    const board = simulateMove(place({ '1,2': 'wP', '4,4': 'wK', '0,0': 'bK' }), { fromR: 1, fromC: 2, toR: 0, toC: 2 });
    expect(board[0][2]).toBe('wQ');
  });

  it('does not mutate the input board', () => {
    const before = JSON.stringify(INITIAL_BOARD);
    simulateMove(INITIAL_BOARD, { fromR: 3, fromC: 0, toR: 2, toC: 0 });
    expect(JSON.stringify(INITIAL_BOARD)).toBe(before);
  });
});

describe('random self-play', () => {
  it('never captures a king and never leaves the mover in check', () => {
    for (let game = 0; game < 100; game++) {
      let board = INITIAL_BOARD;
      let turn: 'w' | 'b' = 'w';
      for (let ply = 0; ply < 200; ply++) {
        expect(findKing('w', board)).not.toBeNull();
        expect(findKing('b', board)).not.toBeNull();
        const status = getGameStatus(turn, board);
        if (status === 'checkmate' || status === 'stalemate' || status === 'draw') break;

        const moves = getAllLegalMoves(turn, board);
        board = simulateMove(board, moves[Math.floor(Math.random() * moves.length)]);
        expect(isInCheck(turn, board)).toBe(false);
        turn = turn === 'w' ? 'b' : 'w';
      }
    }
  });
});

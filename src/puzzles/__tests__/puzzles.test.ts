import { INITIAL_BOARD } from '../../engine/chessEngine';
import { canForceMate, findMatingMoves } from '../../engine/mateSolver';
import bank from '../bank.json';
import { decodeBoard, encodeBoard, mirrorBoard } from '../codec';
import { DAILY_EPOCH, PUZZLE_COUNT, dailyNumberFor, getDailyPuzzle } from '../daily';

describe('codec', () => {
  it('round-trips the starting position', () => {
    const encoded = encodeBoard(INITIAL_BOARD);
    expect(encoded).toBe('rnbqkppppp.....PPPPPRNBQK');
    expect(decodeBoard(encoded)).toEqual(INITIAL_BOARD);
  });

  it('mirrors the starting position onto itself', () => {
    expect(mirrorBoard(INITIAL_BOARD)).toEqual(INITIAL_BOARD);
  });

  it('rejects strings of the wrong length', () => {
    expect(() => decodeBoard('rnbqk')).toThrow();
  });
});

describe('daily puzzle', () => {
  it('numbers days from the epoch', () => {
    expect(dailyNumberFor(DAILY_EPOCH)).toBe(1);
    expect(dailyNumberFor('2026-10-31')).toBe(31);
    expect(dailyNumberFor('2027-10-01')).toBe(366);
  });

  it('gives the same puzzle for the same local date and a different one the next day', () => {
    const morning = getDailyPuzzle(new Date(2026, 9, 5, 8, 0));
    const night = getDailyPuzzle(new Date(2026, 9, 5, 23, 59));
    const tomorrow = getDailyPuzzle(new Date(2026, 9, 6, 0, 1));
    expect(morning.dateKey).toBe('2026-10-05');
    expect(night).toEqual(morning);
    expect(encodeBoard(tomorrow.board)).not.toBe(encodeBoard(morning.board));
  });

  it('cycles through the bank after it runs out', () => {
    const first = getDailyPuzzle(new Date(2026, 9, 1));
    const wrapped = new Date(2026, 9, 1 + PUZZLE_COUNT);
    expect(encodeBoard(getDailyPuzzle(wrapped).board)).toBe(encodeBoard(first.board));
  });
});

describe('puzzle bank', () => {
  it('has unique positions with blue to move', () => {
    const boards = bank.puzzles.map(p => p.b);
    expect(new Set(boards).size).toBe(boards.length);
    expect(bank.puzzles.every(p => p.n === 2 || p.n === 3)).toBe(true);
  });

  // 전부 검사하면 오래 걸려서 앞쪽 일부만 다시 풀어 봄 (생성기가 만든 조건이 맞는지)
  it.each(bank.puzzles.slice(0, 12).map((p, i) => [i + 1, p.b, p.n] as const))(
    'puzzle %i is a unique mate in %s',
    (_index, encoded, n) => {
      const board = decodeBoard(encoded);
      expect(canForceMate(board, 'w', n - 1)).toBe(false);
      expect(findMatingMoves(board, 'w', n)).toHaveLength(1);
    }
  );
});

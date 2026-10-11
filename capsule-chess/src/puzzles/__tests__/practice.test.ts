import { canForceMate, findMatingMoves } from '../../engine/mateSolver';
import { applyPracticeSolve, emptyProgress } from '../../storage/progress';
import bank from '../bank.json';
import practice from '../practice.json';
import { PRACTICE_COUNT, PRACTICE_SECTIONS, getPracticePuzzle, isPracticeUnlocked, nextPracticeNumber } from '../practice';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('puzzle dojo bank', () => {
  it('never repeats a daily puzzle and has no duplicates', () => {
    const daily = new Set(bank.puzzles.map(p => p.b));
    const boards = practice.puzzles.map(p => p.b);
    expect(new Set(boards).size).toBe(boards.length);
    expect(boards.some(b => daily.has(b))).toBe(false);
  });

  it('goes from easy to hard: mate in 1, then 2, then 3', () => {
    expect(PRACTICE_SECTIONS.map(s => s.mateIn)).toEqual([1, 2, 3]);
    expect(PRACTICE_SECTIONS[0].from).toBe(1);
    expect(PRACTICE_SECTIONS[PRACTICE_SECTIONS.length - 1].to).toBe(PRACTICE_COUNT);
  });

  // 구간마다 앞쪽 몇 개를 다시 풀어 봄 (생성기 조건 확인)
  it.each(PRACTICE_SECTIONS.flatMap(s => [s.from, s.from + 1]))('puzzle #%i is a unique mate', number => {
    const puzzle = getPracticePuzzle(number)!;
    expect(canForceMate(puzzle.board, 'w', puzzle.mateIn - 1)).toBe(false);
    expect(findMatingMoves(puzzle.board, 'w', puzzle.mateIn)).toHaveLength(1);
  });
});

describe('puzzle dojo progress', () => {
  it('opens puzzles one by one in order', () => {
    expect(isPracticeUnlocked({}, 1)).toBe(true);
    expect(isPracticeUnlocked({}, 2)).toBe(false);
    expect(isPracticeUnlocked({ 1: { attempts: 1, hints: 0 } }, 2)).toBe(true);
    expect(nextPracticeNumber({ 1: {}, 2: {} })).toBe(3);
  });

  it('keeps only the first solve', () => {
    const first = applyPracticeSolve(emptyProgress(), 4, 2, 1);
    expect(applyPracticeSolve(first, 4, 1, 0).practice[4]).toEqual({ attempts: 2, hints: 1 });
  });
});

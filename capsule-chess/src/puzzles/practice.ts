import { decodeBoard } from './codec';
import practice from './practice.json';

// 퍼즐 도장: 데일리와 겹치지 않는 연습 퍼즐 (scripts/generate-puzzles.ts로 생성, 1수 → 2수 → 3수 순서)
export type PracticePuzzle = {
  number: number; // 1부터
  board: (string | null)[][];
  mateIn: number;
};

export const PRACTICE_COUNT = practice.puzzles.length;

export const getPracticePuzzle = (number: number): PracticePuzzle | undefined => {
  const entry = practice.puzzles[number - 1];
  return entry ? { number, board: decodeBoard(entry.b), mateIn: entry.n } : undefined;
};

// 같은 수(1수·2수·3수) 메이트끼리 묶은 구간 [첫 번호, 끝 번호]
export const PRACTICE_SECTIONS: { mateIn: number; from: number; to: number }[] = practice.puzzles.reduce<
  { mateIn: number; from: number; to: number }[]
>((sections, puzzle, i) => {
  const last = sections[sections.length - 1];
  if (last && last.mateIn === puzzle.n) last.to = i + 1;
  else sections.push({ mateIn: puzzle.n, from: i + 1, to: i + 1 });
  return sections;
}, []);

// 순서대로 풀어야 다음 퍼즐이 열림
export const isPracticeUnlocked = (solved: Record<string, unknown>, number: number): boolean =>
  number === 1 || !!solved[number - 1];

// 이어서 풀 퍼즐: 열려 있으면서 아직 못 푼 첫 번호 (다 풀었으면 null)
export const nextPracticeNumber = (solved: Record<string, unknown>): number | null => {
  for (let n = 1; n <= PRACTICE_COUNT; n++) if (!solved[n]) return n;
  return null;
};

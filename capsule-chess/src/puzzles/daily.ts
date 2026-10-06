import bank from './bank.json';
import { decodeBoard } from './codec';
import { daysBetween, toDateKey } from '../utils/date';

export type DailyPuzzle = {
  number: number; // 데일리 #번호 (공유용)
  dateKey: string;
  board: (string | null)[][];
  mateIn: number; // 블루가 둘 수 있는 수
};

// 데일리 #1이 나오는 날. 출시일에 맞춰 조정 (바꾸면 번호와 문제 배정이 함께 바뀜)
export const DAILY_EPOCH = '2026-10-01';

export const dailyNumberFor = (dateKey: string): number => daysBetween(DAILY_EPOCH, dateKey) + 1;

// 같은 날에는 전 세계 어디서나 같은 문제 (기기 현지 날짜 기준)
export const getDailyPuzzle = (date: Date = new Date()): DailyPuzzle => {
  const dateKey = toDateKey(date);
  const number = dailyNumberFor(dateKey);
  const puzzles = bank.puzzles;
  const index = (((number - 1) % puzzles.length) + puzzles.length) % puzzles.length;
  const { b, n } = puzzles[index];
  return { number, dateKey, board: decodeBoard(b), mateIn: n };
};

export const PUZZLE_COUNT = bank.puzzles.length;

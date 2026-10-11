// 퍼즐 뱅크 생성기: 무작위 대국에서 "정답 첫 수가 하나뿐인 N수 메이트" 위치를 모음
// 데일리:   node --no-warnings --import ./scripts/register-ts.mjs scripts/generate-puzzles.ts [2수] [3수] [시드]
//           → src/puzzles/bank.json (2수·3수를 섞어서)
// 퍼즐 도장: ... generate-puzzles.ts [2수] [3수] [시드] [1수] practice.json
//           → src/puzzles/practice.json (데일리와 겹치지 않게, 1수 → 2수 → 3수 쉬운 순서로)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INITIAL_BOARD, getAllLegalMoves, getGameStatus, isInCheck, simulateMove } from '../src/engine/chessEngine';
import { canForceMate, findMatingMoves } from '../src/engine/mateSolver';
import { encodeBoard, mirrorBoard } from '../src/puzzles/codec';

type Board = (string | null)[][];
type Color = 'w' | 'b';

const args = process.argv.slice(2);
const [count2 = 300, count3 = 100, seed = 20261001, count1 = 0] = args.slice(0, 4).map(Number);
const outName = args[4] ?? 'bank.json';
const PUZZLE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'puzzles');
const OUT = join(PUZZLE_DIR, outName);
const isPractice = outName !== 'bank.json';
// 퍼즐 도장은 데일리 문제와 겹치면 안 됨 (미리 풀어 버리면 데일리가 시시해짐)
const excluded = new Set<string>(
  isPractice ? JSON.parse(readFileSync(join(PUZZLE_DIR, 'bank.json'), 'utf8')).puzzles.map((p: { b: string }) => p.b) : []
);

// 재현 가능한 난수 (mulberry32)
let state = seed >>> 0;
const random = () => {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(items: T[]): T => items[Math.floor(random() * items.length)];

const countPieces = (board: Board, color: Color, filter: (type: string) => boolean) =>
  board.flat().filter(p => p && p.charAt(0) === color && filter(p.charAt(1))).length;

// 퍼즐로 쓸 만한 위치인지: 공격 측이 체크 상태가 아니고, 양쪽에 킹 말고도 기물이 남아 있음
const isInteresting = (board: Board, attacker: Color): boolean => {
  const defender = attacker === 'w' ? 'b' : 'w';
  if (isInCheck(attacker, board)) return false;
  if (countPieces(board, attacker, t => t !== 'K' && t !== 'P') === 0) return false;
  return countPieces(board, defender, t => t !== 'K') >= 2;
};

// 정답 첫 수가 하나뿐인 n수 메이트인지 (더 짧은 메이트는 없어야 함)
const isUniqueMateIn = (board: Board, attacker: Color, n: number): boolean => {
  if (canForceMate(board, attacker, n - 1)) return false;
  if (!canForceMate(board, attacker, n)) return false;
  return findMatingMoves(board, attacker, n).length === 1;
};

const found = { 1: new Map<string, number>(), 2: new Map<string, number>(), 3: new Map<string, number>() };
const target = { 1: count1, 2: count2, 3: count3 };
const missing = (n: 1 | 2 | 3) => found[n].size < target[n];
const startedAt = Date.now();
let games = 0;

while (missing(1) || missing(2) || missing(3)) {
  games++;
  let board: Board = INITIAL_BOARD;
  let turn: Color = 'w';
  for (let ply = 0; ply < 40; ply++) {
    const status = getGameStatus(turn, board);
    if (status !== 'playing' && status !== 'check') break;

    if (ply >= 4 && isInteresting(board, turn)) {
      // 아직 모자란 길이 중에서 고름 (1수는 쉽게 찾히니 먼저 확인)
      const wanted = ([1, 2, 3] as const).filter(missing);
      const n = wanted.includes(1) ? 1 : wanted.length === 2 ? (random() < 0.7 ? 2 : 3) : wanted[0];
      if (isUniqueMateIn(board, turn, n)) {
        const normalized = turn === 'w' ? board : mirrorBoard(board);
        const code = encodeBoard(normalized);
        if (!excluded.has(code)) {
          found[n].set(code, n);
          break; // 비슷한 위치가 몰리지 않게 대국당 하나만
        }
      }
    }

    // 잡는 수를 조금 더 선호해서 기물이 줄어든 중반 위치를 만듦
    const moves = getAllLegalMoves(turn, board);
    const captures = moves.filter(m => board[m.toR][m.toC]);
    const move = captures.length > 0 && random() < 0.45 ? pick(captures) : pick(moves);
    board = simulateMove(board, move);
    turn = turn === 'w' ? 'b' : 'w';
  }
  if (games % 200 === 0) {
    const secs = Math.round((Date.now() - startedAt) / 1000);
    console.log(`${games}판, 1수 ${found[1].size}/${target[1]}, 2수 ${found[2].size}/${target[2]}, 3수 ${found[3].size}/${target[3]} (${secs}초)`);
  }
}

const ones = [...found[1].keys()];
const twos = [...found[2].keys()];
const threes = [...found[3].keys()];
const puzzles: { b: string; n: number }[] = [];
if (isPractice) {
  // 퍼즐 도장: 쉬운 것부터 차례로
  puzzles.push(...ones.map(b => ({ b, n: 1 })), ...twos.map(b => ({ b, n: 2 })), ...threes.map(b => ({ b, n: 3 })));
} else {
  // 데일리: 3수 퍼즐을 고르게 섞음 (4개 중 1개 꼴로 3수)
  while (twos.length || threes.length) {
    const useThree = threes.length > 0 && (puzzles.length % 4 === 3 || twos.length === 0);
    puzzles.push(useThree ? { b: threes.shift()!, n: 3 } : { b: twos.shift()!, n: 2 });
  }
}

writeFileSync(OUT, JSON.stringify({ version: 1, seed, puzzles }, null, 0) + '\n');
console.log(`완료: ${puzzles.length}개 (${games}판, ${Math.round((Date.now() - startedAt) / 1000)}초) → ${OUT}`);

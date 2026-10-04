// 데일리 퍼즐 뱅크 생성기: 무작위 대국에서 "정답 첫 수가 하나뿐인 N수 메이트" 위치를 모아 src/puzzles/bank.json에 저장
// 사용: node --no-warnings --import ./scripts/register-ts.mjs scripts/generate-puzzles.ts [2수 개수] [3수 개수] [시드]
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INITIAL_BOARD, getAllLegalMoves, getGameStatus, isInCheck, simulateMove } from '../src/engine/chessEngine';
import { canForceMate, findMatingMoves } from '../src/engine/mateSolver';
import { encodeBoard, mirrorBoard } from '../src/puzzles/codec';

type Board = (string | null)[][];
type Color = 'w' | 'b';

const [count2 = 300, count3 = 100, seed = 20261001] = process.argv.slice(2).map(Number);
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'puzzles', 'bank.json');

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

const found = { 2: new Map<string, number>(), 3: new Map<string, number>() };
const target = { 2: count2, 3: count3 };
const startedAt = Date.now();
let games = 0;

while (found[2].size < target[2] || found[3].size < target[3]) {
  games++;
  let board: Board = INITIAL_BOARD;
  let turn: Color = 'w';
  for (let ply = 0; ply < 40; ply++) {
    const status = getGameStatus(turn, board);
    if (status !== 'playing' && status !== 'check') break;

    if (ply >= 4 && isInteresting(board, turn)) {
      const n = found[2].size < target[2] && (found[3].size >= target[3] || random() < 0.7) ? 2 : 3;
      if (isUniqueMateIn(board, turn, n)) {
        const normalized = turn === 'w' ? board : mirrorBoard(board);
        found[n as 2 | 3].set(encodeBoard(normalized), n);
        break; // 비슷한 위치가 몰리지 않게 대국당 하나만
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
    console.log(`${games}판, 2수 ${found[2].size}/${target[2]}, 3수 ${found[3].size}/${target[3]} (${secs}초)`);
  }
}

// 3수 퍼즐을 고르게 섞음: 4개 중 1개 꼴로 3수
const twos = [...found[2].keys()];
const threes = [...found[3].keys()];
const puzzles: { b: string; n: number }[] = [];
while (twos.length || threes.length) {
  const useThree = threes.length > 0 && (puzzles.length % 4 === 3 || twos.length === 0);
  puzzles.push(useThree ? { b: threes.shift()!, n: 3 } : { b: twos.shift()!, n: 2 });
}

writeFileSync(OUT, JSON.stringify({ version: 1, seed, puzzles }, null, 0) + '\n');
console.log(`완료: ${puzzles.length}개 (${games}판, ${Math.round((Date.now() - startedAt) / 1000)}초) → ${OUT}`);

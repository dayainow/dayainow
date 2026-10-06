// 단계별 도전 난이도 시뮬레이션: 플레이어 모델(초보/중수)이 단계마다 여러 판을 두고 승률과 승리까지 걸린 수를 출력
// 사용: node --no-warnings --import ./scripts/register-ts.mjs scripts/campaign-balance.ts [단계당 판 수=20]
import { STAGES, buildStageBoard } from '../src/campaign/stages';
import { type AiPolicy, pickAiMove } from '../src/engine/chessAI';
import { type Move, getGameStatus, simulateMove } from '../src/engine/chessEngine';
import { mirrorBoard } from '../src/puzzles/codec';

type Board = (string | null)[][];

// 사람 플레이어 흉내: 초보는 바로 다음 수만 보고 실수도 잦음, 중수는 상대 응수까지 보고 가끔 실수
const PLAYERS: Record<string, AiPolicy> = {
  beginner: { depth: 1, blunder: 0.15 },
  intermediate: { depth: 2, blunder: 0.05 },
};
const GAMES = Number(process.argv[2] ?? 20);
const MAX_PLIES = 120;

// AI 함수는 레드 기준이라 판을 뒤집어서 블루 수를 고름
const pickBlueMove = (board: Board, policy: AiPolicy): Move | null => {
  const m = pickAiMove(mirrorBoard(board), policy);
  return m && { fromR: 4 - m.fromR, fromC: m.fromC, toR: 4 - m.toR, toC: m.toC };
};

const play = (start: Board, player: AiPolicy, ai: AiPolicy): { won: boolean; blueMoves: number } => {
  let board = start;
  let turn: 'w' | 'b' = 'w';
  let blueMoves = 0;
  for (let ply = 0; ply < MAX_PLIES; ply++) {
    const status = getGameStatus(turn, board);
    if (status === 'checkmate') return { won: turn === 'b', blueMoves };
    if (status === 'stalemate' || status === 'draw') return { won: false, blueMoves };
    const move = turn === 'w' ? pickBlueMove(board, player) : pickAiMove(board, ai);
    if (!move) return { won: false, blueMoves };
    if (turn === 'w') blueMoves++;
    board = simulateMove(board, move);
    turn = turn === 'w' ? 'b' : 'w';
  }
  return { won: false, blueMoves };
};

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
};

const pad = (v: string | number, n: number) => String(v).padStart(n);

console.log(`단계당 ${GAMES}판 · 초보 = 깊이 ${PLAYERS.beginner.depth}/실수 ${PLAYERS.beginner.blunder}, 중수 = 깊이 ${PLAYERS.intermediate.depth}/실수 ${PLAYERS.intermediate.blunder}`);
console.log('단계 | AI(깊이/실수) | 빠진 기물   | 초보 승률 | 중수 승률 | 중수 승리 수(중앙값) | 목표 수 | 중수 ★3 비율');
for (const stage of STAGES) {
  const start = buildStageBoard(stage);
  const results = Object.fromEntries(
    Object.entries(PLAYERS).map(([name, policy]) => [name, Array.from({ length: GAMES }, () => play(start, policy, stage.ai))])
  );
  const winRate = (name: string) => Math.round((results[name].filter(r => r.won).length / GAMES) * 100);
  const winMoves = results.intermediate.filter(r => r.won).map(r => r.blueMoves);
  const threeStars = Math.round((winMoves.filter(m => m <= stage.par).length / GAMES) * 100);
  console.log(
    [
      pad(stage.id, 4),
      pad(`${stage.ai.depth}/${stage.ai.blunder ?? 0}`, 13),
      (stage.removed.map(p => p.charAt(1)).join('') || '-').padEnd(11),
      pad(`${winRate('beginner')}%`, 9),
      pad(`${winRate('intermediate')}%`, 9),
      pad(percentile(winMoves, 0.5), 20),
      pad(stage.par, 7),
      pad(`${threeStars}%`, 12),
    ].join(' | ')
  );
}

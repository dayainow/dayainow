import type { AiPolicy } from '../engine/chessAI';
import { INITIAL_BOARD } from '../engine/chessEngine';

export type Stage = {
  id: number;
  world: number; // 캡슐 번호 (5단계씩 묶음)
  ai: AiPolicy; // AI 탐색 깊이 + 실수 확률
  removed: string[]; // 시작할 때 빼 두는 레드(AI) 기물
  par: number; // 이 수 안에 이기면 별 3개
};

// 난이도 표. 조정할 때는 scripts/campaign-balance.ts로 시뮬레이션해서 곡선을 확인
// [AI 깊이, 실수 확률, 빼 둘 레드 기물, 별 3개 목표 수]
const TABLE: [number, number, string[], number][] = [
  // 1번째 캡슐: 규칙에 익숙해지기 (초보도 대부분 깰 수 있게)
  [1, 0.5, ['bR', 'bN', 'bB', 'bQ'], 7],
  [1, 0.3, ['bN', 'bB', 'bQ'], 7],
  [1, 0.3, ['bR', 'bQ'], 8],
  [1, 0.3, ['bQ'], 9],
  [1, 0.5, [], 11],
  // 2번째 캡슐: 상대의 응수를 보는 AI. 캡슐 마지막 단계는 보스처럼 조금 어렵게
  [2, 0.3, ['bQ'], 11],
  [2, 0.3, ['bR'], 13],
  [2, 0.2, ['bN'], 15],
  [2, 0.3, [], 15],
  [2, 0.2, [], 16],
  // 3번째 캡슐: 첫 단계는 한숨 돌리게 조금 쉽게
  [3, 0.2, ['bR'], 16],
  [3, 0.2, ['bB'], 16],
  [3, 0.2, [], 17],
  [3, 0.1, ['bN'], 17],
  [3, 0.15, [], 18],
  // 4번째 캡슐: 두 번씩 주고받는 것까지 읽는 AI
  [4, 0.2, ['bN'], 18],
  [4, 0.15, ['bB'], 19],
  [4, 0.1, ['bN'], 19],
  [4, 0.15, [], 20],
  [4, 0.08, [], 21],
];

export const STAGES: Stage[] = TABLE.map(([depth, blunder, removed, par], i) => ({
  id: i + 1,
  world: Math.floor(i / 5) + 1,
  ai: { depth, blunder },
  removed,
  par,
}));

export const MAX_STARS = STAGES.length * 3;

export const getStage = (id: number): Stage | undefined => STAGES.find(s => s.id === id);

export const buildStageBoard = (stage: Stage): (string | null)[][] =>
  INITIAL_BOARD.map(row => row.map(piece => (piece && stage.removed.includes(piece) ? null : piece)));

// 이겼을 때 별 개수: 목표 수 이내 3개, 목표+6수 이내 2개, 그 외 1개
export const starsFor = (stage: Stage, blueMoves: number): number =>
  blueMoves <= stage.par ? 3 : blueMoves <= stage.par + 6 ? 2 : 1;

export const isStageUnlocked = (campaign: Record<string, number>, id: number): boolean =>
  id === 1 || (campaign[id - 1] ?? 0) > 0;

// 홈의 "이어하기": 열려 있으면서 아직 못 깬 첫 단계. 다 깼으면 null
export const nextStageId = (campaign: Record<string, number>): number | null =>
  STAGES.find(s => isStageUnlocked(campaign, s.id) && !(campaign[s.id] > 0))?.id ?? null;

export const clearedStageCount = (campaign: Record<string, number>): number =>
  STAGES.filter(s => (campaign[s.id] ?? 0) > 0).length;

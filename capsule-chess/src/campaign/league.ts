import { STAGES, type Stage } from './stages';

// 캡슐 리그: 캡슐 4개 × 5단계. 캡슐의 5단계를 모두 깨면 그 캡슐의 배지를 받음
export type Capsule = {
  id: number;
  badgePiece: 'P' | 'N' | 'B' | 'Q'; // 배지에 들어가는 기물
  color: string; // 배지 바탕색
};

export const CAPSULES: Capsule[] = [
  { id: 1, badgePiece: 'P', color: '#6FDDB7' },
  { id: 2, badgePiece: 'N', color: '#58AEFF' },
  { id: 3, badgePiece: 'B', color: '#B18CFF' },
  { id: 4, badgePiece: 'Q', color: '#FFD23F' },
];

export const STAGES_PER_CAPSULE = 5;

// 단계별 상대 얼굴 (레드 기물). 각 캡슐의 마지막 단계는 킹이 나오는 마스터전
const AVATARS = ['P', 'N', 'B', 'R', 'K', 'N', 'B', 'R', 'Q', 'K', 'B', 'R', 'N', 'Q', 'K', 'R', 'Q', 'N', 'B', 'K'];

export type Opponent = {
  index: number; // 0부터 (이름은 strings.league.opponents[index])
  avatar: string; // 'bN' 같은 기물 코드
  level: number;
  isMaster: boolean;
};

export const opponentFor = (stage: Stage): Opponent => ({
  index: stage.id - 1,
  avatar: `b${AVATARS[(stage.id - 1) % AVATARS.length]}`,
  level: stage.id,
  isMaster: stage.id % STAGES_PER_CAPSULE === 0,
});

// 캡슐 안에서 몇 번째 단계인지 (1~5)
export const stageInCapsule = (stage: Stage): number => ((stage.id - 1) % STAGES_PER_CAPSULE) + 1;

export const isCapsuleCleared = (campaign: Record<string, number>, capsuleId: number): boolean =>
  STAGES.filter(s => s.world === capsuleId).every(s => (campaign[s.id] ?? 0) > 0);

export const earnedBadges = (campaign: Record<string, number>): number[] =>
  CAPSULES.filter(c => isCapsuleCleared(campaign, c.id)).map(c => c.id);

// 이번 기록으로 새로 받은 배지 (없으면 null)
export const newBadge = (before: Record<string, number>, after: Record<string, number>): number | null =>
  CAPSULES.find(c => !isCapsuleCleared(before, c.id) && isCapsuleCleared(after, c.id))?.id ?? null;

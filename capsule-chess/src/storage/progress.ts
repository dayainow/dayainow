import AsyncStorage from '@react-native-async-storage/async-storage';
import { emitAchievements } from '../achievements/events';
import { type AchievementId, newlyEarned } from '../achievements/list';
import { previousDateKey, toDateKey } from '../utils/date';

export type DailyRecord = {
  solved: boolean;
  attempts: number; // 성공까지 시도한 횟수 (성공한 시도 포함)
  hints?: number; // 사용한 힌트 수
};

export type Progress = {
  onboarded: boolean; // 첫 실행 환영 안내를 봤는지
  tutorial: Record<string, boolean>; // 레슨 id -> 완료 여부
  campaign: Record<string, number>; // 단계 id -> 최고 별 개수 (1~3)
  daily: {
    streak: number; // 마지막으로 푼 날까지의 연속 일수
    bestStreak: number;
    lastSolved: string | null; // 'YYYY-MM-DD'
    records: Record<string, DailyRecord>;
  };
  stats: Stats; // 업적 판정용 누적 기록
  achievements: Record<string, string>; // 업적 id -> 달성한 날 'YYYY-MM-DD'
};

export type Stats = {
  wins: number; // 자유 대전에서 AI에게 이긴 횟수
  hardWins: number; // 그중 어려움 난이도
  evolutions: number; // 내 폰이 퀸으로 진화한 횟수
  pvpGames: number; // 2인 대전을 끝까지 둔 횟수
};

const emptyStats = (): Stats => ({ wins: 0, hardWins: 0, evolutions: 0, pvpGames: 0 });

const STORAGE_KEY = 'progress:v1';

export const emptyProgress = (): Progress => ({
  onboarded: false,
  tutorial: {},
  campaign: {},
  daily: { streak: 0, bestStreak: 0, lastSolved: null, records: {} },
  stats: emptyStats(),
  achievements: {},
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const loadProgress = async (): Promise<Progress> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const saved = JSON.parse(raw);
    const empty = emptyProgress();
    return {
      onboarded: saved?.onboarded === true,
      tutorial: isObject(saved?.tutorial) ? (saved.tutorial as Record<string, boolean>) : empty.tutorial,
      campaign: isObject(saved?.campaign) ? (saved.campaign as Record<string, number>) : empty.campaign,
      daily: isObject(saved?.daily) ? { ...empty.daily, ...(saved.daily as object) } : empty.daily,
      stats: isObject(saved?.stats) ? { ...empty.stats, ...(saved.stats as object) } : empty.stats,
      achievements: isObject(saved?.achievements) ? (saved.achievements as Record<string, string>) : empty.achievements,
    };
  } catch {
    return emptyProgress();
  }
};

// 읽고-고치고-저장하는 작업을 한 줄로 세워 차례로 처리 (진화와 승리가 동시에 저장돼도 서로 덮어쓰지 않게)
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(task: () => Promise<T>): Promise<T> => {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
};

// 새로 만족한 업적을 오늘 날짜로 기록 (순수 함수)
export const applyAchievements = (progress: Progress, today: string): { next: Progress; earned: AchievementId[] } => {
  const earned = newlyEarned(progress);
  if (!earned.length) return { next: progress, earned };
  const achievements = { ...progress.achievements };
  earned.forEach(id => (achievements[id] = today));
  return { next: { ...progress, achievements }, earned };
};

// 저장하면서 새 업적이 있으면 알림
const saveWithAchievements = async (progress: Progress): Promise<Progress> => {
  const { next, earned } = applyAchievements(progress, toDateKey(new Date()));
  await saveProgress(next);
  emitAchievements(earned);
  return next;
};

// 업데이트 전부터 이미 만족한 업적은 알림 없이 조용히 채움 (앱 시작 시 한 번)
export const backfillAchievements = (): Promise<void> =>
  serial(async () => {
    const { next, earned } = applyAchievements(await loadProgress(), toDateKey(new Date()));
    if (earned.length) await saveProgress(next);
  });

export const applyStat = (progress: Progress, key: keyof Stats): Progress => ({
  ...progress,
  stats: { ...progress.stats, [key]: progress.stats[key] + 1 },
});

export const recordStat = (key: keyof Stats): Promise<Progress> =>
  serial(async () => saveWithAchievements(applyStat(await loadProgress(), key)));

const saveProgress = async (progress: Progress): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // 저장 실패는 게임 진행에 영향 없음
  }
};

// 다른 저장이 처리 중이어도 그 뒤에 지워서, 예전 기록이 다시 저장되지 않게
export const resetProgress = (): Promise<void> =>
  serial(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }
  });

export const applyLessonDone = (progress: Progress, lessonId: string): Progress =>
  progress.tutorial[lessonId] ? progress : { ...progress, tutorial: { ...progress.tutorial, [lessonId]: true } };

// 최고 기록만 남김
export const applyStageResult = (progress: Progress, stageId: number, stars: number): Progress =>
  stars > (progress.campaign[stageId] ?? 0)
    ? { ...progress, campaign: { ...progress.campaign, [stageId]: stars } }
    : progress;

// 어제 풀었으면 연속 +1, 아니면 1부터. 같은 날 두 번 풀어도 한 번만 인정
export const applyDailySolve = (progress: Progress, dateKey: string, attempts: number, hints = 0): Progress => {
  if (progress.daily.records[dateKey]?.solved) return progress;
  const streak = progress.daily.lastSolved === previousDateKey(dateKey) ? progress.daily.streak + 1 : 1;
  return {
    ...progress,
    daily: {
      streak,
      bestStreak: Math.max(progress.daily.bestStreak, streak),
      lastSolved: dateKey,
      records: { ...progress.daily.records, [dateKey]: { solved: true, attempts, hints } },
    },
  };
};

// 오늘 기준으로 아직 끊기지 않은 연속 기록 (어제나 오늘 풀었어야 유지)
export const currentStreak = (progress: Progress, todayKey: string): number =>
  progress.daily.lastSolved === todayKey || progress.daily.lastSolved === previousDateKey(todayKey)
    ? progress.daily.streak
    : 0;

export const totalStars = (progress: Progress): number =>
  Object.values(progress.campaign).reduce((sum, stars) => sum + stars, 0);

export const recordOnboarded = (): Promise<Progress> =>
  serial(async () => {
    const next = { ...(await loadProgress()), onboarded: true };
    await saveProgress(next);
    return next;
  });

export const recordLessonDone = (lessonId: string): Promise<Progress> =>
  serial(async () => saveWithAchievements(applyLessonDone(await loadProgress(), lessonId)));

export const recordStageResult = (stageId: number, stars: number): Promise<Progress> =>
  serial(async () => saveWithAchievements(applyStageResult(await loadProgress(), stageId, stars)));

export const recordDailySolve = (dateKey: string, attempts: number, hints = 0): Promise<Progress> =>
  serial(async () => saveWithAchievements(applyDailySolve(await loadProgress(), dateKey, attempts, hints)));

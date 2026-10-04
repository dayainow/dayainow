import AsyncStorage from '@react-native-async-storage/async-storage';
import { previousDateKey } from '../utils/date';

export type DailyRecord = {
  solved: boolean;
  attempts: number; // 성공까지 시도한 횟수 (성공한 시도 포함)
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
};

const STORAGE_KEY = 'progress:v1';

export const emptyProgress = (): Progress => ({
  onboarded: false,
  tutorial: {},
  campaign: {},
  daily: { streak: 0, bestStreak: 0, lastSolved: null, records: {} },
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
    };
  } catch {
    return emptyProgress();
  }
};

const saveProgress = async (progress: Progress): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // 저장 실패는 게임 진행에 영향 없음
  }
};

export const resetProgress = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // 무시
  }
};

export const applyLessonDone = (progress: Progress, lessonId: string): Progress =>
  progress.tutorial[lessonId] ? progress : { ...progress, tutorial: { ...progress.tutorial, [lessonId]: true } };

// 최고 기록만 남김
export const applyStageResult = (progress: Progress, stageId: number, stars: number): Progress =>
  stars > (progress.campaign[stageId] ?? 0)
    ? { ...progress, campaign: { ...progress.campaign, [stageId]: stars } }
    : progress;

// 어제 풀었으면 연속 +1, 아니면 1부터. 같은 날 두 번 풀어도 한 번만 인정
export const applyDailySolve = (progress: Progress, dateKey: string, attempts: number): Progress => {
  if (progress.daily.records[dateKey]?.solved) return progress;
  const streak = progress.daily.lastSolved === previousDateKey(dateKey) ? progress.daily.streak + 1 : 1;
  return {
    ...progress,
    daily: {
      streak,
      bestStreak: Math.max(progress.daily.bestStreak, streak),
      lastSolved: dateKey,
      records: { ...progress.daily.records, [dateKey]: { solved: true, attempts } },
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

export const recordOnboarded = async (): Promise<Progress> => {
  const next = { ...(await loadProgress()), onboarded: true };
  await saveProgress(next);
  return next;
};

export const recordLessonDone = async (lessonId: string): Promise<Progress> => {
  const next = applyLessonDone(await loadProgress(), lessonId);
  await saveProgress(next);
  return next;
};

export const recordStageResult = async (stageId: number, stars: number): Promise<Progress> => {
  const next = applyStageResult(await loadProgress(), stageId, stars);
  await saveProgress(next);
  return next;
};

export const recordDailySolve = async (dateKey: string, attempts: number): Promise<Progress> => {
  const next = applyDailySolve(await loadProgress(), dateKey, attempts);
  await saveProgress(next);
  return next;
};

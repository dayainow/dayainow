import * as StoreReview from 'expo-store-review';
import { track } from './analytics';
import { loadSettings, updateSettings } from './storage/settings';
import { daysBetween, toDateKey } from './utils/date';

// 스토어 정책: 평가 창 전에 "재밌나요?" 같은 질문을 하거나 보상을 주면 안 됨 → 기분 좋은 순간에 공식 창만 요청.
// 실제로 창을 띄울지는 스토어가 정함 (자주 부르면 무시됨)
const MIN_DAYS_BETWEEN = 60;
const MAX_REQUESTS = 3;
const DELAY_MS = 2500; // 축하 연출을 먼저 보고 나서

export type ReviewTrigger = 'badge' | 'streak';

// 지금 요청해도 되는지: 최대 3번, 마지막 요청 뒤 60일 이상
export const shouldRequestReview = (history: string[], today: string): boolean => {
  if (history.length >= MAX_REQUESTS) return false;
  const last = history[history.length - 1];
  return !last || daysBetween(last, today) >= MIN_DAYS_BETWEEN;
};

// 연속 기록이 이 날수에 닿았을 때가 좋은 순간
export const isReviewStreak = (streak: number): boolean => [3, 7, 14, 30].includes(streak);

export const requestReviewLater = (trigger: ReviewTrigger): ReturnType<typeof setTimeout> =>
  setTimeout(async () => {
    try {
      const settings = await loadSettings();
      const today = toDateKey(new Date());
      if (!shouldRequestReview(settings.reviewRequests, today)) return;
      if (!(await StoreReview.isAvailableAsync())) return;
      await updateSettings({ reviewRequests: [...settings.reviewRequests, today] });
      track('review_prompt', { trigger });
      await StoreReview.requestReview();
    } catch {
      // 평가 창을 못 띄워도 게임에는 영향 없음
    }
  }, DELAY_MS);

import type { AchievementId } from './list';

type Listener = (ids: AchievementId[]) => void;
const listeners = new Set<Listener>();

// 새 업적을 화면(알림)에 알리는 작은 이벤트 통로
export const onAchievements = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const emitAchievements = (ids: AchievementId[]) => {
  if (ids.length) listeners.forEach(listener => listener(ids));
};

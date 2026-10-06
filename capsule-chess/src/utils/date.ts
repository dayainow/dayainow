// 날짜는 기기의 현지 날짜 기준 'YYYY-MM-DD' 문자열로 다룸
const pad = (n: number) => String(n).padStart(2, '0');

export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const keyToUtc = (key: string): number => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export const previousDateKey = (key: string): string => {
  const prev = new Date(keyToUtc(key) - 86_400_000);
  return `${prev.getUTCFullYear()}-${pad(prev.getUTCMonth() + 1)}-${pad(prev.getUTCDate())}`;
};

// 기기 현지 시각 기준 다음 날 0시까지 남은 밀리초 (다음 데일리 퍼즐이 열리는 시각)
export const msUntilNextDay = (now: Date): number =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

// 05:12:09 형태
export const formatCountdown = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60].map(pad).join(':');
};

// from부터 to까지 며칠 차이인지 (to가 더 늦으면 양수)
export const daysBetween = (from: string, to: string): number =>
  Math.round((keyToUtc(to) - keyToUtc(from)) / 86_400_000);

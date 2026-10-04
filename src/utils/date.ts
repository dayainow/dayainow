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

// from부터 to까지 며칠 차이인지 (to가 더 늦으면 양수)
export const daysBetween = (from: string, to: string): number =>
  Math.round((keyToUtc(to) - keyToUtc(from)) / 86_400_000);

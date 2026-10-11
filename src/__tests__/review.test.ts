import { isReviewStreak, shouldRequestReview } from '../review';

jest.mock('expo-store-review', () => ({ isAvailableAsync: jest.fn(), requestReview: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('store review timing', () => {
  it('asks at most three times, at least 60 days apart', () => {
    expect(shouldRequestReview([], '2026-10-11')).toBe(true);
    expect(shouldRequestReview(['2026-10-01'], '2026-11-29')).toBe(false);
    expect(shouldRequestReview(['2026-10-01'], '2026-11-30')).toBe(true);
    expect(shouldRequestReview(['2026-01-01', '2026-04-01', '2026-07-01'], '2027-01-01')).toBe(false);
  });

  it('treats only milestone streaks as good moments', () => {
    expect([1, 2, 3, 4, 7, 8, 14, 30].filter(isReviewStreak)).toEqual([3, 7, 14, 30]);
  });
});

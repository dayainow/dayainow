import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyDailySolve,
  applyLessonDone,
  applyStageResult,
  currentStreak,
  emptyProgress,
  loadProgress,
  recordDailySolve,
  recordLessonDone,
  recordOnboarded,
  recordStageResult,
  resetProgress,
  totalStars,
} from '../progress';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(() => AsyncStorage.clear());

describe('onboarding', () => {
  it('starts not onboarded and remembers once seen', async () => {
    expect((await loadProgress()).onboarded).toBe(false);
    await recordOnboarded();
    await recordStageResult(1, 2);
    const loaded = await loadProgress();
    expect(loaded.onboarded).toBe(true);
    expect(loaded.campaign).toEqual({ 1: 2 });
  });

  it('shows the welcome again after a reset', async () => {
    await recordOnboarded();
    await resetProgress();
    expect((await loadProgress()).onboarded).toBe(false);
  });
});

describe('tutorial progress', () => {
  it('marks lessons done once', () => {
    const p = applyLessonDone(emptyProgress(), 'king');
    expect(p.tutorial).toEqual({ king: true });
    expect(applyLessonDone(p, 'king')).toBe(p);
  });

  it('loads older saves that have no tutorial field', async () => {
    await AsyncStorage.setItem('progress:v1', JSON.stringify({ campaign: { 1: 2 } }));
    const loaded = await loadProgress();
    expect(loaded.tutorial).toEqual({});
    expect(loaded.campaign).toEqual({ 1: 2 });
  });
});

describe('campaign progress', () => {
  it('keeps only the best stars per stage', () => {
    let p = applyStageResult(emptyProgress(), 1, 2);
    p = applyStageResult(p, 1, 1);
    p = applyStageResult(p, 2, 3);
    expect(p.campaign).toEqual({ 1: 2, 2: 3 });
    expect(totalStars(p)).toBe(5);
  });
});

describe('daily streak', () => {
  it('grows on consecutive days and restarts after a gap', () => {
    let p = applyDailySolve(emptyProgress(), '2026-10-01', 1);
    p = applyDailySolve(p, '2026-10-02', 3);
    expect(p.daily.streak).toBe(2);
    p = applyDailySolve(p, '2026-10-04', 1);
    expect(p.daily.streak).toBe(1);
    expect(p.daily.bestStreak).toBe(2);
    expect(p.daily.records['2026-10-02']).toEqual({ solved: true, attempts: 3, hints: 0 });
  });

  it('records how many hints were used', () => {
    const p = applyDailySolve(emptyProgress(), '2026-10-01', 2, 1);
    expect(p.daily.records['2026-10-01']).toEqual({ solved: true, attempts: 2, hints: 1 });
  });

  it('counts the same day only once', () => {
    const once = applyDailySolve(emptyProgress(), '2026-10-01', 2);
    expect(applyDailySolve(once, '2026-10-01', 1)).toBe(once);
  });

  it('crosses month and year boundaries', () => {
    let p = applyDailySolve(emptyProgress(), '2026-12-31', 1);
    p = applyDailySolve(p, '2027-01-01', 1);
    expect(p.daily.streak).toBe(2);
  });

  it('shows a broken streak as 0 until the next solve', () => {
    const p = applyDailySolve(applyDailySolve(emptyProgress(), '2026-10-01', 1), '2026-10-02', 1);
    expect(currentStreak(p, '2026-10-02')).toBe(2);
    expect(currentStreak(p, '2026-10-03')).toBe(2);
    expect(currentStreak(p, '2026-10-04')).toBe(0);
  });
});

describe('progress storage', () => {
  it('persists, reloads and resets', async () => {
    await recordLessonDone('rook');
    await recordStageResult(1, 3);
    await recordDailySolve('2026-10-01', 2);
    const loaded = await loadProgress();
    expect(loaded.tutorial).toEqual({ rook: true });
    expect(loaded.campaign).toEqual({ 1: 3 });
    expect(loaded.daily.streak).toBe(1);

    await resetProgress();
    expect(await loadProgress()).toEqual(emptyProgress());
  });

  it('survives broken stored data', async () => {
    await AsyncStorage.setItem('progress:v1', '{oops');
    expect(await loadProgress()).toEqual(emptyProgress());
  });
});

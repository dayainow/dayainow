import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyAchievements,
  applyDailySolve,
  applyLessonDone,
  applyStageResult,
  backfillAchievements,
  currentStreak,
  emptyProgress,
  loadProgress,
  recordDailySolve,
  recordLessonDone,
  recordOnboarded,
  recordStageResult,
  recordStat,
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

describe('achievements', () => {
  it('unlocks once, stamped with the date, when the condition is first met', () => {
    const first = applyAchievements(applyStageResult(emptyProgress(), 1, 3), '2026-10-11');
    expect(first.earned).toEqual(expect.arrayContaining(['first_win', 'perfect']));
    expect(first.next.achievements.first_win).toBe('2026-10-11');
    expect(applyAchievements(first.next, '2026-10-12').earned).toEqual([]);
  });

  it('counts stats for wins, evolutions and two-player games', async () => {
    await recordStat('evolutions');
    const saved = await recordStat('pvpGames');
    expect(saved.stats).toMatchObject({ evolutions: 1, pvpGames: 1, wins: 0 });
    expect(Object.keys(saved.achievements)).toEqual(expect.arrayContaining(['first_evolution', 'pvp_game']));
  });

  it('fills in old saves without stats or achievements', async () => {
    await AsyncStorage.setItem('progress:v1', JSON.stringify({ onboarded: true, campaign: { 1: 1 } }));
    const loaded = await loadProgress();
    expect(loaded.stats).toEqual({ wins: 0, hardWins: 0, evolutions: 0, pvpGames: 0 });
    expect(loaded.achievements).toEqual({});
    await backfillAchievements();
    expect((await loadProgress()).achievements.first_win).toBeDefined();
  });
});

describe('concurrent saves', () => {
  it('keeps both writes when a stat and a stage result land together', async () => {
    await Promise.all([recordStat('evolutions'), recordStageResult(3, 2), recordStat('wins')]);
    const saved = await loadProgress();
    expect(saved.campaign[3]).toBe(2);
    expect(saved.stats).toMatchObject({ evolutions: 1, wins: 1 });
  });
});

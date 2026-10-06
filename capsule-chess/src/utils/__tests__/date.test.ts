import { daysBetween, formatCountdown, msUntilNextDay, previousDateKey, toDateKey } from '../date';

describe('date utils', () => {
  it('formats local dates and steps back a day across months', () => {
    expect(toDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(previousDateKey('2026-03-01')).toBe('2026-02-28');
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(30);
  });

  it('counts down to the next local midnight', () => {
    expect(msUntilNextDay(new Date(2026, 9, 5, 23, 0, 0))).toBe(3_600_000);
    expect(msUntilNextDay(new Date(2026, 9, 5, 0, 0, 0))).toBe(86_400_000);
  });

  it('formats the countdown as HH:MM:SS', () => {
    expect(formatCountdown(3_725_000)).toBe('01:02:05');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });
});

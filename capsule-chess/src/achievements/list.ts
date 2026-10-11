import { CAPSULES, earnedBadges } from '../campaign/league';
import type { Progress } from '../storage/progress';
import { PRACTICE_COUNT } from '../puzzles/practice';
import { LESSONS } from '../tutorial/lessons';

// 업적 15종. 판정은 저장된 진행 기록만 보고 함 (문구는 i18n strings.achievements.items)
export type AchievementId =
  | 'first_win'
  | 'first_evolution'
  | 'perfect'
  | 'first_badge'
  | 'all_badges'
  | 'stars_30'
  | 'daily_first'
  | 'daily_flawless'
  | 'streak_3'
  | 'streak_7'
  | 'graduate'
  | 'hard_win'
  | 'pvp_game'
  | 'practice_10'
  | 'practice_all';

export type Achievement = { id: AchievementId; icon: string; color: string; check: (p: Progress) => boolean };

const stars = (p: Progress) => Object.values(p.campaign);
const dailies = (p: Progress) => Object.values(p.daily.records).filter(r => r.solved);

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', icon: '🏆', color: '#FFD23F', check: p => stars(p).some(s => s > 0) || p.stats.wins > 0 },
  { id: 'first_evolution', icon: '✨', color: '#58AEFF', check: p => p.stats.evolutions > 0 },
  { id: 'perfect', icon: '⭐', color: '#FFD23F', check: p => stars(p).some(s => s >= 3) },
  { id: 'first_badge', icon: '🏅', color: '#6FDDB7', check: p => earnedBadges(p.campaign).length >= 1 },
  { id: 'all_badges', icon: '👑', color: '#B18CFF', check: p => earnedBadges(p.campaign).length >= CAPSULES.length },
  { id: 'stars_30', icon: '🌟', color: '#FFD23F', check: p => stars(p).reduce((a, b) => a + b, 0) >= 30 },
  { id: 'daily_first', icon: '🧩', color: '#6FDDB7', check: p => dailies(p).length > 0 },
  { id: 'daily_flawless', icon: '🎯', color: '#FF6B6B', check: p => dailies(p).some(r => r.attempts === 1 && !r.hints) },
  { id: 'streak_3', icon: '🔥', color: '#FF6B6B', check: p => p.daily.bestStreak >= 3 },
  { id: 'streak_7', icon: '📅', color: '#FF6B6B', check: p => p.daily.bestStreak >= 7 },
  { id: 'graduate', icon: '🎓', color: '#6FDDB7', check: p => LESSONS.every(l => p.tutorial[l.id]) },
  { id: 'hard_win', icon: '💪', color: '#B18CFF', check: p => p.stats.hardWins > 0 },
  { id: 'pvp_game', icon: '🤝', color: '#58AEFF', check: p => p.stats.pvpGames > 0 },
  { id: 'practice_10', icon: '🥋', color: '#6FDDB7', check: p => Object.keys(p.practice).length >= 10 },
  { id: 'practice_all', icon: '🧠', color: '#B18CFF', check: p => Object.keys(p.practice).length >= PRACTICE_COUNT },
];

// 조건을 만족했지만 아직 기록되지 않은 업적
export const newlyEarned = (p: Progress): AchievementId[] =>
  ACHIEVEMENTS.filter(a => !p.achievements[a.id] && a.check(p)).map(a => a.id);

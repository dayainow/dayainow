import type { AchievementId } from '../achievements/list';
import { getCachedSettings } from '../storage/settings';

// 판 테마: 칸 색 두 가지. 업적을 달성하면 열림 (기본 캡슐 판은 처음부터)
// 기물 몬스터가 잘 보이도록 너무 진하거나 기물 색(블루·레드)과 겹치는 색은 피함
export type BoardTheme = {
  id: string;
  light: string;
  dark: string;
  unlock: AchievementId | null;
};

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'capsule', light: '#FFFBF3', dark: '#CFF3E4', unlock: null },
  { id: 'forest', light: '#F3F9E6', dark: '#BFE09A', unlock: 'first_win' },
  { id: 'ocean', light: '#EEF8FF', dark: '#A9D8F5', unlock: 'first_badge' },
  { id: 'candy', light: '#FFF2F7', dark: '#FFC9DF', unlock: 'streak_3' },
  { id: 'wood', light: '#F7E7CC', dark: '#D9AE7C', unlock: 'stars_30' },
  { id: 'night', light: '#9EA4E0', dark: '#6B71BF', unlock: 'practice_10' },
  { id: 'gold', light: '#FFF7DA', dark: '#F4D46A', unlock: 'all_badges' },
];

export const DEFAULT_BOARD_THEME = BOARD_THEMES[0];

export const boardThemeById = (id: string | undefined): BoardTheme => BOARD_THEMES.find(t => t.id === id) ?? DEFAULT_BOARD_THEME;

// 지금 고른 판 (설정은 앱 시작 때 읽어 둔 값을 씀)
export const currentBoardTheme = (): BoardTheme => boardThemeById(getCachedSettings().boardTheme);

export const isThemeUnlocked = (theme: BoardTheme, achievements: Record<string, string>): boolean =>
  !theme.unlock || !!achievements[theme.unlock];

// 이 업적으로 열리는 판 (없으면 undefined)
export const themeUnlockedBy = (achievement: string): BoardTheme | undefined => BOARD_THEMES.find(t => t.unlock === achievement);

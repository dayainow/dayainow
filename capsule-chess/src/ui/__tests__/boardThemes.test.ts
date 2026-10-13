import { ACHIEVEMENTS } from '../../achievements/list';
import { BOARD_THEMES, boardThemeById, isThemeUnlocked, themeUnlockedBy } from '../boardThemes';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('board themes', () => {
  it('starts with the capsule board open and ties every other board to a real achievement', () => {
    expect(BOARD_THEMES[0]).toMatchObject({ id: 'capsule', unlock: null });
    const ids = new Set(ACHIEVEMENTS.map(a => a.id));
    expect(BOARD_THEMES.slice(1).every(t => t.unlock && ids.has(t.unlock))).toBe(true);
    expect(new Set(BOARD_THEMES.map(t => t.unlock)).size).toBe(BOARD_THEMES.length);
  });

  it('unlocks a board once its achievement is earned', () => {
    const forest = boardThemeById('forest');
    expect(isThemeUnlocked(forest, {})).toBe(false);
    expect(isThemeUnlocked(forest, { first_win: '2026-10-11' })).toBe(true);
    expect(themeUnlockedBy('first_win')?.id).toBe('forest');
  });

  it('falls back to the capsule board for unknown ids', () => {
    expect(boardThemeById('nope').id).toBe('capsule');
  });
});

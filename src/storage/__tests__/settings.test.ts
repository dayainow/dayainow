import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS, getCachedSettings, loadSettings, updateSettings } from '../settings';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(() => AsyncStorage.clear());

describe('settings storage', () => {
  it('returns defaults when nothing is saved', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('updates one field without touching the others', async () => {
    await updateSettings({ soundEnabled: false });
    await updateSettings({ difficulty: 'hard' });
    expect(await loadSettings()).toEqual({ difficulty: 'hard', soundEnabled: false, hapticsEnabled: true });
    expect(getCachedSettings()).toEqual({ difficulty: 'hard', soundEnabled: false, hapticsEnabled: true });
  });

  it('fills new fields with defaults for older saves', async () => {
    await AsyncStorage.setItem('settings:v1', JSON.stringify({ difficulty: 'easy' }));
    expect(await loadSettings()).toEqual({ ...DEFAULT_SETTINGS, difficulty: 'easy' });
  });

  it('falls back to defaults for unknown or broken data', async () => {
    await AsyncStorage.setItem('settings:v1', JSON.stringify({ difficulty: 'toString', soundEnabled: 'yes' }));
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);

    await AsyncStorage.setItem('settings:v1', '{not json');
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});

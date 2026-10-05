import AsyncStorage from '@react-native-async-storage/async-storage';
import { DIFFICULTY_DEPTH, Difficulty } from '../engine/chessAI';

export type Settings = {
  difficulty: Difficulty;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  reminderEnabled: boolean; // 매일 아침 퍼즐 알림
  reminderPromptDismissed: boolean; // "알림 받을까요?" 카드를 닫았는지
};

// 저장 형식을 바꿀 땐 버전을 올려서 예전 데이터와 섞이지 않게 함 (필드 추가는 기본값으로 채워서 그대로 사용)
const STORAGE_KEY = 'settings:v1';

export const DEFAULT_SETTINGS: Settings = {
  difficulty: 'normal',
  soundEnabled: true,
  hapticsEnabled: true,
  reminderEnabled: false,
  reminderPromptDismissed: false,
};

// 효과음·진동처럼 매번 비동기로 읽기 곤란한 곳을 위해 마지막으로 읽은 값을 기억
let cached: Settings = DEFAULT_SETTINGS;
export const getCachedSettings = (): Settings => cached;

const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === 'string' && Object.keys(DIFFICULTY_DEPTH).includes(value);

const bool = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);

export const loadSettings = async (): Promise<Settings> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    cached = {
      difficulty: isDifficulty(saved?.difficulty) ? saved.difficulty : DEFAULT_SETTINGS.difficulty,
      soundEnabled: bool(saved?.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
      hapticsEnabled: bool(saved?.hapticsEnabled, DEFAULT_SETTINGS.hapticsEnabled),
      reminderEnabled: bool(saved?.reminderEnabled, DEFAULT_SETTINGS.reminderEnabled),
      reminderPromptDismissed: bool(saved?.reminderPromptDismissed, DEFAULT_SETTINGS.reminderPromptDismissed),
    };
  } catch {
    // 저장 데이터가 깨져 있어도 기본값으로 게임은 계속
    cached = DEFAULT_SETTINGS;
  }
  return cached;
};

// 바꾼 항목만 넘기면 나머지 설정은 그대로 유지
export const updateSettings = async (patch: Partial<Settings>): Promise<Settings> => {
  const next = { ...(await loadSettings()), ...patch };
  cached = next;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // 저장 실패는 게임 진행에 영향 없음
  }
  return next;
};

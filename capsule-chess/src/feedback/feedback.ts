import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { getCachedSettings, loadSettings } from '../storage/settings';
import type { MoveFeedback } from './moveKind';

// 소리 파일은 scripts/build-sounds.mjs로 합성
const SOUNDS = {
  select: require('../../assets/sounds/select.wav'),
  move: require('../../assets/sounds/move.wav'),
  capture: require('../../assets/sounds/capture.wav'),
  check: require('../../assets/sounds/check.wav'),
  star: require('../../assets/sounds/star.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  clear: require('../../assets/sounds/clear.wav'),
  win: require('../../assets/sounds/win.wav'),
  lose: require('../../assets/sounds/lose.wav'),
  versus: require('../../assets/sounds/versus.wav'),
  evolve: require('../../assets/sounds/evolve.wav'),
  badge: require('../../assets/sounds/badge.wav'),
};

export type SoundName = keyof typeof SOUNDS;

const players: Partial<Record<SoundName, AudioPlayer>> = {};

const playerFor = (name: SoundName): AudioPlayer => (players[name] ??= createAudioPlayer(SOUNDS[name]));

// 앱 시작 시 한 번: 설정을 읽고, 소리를 미리 불러와 첫 재생이 늦지 않게 함
export const initFeedback = async (): Promise<void> => {
  await loadSettings();
  try {
    // 무음 모드면 소리 안 냄, 다른 앱 음악은 끊지 않음
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
  } catch {
    // 지원하지 않는 환경
  }
  (Object.keys(SOUNDS) as SoundName[]).forEach(name => {
    try {
      playerFor(name);
    } catch {
      // 불러오기 실패해도 게임은 계속
    }
  });
};

const playSound = (name: SoundName) => {
  if (!getCachedSettings().soundEnabled) return;
  try {
    // 웹 브라우저는 사용자가 화면을 한 번도 누르지 않았으면 소리 재생을 거부하고 오류를 냄 → 그때는 건너뜀
    if (Platform.OS === 'web' && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    const player = playerFor(name);
    player.seekTo(0);
    player.play();
  } catch {
    // 재생 실패는 무시
  }
};

type HapticKind = 'selection' | 'light' | 'medium' | 'success' | 'warning' | 'error';

const haptic = (kind: HapticKind) => {
  if (Platform.OS === 'web' || !getCachedSettings().hapticsEnabled) return;
  const run = {
    selection: () => Haptics.selectionAsync(),
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
    error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  }[kind];
  run().catch(() => {});
};

const MOVE_HAPTIC: Record<MoveFeedback, HapticKind> = { move: 'light', capture: 'medium', check: 'warning' };

// 화면에서 쓰는 효과 묶음 (소리 + 진동)
export const feedback = {
  select: () => {
    playSound('select');
    haptic('selection');
  },
  move: (kind: MoveFeedback) => {
    playSound(kind);
    haptic(MOVE_HAPTIC[kind]);
  },
  star: () => {
    playSound('star');
    haptic('light');
  },
  wrong: () => {
    playSound('wrong');
    haptic('error');
  },
  clear: () => {
    playSound('clear');
    haptic('success');
  },
  win: () => {
    playSound('win');
    haptic('success');
  },
  lose: () => {
    playSound('lose');
    haptic('error');
  },
  versus: () => {
    playSound('versus');
    haptic('medium');
  },
  evolve: () => {
    playSound('evolve');
    haptic('success');
  },
  badge: () => {
    playSound('badge');
    haptic('success');
  },
};

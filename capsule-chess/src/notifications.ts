import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';
import { strings } from './i18n';

// 서버 없이 기기 안에서만 예약하는 로컬 알림 (개인정보 전송 없음)
export const REMINDER_HOUR = 9;
const CHANNEL_ID = 'daily-puzzle';

// 안드로이드 Expo Go는 SDK 53부터 expo-notifications를 불러오기만 해도 오류가 나므로 제외
// (개발 빌드·스토어 빌드에서는 정상 동작)
const isAndroidExpoGo = Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isReminderSupported = Platform.OS !== 'web' && !isAndroidExpoGo;

// 지원되는 환경에서만 모듈을 불러옴
const loadNotifications = (): typeof NotificationsModule => require('expo-notifications');

// 매일 아침 오늘의 퍼즐 알림 예약. 권한을 거절하면 false
export const enableDailyReminder = async (): Promise<boolean> => {
  if (!isReminderSupported) return false;
  try {
    const Notifications = loadNotifications();
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: strings.notification.channel,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title: strings.notification.title, body: strings.notification.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMINDER_HOUR,
        minute: 0,
        channelId: CHANNEL_ID,
      },
    });
    return true;
  } catch {
    return false;
  }
};

export const disableDailyReminder = async (): Promise<void> => {
  if (!isReminderSupported) return;
  try {
    await loadNotifications().cancelAllScheduledNotificationsAsync();
  } catch {
    // 무시
  }
};

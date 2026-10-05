import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { strings } from './i18n';

// 서버 없이 기기 안에서만 예약하는 로컬 알림 (개인정보 전송 없음)
export const REMINDER_HOUR = 9;
const CHANNEL_ID = 'daily-puzzle';

export const isReminderSupported = Platform.OS !== 'web';

// 매일 아침 오늘의 퍼즐 알림 예약. 권한을 거절하면 false
export const enableDailyReminder = async (): Promise<boolean> => {
  if (!isReminderSupported) return false;
  try {
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
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // 무시
  }
};

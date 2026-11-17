import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';
import type { Strings } from './i18n';

// 서버 없이 기기 안에서만 예약하는 로컬 알림 (개인정보 전송 없음)
export const REMINDER_HOUR = 9;
const CHANNEL_ID = 'daily-puzzle';

// 안드로이드 Expo Go는 SDK 53부터 expo-notifications를 불러오기만 해도 오류가 나므로 제외
// (개발 빌드·스토어 빌드에서는 정상 동작)
const isAndroidExpoGo = Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export const isReminderSupported = Platform.OS !== 'web' && !isAndroidExpoGo;

// 지원되는 환경에서만 모듈을 불러옴
const loadNotifications = (): typeof NotificationsModule => require('expo-notifications');
type ReminderText = Strings['notification'];

let reminderQueue = Promise.resolve();
const runReminderTask = (task: () => Promise<boolean>): Promise<boolean> => {
  const result = reminderQueue.then(async () => {
    if (!isReminderSupported) return false;
    try {
      return await task();
    } catch {
      return false;
    }
  });
  reminderQueue = result.then(() => {});
  return result;
};

const setDailyChannel = async (Notifications: typeof NotificationsModule, text: ReminderText) => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: text.channel,
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
};

const scheduleDailyReminder = async (
  Notifications: typeof NotificationsModule,
  text: ReminderText,
  previous: NotificationsModule.NotificationRequest[],
) => {
  if (previous.length === 1 && previous[0].content.title === text.title && previous[0].content.body === text.body) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: text.title, body: text.body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REMINDER_HOUR,
      minute: 0,
      channelId: CHANNEL_ID,
    },
  });
  await Promise.all(previous.map(({ identifier }) => Notifications.cancelScheduledNotificationAsync(identifier)));
};

// 권한 요청은 사용자가 알림을 켤 때만
export const enableDailyReminder = (text: ReminderText): Promise<boolean> =>
  runReminderTask(async () => {
    const Notifications = loadNotifications();
    await setDailyChannel(Notifications, text);
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return false;
    await scheduleDailyReminder(Notifications, text, await Notifications.getAllScheduledNotificationsAsync());
    return true;
  });

export const refreshDailyReminder = (text: ReminderText): Promise<boolean> =>
  runReminderTask(async () => {
    const Notifications = loadNotifications();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return false;
    const previous = await Notifications.getAllScheduledNotificationsAsync();
    if (previous.length === 0) return false;
    await setDailyChannel(Notifications, text);
    await scheduleDailyReminder(Notifications, text, previous);
    return true;
  });

export const disableDailyReminder = async (): Promise<void> => {
  await runReminderTask(async () => {
    await loadNotifications().cancelAllScheduledNotificationsAsync();
    return true;
  });
};

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// A thin wrapper over expo-notifications for the local study reminder. Web has a no-op twin.

export const notificationsSupported = true;

const CHANNEL_ID = 'reminders';

export async function hasPermission() {
  const settings = await Notifications.getPermissionsAsync();
  if (Platform.OS === 'ios') {
    const status = settings.ios?.status;
    return (
      status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
      status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
  }
  return settings.granted;
}

export async function requestPermission() {
  // Android 13+ needs a channel before it will show the permission prompt
  await ensureChannel();
  if (await hasPermission()) return true;
  await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return hasPermission();
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Study reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Replaces whatever was scheduled, so there's only ever one reminder waiting
export async function scheduleReminder(date: Date, content: { title: string; body: string }) {
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

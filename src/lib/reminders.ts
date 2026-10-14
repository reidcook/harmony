import { AppState } from 'react-native';

import {
  REMINDER_EARLIEST_HOUR,
  REMINDER_GAP_MS,
  REMINDER_LATEST_HOUR,
  REMINDER_MESSAGES,
} from '@/constants/reminders';
import {
  cancelReminders,
  hasPermission,
  notificationsSupported,
  requestPermission,
  scheduleReminder,
} from '@/lib/notifications';
import { createPersistedStore } from '@/lib/persisted-store';
import { getSessions, subscribe as subscribeSessions, type StudySession } from '@/lib/study-sessions';
import { getTimer, subscribeTimer, type StudyTimer } from '@/lib/study-timer';

// A gentle nudge when nothing has been logged for REMINDER_GAP_MS. It's a local notification
// scheduled on this phone, moved forward whenever something is logged, and never repeated.
// Only kept on this device, since notification permission belongs to the phone.
export type ReminderSettings = {
  enabled: boolean;
  // Whether the first-launch ask has been shown
  asked: boolean;
  // When reminders were turned on, so a brand-new user isn't nudged right away
  enabledAt: number | null;
};

export const DEFAULT_REMINDERS: ReminderSettings = { enabled: false, asked: false, enabledAt: null };

const store = createPersistedStore('harmony.reminders', DEFAULT_REMINDERS);

export const subscribeReminders = store.subscribe;
export const getReminders = store.get;

export { notificationsSupported };

export function getShouldAskReminders() {
  return notificationsSupported && !store.get().asked;
}

export function markRemindersAsked() {
  if (!store.get().asked) store.set({ ...store.get(), asked: true });
}

// Asks for permission and turns reminders on. 'denied' means the phone said no.
export async function enableReminders(): Promise<'enabled' | 'denied'> {
  const granted = await requestPermission();
  if (!granted) {
    markRemindersAsked();
    return 'denied';
  }
  store.set({ enabled: true, asked: true, enabledAt: Date.now() });
  await rescheduleReminders();
  return 'enabled';
}

export async function disableReminders() {
  store.set({ ...store.get(), enabled: false, asked: true });
  await rescheduleReminders();
}

// Last log (or timer start) plus the gap, moved into daytime. If that's already past, the app
// was just opened, so it waits another full gap rather than nudging right away.
export function nextReminderTime(
  sessions: StudySession[],
  timer: StudyTimer,
  enabledAt: number | null,
  now: number
) {
  let lastActivity = Math.max(enabledAt ?? now, timer.runningSince ?? 0);
  for (const session of sessions) lastActivity = Math.max(lastActivity, session.createdAt);

  let fireAt = lastActivity + REMINDER_GAP_MS;
  if (fireAt <= now) fireAt = now + REMINDER_GAP_MS;

  const date = new Date(fireAt);
  if (date.getHours() < REMINDER_EARLIEST_HOUR) {
    date.setHours(REMINDER_EARLIEST_HOUR, 0, 0, 0);
  } else if (date.getHours() >= REMINDER_LATEST_HOUR) {
    date.setDate(date.getDate() + 1);
    date.setHours(REMINDER_EARLIEST_HOUR, 0, 0, 0);
  }
  return date;
}

// Runs one at a time, so overlapping changes can't leave two reminders scheduled
let queue = Promise.resolve();

export function rescheduleReminders() {
  queue = queue.then(reschedule).catch((error) => {
    console.warn('Harmony couldn’t schedule a reminder', error);
  });
  return queue;
}

async function reschedule() {
  const { enabled, enabledAt } = store.get();
  // Permission can be turned off in the phone's settings at any time
  if (!enabled || !(await hasPermission())) {
    await cancelReminders();
    return;
  }
  const message = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
  await scheduleReminder(nextReminderTime(getSessions(), getTimer(), enabledAt, Date.now()), message);
}

if (notificationsSupported && typeof localStorage !== 'undefined') {
  // Coalesces a burst of store changes (like loading the account) into one reschedule
  let pending = false;
  const onChange = () => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      void rescheduleReminders();
    }, 0);
  };
  subscribeSessions(onChange);
  subscribeTimer(onChange);
  AppState.addEventListener('change', (state) => {
    if (state === 'active') onChange();
  });
  onChange();
}

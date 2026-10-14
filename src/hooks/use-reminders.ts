import { useSyncExternalStore } from 'react';

import { DEFAULT_REMINDERS, getReminders, subscribeReminders } from '@/lib/reminders';

// Static web rendering has no storage, so it starts from the defaults
export function useReminders() {
  return useSyncExternalStore(subscribeReminders, getReminders, () => DEFAULT_REMINDERS);
}

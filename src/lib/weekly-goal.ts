import { DEFAULT_WEEKLY_GOAL_MINUTES } from '@/constants/goal';
import { saveGoalToCloud } from '@/lib/cloud';
import { createPersistedStore } from '@/lib/persisted-store';

const store = createPersistedStore('harmony.weeklyGoalMinutes', DEFAULT_WEEKLY_GOAL_MINUTES);

export const subscribeWeeklyGoal = store.subscribe;

export function getWeeklyGoal() {
  const stored = store.get();
  return stored > 0 ? stored : DEFAULT_WEEKLY_GOAL_MINUTES;
}

// Saves to the account first (while logged in) and only reaches this phone if that works
export async function setWeeklyGoal(minutes: number) {
  await saveGoalToCloud(minutes);
  store.set(minutes);
}

// For loading from the account and logout. Not saved to the cloud.
export const replaceWeeklyGoal = store.set;

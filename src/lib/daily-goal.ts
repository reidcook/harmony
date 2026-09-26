import { DEFAULT_DAILY_GOAL_MINUTES } from '@/constants/goal';
import { createPersistedStore } from '@/lib/persisted-store';

const store = createPersistedStore('harmony.dailyGoalMinutes', DEFAULT_DAILY_GOAL_MINUTES);

export const subscribeDailyGoal = store.subscribe;

export function getDailyGoal() {
  const stored = store.get();
  return stored > 0 ? stored : DEFAULT_DAILY_GOAL_MINUTES;
}

export const setDailyGoal = store.set;

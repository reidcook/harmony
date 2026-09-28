import { DEFAULT_WEEKLY_GOAL_MINUTES } from '@/constants/goal';
import { createPersistedStore } from '@/lib/persisted-store';

const store = createPersistedStore('harmony.weeklyGoalMinutes', DEFAULT_WEEKLY_GOAL_MINUTES);

export const subscribeWeeklyGoal = store.subscribe;

export function getWeeklyGoal() {
  const stored = store.get();
  return stored > 0 ? stored : DEFAULT_WEEKLY_GOAL_MINUTES;
}

export const setWeeklyGoal = store.set;

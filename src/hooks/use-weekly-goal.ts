import { useSyncExternalStore } from 'react';

import { DEFAULT_WEEKLY_GOAL_MINUTES } from '@/constants/goal';
import { getWeeklyGoal, subscribeWeeklyGoal } from '@/lib/weekly-goal';

// Goal in minutes; static web rendering has no storage, so it starts from the default
export function useWeeklyGoal() {
  return useSyncExternalStore(
    subscribeWeeklyGoal,
    getWeeklyGoal,
    () => DEFAULT_WEEKLY_GOAL_MINUTES
  );
}

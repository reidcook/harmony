import { useSyncExternalStore } from 'react';

import { DEFAULT_DAILY_GOAL_MINUTES } from '@/constants/goal';
import { getDailyGoal, subscribeDailyGoal } from '@/lib/daily-goal';

// Goal in minutes; static web rendering has no storage, so it starts from the default
export function useDailyGoal() {
  return useSyncExternalStore(subscribeDailyGoal, getDailyGoal, () => DEFAULT_DAILY_GOAL_MINUTES);
}

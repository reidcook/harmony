import '@/lib/install-local-storage';

import { DEFAULT_DAILY_GOAL_MINUTES } from '@/constants/goal';

const STORAGE_KEY = 'harmony.dailyGoalMinutes';

const listeners = new Set<() => void>();
let cache: number | null = null;

function load() {
  if (typeof localStorage === 'undefined') return DEFAULT_DAILY_GOAL_MINUTES;
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return stored > 0 ? stored : DEFAULT_DAILY_GOAL_MINUTES;
}

export function subscribeDailyGoal(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDailyGoal() {
  cache ??= load();
  return cache;
}

export function setDailyGoal(minutes: number) {
  cache = minutes;
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, String(minutes));
  listeners.forEach((listener) => listener());
}

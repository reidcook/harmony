import { useSyncExternalStore } from 'react';

import { getTimer, IDLE_TIMER, subscribeTimer } from '@/lib/study-timer';

export function useStudyTimer() {
  // Static web rendering has no storage, so the server snapshot is a stopped timer
  return useSyncExternalStore(subscribeTimer, getTimer, () => IDLE_TIMER);
}

// Shared by every subscriber so the snapshot stays the same between ticks
let now = Date.now();

function subscribeClock(listener: () => void) {
  now = Date.now();
  const id = setInterval(() => {
    now = Date.now();
    listener();
  }, 1000);
  return () => clearInterval(id);
}

// The current time, updated every second. 0 during static rendering so hydration matches.
export function useNow() {
  return useSyncExternalStore(
    subscribeClock,
    () => now,
    () => 0
  );
}

import { useSyncExternalStore } from 'react';

import {
  EMPTY_SESSIONS,
  getSessions,
  subscribe,
  toDateKey,
} from '@/lib/study-sessions';

export function useStudySessions() {
  // Static web rendering has no storage, so the server snapshot is empty
  return useSyncExternalStore(subscribe, getSessions, () => EMPTY_SESSIONS);
}

const noopSubscribe = () => () => {};

// null during static rendering so the build date never leaks into hydration
export function useToday() {
  return useSyncExternalStore(
    noopSubscribe,
    () => toDateKey(new Date()),
    () => null
  );
}

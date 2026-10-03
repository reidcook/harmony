import { useSyncExternalStore } from 'react';

import { getAuthUser, subscribeAuth } from '@/lib/auth';

// The logged-in user, or null; static web rendering is always logged out
export function useAuthUser() {
  return useSyncExternalStore(subscribeAuth, getAuthUser, () => null);
}

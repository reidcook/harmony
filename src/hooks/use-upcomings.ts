import { useSyncExternalStore } from 'react';

import { EMPTY_UPCOMINGS, getUpcomings, subscribeUpcomings } from '@/lib/upcomings';

export function useUpcomings() {
  // Static web rendering has no storage, so the server snapshot is empty
  return useSyncExternalStore(subscribeUpcomings, getUpcomings, () => EMPTY_UPCOMINGS);
}

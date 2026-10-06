import { useSyncExternalStore } from 'react';

import {
  EMPTY_REWARDS,
  getPendingRewards,
  getRewards,
  subscribePendingRewards,
  subscribeRewards,
} from '@/lib/rewards';

// Static web rendering has no storage, so the server snapshots are empty

export function useRewards() {
  return useSyncExternalStore(subscribeRewards, getRewards, () => EMPTY_REWARDS);
}

// Rewards earned on this device that Harmony hasn't celebrated yet
export function usePendingRewards() {
  return useSyncExternalStore(subscribePendingRewards, getPendingRewards, () => EMPTY_REWARDS);
}

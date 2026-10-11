import { useSyncExternalStore } from 'react';

import { useRewards } from '@/hooks/use-rewards';
import {
  computeBalance,
  EMPTY_EQUIPPED,
  EMPTY_PURCHASES,
  getEquipped,
  getPurchases,
  subscribeEquipped,
  subscribePurchases,
} from '@/lib/wardrobe';

// Static web rendering has no storage, so the server snapshots are empty

export function usePurchases() {
  return useSyncExternalStore(subscribePurchases, getPurchases, () => EMPTY_PURCHASES);
}

export function useEquipped() {
  return useSyncExternalStore(subscribeEquipped, getEquipped, () => EMPTY_EQUIPPED);
}

// Hearts earned minus hearts spent
export function useBalance() {
  return computeBalance(useRewards(), usePurchases());
}

import { useSyncExternalStore } from 'react';

import { getShouldWelcome, subscribeWelcome } from '@/lib/welcome';

// Whether to offer backup on first launch; static web rendering never does, so hydration matches
export function useShouldWelcome() {
  return useSyncExternalStore(subscribeWelcome, getShouldWelcome, () => false);
}

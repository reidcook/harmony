import { useSyncExternalStore } from 'react';

import { ENCOURAGEMENTS } from '@/constants/encouragements';

// Picked once per app launch so the message stays put across re-renders
const launchMessage =
  ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];

const subscribe = () => () => {};

export function useEncouragement() {
  // Static web rendering uses a fixed message so hydration matches
  return useSyncExternalStore(
    subscribe,
    () => launchMessage,
    () => ENCOURAGEMENTS[0]
  );
}

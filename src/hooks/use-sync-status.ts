import { useSyncExternalStore } from 'react';

import { getSyncStatus, subscribeSyncStatus } from '@/lib/sync';

const SERVER_STATUS = { state: 'idle', lastSyncedAt: null } as const;

export function useSyncStatus() {
  return useSyncExternalStore(subscribeSyncStatus, getSyncStatus, () => SERVER_STATUS);
}

import { useSyncExternalStore } from 'react';

import {
  EMPTY_CLINICAL_LOCATIONS,
  getClinicalLocations,
  subscribeClinicalLocations,
} from '@/lib/clinical-locations';
import { EMPTY_CLINICALS, getClinicals, subscribeClinicals } from '@/lib/clinicals';

// Static web rendering has no storage, so the server snapshots are empty

export function useClinicals() {
  return useSyncExternalStore(subscribeClinicals, getClinicals, () => EMPTY_CLINICALS);
}

export function useClinicalLocations() {
  return useSyncExternalStore(
    subscribeClinicalLocations,
    getClinicalLocations,
    () => EMPTY_CLINICAL_LOCATIONS
  );
}

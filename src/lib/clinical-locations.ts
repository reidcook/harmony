import { getClinicals } from '@/lib/clinicals';
import { deleteClinicalLocationFromCloud, saveClinicalLocationsToCloud } from '@/lib/cloud';
import { createPersistedStore, newId } from '@/lib/persisted-store';

export type ClinicalLocationType = 'hospital' | 'longTermCare' | 'outpatient';

export type ClinicalLocation = {
  id: string;
  name: string;
  description: string;
  type: ClinicalLocationType | null;
  createdAt: number;
};

type ClinicalLocationFields = {
  name: string;
  description: string;
  type: ClinicalLocationType | null;
};

export const CLINICAL_LOCATION_TYPES: Record<
  ClinicalLocationType,
  { label: string; emoji: string }
> = {
  hospital: { label: 'Hospital/Medical Center', emoji: '🏥' },
  longTermCare: { label: 'Long-Term Care', emoji: '🏡' },
  outpatient: { label: 'Outpatient Clinic', emoji: '🩹' },
};

export const EMPTY_CLINICAL_LOCATIONS: ClinicalLocation[] = [];

const store = createPersistedStore('harmony.clinicalLocations', EMPTY_CLINICAL_LOCATIONS);

export const subscribeClinicalLocations = store.subscribe;
export const getClinicalLocations = store.get;
// Swaps in a whole list at once, for loading from the account and logout. Not saved to the cloud.
export const replaceClinicalLocations = store.set;

export function getClinicalLocation(id: string) {
  return getClinicalLocations().find((l) => l.id === id);
}

export function isLocationInUse(id: string) {
  return getClinicals().some((c) => c.locationId === id);
}

// The location just created, so the clinical form that opened it can select it on return
let justAdded: string | null = null;
export function takeJustAddedLocationId() {
  const id = justAdded;
  justAdded = null;
  return id;
}

const tidy = (fields: ClinicalLocationFields) => ({
  ...fields,
  name: fields.name.trim(),
  description: fields.description.trim(),
});

// Changes save to the account first (while logged in) and only reach this phone if that works

export async function addClinicalLocation(fields: ClinicalLocationFields) {
  const location: ClinicalLocation = { id: newId(), ...tidy(fields), createdAt: Date.now() };
  await saveClinicalLocationsToCloud([location]);
  store.set([...getClinicalLocations(), location]);
  justAdded = location.id;
}

export async function updateClinicalLocation(id: string, fields: ClinicalLocationFields) {
  const existing = getClinicalLocation(id);
  if (!existing) return;
  const updated: ClinicalLocation = { ...existing, ...tidy(fields) };
  await saveClinicalLocationsToCloud([updated]);
  store.set(getClinicalLocations().map((l) => (l.id === id ? updated : l)));
}

// Only once no clinical uses it
export async function removeClinicalLocation(id: string) {
  if (isLocationInUse(id)) {
    throw new Error('This location still has clinicals. Delete or move them first.');
  }
  await deleteClinicalLocationFromCloud(id);
  store.set(getClinicalLocations().filter((l) => l.id !== id));
}

// Alphabetical, for pickers
export function sortLocations(locations: ClinicalLocation[]) {
  return [...locations].sort((a, b) => a.name.localeCompare(b.name));
}

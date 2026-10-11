import { deleteClinicalFromCloud, saveClinicalsToCloud } from '@/lib/cloud';
import { createPersistedStore, newId } from '@/lib/persisted-store';

// Clinical shifts. Kept apart from study sessions, so their hours never count toward the
// weekly goal, the streak, hearts, or rewards.
export type Clinical = {
  id: string;
  date: string; // local YYYY-MM-DD
  locationId: string;
  minutes: number | null;
  description: string;
  createdAt: number;
};

type ClinicalFields = {
  date: string;
  locationId: string;
  minutes: number | null;
  description: string;
};

export const EMPTY_CLINICALS: Clinical[] = [];

const store = createPersistedStore('harmony.clinicals', EMPTY_CLINICALS);

export const subscribeClinicals = store.subscribe;
export const getClinicals = store.get;
// Swaps in a whole list at once, for loading from the account and logout. Not saved to the cloud.
export const replaceClinicals = store.set;

export function getClinical(id: string) {
  return getClinicals().find((c) => c.id === id);
}

const tidy = (fields: ClinicalFields) => ({
  ...fields,
  minutes: fields.minutes && fields.minutes > 0 ? fields.minutes : null,
  description: fields.description.trim(),
});

// Changes save to the account first (while logged in) and only reach this phone if that works

export async function addClinical(fields: ClinicalFields) {
  const clinical: Clinical = { id: newId(), ...tidy(fields), createdAt: Date.now() };
  await saveClinicalsToCloud([clinical]);
  store.set([...getClinicals(), clinical]);
}

export async function updateClinical(id: string, fields: ClinicalFields) {
  const existing = getClinical(id);
  if (!existing) return;
  const updated: Clinical = { ...existing, ...tidy(fields) };
  await saveClinicalsToCloud([updated]);
  store.set(getClinicals().map((c) => (c.id === id ? updated : c)));
}

export async function removeClinical(id: string) {
  await deleteClinicalFromCloud(id);
  store.set(getClinicals().filter((c) => c.id !== id));
}

// Today onward, soonest first
export function nextClinicals(clinicals: Clinical[], today: string, count = Infinity) {
  return clinicals
    .filter((c) => c.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .slice(0, count);
}

// Before today, most recent first
export function pastClinicals(clinicals: Clinical[], today: string) {
  return clinicals
    .filter((c) => c.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

// Days with a clinical, for the calendar's stethoscope
export function clinicalDates(clinicals: Clinical[]) {
  return new Set(clinicals.map((c) => c.date));
}

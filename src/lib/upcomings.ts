import { deleteUpcomingFromCloud, saveSessionsToCloud, saveUpcomingsToCloud } from '@/lib/cloud';
import { createPersistedStore, newId } from '@/lib/persisted-store';
import { replaceSomeSessions, withoutUpcoming } from '@/lib/study-sessions';

export type UpcomingType = 'quiz' | 'exam' | 'final';

export type Upcoming = {
  id: string;
  type: UpcomingType;
  title: string;
  date: string; // local YYYY-MM-DD
  createdAt: number;
};

type UpcomingFields = { type: UpcomingType; title: string; date: string };

export const UPCOMING_TYPES: Record<UpcomingType, { label: string; emoji: string }> = {
  quiz: { label: 'Quiz', emoji: '📝' },
  exam: { label: 'Exam', emoji: '📋' },
  final: { label: 'Final', emoji: '🎓' },
};

export const EMPTY_UPCOMINGS: Upcoming[] = [];

const store = createPersistedStore('harmony.upcomings', EMPTY_UPCOMINGS);

export const subscribeUpcomings = store.subscribe;
export const getUpcomings = store.get;
// Swaps in a whole list at once, for loading from the account and logout. Not saved to the cloud.
export const replaceUpcomings = store.set;

export function getUpcoming(id: string) {
  return getUpcomings().find((u) => u.id === id);
}

// Changes save to the account first (while logged in) and only reach this phone if that works

export async function addUpcoming(fields: UpcomingFields) {
  const upcoming: Upcoming = {
    id: newId(),
    ...fields,
    title: fields.title.trim(),
    createdAt: Date.now(),
  };
  await saveUpcomingsToCloud([upcoming]);
  store.set([...getUpcomings(), upcoming]);
}

export async function updateUpcoming(id: string, fields: UpcomingFields) {
  const existing = getUpcoming(id);
  if (!existing) return;
  const updated: Upcoming = { ...existing, ...fields, title: fields.title.trim() };
  await saveUpcomingsToCloud([updated]);
  store.set(getUpcomings().map((u) => (u.id === id ? updated : u)));
}

// Keeps its sessions (and their time) but drops their link to it
export async function removeUpcoming(id: string) {
  const unlinked = withoutUpcoming(id);
  // Unlink first, so a failure never leaves sessions pointing at a deleted upcoming
  await saveSessionsToCloud(unlinked);
  await deleteUpcomingFromCloud(id);
  replaceSomeSessions(unlinked);
  store.set(getUpcomings().filter((u) => u.id !== id));
}

// Soonest first, skipping anything already past
export function nextUpcomings(upcomings: Upcoming[], today: string, count = Infinity) {
  return upcomings
    .filter((u) => u.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .slice(0, count);
}

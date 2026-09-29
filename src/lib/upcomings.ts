import { createPersistedStore, newId } from '@/lib/persisted-store';
import { unlinkUpcoming } from '@/lib/study-sessions';

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
// Swaps in a whole list at once, for cloud sync and logout
export const replaceUpcomings = store.set;

export function getUpcoming(id: string) {
  return getUpcomings().find((u) => u.id === id);
}

export function addUpcoming(fields: UpcomingFields) {
  store.set([
    ...getUpcomings(),
    { id: newId(), ...fields, title: fields.title.trim(), createdAt: Date.now() },
  ]);
}

export function updateUpcoming(id: string, fields: UpcomingFields) {
  store.set(
    getUpcomings().map((u) => (u.id === id ? { ...u, ...fields, title: fields.title.trim() } : u))
  );
}

export function removeUpcoming(id: string) {
  store.set(getUpcomings().filter((u) => u.id !== id));
  unlinkUpcoming(id);
}

// Soonest first, skipping anything already past
export function nextUpcomings(upcomings: Upcoming[], today: string, count = Infinity) {
  return upcomings
    .filter((u) => u.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
    .slice(0, count);
}

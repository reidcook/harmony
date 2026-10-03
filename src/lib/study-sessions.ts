import { deleteSessionFromCloud, saveSessionsToCloud } from '@/lib/cloud';
import { createPersistedStore, newId } from '@/lib/persisted-store';

export type StudySession = {
  id: string;
  date: string; // local YYYY-MM-DD
  minutes: number;
  description: string;
  createdAt: number;
  upcomingIds: string[]; // the quizzes/exams/finals this was studying for
};

type SessionFields = { minutes: number; description: string; upcomingIds: string[] };

// Sessions saved before multi-linking had a single optional `upcomingId`
type StoredSession = Omit<StudySession, 'upcomingIds'> & {
  upcomingIds?: string[];
  upcomingId?: string;
};

function migrateSession({ upcomingId, upcomingIds, ...rest }: StoredSession): StudySession {
  return { ...rest, upcomingIds: upcomingIds ?? (upcomingId ? [upcomingId] : []) };
}

export const EMPTY_SESSIONS: StudySession[] = [];

const store = createPersistedStore('harmony.sessions', EMPTY_SESSIONS, (stored) =>
  (stored as StoredSession[]).map(migrateSession)
);

export const subscribe = store.subscribe;
export const getSessions = store.get;
// Swaps in a whole list at once, for loading from the account and logout. Not saved to the cloud.
export const replaceSessions = store.set;

// Changes save to the account first (while logged in) and only reach this phone if that works

export async function addSession(input: SessionFields & { date?: string }) {
  const now = Date.now();
  const session: StudySession = {
    id: newId(),
    date: input.date ?? toDateKey(new Date(now)),
    minutes: input.minutes,
    description: input.description.trim(),
    createdAt: now,
    upcomingIds: input.upcomingIds,
  };
  await saveSessionsToCloud([session]);
  store.set([...getSessions(), session]);
}

export function getSession(id: string) {
  return getSessions().find((s) => s.id === id);
}

export async function updateSession(id: string, changes: SessionFields) {
  const existing = getSession(id);
  if (!existing) return;
  const updated: StudySession = {
    ...existing,
    minutes: changes.minutes,
    description: changes.description.trim(),
    upcomingIds: changes.upcomingIds,
  };
  await saveSessionsToCloud([updated]);
  store.set(getSessions().map((s) => (s.id === id ? updated : s)));
}

export async function removeSession(id: string) {
  await deleteSessionFromCloud(id);
  store.set(getSessions().filter((s) => s.id !== id));
}

// The sessions linked to a deleted upcoming, with the link dropped (their time is kept)
export function withoutUpcoming(upcomingId: string) {
  return getSessions()
    .filter((s) => s.upcomingIds.includes(upcomingId))
    .map((s) => ({ ...s, upcomingIds: s.upcomingIds.filter((id) => id !== upcomingId) }));
}

// Swaps already-saved versions of some sessions into the list
export function replaceSomeSessions(changed: StudySession[]) {
  if (changed.length === 0) return;
  const byId = new Map(changed.map((s) => [s.id, s]));
  store.set(getSessions().map((s) => byId.get(s.id) ?? s));
}

export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Built by hand so the server render and the browser agree regardless of locale
export function formatDayHeading(key: string) {
  const date = fromDateKey(key);
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

// Whole days from one date key to another (negative if `to` is earlier)
export function daysUntil(from: string, to: string) {
  const ms = fromDateKey(to).getTime() - fromDateKey(from).getTime();
  // Rounding absorbs the hour lost or gained across daylight-saving changes
  return Math.round(ms / 86_400_000);
}

export function formatDaysAway(days: number) {
  if (days < 0) return 'Past';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `in ${days} days`;
}

function addDays(key: string, days: number) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

// Sessions can be added, edited, or deleted only on today or up to this many days back
export const MAX_DAYS_BACK = 2;

export const SESSION_LOCK_MESSAGE = `Sessions can only be added or changed for today and the ${MAX_DAYS_BACK} days before.`;

export function canChangeSessionOn(dateKey: string, todayKey: string) {
  return dateKey <= todayKey && dateKey >= addDays(todayKey, -MAX_DAYS_BACK);
}

// Monday through Sunday of the week containing `todayKey`
export function getWeekDates(todayKey: string) {
  const mondayOffset = (fromDateKey(todayKey).getDay() + 6) % 7;
  const monday = addDays(todayKey, -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// Monday-first grid for a month (0-based `month`), padded with nulls to whole weeks
export function getMonthGrid(year: number, month: number) {
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateKey(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function minutesByDate(sessions: StudySession[]) {
  const totals = new Map<string, number>();
  for (const session of sessions) {
    totals.set(session.date, (totals.get(session.date) ?? 0) + session.minutes);
  }
  return totals;
}

// Twelve monthly totals (January first) for one year
export function minutesByMonth(totals: Map<string, number>, year: number) {
  const months: number[] = Array(12).fill(0);
  const prefix = `${year}-`;
  for (const [key, minutes] of totals) {
    if (key.startsWith(prefix)) months[fromDateKey(key).getMonth()] += minutes;
  }
  return months;
}

// Total minutes in the Monday–Sunday week containing `dayKey`
export function weekMinutes(totals: Map<string, number>, dayKey: string) {
  return getWeekDates(dayKey).reduce((sum, d) => sum + (totals.get(d) ?? 0), 0);
}

// Consecutive weeks that met the weekly goal
export function computeWeekStreak(totals: Map<string, number>, todayKey: string, goal: number) {
  const met = (dayKey: string) => weekMinutes(totals, dayKey) >= goal;
  // This week isn't over yet, so falling short so far doesn't break the streak
  let day = met(todayKey) ? todayKey : addDays(todayKey, -7);
  let streak = 0;
  // A goal above zero guarantees this stops at the first week without study
  while (met(day)) {
    streak++;
    day = addDays(day, -7);
  }
  return streak;
}

export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

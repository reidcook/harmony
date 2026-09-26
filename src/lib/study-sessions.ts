import '@/lib/install-local-storage';

export type StudySession = {
  id: string;
  date: string; // local YYYY-MM-DD
  minutes: number;
  description: string;
  createdAt: number;
};

const STORAGE_KEY = 'harmony.sessions';

export const EMPTY_SESSIONS: StudySession[] = [];

const listeners = new Set<() => void>();
let cache: StudySession[] | null = null;

function hasStorage() {
  return typeof localStorage !== 'undefined';
}

function load(): StudySession[] {
  if (!hasStorage()) return EMPTY_SESSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StudySession[]) : EMPTY_SESSIONS;
  } catch {
    return EMPTY_SESSIONS;
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Returns the same array until a write happens, as useSyncExternalStore requires
export function getSessions() {
  cache ??= load();
  return cache;
}

export function addSession(input: { minutes: number; description: string; date?: string }) {
  const now = Date.now();
  const session: StudySession = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    date: input.date ?? toDateKey(new Date(now)),
    minutes: input.minutes,
    description: input.description.trim(),
    createdAt: now,
  };
  cache = [...getSessions(), session];
  if (hasStorage()) localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  listeners.forEach((listener) => listener());
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

function addDays(key: string, days: number) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

// Monday through Sunday of the week containing `todayKey`
export function getWeekDates(todayKey: string) {
  const mondayOffset = (fromDateKey(todayKey).getDay() + 6) % 7;
  const monday = addDays(todayKey, -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function minutesByDate(sessions: StudySession[]) {
  const totals = new Map<string, number>();
  for (const session of sessions) {
    totals.set(session.date, (totals.get(session.date) ?? 0) + session.minutes);
  }
  return totals;
}

export function computeStreak(totals: Map<string, number>, todayKey: string) {
  // Any logged study keeps the streak alive; the hearts show whether the goal was met
  const studied = (key: string) => (totals.get(key) ?? 0) > 0;
  // Not having studied yet today doesn't break the streak
  let day = studied(todayKey) ? todayKey : addDays(todayKey, -1);
  let streak = 0;
  while (studied(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

import { AppState } from 'react-native';

import { DEFAULT_WEEKLY_GOAL_MINUTES } from '@/constants/goal';
import { getAuthUser, signOut } from '@/lib/auth';
import { createPersistedStore } from '@/lib/persisted-store';
import {
  getSessions,
  replaceSessions,
  subscribe as subscribeSessions,
  type StudySession,
} from '@/lib/study-sessions';
import { supabase } from '@/lib/supabase';
import {
  getUpcomings,
  replaceUpcomings,
  subscribeUpcomings,
  type Upcoming,
  type UpcomingType,
} from '@/lib/upcomings';
import { getWeeklyGoal, setWeeklyGoal, subscribeWeeklyGoal } from '@/lib/weekly-goal';

// Local storage stays what the UI reads. While logged in, every local change is queued here
// and pushed to Supabase; pulls bring in changes from other devices.

type Table = 'sessions' | 'upcomings' | 'users';
type QueueEntry = { table: Table; id: string; op: 'upsert' | 'delete' };

const GOAL_ID = 'goal';
const EMPTY_QUEUE: QueueEntry[] = [];
const queue = createPersistedStore('harmony.syncQueue', EMPTY_QUEUE);

const entryKey = (e: QueueEntry) => `${e.table}:${e.id}`;

// A newer entry for the same record replaces the older one
function enqueue(entries: QueueEntry[]) {
  if (entries.length === 0) return;
  const keys = new Set(entries.map(entryKey));
  queue.set([...queue.get().filter((e) => !keys.has(entryKey(e))), ...entries]);
}

export function pendingChangeCount() {
  return queue.get().length;
}

// ---- Sync status, for the account screen ----

type SyncStatus = { state: 'idle' | 'syncing' | 'error'; lastSyncedAt: number | null };
const statusListeners = new Set<() => void>();
let status: SyncStatus = { state: 'idle', lastSyncedAt: null };

function setStatus(next: Partial<SyncStatus>) {
  status = { ...status, ...next };
  statusListeners.forEach((listener) => listener());
}

export function subscribeSyncStatus(listener: () => void) {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function getSyncStatus() {
  return status;
}

// ---- Change capture ----

// Set while writing pulled data into the stores, so it isn't queued back up
let applyingRemote = false;

function applyRemote(write: () => void) {
  applyingRemote = true;
  try {
    write();
  } finally {
    applyingRemote = false;
  }
}

// The stores never mutate in place, so a changed object reference means a changed record
function diffById(table: Table, before: { id: string }[], after: { id: string }[]) {
  const old = new Map(before.map((item) => [item.id, item]));
  const entries: QueueEntry[] = [];
  for (const item of after) {
    if (old.get(item.id) !== item) entries.push({ table, id: item.id, op: 'upsert' });
    old.delete(item.id);
  }
  for (const id of old.keys()) entries.push({ table, id, op: 'delete' });
  return entries;
}

function watch<T>(subscribe: (listener: () => void) => () => void, get: () => T, onChange: (before: T, after: T) => void) {
  let prev = get();
  subscribe(() => {
    const next = get();
    if (next === prev) return;
    const before = prev;
    prev = next;
    if (applyingRemote || !getAuthUser()) return;
    onChange(before, next);
    void pushChanges();
  });
}

watch(subscribeSessions, getSessions, (before, after) =>
  enqueue(diffById('sessions', before, after))
);
watch(subscribeUpcomings, getUpcomings, (before, after) =>
  enqueue(diffById('upcomings', before, after))
);
watch(subscribeWeeklyGoal, getWeeklyGoal, () =>
  enqueue([{ table: 'users', id: GOAL_ID, op: 'upsert' }])
);

// ---- Row mapping ----

type SessionRow = {
  user_id: string;
  id: string;
  date: string;
  minutes: number;
  description: string;
  upcoming_ids: string[];
  created_at: string;
};

type UpcomingRow = {
  user_id: string;
  id: string;
  type: UpcomingType;
  title: string;
  date: string;
  created_at: string;
};

const sessionToRow = (s: StudySession, userId: string): SessionRow => ({
  user_id: userId,
  id: s.id,
  date: s.date,
  minutes: s.minutes,
  description: s.description,
  upcoming_ids: s.upcomingIds,
  created_at: new Date(s.createdAt).toISOString(),
});

const rowToSession = (r: SessionRow): StudySession => ({
  id: r.id,
  date: r.date,
  minutes: r.minutes,
  description: r.description,
  upcomingIds: r.upcoming_ids,
  createdAt: Date.parse(r.created_at),
});

const upcomingToRow = (u: Upcoming, userId: string): UpcomingRow => ({
  user_id: userId,
  id: u.id,
  type: u.type,
  title: u.title,
  date: u.date,
  created_at: new Date(u.createdAt).toISOString(),
});

const rowToUpcoming = (r: UpcomingRow): Upcoming => ({
  id: r.id,
  type: r.type,
  title: r.title,
  date: r.date,
  createdAt: Date.parse(r.created_at),
});

// ---- Push and pull ----

// One sync task at a time, so a pull never interleaves with a push
let chain: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.catch(() => {});
  return run;
}

function check<T extends { error: unknown }>(result: T) {
  if (result.error) throw result.error;
  return result;
}

// Sends everything queued, a batch per table and operation; throws if offline
async function flush() {
  const user = getAuthUser();
  if (!supabase || !user) return;

  const batch = queue.get();
  if (batch.length === 0) return;
  const pick = (table: Table, op: QueueEntry['op']) =>
    batch.filter((e) => e.table === table && e.op === op).map((e) => e.id);

  // Upserts send the record as it is now, not as it was when queued
  const sessionsById = new Map(getSessions().map((s) => [s.id, s]));
  const sessionRows = pick('sessions', 'upsert')
    .map((id) => sessionsById.get(id))
    .filter((s): s is StudySession => !!s)
    .map((s) => sessionToRow(s, user.id));
  const upcomingsById = new Map(getUpcomings().map((u) => [u.id, u]));
  const upcomingRows = pick('upcomings', 'upsert')
    .map((id) => upcomingsById.get(id))
    .filter((u): u is Upcoming => !!u)
    .map((u) => upcomingToRow(u, user.id));
  const sessionDeletes = pick('sessions', 'delete');
  const upcomingDeletes = pick('upcomings', 'delete');
  const goalChanged = pick('users', 'upsert').length > 0;

  if (sessionRows.length > 0) {
    check(await supabase.from('sessions').upsert(sessionRows, { onConflict: 'user_id,id' }));
  }
  if (upcomingRows.length > 0) {
    check(await supabase.from('upcomings').upsert(upcomingRows, { onConflict: 'user_id,id' }));
  }
  if (sessionDeletes.length > 0) {
    check(
      await supabase.from('sessions').delete().eq('user_id', user.id).in('id', sessionDeletes)
    );
  }
  if (upcomingDeletes.length > 0) {
    check(
      await supabase.from('upcomings').delete().eq('user_id', user.id).in('id', upcomingDeletes)
    );
  }
  if (goalChanged) {
    check(
      await supabase
        .from('users')
        .update({ weekly_goal_minutes: getWeeklyGoal() })
        .eq('id', user.id)
    );
  }

  // Entries replaced by newer changes while sending stay queued for the next push
  const sent = new Set(batch);
  queue.set(queue.get().filter((e) => !sent.has(e)));
}

// Same fields and values, whatever order the keys were written in
const canonical = (record: object) => JSON.stringify(record, Object.keys(record).sort());
const sameRecord = (a: object, b: object) => canonical(a) === canonical(b);

// Replaces local data with the account's, keeping any changes still waiting to upload
async function pull() {
  const user = getAuthUser();
  if (!supabase || !user) return;

  const [sessionsResult, upcomingsResult, userResult] = await Promise.all([
    supabase.from('sessions').select('*').eq('user_id', user.id),
    supabase.from('upcomings').select('*').eq('user_id', user.id),
    supabase.from('users').select('weekly_goal_minutes').eq('id', user.id).maybeSingle(),
  ]);
  const remoteSessions = (check(sessionsResult).data as SessionRow[]).map(rowToSession);
  const remoteUpcomings = (check(upcomingsResult).data as UpcomingRow[]).map(rowToUpcoming);
  const remoteGoal = check(userResult).data?.weekly_goal_minutes as number | undefined;

  // Read pending changes and local data only now, after the network round trip
  const pending = queue.get();
  const pendingFor = (table: Table) =>
    new Map(pending.filter((e) => e.table === table).map((e) => [e.id, e.op]));

  function merge<T extends { id: string }>(table: Table, remote: T[], local: T[]) {
    const ops = pendingFor(table);
    const localById = new Map(local.map((item) => [item.id, item]));
    // Unchanged records keep their local object, so screens don't redraw for nothing
    const merged = remote
      .filter((item) => !ops.has(item.id))
      .map((item) => {
        const mine = localById.get(item.id);
        return mine && sameRecord(mine, item) ? mine : item;
      });
    for (const [id, op] of ops) {
      const mine = localById.get(id);
      if (op === 'upsert' && mine) merged.push(mine);
    }
    const unchanged =
      merged.length === local.length && merged.every((item) => localById.get(item.id) === item);
    return unchanged ? local : merged;
  }

  const sessions = merge('sessions', remoteSessions, getSessions());
  const upcomings = merge('upcomings', remoteUpcomings, getUpcomings());

  applyRemote(() => {
    if (sessions !== getSessions()) replaceSessions(sessions);
    if (upcomings !== getUpcomings()) replaceUpcomings(upcomings);
    if (remoteGoal && !pendingFor('users').has(GOAL_ID) && remoteGoal !== getWeeklyGoal()) {
      setWeeklyGoal(remoteGoal);
    }
  });
}

// Pushes local changes; failures just wait for the next sync
function pushChanges() {
  return serial(flush).catch(() => setStatus({ state: 'error' }));
}

// Full round trip. Resolves true when everything reached the cloud.
export function syncNow() {
  if (!supabase || !getAuthUser()) return Promise.resolve(false);
  setStatus({ state: 'syncing' });
  return serial(async () => {
    await flush();
    await pull();
  }).then(
    () => {
      setStatus({ state: 'idle', lastSyncedAt: Date.now() });
      return true;
    },
    (error) => {
      console.warn('Harmony sync failed', error);
      setStatus({ state: 'error' });
      return false;
    }
  );
}

// ---- Login and logout ----

let goalBeforeLogin: number | null = null;

// Call right before verifying the code: queues everything on this device for upload,
// so no pull can drop it, and remembers the goal in case this is a brand-new account.
export function prepareLogin() {
  enqueue([
    ...getSessions().map((s): QueueEntry => ({ table: 'sessions', id: s.id, op: 'upsert' })),
    ...getUpcomings().map((u): QueueEntry => ({ table: 'upcomings', id: u.id, op: 'upsert' })),
  ]);
  goalBeforeLogin = getWeeklyGoal();
}

// After a successful login: merges this device's data into the account
export async function finishLogin() {
  const user = getAuthUser();
  if (supabase && user && goalBeforeLogin !== null) {
    try {
      // A new account has no study data yet, so this device's goal becomes the account's.
      // Otherwise the account's goal wins.
      const [sessions, upcomings] = await Promise.all([
        supabase.from('sessions').select('id', { count: 'exact', head: true }),
        supabase.from('upcomings').select('id', { count: 'exact', head: true }),
      ]);
      if (!check(sessions).count && !check(upcomings).count) {
        enqueue([{ table: 'users', id: GOAL_ID, op: 'upsert' }]);
      }
    } catch {
      // Offline: keep the account's goal, which the next pull brings in
    }
  }
  goalBeforeLogin = null;
  return syncNow();
}

// Tries a last upload; resolves how many changes still haven't reached the cloud
export async function flushBeforeLogout() {
  await serial(flush).catch(() => {});
  return pendingChangeCount();
}

// Signs out and clears this device, since the data is kept in the account
export async function logOutAndClear() {
  await signOut();
  applyRemote(() => {
    replaceSessions([]);
    replaceUpcomings([]);
    setWeeklyGoal(DEFAULT_WEEKLY_GOAL_MINUTES);
  });
  queue.set([]);
  setStatus({ state: 'idle', lastSyncedAt: null });
}

// ---- Automatic syncing ----

// A session saved from an earlier launch syncs once restored, and again whenever the app comes back
supabase?.auth.onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION' && session) {
    // Let auth.ts record the user before syncing
    setTimeout(() => void syncNow(), 0);
  }
});

if (typeof localStorage !== 'undefined') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active' && getAuthUser()) void syncNow();
  });
}

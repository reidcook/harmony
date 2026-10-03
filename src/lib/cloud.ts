import { getAuthUser } from '@/lib/auth';
import type { StudySession } from '@/lib/study-sessions';
import { supabase } from '@/lib/supabase';
import type { Upcoming, UpcomingType } from '@/lib/upcomings';

// Supabase reads and writes. While logged in, every save goes here first and only reaches
// local storage if it succeeds. Each write does nothing when logged out, and throws on failure.

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

function check<T extends { error: unknown }>(result: T) {
  if (result.error) throw result.error;
  return result;
}

// Bumped when a save starts and ends, so a download that overlapped one is thrown away
// instead of undoing it
let writeCount = 0;
export const getCloudWriteCount = () => writeCount;

type Db = NonNullable<typeof supabase>;

// Runs a write when logged in; does nothing when local-only
async function write(send: (db: Db, userId: string) => PromiseLike<{ error: unknown }>) {
  const user = getAuthUser();
  if (!supabase || !user) return;
  writeCount++;
  try {
    check(await send(supabase, user.id));
  } finally {
    writeCount++;
  }
}

export async function saveSessionsToCloud(sessions: StudySession[]) {
  if (sessions.length === 0) return;
  await write((db, userId) =>
    db.from('sessions').upsert(
      sessions.map((s) => sessionToRow(s, userId)),
      { onConflict: 'user_id,id' }
    )
  );
}

export async function deleteSessionFromCloud(id: string) {
  await write((db, userId) => db.from('sessions').delete().eq('user_id', userId).eq('id', id));
}

export async function saveUpcomingsToCloud(upcomings: Upcoming[]) {
  if (upcomings.length === 0) return;
  await write((db, userId) =>
    db.from('upcomings').upsert(
      upcomings.map((u) => upcomingToRow(u, userId)),
      { onConflict: 'user_id,id' }
    )
  );
}

export async function deleteUpcomingFromCloud(id: string) {
  await write((db, userId) => db.from('upcomings').delete().eq('user_id', userId).eq('id', id));
}

export async function saveGoalToCloud(minutes: number) {
  await write((db, userId) =>
    db.from('users').update({ weekly_goal_minutes: minutes }).eq('id', userId)
  );
}

// Everything in the account; null when logged out
export async function fetchAccountData() {
  const user = getAuthUser();
  if (!supabase || !user) return null;
  const [sessions, upcomings, profile] = await Promise.all([
    supabase.from('sessions').select('*').eq('user_id', user.id),
    supabase.from('upcomings').select('*').eq('user_id', user.id),
    supabase.from('users').select('weekly_goal_minutes').eq('id', user.id).maybeSingle(),
  ]);
  return {
    sessions: (check(sessions).data as SessionRow[]).map(rowToSession),
    upcomings: (check(upcomings).data as UpcomingRow[]).map(rowToUpcoming),
    goal: check(profile).data?.weekly_goal_minutes as number | undefined,
  };
}

// A message to show when a save, login, or code check fails
export function describeError(error: unknown) {
  const { message = '', code = '' } = (error ?? {}) as { message?: string; code?: string };
  if (code === 'otp_expired' || /token|otp/i.test(message)) {
    return 'That code is wrong or has expired. Try again or send a new one.';
  }
  if (/network|fetch/i.test(message)) return 'Couldn’t connect. Check your internet and try again.';
  return message || 'Something went wrong. Please try again.';
}

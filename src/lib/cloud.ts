import { getAuthUser } from '@/lib/auth';
import type { ClinicalLocation, ClinicalLocationType } from '@/lib/clinical-locations';
import type { Clinical } from '@/lib/clinicals';
import type { Reward, RewardKind } from '@/lib/rewards';
import type { StudySession } from '@/lib/study-sessions';
import { supabase } from '@/lib/supabase';
import type { Upcoming, UpcomingType } from '@/lib/upcomings';
import type { Equipped, Purchase } from '@/lib/wardrobe';

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

type ClinicalLocationRow = {
  user_id: string;
  id: string;
  // The table also has a description column, which the app doesn't use
  name: string;
  type: ClinicalLocationType | null;
  created_at: string;
};

type ClinicalRow = {
  user_id: string;
  id: string;
  date: string;
  location_id: string;
  minutes: number | null;
  description: string;
  created_at: string;
};

type RewardRow = {
  user_id: string;
  id: string;
  kind: RewardKind;
  date: string;
  points: number;
  goal: number | null;
  earned_at: string;
};

type PurchaseRow = {
  user_id: string;
  item_id: string;
  price: number;
  purchased_at: string;
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

const clinicalLocationToRow = (l: ClinicalLocation, userId: string): ClinicalLocationRow => ({
  user_id: userId,
  id: l.id,
  name: l.name,
  type: l.type,
  created_at: new Date(l.createdAt).toISOString(),
});

const rowToClinicalLocation = (r: ClinicalLocationRow): ClinicalLocation => ({
  id: r.id,
  name: r.name,
  type: r.type,
  createdAt: Date.parse(r.created_at),
});

const clinicalToRow = (c: Clinical, userId: string): ClinicalRow => ({
  user_id: userId,
  id: c.id,
  date: c.date,
  location_id: c.locationId,
  minutes: c.minutes,
  description: c.description,
  created_at: new Date(c.createdAt).toISOString(),
});

const rowToClinical = (r: ClinicalRow): Clinical => ({
  id: r.id,
  date: r.date,
  locationId: r.location_id,
  minutes: r.minutes,
  description: r.description,
  createdAt: Date.parse(r.created_at),
});

const rewardToRow = (r: Reward, userId: string): RewardRow => ({
  user_id: userId,
  id: r.id,
  kind: r.kind,
  date: r.date,
  points: r.points,
  goal: r.goal ?? null,
  earned_at: new Date(r.earnedAt).toISOString(),
});

const rowToReward = (r: RewardRow): Reward => ({
  id: r.id,
  kind: r.kind,
  date: r.date,
  points: r.points,
  ...(r.goal === null ? {} : { goal: r.goal }),
  earnedAt: Date.parse(r.earned_at),
});

const purchaseToRow = (p: Purchase, userId: string): PurchaseRow => ({
  user_id: userId,
  item_id: p.itemId,
  price: p.price,
  purchased_at: new Date(p.purchasedAt).toISOString(),
});

const rowToPurchase = (r: PurchaseRow): Purchase => ({
  itemId: r.item_id,
  price: r.price,
  purchasedAt: Date.parse(r.purchased_at),
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

export async function saveClinicalLocationsToCloud(locations: ClinicalLocation[]) {
  if (locations.length === 0) return;
  await write((db, userId) =>
    db.from('clinical_locations').upsert(
      locations.map((l) => clinicalLocationToRow(l, userId)),
      { onConflict: 'user_id,id' }
    )
  );
}

export async function deleteClinicalLocationFromCloud(id: string) {
  await write((db, userId) =>
    db.from('clinical_locations').delete().eq('user_id', userId).eq('id', id)
  );
}

// Their locations must already be saved
export async function saveClinicalsToCloud(clinicals: Clinical[]) {
  if (clinicals.length === 0) return;
  await write((db, userId) =>
    db.from('clinicals').upsert(
      clinicals.map((c) => clinicalToRow(c, userId)),
      { onConflict: 'user_id,id' }
    )
  );
}

export async function deleteClinicalFromCloud(id: string) {
  await write((db, userId) => db.from('clinicals').delete().eq('user_id', userId).eq('id', id));
}

export async function saveGoalToCloud(minutes: number) {
  await write((db, userId) =>
    db.from('users').update({ weekly_goal_minutes: minutes }).eq('id', userId)
  );
}

// Rewards and purchases are only ever added; one already in the account is left as it is

export async function saveRewardsToCloud(rewards: Reward[]) {
  if (rewards.length === 0) return;
  await write((db, userId) =>
    db.from('rewards').upsert(
      rewards.map((r) => rewardToRow(r, userId)),
      { onConflict: 'user_id,id', ignoreDuplicates: true }
    )
  );
}

export async function savePurchasesToCloud(purchases: Purchase[]) {
  if (purchases.length === 0) return;
  await write((db, userId) =>
    db.from('purchases').upsert(
      purchases.map((p) => purchaseToRow(p, userId)),
      { onConflict: 'user_id,item_id', ignoreDuplicates: true }
    )
  );
}

export async function saveEquippedToCloud(equipped: Equipped) {
  await write((db, userId) => db.from('users').update({ equipped }).eq('id', userId));
}

// Everything in the account; null when logged out
export async function fetchAccountData() {
  const user = getAuthUser();
  if (!supabase || !user) return null;
  const [sessions, upcomings, clinicalLocations, clinicals, rewards, purchases, profile] =
    await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', user.id),
      supabase.from('upcomings').select('*').eq('user_id', user.id),
      supabase.from('clinical_locations').select('*').eq('user_id', user.id),
      supabase.from('clinicals').select('*').eq('user_id', user.id),
      supabase.from('rewards').select('*').eq('user_id', user.id),
      supabase.from('purchases').select('*').eq('user_id', user.id),
      supabase.from('users').select('weekly_goal_minutes, equipped').eq('id', user.id).maybeSingle(),
    ]);
  return {
    sessions: (check(sessions).data as SessionRow[]).map(rowToSession),
    upcomings: (check(upcomings).data as UpcomingRow[]).map(rowToUpcoming),
    clinicalLocations: (check(clinicalLocations).data as ClinicalLocationRow[]).map(
      rowToClinicalLocation
    ),
    clinicals: (check(clinicals).data as ClinicalRow[]).map(rowToClinical),
    rewards: (check(rewards).data as RewardRow[]).map(rowToReward),
    purchases: (check(purchases).data as PurchaseRow[]).map(rowToPurchase),
    goal: check(profile).data?.weekly_goal_minutes as number | undefined,
    equipped: (check(profile).data?.equipped ?? {}) as Equipped,
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

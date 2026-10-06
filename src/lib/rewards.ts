import {
  MAX_STREAK_BONUS,
  MIN_REWARD_GOAL_MINUTES,
  STREAK_BONUS_POINTS,
  STRONG_DAY_MINUTES,
  STRONG_DAY_POINTS,
  WEEK_GOAL_POINTS,
} from '@/constants/rewards';
import { saveRewardsToCloud } from '@/lib/cloud';
import { createPersistedStore } from '@/lib/persisted-store';
import {
  addDays,
  getSessions,
  getWeekDates,
  MAX_DAYS_BACK,
  minutesByDate,
  toDateKey,
  weekMinutes,
  type StudySession,
} from '@/lib/study-sessions';
import { getWeeklyGoal } from '@/lib/weekly-goal';

// The ledger of earned hearts. A reward is recorded the moment it's earned and never taken
// back, even if a session is later deleted or the goal changes.

export type RewardKind = 'day' | 'week';

export type Reward = {
  id: string; // `${kind}:${date}`, so the same reward is never recorded twice, even across devices
  kind: RewardKind;
  date: string; // the day, or the Monday of the week
  points: number;
  goal?: number; // the weekly goal when a 'week' reward was earned
  earnedAt: number;
};

export const EMPTY_REWARDS: Reward[] = [];

const store = createPersistedStore('harmony.rewards', EMPTY_REWARDS);

export const subscribeRewards = store.subscribe;
export const getRewards = store.get;
// For loading from the account and logout. Not saved to the cloud.
export const replaceRewards = store.set;

// Rewards earned on this device that Harmony hasn't celebrated yet
const pendingStore = createPersistedStore('harmony.pendingRewards', EMPTY_REWARDS);

export const subscribePendingRewards = pendingStore.subscribe;
export const getPendingRewards = pendingStore.get;
export const clearPendingRewards = () => pendingStore.set(EMPTY_REWARDS);

export function totalPoints(rewards: Reward[]) {
  return rewards.reduce((sum, r) => sum + r.points, 0);
}

const rewardId = (kind: RewardKind, date: string) => `${kind}:${date}`;

// The rewards these sessions have earned that aren't in the ledger yet. Only days that can
// still change (today and MAX_DAYS_BACK before) and their weeks are checked, so older
// history never earns.
export function checkForRewards(
  sessions: StudySession[],
  todayKey: string,
  goal: number,
  ledger: Reward[],
  now = Date.now()
) {
  const totals = minutesByDate(sessions);
  const have = new Set(ledger.map((r) => r.id));
  const found: Reward[] = [];
  const add = (reward: Omit<Reward, 'id' | 'earnedAt'>) => {
    const id = rewardId(reward.kind, reward.date);
    if (have.has(id)) return;
    have.add(id);
    found.push({ ...reward, id, earnedAt: now });
  };

  // Oldest first, so a week's streak bonus can count the week just before it
  const days = Array.from({ length: MAX_DAYS_BACK + 1 }, (_, i) =>
    addDays(todayKey, i - MAX_DAYS_BACK)
  );

  // Loops through days and awards daily awards
  for (const day of days) {
    if ((totals.get(day) ?? 0) >= STRONG_DAY_MINUTES) {
      add({ kind: 'day', date: day, points: STRONG_DAY_POINTS });
    }
  }

  // 
  const mondays = [...new Set(days.map((day) => getWeekDates(day)[0]))];
  for (const monday of mondays) {
    if (goal >= MIN_REWARD_GOAL_MINUTES && weekMinutes(totals, monday) >= goal) {
      let streak = 0;
      while (have.has(rewardId('week', addDays(monday, -7 * (streak + 1))))) streak++;
      const bonus = Math.min(streak * STREAK_BONUS_POINTS, MAX_STREAK_BONUS);
      add({ kind: 'week', date: monday, points: WEEK_GOAL_POINTS + bonus, goal });
    }
  }

  return found;
}

// Records anything newly earned. Saves to the account first (while logged in), like every
// other change. Runs one at a time so overlapping calls can't record a reward twice.
let queue = Promise.resolve();

export function awardRewards() {
  queue = queue.then(async () => {
    const earned = checkForRewards(
      getSessions(),
      toDateKey(new Date()),
      getWeeklyGoal(),
      getRewards()
    );
    if (earned.length === 0) return;
    try {
      await saveRewardsToCloud(earned);
    } catch (error) {
      // Nothing is recorded, so the next check tries again
      console.warn('Harmony couldn’t save your rewards', error);
      return;
    }
    store.set([...getRewards(), ...earned]);
    pendingStore.set([...getPendingRewards(), ...earned]);
  });
  return queue;
}

export function describeReward(reward: Reward) {
  switch (reward.kind) {
    case 'day':
      return 'An hour or more of study in a day';
    case 'week':
      return reward.points > WEEK_GOAL_POINTS
        ? `Met your weekly goal (+${reward.points - WEEK_GOAL_POINTS} streak bonus)`
        : 'Met your weekly goal';
  }
}

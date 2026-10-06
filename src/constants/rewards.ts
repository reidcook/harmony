// How hearts (the shop currency) are earned. Every reward is a flat amount for a yes/no
// condition, at most once per day or week, so logging more hours never earns more.

// A day with at least this much study earns a strong-day reward (the deep-pink heart)
export const STRONG_DAY_MINUTES = 60;
export const STRONG_DAY_POINTS = 5;

// Meeting the weekly goal. Goals below the minimum don't earn, so a tiny goal can't farm it.
export const WEEK_GOAL_POINTS = 50;
export const MIN_REWARD_GOAL_MINUTES = 180;

// Added to the weekly goal reward for each earned week right before it, up to the cap
export const STREAK_BONUS_POINTS = 10;
export const MAX_STREAK_BONUS = 50;

export function formatHearts(points: number) {
  return `${points} ${points === 1 ? 'heart' : 'hearts'}`;
}

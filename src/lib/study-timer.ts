import { createPersistedStore } from '@/lib/persisted-store';

// A stopwatch for a study session in progress. It's saved as timestamps, so it keeps counting
// while the app is closed. Time from earlier runs is banked when paused. Only kept on this device.
export type StudyTimer = {
  bankedMs: number;
  // When the current run started, or null while paused or not started
  runningSince: number | null;
};

export const IDLE_TIMER: StudyTimer = { bankedMs: 0, runningSince: null };

const store = createPersistedStore<StudyTimer>('harmony.timer', IDLE_TIMER);

export const subscribeTimer = store.subscribe;
export const getTimer = store.get;

export function timerElapsedMs(timer: StudyTimer, now: number) {
  if (timer.runningSince === null) return timer.bankedMs;
  return timer.bankedMs + Math.max(0, now - timer.runningSince);
}

export function isTimerStarted(timer: StudyTimer) {
  return timer.runningSince !== null || timer.bankedMs > 0;
}

// Starts, or resumes after a pause
export function startTimer() {
  const timer = store.get();
  if (timer.runningSince !== null) return;
  store.set({ ...timer, runningSince: Date.now() });
}

export function pauseTimer() {
  const timer = store.get();
  if (timer.runningSince === null) return;
  store.set({ bankedMs: timerElapsedMs(timer, Date.now()), runningSince: null });
}

// Throws away the time so far
export function resetTimer() {
  store.set(IDLE_TIMER);
}

// Whole minutes to log, at least 1
export function timerMinutes(ms: number) {
  return Math.max(1, Math.round(ms / 60_000));
}

// 4:05 under an hour, 1:04:05 after
export function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}

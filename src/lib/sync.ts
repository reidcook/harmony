import { AppState } from 'react-native';

import { DEFAULT_WEEKLY_GOAL_MINUTES } from '@/constants/goal';
import { getAuthUser, signOut, verifyCode } from '@/lib/auth';
import {
  fetchAccountData,
  getCloudWriteCount,
  saveGoalToCloud,
  saveSessionsToCloud,
  saveUpcomingsToCloud,
} from '@/lib/cloud';
import { getSessions, replaceSessions } from '@/lib/study-sessions';
import { supabase } from '@/lib/supabase';
import { getUpcomings, replaceUpcomings } from '@/lib/upcomings';
import { getWeeklyGoal, replaceWeeklyGoal } from '@/lib/weekly-goal';

// While logged in, the account is the real data and local storage is a copy the app reads,
// so it opens instantly and can still be looked at offline. Saves go to the account first
// (see cloud.ts), so the two never drift apart; this just downloads the account on launch,
// on return to the app, and after login.

// Replaces this phone's copy with the account's. Keeps the copy if the download fails.
export async function refreshFromCloud() {
  const writesBefore = getCloudWriteCount();
  try {
    const data = await fetchAccountData();
    // A save during the download may be missing from it; the next refresh will include it
    if (!data || getCloudWriteCount() !== writesBefore) return;
    replaceSessions(data.sessions);
    replaceUpcomings(data.upcomings);
    if (data.goal) replaceWeeklyGoal(data.goal);
  } catch (error) {
    console.warn('Harmony couldn’t load your account', error);
  }
}

// Logs in and uploads everything on this phone to the account, then loads the account.
// If the upload fails, it logs back out, so nothing on this phone gets replaced and lost.
export async function logIn(email: string, code: string) {
  await verifyCode(email, code);
  try {
    const data = await fetchAccountData();
    await saveSessionsToCloud(getSessions());
    await saveUpcomingsToCloud(getUpcomings());
    // A brand-new account takes this phone's goal; an existing one keeps its own
    if (data && data.sessions.length === 0 && data.upcomings.length === 0) {
      await saveGoalToCloud(getWeeklyGoal());
    }
  } catch (error) {
    await signOut();
    throw error;
  }
  await refreshFromCloud();
}

// Signs out and clears this phone, since everything is already in the account
export async function logOutAndClear() {
  await signOut();
  replaceSessions([]);
  replaceUpcomings([]);
  replaceWeeklyGoal(DEFAULT_WEEKLY_GOAL_MINUTES);
}

// A login saved from an earlier launch loads once restored, and again whenever the app comes back
supabase?.auth.onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION' && session) {
    // Let auth.ts record the user before loading
    setTimeout(() => void refreshFromCloud(), 0);
  }
});

if (typeof localStorage !== 'undefined') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active' && getAuthUser()) void refreshFromCloud();
  });
}

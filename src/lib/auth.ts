import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export type AuthUser = Pick<User, 'id' | 'email'>;

const listeners = new Set<() => void>();
let current: AuthUser | null = null;

function setCurrent(user: User | null) {
  const next = user ? { id: user.id, email: user.email } : null;
  if (next?.id === current?.id && next?.email === current?.email) return;
  current = next;
  listeners.forEach((listener) => listener());
}

// Fires once at startup with the saved session (if any), then on every login/logout
supabase?.auth.onAuthStateChange((_event, session) => setCurrent(session?.user ?? null));

export function subscribeAuth(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAuthUser() {
  return current;
}

function client() {
  if (!supabase) throw new Error('Backup isn’t set up in this build.');
  return supabase;
}

// Emails a 6-digit code, creating the account on first use
export async function sendCode(email: string) {
  const { error } = await client().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyCode(email: string, code: string) {
  const { data, error } = await client().auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
  if (!data.user) throw new Error('That code didn’t work.');
  setCurrent(data.user);
  return data.user;
}

export async function signOut() {
  // Local scope clears this device's session even when offline
  await client().auth.signOut({ scope: 'local' });
  setCurrent(null);
}

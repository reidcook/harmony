import { createPersistedStore } from '@/lib/persisted-store';
import { supabase } from '@/lib/supabase';

const store = createPersistedStore('harmony.welcomeSeen', false);

export const subscribeWelcome = store.subscribe;

export function markWelcomeSeen() {
  if (!store.get()) store.set(true);
}

// The first-launch backup offer only makes sense when Supabase is configured
export function getShouldWelcome() {
  return !!supabase && !store.get();
}

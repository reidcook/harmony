import '@/lib/install-local-storage';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// No storage during the static web render, so nothing is persisted there
const hasStorage = typeof localStorage !== 'undefined';

// null when .env.local has no Supabase keys; the app then stays local-only
export const supabase =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          storage: hasStorage ? localStorage : undefined,
          autoRefreshToken: hasStorage,
          persistSession: hasStorage,
          // Phones have no URL to read a session from
          detectSessionInUrl: false,
        },
      })
    : null;

// The refresh loop only needs to run while the app is on screen
if (supabase && hasStorage) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

import '@/lib/install-local-storage';

// A JSON value kept in localStorage, cached in memory, and observable for useSyncExternalStore.
// get() returns the same reference until set() is called. `migrate` upgrades older saved shapes on load.

// Returns a subscription that adds the caller to a list of listeners
// A get which pulls all items back from the cache
// A set which sets the local storage, and calls the functions stored in the listeners list
export function createPersistedStore<T>(
  key: string,
  fallback: T,
  migrate: (stored: T) => T = (stored) => stored
) {
  const listeners = new Set<() => void>();
  let cache: { value: T } | null = null;

  function load(): T {
    // No storage during the static web render
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : migrate(JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get(): T {
      cache ??= { value: load() };
      return cache.value;
    },
    set(value: T) {
      cache = { value };
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value));
      listeners.forEach((listener) => listener());
    },
  };
}

export function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

@AGENTS.md

## Harmony project notes

Harmony is a study-goal tracker for nursing students. Harmony, a pink nurse-heart at `assets/harmony/heartprogress.png`, encourages the user and shows their study streak and progress toward today's goal.

### Current state
- `src/app/index.tsx` is the home screen. It shows the mascot, an encouragement bubble, two stat cards (streak, daily goal), a week row of hearts (`WeekHearts`), and a bottom-right "+" button that opens `src/app/add-session.tsx`.
- `src/app/day/[date].tsx` lists one day's sessions. `index` opens it when a heart is tapped. `_layout.tsx` presents both the add and day screens as modals.
- Study sessions live in `src/lib/study-sessions.ts`, a small external store saved to `localStorage` under `harmony.sessions`. Read them with `useStudySessions()` / `useToday()` from `src/hooks/use-study-sessions.ts`.
- On native, `localStorage` comes from the `expo-sqlite/localStorage/install` polyfill, imported only in `src/lib/install-local-storage.ts`. The `.web.ts` twin is empty because importing expo-sqlite on web breaks bundling ("Worker chunk not found").
- The daily goal is saved in `localStorage` under `harmony.dailyGoalMinutes` by `src/lib/daily-goal.ts`, and the default is `DEFAULT_DAILY_GOAL_MINUTES`. Read it with `useDailyGoal()`. Tapping the goal card opens `src/app/goal.tsx` to change it. The streak counts consecutive days with at least one session, whether or not the goal was met. Not having studied yet today doesn't break it. The hearts are what show whether the goal was met.

### Conventions
- Colors come from `Colors` in `src/constants/theme.ts`. The palette is soft pinks taken from the mascot, and there is no dark mode yet.
- Reusable UI lives in `src/components/` (kebab-case filenames, named exports). Import it with the `@/` alias.
- Web uses static rendering (`web.output: "static"`), so random or client-only values must not differ between the server render and hydration. Use `useSyncExternalStore` with a fixed server snapshot, as `src/hooks/use-encouragement.ts` does, not `useEffect` + `setState`.
- Use `npx`, not `bunx`, because the project uses npm (`package-lock.json`).

### Environment gotchas
- The system Node is v18, which is too old for the Expo CLI (`configs.toReversed is not a function`). Put nvm's Node 24 first on PATH: `export PATH=~/.nvm/versions/node/v24.21.0/bin:$PATH`.
- `example/` is the gitignored output of the old starter template. It fails `npx tsc --noEmit` because its imports resolve against `src/`. Ignore errors from it.

@AGENTS.md

## Harmony project notes

Harmony is a study-goal tracker for nursing students. Harmony, a pink nurse-heart at `assets/harmony/heartprogress.png`, encourages the user and shows their study streak and progress toward this week's goal.

### Current state
- `src/app/index.tsx` is the home screen. It shows the mascot, an encouragement bubble, two stat cards (week streak, and `WeeklyGoalCard`, a `ProgressRing` with the percentage and hours inside), a week row of hearts (`WeekHearts`), the 3 soonest upcomings (`UpcomingsCard`), a line chart of hours per month this year (`MonthlyHoursChart`, drawn with `react-native-svg`), and a bottom-right "+" button that opens `src/app/add-session.tsx`.
- `src/app/day/[date].tsx` lists one day's sessions, and `src/app/calendar.tsx` shows a month of hearts plus that month's sessions, newest first. `_layout.tsx` presents every non-home screen as a modal.
- All persisted data goes through `createPersistedStore(key, fallback)` in `src/lib/persisted-store.ts`, which gives a cached JSON value in `localStorage` that `useSyncExternalStore` can subscribe to. Build new stores on it.
- Study sessions live in `src/lib/study-sessions.ts` (key `harmony.sessions`). Read them with `useStudySessions()` / `useToday()` from `src/hooks/use-study-sessions.ts`.
- Upcomings are quizzes, exams, and finals with a date. They live in `src/lib/upcomings.ts` (key `harmony.upcomings`) and are read with `useUpcomings()`. A session links to any number of upcomings through `upcomingIds`. Older saves with a single `upcomingId` are converted on load by `migrateSession`, using the `migrate` option of `createPersistedStore`. Deleting an upcoming unlinks its sessions but keeps them. `src/app/add-upcoming.tsx` creates or edits an upcoming (`?id=`). `src/app/upcoming/[id].tsx` shows an upcoming's linked sessions and their total time. Tapping the home `UpcomingsCard` opens `src/app/upcomings.tsx`, which lists every upcoming ("Coming up" soonest first, then "Past" newest first). Both use the shared `UpcomingRow`.
- Accounts and backup through Supabase are optional. Without `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, `supabase` (`src/lib/supabase.ts`) is null and the app is local-only.
  - **Login** is by emailed code (`src/lib/auth.ts`, `src/app/sign-in.tsx`). On first launch, `index.tsx` opens `/sign-in?welcome=1` once, and that screen has Skip. The top-left `AccountButton` opens `src/app/account.tsx` (log in / log out).
  - **Saving** (`src/lib/cloud.ts`): while logged in, the account is the real data. Mutations (`addSession`, `updateUpcoming`, `setWeeklyGoal`, …) are async. They write to Supabase first and update the local store only if that succeeds, so a failed save changes nothing and the screen shows `describeError(e)`. Logged out, the cloud helpers do nothing. `replaceSessions` / `replaceUpcomings` / `replaceWeeklyGoal` write locally only, for loading and logout.
  - **Loading** (`src/lib/sync.ts`): the local stores are what the UI reads. `refreshFromCloud()` replaces them with the account's data on launch, on foreground, and after login. It discards a download that overlapped a save.
  - **Login** (`logIn`) uploads everything on this device to the account. If that fails, it signs back out. **Logout** clears local data.
  - **Schema**: `supabase/migrations/0001_init.sql`, with tables `users` (`weekly_goal_minutes`), `sessions`, and `upcomings`, keyed by `(user_id, id)` with the app's text ids, and RLS on. Row mapping lives in `sync.ts`. New synced data needs a column there as well as in the local type.
- On native, `localStorage` comes from the `expo-sqlite/localStorage/install` polyfill, imported only in `src/lib/install-local-storage.ts`. The `.web.ts` twin is empty because importing expo-sqlite on web breaks bundling ("Worker chunk not found").
- There is only a weekly goal (no daily goal). It is saved in `localStorage` under `harmony.weeklyGoalMinutes` by `src/lib/weekly-goal.ts`, and the default is `DEFAULT_WEEKLY_GOAL_MINUTES`. Read it with `useWeeklyGoal()`. Tapping the goal card opens `src/app/goal.tsx` to change it. Weeks run Monday to Sunday (`getWeekDates`, `weekMinutes`). The streak (`computeWeekStreak`) counts consecutive weeks that met the goal. The current week doesn't break it until it's over.
- Sessions can only be added, edited, or deleted on today or the `MAX_DAYS_BACK` (2) days before (`canChangeSessionOn` in `study-sessions.ts`). Older sessions show in lists but can't be tapped, and `add-session.tsx` disables Save/Delete for them.
- Hearts (`DayHeart`) don't depend on the goal. They're pale for no study, `accent` pink for under 1 hour, and `heartStrong` (deeper and about 15% larger, in a fixed slot) for 1 hour or more.

### Conventions
- Colors come from `Colors` in `src/constants/theme.ts`. The palette is soft pinks taken from the mascot, and there is no dark mode yet.
- Reusable UI lives in `src/components/` (kebab-case filenames, named exports). Import it with the `@/` alias.
- Web uses static rendering (`web.output: "static"`), so random or client-only values must not differ between the server render and hydration. Use `useSyncExternalStore` with a fixed server snapshot, as `src/hooks/use-encouragement.ts` does, not `useEffect` + `setState`.
- Use `npx`, not `bunx`, because the project uses npm (`package-lock.json`).

### Environment gotchas
- The system Node is v18, which is too old for the Expo CLI (`configs.toReversed is not a function`). Put nvm's Node 24 first on PATH: `export PATH=~/.nvm/versions/node/v24.21.0/bin:$PATH`.
- `example/` is the gitignored output of the old starter template. It fails `npx tsc --noEmit` because its imports resolve against `src/`. Ignore errors from it.

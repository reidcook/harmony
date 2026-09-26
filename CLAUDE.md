@AGENTS.md

## Harmony project notes

Harmony is a study-goal tracker for nursing students. Harmony, a pink nurse-heart at `assets/harmony/heartprogress.png`, encourages the user and shows their study streak and progress toward today's goal.

### Current state
- The only screen is `src/app/index.tsx`. It shows the mascot, an encouragement bubble, and two side-by-side stat cards (streak, daily goal).
- The streak and goal values are hard-coded constants at the top of `src/app/index.tsx`. There is no editing, persistence, or backend yet.
- `src/app/_layout.tsx` is a plain `Stack` with `headerShown: false`.

### Conventions
- Colors come from `Colors` in `src/constants/theme.ts`. The palette is soft pinks taken from the mascot, and there is no dark mode yet.
- Reusable UI lives in `src/components/` (kebab-case filenames, named exports). Import it with the `@/` alias.
- Web uses static rendering (`web.output: "static"`), so random or client-only values must not differ between the server render and hydration. Use `useSyncExternalStore` with a fixed server snapshot, as `src/hooks/use-encouragement.ts` does, not `useEffect` + `setState`.
- Use `npx`, not `bunx`, because the project uses npm (`package-lock.json`).

### Environment gotchas
- The system Node is v18, which is too old for the Expo CLI (`configs.toReversed is not a function`). Put nvm's Node 24 first on PATH: `export PATH=~/.nvm/versions/node/v24.21.0/bin:$PATH`.
- `example/` is the gitignored output of the old starter template. It fails `npx tsc --noEmit` because its imports resolve against `src/`. Ignore errors from it.

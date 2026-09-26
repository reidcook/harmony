# Harmony 💕

A study companion for nursing students. Harmony, a pink heart in a nurse's cap, cheers you on and keeps track of your study streak and daily study goals.

Built with [Expo](https://expo.dev) (SDK 57) and [Expo Router](https://docs.expo.dev/router/introduction).

## Progress so far

### Home screen (`src/app/index.tsx`)
- **Harmony** (`assets/harmony/heartprogress.png`) sits at the top of the screen.
- **Encouragement message:** a speech bubble with a random nursing-themed message, chosen once each time the app opens.
- **Stat cards**, side by side:
  - 🔥 **Study streak:** consecutive days studied.
  - 🎯 **Daily goal:** percent of today's study-hour goal, with a progress bar.

> The streak and goal values are **hard-coded** for now (constants at the top of `src/app/index.tsx`). Editing and saving them is not built yet.

### Up next
- Let users set and edit their daily study goal
- Log study sessions and track the streak for real
- Save data between app launches

## Project structure

```
src/
  app/                        # Routes (Expo Router) — every file is a screen
    _layout.tsx               # Root stack, header hidden
    index.tsx                 # Home screen
  components/
    harmony-greeting.tsx      # Mascot + speech bubble
    stat-card.tsx             # White rounded card for a single stat
    progress-bar.tsx          # Track + fill bar (progress 0–1)
  constants/
    theme.ts                  # Color palette
    encouragements.ts         # Harmony's messages
  hooks/
    use-encouragement.ts      # Picks a random message once per launch
assets/harmony/               # Harmony artwork
```

## Get started

Requires **Node.js 20.19.4 or newer** (Node 24 recommended). With nvm, run `nvm use 24`.

```bash
npm install
npx expo start            # or: npx expo start --tunnel
```

Then open the app in [Expo Go](https://expo.dev/go), an emulator/simulator, or the browser (press `w`).

### Checks

```bash
npx expo lint
npx tsc --noEmit
```

## Manual Notes

- Add libraries with `npx expo install <pkg>`, not `npm install`
- `npx expo start --tunnel`

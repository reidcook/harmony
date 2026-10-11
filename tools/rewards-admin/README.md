# Harmony Rewards Admin

A testing tool for editing one account's hearts (`rewards`) and shop `purchases` in Supabase. It isn't part of the app.

Supabase rejects secret keys sent from a browser, so a small local server (`server.mjs`) holds the key and the page talks to that server.

## Use it
1. Add your secret key to `.env.local` (it's gitignored):
   ```
   SUPABASE_SECRET_KEY=sb_secret_...
   ```
   You'll find it in the Supabase dashboard under Project Settings, then API Keys. Leave off the `EXPO_PUBLIC_` prefix so it never ends up in the app bundle. The server also reads `EXPO_PUBLIC_SUPABASE_URL`, which is already there.
2. From the project root, run:
   ```
   export PATH=~/.nvm/versions/node/v24.21.0/bin:$PATH
   node --env-file=.env.local tools/rewards-admin/server.mjs
   ```
3. Open http://localhost:8787, enter your account email, and press **Look up**.

You can then grant hearts, add, edit, or delete rewards and purchases, and clear what Harmony is wearing. The server only listens on localhost. Set `ADMIN_PORT` to change the port.

> ⚠️ The secret key bypasses row-level security and can read and change every user's data. Keep it only in `.env.local`, and never commit it or add the `EXPO_PUBLIC_` prefix.

## How the app picks it up
The app downloads the account on launch and whenever it comes back to the foreground (`refreshFromCloud` in `src/lib/sync.ts`), so close and reopen it (or switch away and back) to see changes.

- Rewards that can still be earned (a 1h+ day today or in the 2 days before, or this week's goal) are earned again right after the refresh if you delete them.
- This only edits the cloud. Data on a device that isn't logged in isn't affected.
- Delete a purchase for an item that's being worn, then press **Clear outfit**.

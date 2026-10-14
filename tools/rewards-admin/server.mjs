// Local server for the rewards admin page. Supabase only accepts the secret key outside a
// browser, so the key stays here and the page calls these routes instead.
//
// Run from the project root:
//   node --env-file=.env.local tools/rewards-admin/server.mjs
// Needs EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (gitignored). Variables
// without the EXPO_PUBLIC_ prefix never reach the app bundle.

import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';

const PORT = Number(process.env.ADMIN_PORT) || 8787;
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. Add them to .env.local and run with\n' +
      '  node --env-file=.env.local tools/rewards-admin/server.mjs'
  );
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

function check({ data, error }) {
  if (error) throw error;
  return data;
}

// Every action is scoped to one user id, sent by the page after a lookup
const actions = {
  async lookup({ email }) {
    const rows = check(
      await db
        .from('users')
        .select('id, email, weekly_goal_minutes, equipped')
        .eq('email', String(email).trim().toLowerCase())
    );
    if (rows.length === 0) throw new Error(`No account with email ${email}.`);
    return rows[0];
  },

  async load({ userId }) {
    const [rewards, purchases, user] = await Promise.all([
      db.from('rewards').select('*').eq('user_id', userId).order('earned_at', { ascending: false }),
      db.from('purchases').select('*').eq('user_id', userId).order('purchased_at', { ascending: false }),
      db.from('users').select('id, email, weekly_goal_minutes, equipped').eq('id', userId).single(),
    ]);
    return { rewards: check(rewards), purchases: check(purchases), user: check(user) };
  },

  async addReward({ userId, id, kind, date, points, goal }) {
    check(
      await db.from('rewards').insert({
        user_id: userId,
        id,
        kind,
        date,
        points,
        goal: goal ?? null,
        earned_at: new Date().toISOString(),
      })
    );
  },

  async updateReward({ userId, id, points, goal }) {
    check(
      await db
        .from('rewards')
        .update({ points, goal: goal ?? null })
        .eq('user_id', userId)
        .eq('id', id)
    );
  },

  async deleteReward({ userId, id }) {
    check(await db.from('rewards').delete().eq('user_id', userId).eq('id', id));
  },

  async deleteAllRewards({ userId }) {
    check(await db.from('rewards').delete().eq('user_id', userId));
  },

  async addPurchase({ userId, itemId, price }) {
    check(
      await db.from('purchases').insert({
        user_id: userId,
        item_id: itemId,
        price,
        purchased_at: new Date().toISOString(),
      })
    );
  },

  async updatePurchase({ userId, itemId, price }) {
    check(
      await db.from('purchases').update({ price }).eq('user_id', userId).eq('item_id', itemId)
    );
  },

  async deletePurchase({ userId, itemId }) {
    check(await db.from('purchases').delete().eq('user_id', userId).eq('item_id', itemId));
  },

  async deleteAllPurchases({ userId }) {
    check(await db.from('purchases').delete().eq('user_id', userId));
  },

  async clearOutfit({ userId }) {
    check(await db.from('users').update({ equipped: {} }).eq('id', userId));
  },
};

const page = new URL('./index.html', import.meta.url);

async function readBody(req) {
  let text = '';
  for await (const chunk of req) text += chunk;
  return text ? JSON.parse(text) : {};
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      return send(res, 200, await readFile(page, 'utf8'), 'text/html; charset=utf-8');
    }
    const match = req.method === 'POST' && req.url?.match(/^\/api\/(\w+)$/);
    const action = match && Object.hasOwn(actions, match[1]) ? actions[match[1]] : null;
    if (!action) return send(res, 404, { error: 'Not found' });
    const body = await readBody(req);
    if (match[1] !== 'lookup' && !body.userId) throw new Error('Look up an account first.');
    send(res, 200, { data: (await action(body)) ?? null });
  } catch (e) {
    send(res, 400, { error: e?.message || String(e) });
  }
});

// Only reachable from this machine
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Harmony rewards admin: http://localhost:${PORT}`);
});

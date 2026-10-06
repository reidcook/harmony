-- Harmony rewards: earned hearts, shop purchases, and what Harmony is wearing.
-- Run once in the Supabase SQL editor, after 0001_init.sql.

-- What Harmony is wearing: slot -> item id
alter table public.users add column equipped jsonb not null default '{}';

-- rewards: the ledger of earned hearts. Ids are `${kind}:${date}`, so each is recorded once.
create table public.rewards (
  user_id uuid not null references public.users (id) on delete cascade,
  id text not null,
  kind text not null check (kind in ('day', 'week')),
  date date not null,
  points integer not null check (points > 0),
  goal integer,
  earned_at timestamptz not null,
  primary key (user_id, id)
);

-- purchases: items bought in the shop, each at most once
create table public.purchases (
  user_id uuid not null references public.users (id) on delete cascade,
  item_id text not null,
  price integer not null check (price >= 0),
  purchased_at timestamptz not null,
  primary key (user_id, item_id)
);

-- Row level security: rewards and purchases are only ever added, never changed or removed
alter table public.rewards enable row level security;
alter table public.purchases enable row level security;

create policy "Users read their own rewards" on public.rewards
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users add their own rewards" on public.rewards
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Users read their own purchases" on public.purchases
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users add their own purchases" on public.purchases
  for insert to authenticated with check (user_id = (select auth.uid()));

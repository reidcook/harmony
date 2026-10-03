-- Harmony cloud backup: one row per account, plus each account's sessions and upcomings.
-- Run once in the Supabase SQL editor.

-- Keeps updated_at current on every update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- users: account-level settings, keyed by the Supabase auth user
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  weekly_goal_minutes integer not null default 600 check (weekly_goal_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Creates the users row the first time someone signs in
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- sessions: ids are the app's own text ids, unique per user
create table public.sessions (
  user_id uuid not null references public.users (id) on delete cascade,
  id text not null,
  date date not null,
  minutes integer not null check (minutes > 0),
  description text not null default '',
  upcoming_ids text[] not null default '{}',
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index sessions_user_date on public.sessions (user_id, date);

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

-- upcomings: quizzes, exams, and finals
create table public.upcomings (
  user_id uuid not null references public.users (id) on delete cascade,
  id text not null,
  type text not null check (type in ('quiz', 'exam', 'final')),
  title text not null,
  date date not null,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create trigger upcomings_set_updated_at
  before update on public.upcomings
  for each row execute function public.set_updated_at();

-- Row level security: everyone only sees and changes their own rows
alter table public.users enable row level security;
alter table public.sessions enable row level security;
alter table public.upcomings enable row level security;

create policy "Users read their own row" on public.users
  for select to authenticated using (id = (select auth.uid()));
create policy "Users update their own row" on public.users
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Users read their own sessions" on public.sessions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users add their own sessions" on public.sessions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users update their own sessions" on public.sessions
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users delete their own sessions" on public.sessions
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Users read their own upcomings" on public.upcomings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users add their own upcomings" on public.upcomings
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users update their own upcomings" on public.upcomings
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users delete their own upcomings" on public.upcomings
  for delete to authenticated using (user_id = (select auth.uid()));

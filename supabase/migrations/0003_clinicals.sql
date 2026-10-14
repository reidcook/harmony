-- Harmony clinicals: each account's clinical locations and the clinical shifts at them.
-- Run once in the Supabase SQL editor, after 0002_rewards.sql.

-- clinical_locations: hospitals, long-term care, and outpatient clinics, per user
create table public.clinical_locations (
  user_id uuid not null references public.users (id) on delete cascade,
  id text not null,
  name text not null,
  description text not null default '',
  type text check (type in ('hospital', 'longTermCare', 'outpatient')),
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create trigger clinical_locations_set_updated_at
  before update on public.clinical_locations
  for each row execute function public.set_updated_at();

-- clinicals: one shift on a date at a location. Minutes are optional.
-- A location can't be deleted while a clinical still points at it.
create table public.clinicals (
  user_id uuid not null references public.users (id) on delete cascade,
  id text not null,
  date date not null,
  location_id text not null,
  minutes integer check (minutes > 0),
  description text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, location_id)
    references public.clinical_locations (user_id, id) on delete restrict
);

create index clinicals_user_date on public.clinicals (user_id, date);

create trigger clinicals_set_updated_at
  before update on public.clinicals
  for each row execute function public.set_updated_at();

-- Row level security: everyone only sees and changes their own rows
alter table public.clinical_locations enable row level security;
alter table public.clinicals enable row level security;

create policy "Users read their own clinical locations" on public.clinical_locations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users add their own clinical locations" on public.clinical_locations
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users update their own clinical locations" on public.clinical_locations
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users delete their own clinical locations" on public.clinical_locations
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Users read their own clinicals" on public.clinicals
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users add their own clinicals" on public.clinicals
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users update their own clinicals" on public.clinicals
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Users delete their own clinicals" on public.clinicals
  for delete to authenticated using (user_id = (select auth.uid()));

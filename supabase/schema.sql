-- ============================================================
-- NORTHBROOK BLUEHAWKS SUMMER TRAINING TRACKER
-- Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── PROFILES TABLE ──────────────────────────────────────────
-- Extends Supabase auth.users with player-specific fields
create table if not exists public.profiles (
  id             uuid        references auth.users(id) on delete cascade primary key,
  name           text        not null,
  jersey_number  int,
  role           text        not null default 'player' check (role in ('player', 'admin')),
  created_at     timestamptz default now()
);

-- ── TRAINING LOGS TABLE ─────────────────────────────────────
-- One row per player per day (upserted on save)
create table if not exists public.training_logs (
  id             uuid        default gen_random_uuid() primary key,
  user_id        uuid        references auth.users(id) on delete cascade not null,
  date           date        not null,
  shots          int         not null default 0,
  stickhandles   int         not null default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now(),
  unique(user_id, date)
);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.training_logs  enable row level security;

-- Profiles: authenticated users can read all profiles
-- (needed for leaderboard / admin views)
create policy "Authenticated users can read all profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Training logs: owners + admins can read; only owner can write
create policy "Logs visible to owner or admin"
  on public.training_logs for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Users can insert their own logs"
  on public.training_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own logs"
  on public.training_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own logs"
  on public.training_logs for delete
  using (auth.uid() = user_id);

-- ── AUTO-CREATE PROFILE ON SIGNUP ───────────────────────────
-- Trigger fires after every new auth.users row is inserted.
-- name / jersey_number / role come from signUp() metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, jersey_number, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'jersey_number', '')::int,
    coalesce(new.raw_user_meta_data->>'role', 'player')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── UPDATED_AT TRIGGER ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_training_logs_updated_at on public.training_logs;
create trigger set_training_logs_updated_at
  before update on public.training_logs
  for each row execute procedure public.set_updated_at();

-- ── MAKE YOURSELF AN ADMIN ──────────────────────────────────
-- After you sign up via the app, run this once in the SQL editor
-- to grant yourself admin access (replace with your email):
--
--   update public.profiles
--   set role = 'admin'
--   where id = (
--     select id from auth.users where email = 'your@email.com'
--   );

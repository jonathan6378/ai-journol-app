-- =====================================================================
-- MindMirror — Supabase Schema
-- =====================================================================
-- Run this in the Supabase SQL editor (or psql).
-- Idempotent: safe to re-run.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles : 1-1 with auth.users
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  avatar_url      text,
  is_premium      boolean not null default false,
  premium_until   timestamptz,
  streak_count    integer not null default 0,
  last_entry_at   timestamptz,
  timezone        text,
  created_at      timestamptz not null default now()
);

-- Auto-create a profile when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- journal_entries
-- ---------------------------------------------------------------------
create table if not exists public.journal_entries (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  body            text not null default '',
  mood            text check (mood in (
                    'radiant','happy','calm','neutral',
                    'tired','anxious','sad','overwhelmed'
                  )),
  emotions        text[] not null default '{}',
  voice_url       text,
  word_count      integer not null default 0,
  reflection_id   uuid,
  created_at      timestamptz not null default now()
);

create index if not exists idx_entries_user_created
  on public.journal_entries (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- reflections : AI-generated, 1-1 with an entry
-- ---------------------------------------------------------------------
create table if not exists public.reflections (
  id                  uuid primary key default uuid_generate_v4(),
  entry_id            uuid not null references public.journal_entries(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  summary             text not null,
  insight             text not null,
  question            text not null,
  detected_emotions   text[] not null default '{}',
  detected_mood       text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_reflections_user_created
  on public.reflections (user_id, created_at desc);

alter table public.journal_entries
  drop constraint if exists journal_entries_reflection_fkey;
alter table public.journal_entries
  add constraint journal_entries_reflection_fkey
  foreign key (reflection_id) references public.reflections(id) on delete set null;

-- ---------------------------------------------------------------------
-- memory_notes : the AI's long-term memory of the user
-- ---------------------------------------------------------------------
create table if not exists public.memory_notes (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  content         text not null,
  category        text not null check (category in (
                    'stress','goal','habit','relationship','trigger','value'
                  )),
  weight          real not null default 0.5,
  last_seen_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists idx_memory_user_weight
  on public.memory_notes (user_id, weight desc);

-- ---------------------------------------------------------------------
-- weekly_insights : pre-computed weekly summaries
-- ---------------------------------------------------------------------
create table if not exists public.weekly_insights (
  user_id               uuid not null references auth.users(id) on delete cascade,
  week_start            date not null,
  mood_average          real not null default 0,
  most_common_emotions  text[] not null default '{}',
  trends                text[] not null default '{}',
  highlight             text not null default '',
  triggers              text[] not null default '{}',
  created_at            timestamptz not null default now(),
  primary key (user_id, week_start)
);

-- ---------------------------------------------------------------------
-- subscriptions : Razorpay payment records
-- ---------------------------------------------------------------------
create table if not exists public.subscriptions (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  razorpay_payment_id   text,
  razorpay_order_id     text,
  razorpay_signature    text,
  plan                  text not null check (plan in ('monthly','annual','lifetime')),
  amount                integer not null,        -- in paise
  currency              text not null default 'INR',
  status                text not null check (status in ('created','authorized','captured','failed','refunded')),
  starts_at             timestamptz not null default now(),
  ends_at               timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists idx_subscriptions_user
  on public.subscriptions (user_id, created_at desc);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.profiles          enable row level security;
alter table public.journal_entries   enable row level security;
alter table public.reflections       enable row level security;
alter table public.memory_notes      enable row level security;
alter table public.weekly_insights   enable row level security;
alter table public.subscriptions     enable row level security;

-- Helper: every policy below shares the same shape -- "you can only see/edit your own rows".
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','journal_entries','reflections',
    'memory_notes','weekly_insights','subscriptions'
  ] loop
    execute format('drop policy if exists "%1$s_select_own" on public.%1$s;', t);
    execute format('drop policy if exists "%1$s_insert_own" on public.%1$s;', t);
    execute format('drop policy if exists "%1$s_update_own" on public.%1$s;', t);
    execute format('drop policy if exists "%1$s_delete_own" on public.%1$s;', t);
  end loop;
end $$;

-- profiles uses `id` as the owner column; everything else uses `user_id`.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "journal_entries_select_own" on public.journal_entries
  for select using (auth.uid() = user_id);
create policy "journal_entries_insert_own" on public.journal_entries
  for insert with check (auth.uid() = user_id);
create policy "journal_entries_update_own" on public.journal_entries
  for update using (auth.uid() = user_id);
create policy "journal_entries_delete_own" on public.journal_entries
  for delete using (auth.uid() = user_id);

create policy "reflections_select_own" on public.reflections
  for select using (auth.uid() = user_id);
create policy "reflections_insert_own" on public.reflections
  for insert with check (auth.uid() = user_id);

create policy "memory_notes_select_own" on public.memory_notes
  for select using (auth.uid() = user_id);
create policy "memory_notes_insert_own" on public.memory_notes
  for insert with check (auth.uid() = user_id);
create policy "memory_notes_update_own" on public.memory_notes
  for update using (auth.uid() = user_id);
create policy "memory_notes_delete_own" on public.memory_notes
  for delete using (auth.uid() = user_id);

create policy "weekly_insights_select_own" on public.weekly_insights
  for select using (auth.uid() = user_id);
create policy "weekly_insights_insert_own" on public.weekly_insights
  for insert with check (auth.uid() = user_id);
create policy "weekly_insights_update_own" on public.weekly_insights
  for update using (auth.uid() = user_id);

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
create policy "subscriptions_insert_own" on public.subscriptions
  for insert with check (auth.uid() = user_id);

-- =====================================================================
-- STORAGE : voice notes
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', false)
on conflict (id) do nothing;

drop policy if exists "voice_notes_owner_read" on storage.objects;
drop policy if exists "voice_notes_owner_write" on storage.objects;

create policy "voice_notes_owner_read" on storage.objects
  for select using (
    bucket_id = 'voice-notes' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "voice_notes_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'voice-notes' and auth.uid()::text = (storage.foldername(name))[1]
  );

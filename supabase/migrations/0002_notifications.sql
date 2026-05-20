-- =====================================================================
-- MindMirror — Migration 0002: Push notifications
-- =====================================================================
-- Adds the columns + table needed to send personalized push notifications.
-- Run after the base schema. Idempotent.
-- =====================================================================

-- Profile: track the device push token + per-user preferences.
alter table public.profiles
  add column if not exists expo_push_token       text,
  add column if not exists notifications_enabled boolean not null default true,
  add column if not exists notification_hour     integer not null default 20
    check (notification_hour between 0 and 23),
  add column if not exists last_notified_at      timestamptz;

create index if not exists idx_profiles_notifications
  on public.profiles (notifications_enabled, notification_hour)
  where notifications_enabled = true and expo_push_token is not null;

-- Audit log: every notification we send. Useful for de-dup, analytics,
-- and proving to users we don't spam them.
create table if not exists public.notifications_log (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  body            text not null,
  kind            text not null check (kind in ('daily_nudge','streak','reflection','custom')),
  expo_ticket_id  text,
  delivered_at    timestamptz not null default now()
);

create index if not exists idx_notifications_log_user
  on public.notifications_log (user_id, delivered_at desc);

alter table public.notifications_log enable row level security;

drop policy if exists "notifications_log_select_own" on public.notifications_log;
create policy "notifications_log_select_own" on public.notifications_log
  for select using (auth.uid() = user_id);

-- Inserts only happen from a trusted server (the Edge Function uses the
-- service role key) — so no insert policy is needed for end users.

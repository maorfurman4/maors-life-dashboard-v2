-- Push Notifications Setup
-- Run this in the Supabase SQL editor to enable push notification support.

create table if not exists push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);
alter table push_subscriptions enable row level security;
create policy "Users manage their own subscriptions" on push_subscriptions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists notification_preferences (
  user_id uuid references auth.users primary key,
  workout_reminder boolean not null default true,
  workout_reminder_time time not null default '18:00',
  nutrition_reminder boolean not null default true,
  budget_alerts boolean not null default true,
  streak_alerts boolean not null default true
);
alter table notification_preferences enable row level security;
create policy "Users manage their own notification prefs" on notification_preferences
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

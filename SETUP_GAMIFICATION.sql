-- ============================================================
-- Gamification System + AI Chat — Run this in Supabase SQL editor
-- ============================================================

-- XP table: one row per user
create table if not exists user_xp (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null unique,
  total_xp integer not null default 0,
  level integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table user_xp enable row level security;
create policy "Users can manage their own XP" on user_xp
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Streaks table: one row per user+type
create table if not exists user_streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  streak_type text not null,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_activity_date date,
  updated_at timestamptz not null default now(),
  unique(user_id, streak_type)
);
alter table user_streaks enable row level security;
create policy "Users can manage their own streaks" on user_streaks
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Achievements table: one row per user+achievement
create table if not exists achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  achievement_key text not null,
  achieved_at timestamptz not null default now(),
  xp_earned integer not null default 0,
  unique(user_id, achievement_key)
);
alter table achievements enable row level security;
create policy "Users can manage their own achievements" on achievements
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AI Chat messages table
create table if not exists ai_chat_messages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table ai_chat_messages enable row level security;
create policy "Users can manage their own chat" on ai_chat_messages
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Index for faster chat queries
create index if not exists ai_chat_messages_user_created
  on ai_chat_messages (user_id, created_at desc);

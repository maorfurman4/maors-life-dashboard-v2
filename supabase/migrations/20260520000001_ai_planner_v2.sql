-- AI Planner v2: workout_plans + user_fitness_profile

-- Full 4-week AI-generated plans
CREATE TABLE IF NOT EXISTS workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  goal text,
  level text,
  split_type text,
  weeks jsonb NOT NULL DEFAULT '[]',
  deload_week jsonb,
  tips text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plans" ON workout_plans
  FOR ALL USING (auth.uid() = user_id);

-- Personal fitness preferences
CREATE TABLE IF NOT EXISTS user_fitness_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  age int,
  gender text CHECK (gender IN ('male','female','other')),
  fitness_level text CHECK (fitness_level IN ('beginner','intermediate','advanced')) DEFAULT 'intermediate',
  preferred_muscles text[] DEFAULT '{}',
  avoided_muscles text[] DEFAULT '{}',
  favorite_exercises text[] DEFAULT '{}',
  blacklisted_exercises text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_fitness_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON user_fitness_profile
  FOR ALL USING (auth.uid() = user_id);

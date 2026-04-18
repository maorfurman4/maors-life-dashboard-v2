-- Extend user_profile with sport goals, nutrition, finance, and market preferences
ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS sport_goals TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS muscle_focus TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS diet_type TEXT,
  ADD COLUMN IF NOT EXISTS food_allergies TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS macro_preference TEXT,
  ADD COLUMN IF NOT EXISTS monthly_income NUMERIC,
  ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC,
  ADD COLUMN IF NOT EXISTS savings_goal_percent INTEGER,
  ADD COLUMN IF NOT EXISTS invests_in_market BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS investment_types TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS investment_level TEXT;

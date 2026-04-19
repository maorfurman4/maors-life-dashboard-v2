-- =====================================================================
-- ALL_MIGRATIONS.sql  —  Run this in Supabase SQL Editor
-- Fully idempotent: safe to run on a fresh DB or an existing one
-- =====================================================================

-- ============================================================
-- 0. Shared trigger function (needed by user_settings below)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 1. user_settings  (create if missing, then add new columns)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Personal info
  full_name TEXT,
  date_of_birth DATE,
  height_cm NUMERIC,
  weight_kg NUMERIC,

  -- Nutrition goals
  daily_calories_goal INTEGER DEFAULT 2000,
  daily_protein_goal NUMERIC DEFAULT 120,
  daily_carbs_goal NUMERIC DEFAULT 250,
  daily_fat_goal NUMERIC DEFAULT 65,
  daily_water_glasses_goal INTEGER DEFAULT 8,

  -- Sport goals
  weekly_workouts_goal INTEGER DEFAULT 4,
  weekly_minutes_goal INTEGER DEFAULT 200,
  weekly_calories_burn_goal INTEGER DEFAULT 2000,

  -- Work contract
  work_role TEXT DEFAULT 'guard',
  hourly_rate NUMERIC DEFAULT 57.48,
  shift_manager_rate NUMERIC DEFAULT 61.08,
  travel_allowance NUMERIC DEFAULT 22.60,
  briefing_allowance NUMERIC DEFAULT 13.58,
  shabbat_holiday_multiplier NUMERIC DEFAULT 1.5,

  -- Deductions
  union_deduction_pct NUMERIC DEFAULT 0.95,
  pension_deduction_pct NUMERIC DEFAULT 7.0,
  education_fund_pct NUMERIC DEFAULT 2.5,

  -- General
  preferred_language TEXT DEFAULT 'he',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='user_settings' AND policyname='Users can view own settings'
  ) THEN
    CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='user_settings' AND policyname='Users can insert own settings'
  ) THEN
    CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='user_settings' AND policyname='Users can update own settings'
  ) THEN
    CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='user_settings' AND policyname='Users can delete own settings'
  ) THEN
    CREATE POLICY "Users can delete own settings" ON public.user_settings FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);

-- Extra columns added in later migrations
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS training_day_calories INTEGER DEFAULT 2400,
  ADD COLUMN IF NOT EXISTS training_day_protein NUMERIC DEFAULT 160,
  ADD COLUMN IF NOT EXISTS daily_water_ml INTEGER DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS shoulder_sensitivity BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS base_hourly_rate NUMERIC DEFAULT 52.80,
  ADD COLUMN IF NOT EXISTS alt_hourly_rate NUMERIC DEFAULT 56.20,
  ADD COLUMN IF NOT EXISTS recovery_per_hour NUMERIC DEFAULT 1.51,
  ADD COLUMN IF NOT EXISTS excellence_per_hour NUMERIC DEFAULT 3.17,
  ADD COLUMN IF NOT EXISTS shabbat_hourly_rate NUMERIC DEFAULT 79.20,
  ADD COLUMN IF NOT EXISTS travel_per_shift NUMERIC DEFAULT 22.60,
  ADD COLUMN IF NOT EXISTS briefing_per_shift NUMERIC DEFAULT 13.58,
  ADD COLUMN IF NOT EXISTS national_insurance_pct NUMERIC DEFAULT 1.15,
  ADD COLUMN IF NOT EXISTS health_insurance_pct NUMERIC DEFAULT 0.86,
  ADD COLUMN IF NOT EXISTS lunch_deduction NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS union_national_deduction NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS harel_savings_pct NUMERIC DEFAULT 7.00,
  ADD COLUMN IF NOT EXISTS harel_study_pct NUMERIC DEFAULT 2.50,
  ADD COLUMN IF NOT EXISTS harel_travel_pct NUMERIC DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS extra_harel_pct NUMERIC DEFAULT 7.00,
  ADD COLUMN IF NOT EXISTS income_sync_mode TEXT DEFAULT 'net',
  ADD COLUMN IF NOT EXISTS savings_goal_pct NUMERIC DEFAULT 35,
  -- NEW: feature-expansion columns
  ADD COLUMN IF NOT EXISTS hidden_modules JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS google_calendar_token TEXT,
  ADD COLUMN IF NOT EXISTS sport_favorites JSONB DEFAULT '[]'::jsonb;

-- ============================================================
-- 2. user_profile  (create if missing, then add new columns)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER,
  gender TEXT,
  city TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  target_weight_kg NUMERIC,
  physical_limitations TEXT[] DEFAULT '{}',
  sport_types TEXT[] DEFAULT '{}',
  sport_frequency TEXT,
  sport_location TEXT,
  sport_level TEXT,
  interest_topics TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='user_profile' AND policyname='Users can manage own profile'
  ) THEN
    CREATE POLICY "Users can manage own profile"
      ON public.user_profile FOR ALL
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Extra profile columns
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

-- Auto-create profile row on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profile (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. coupons
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  code TEXT,
  barcode TEXT,
  store TEXT,
  discount_amount NUMERIC,
  discount_percent NUMERIC,
  expiry_date DATE,
  category TEXT DEFAULT 'אחר',
  is_used BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='coupons' AND policyname='Users manage own coupons'
  ) THEN
    CREATE POLICY "Users manage own coupons" ON public.coupons
      FOR ALL USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON public.coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_expiry ON public.coupons(expiry_date);

-- ============================================================
-- 4. task_projects + tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.task_projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='task_projects' AND policyname='Users manage own projects'
  ) THEN
    CREATE POLICY "Users manage own projects" ON public.task_projects
      FOR ALL USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_task_projects_user_id ON public.task_projects(user_id);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID REFERENCES public.task_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='tasks' AND policyname='Users manage own tasks'
  ) THEN
    CREATE POLICY "Users manage own tasks" ON public.tasks
      FOR ALL USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(user_id, status);

-- ============================================================
-- 5. grocery_lists + grocery_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grocery_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='grocery_lists' AND policyname='Users manage own grocery lists'
  ) THEN
    CREATE POLICY "Users manage own grocery lists" ON public.grocery_lists
      FOR ALL USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_grocery_lists_user ON public.grocery_lists(user_id);

CREATE TABLE IF NOT EXISTS public.grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.grocery_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  barcode TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='grocery_items' AND policyname='Users manage own grocery items'
  ) THEN
    CREATE POLICY "Users manage own grocery items" ON public.grocery_items
      FOR ALL USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_grocery_items_list ON public.grocery_items(list_id);

-- =====================================================================
-- Done. All tables, policies, and indexes are now up to date.
-- =====================================================================


CREATE TABLE public.user_settings (
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
  
  -- Deductions (percentages)
  union_deduction_pct NUMERIC DEFAULT 0.95,
  pension_deduction_pct NUMERIC DEFAULT 7.0,
  education_fund_pct NUMERIC DEFAULT 2.5,
  
  -- General settings
  preferred_language TEXT DEFAULT 'he',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_settings_user ON public.user_settings(user_id);

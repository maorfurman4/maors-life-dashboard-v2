
-- Weight tracking
CREATE TABLE public.weight_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.weight_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own weight" ON public.weight_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight" ON public.weight_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weight" ON public.weight_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight" ON public.weight_entries FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_weight_user_date ON public.weight_entries(user_id, date DESC);

-- Body progress photos
CREATE TABLE public.body_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_url TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.body_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own body progress" ON public.body_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body progress" ON public.body_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own body progress" ON public.body_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own body progress" ON public.body_progress FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_body_progress_user_date ON public.body_progress(user_id, date DESC);

-- Personal records
CREATE TABLE public.personal_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'calisthenics',
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'reps',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own PRs" ON public.personal_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own PRs" ON public.personal_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own PRs" ON public.personal_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own PRs" ON public.personal_records FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_pr_user_exercise ON public.personal_records(user_id, exercise_name);
CREATE TRIGGER update_personal_records_updated_at BEFORE UPDATE ON public.personal_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Workout templates
CREATE TABLE public.workout_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_duration_minutes INTEGER,
  estimated_calories INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own templates" ON public.workout_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own templates" ON public.workout_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.workout_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own templates" ON public.workout_templates FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON public.workout_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add training-day goals to user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS training_day_calories INTEGER DEFAULT 2400,
  ADD COLUMN IF NOT EXISTS training_day_protein NUMERIC DEFAULT 160,
  ADD COLUMN IF NOT EXISTS daily_water_ml INTEGER DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS shoulder_sensitivity BOOLEAN DEFAULT false;

-- Storage bucket for body progress photos
INSERT INTO storage.buckets (id, name, public) VALUES ('body-progress', 'body-progress', false);
CREATE POLICY "Users can upload own body photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'body-progress' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own body photos" ON storage.objects FOR SELECT USING (bucket_id = 'body-progress' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own body photos" ON storage.objects FOR DELETE USING (bucket_id = 'body-progress' AND auth.uid()::text = (storage.foldername(name))[1]);

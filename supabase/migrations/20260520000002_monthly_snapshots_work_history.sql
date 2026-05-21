-- Finance monthly rollover snapshots
CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL,
  total_income numeric(12,2) NOT NULL DEFAULT 0,
  total_expenses numeric(12,2) NOT NULL DEFAULT 0,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  savings_pct numeric(5,2) NOT NULL DEFAULT 0,
  category_breakdown jsonb,
  snapshot_data jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year, month)
);
ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.monthly_snapshots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Work monthly history
CREATE TABLE IF NOT EXISTS public.work_monthly_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL,
  total_shifts integer NOT NULL DEFAULT 0,
  total_hours numeric(8,2) NOT NULL DEFAULT 0,
  total_gross_pay numeric(12,2) NOT NULL DEFAULT 0,
  breakdown_by_type jsonb,
  shifts_snapshot jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year, month)
);
ALTER TABLE public.work_monthly_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.work_monthly_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Work payslip uploads
CREATE TABLE IF NOT EXISTS public.payslip_uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text,
  extracted_data jsonb,
  upload_month text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.payslip_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.payslip_uploads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

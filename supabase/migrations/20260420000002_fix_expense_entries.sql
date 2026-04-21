-- =========================================================================
-- Fix expense_entries: create if missing, add all required columns safely
-- Safe to run even if table already exists.
-- =========================================================================

-- 1. Ensure the table exists with base columns
CREATE TABLE IF NOT EXISTS public.expense_entries (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  amount      NUMERIC     NOT NULL,
  category    TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add columns that the app requires (idempotent)
ALTER TABLE public.expense_entries ADD COLUMN IF NOT EXISTS expense_type  TEXT    NOT NULL DEFAULT 'variable';
ALTER TABLE public.expense_entries ADD COLUMN IF NOT EXISTS is_recurring  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.expense_entries ADD COLUMN IF NOT EXISTS needs_review  BOOLEAN NOT NULL DEFAULT false;

-- 3. Enable RLS
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;

-- 4. Policies (safe: only create if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expense_entries'
      AND policyname = 'Users can view own expenses'
  ) THEN
    CREATE POLICY "Users can view own expenses" ON public.expense_entries
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expense_entries'
      AND policyname = 'Users can insert own expenses'
  ) THEN
    CREATE POLICY "Users can insert own expenses" ON public.expense_entries
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expense_entries'
      AND policyname = 'Users can update own expenses'
  ) THEN
    CREATE POLICY "Users can update own expenses" ON public.expense_entries
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expense_entries'
      AND policyname = 'Users can delete own expenses'
  ) THEN
    CREATE POLICY "Users can delete own expenses" ON public.expense_entries
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Updated-at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_expenses_updated_at'
  ) THEN
    CREATE TRIGGER update_expenses_updated_at
      BEFORE UPDATE ON public.expense_entries
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- =========================================================================
-- Also patch income_entries (needs source column)
-- =========================================================================
ALTER TABLE public.income_entries ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- =========================================================================
-- Also patch user_settings (needs savings_goal_pct + income_sync_mode)
-- =========================================================================
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS savings_goal_pct  NUMERIC DEFAULT 35;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS income_sync_mode  TEXT    DEFAULT 'net';

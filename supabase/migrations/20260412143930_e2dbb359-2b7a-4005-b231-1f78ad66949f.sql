
-- Drop old check constraint and add new one with verified shift types
ALTER TABLE public.work_shifts DROP CONSTRAINT IF EXISTS work_shifts_type_check;
ALTER TABLE public.work_shifts ADD CONSTRAINT work_shifts_type_check 
  CHECK (type IN ('morning','afternoon','night','long_morning','long_night','briefing','vacation','sick'));

-- Add role column (guard or shift_manager)
ALTER TABLE public.work_shifts ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'guard' 
  CHECK (role IN ('guard','shift_manager'));

-- Add is_shabbat_holiday flag for 150% calculation
ALTER TABLE public.work_shifts ADD COLUMN IF NOT EXISTS is_shabbat_holiday BOOLEAN NOT NULL DEFAULT false;

-- Add actual_salary column for manual payslip entry
ALTER TABLE public.work_shifts ADD COLUMN IF NOT EXISTS actual_salary NUMERIC;

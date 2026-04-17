
-- Add briefing flag to work_shifts
ALTER TABLE public.work_shifts
ADD COLUMN IF NOT EXISTS has_briefing boolean NOT NULL DEFAULT false;

-- Add payroll columns to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS base_hourly_rate numeric DEFAULT 52.80,
ADD COLUMN IF NOT EXISTS alt_hourly_rate numeric DEFAULT 56.20,
ADD COLUMN IF NOT EXISTS recovery_per_hour numeric DEFAULT 1.51,
ADD COLUMN IF NOT EXISTS excellence_per_hour numeric DEFAULT 3.17,
ADD COLUMN IF NOT EXISTS shabbat_hourly_rate numeric DEFAULT 79.20,
ADD COLUMN IF NOT EXISTS travel_per_shift numeric DEFAULT 22.60,
ADD COLUMN IF NOT EXISTS briefing_per_shift numeric DEFAULT 13.58,
ADD COLUMN IF NOT EXISTS national_insurance_pct numeric DEFAULT 1.15,
ADD COLUMN IF NOT EXISTS health_insurance_pct numeric DEFAULT 0.86,
ADD COLUMN IF NOT EXISTS lunch_deduction numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS union_national_deduction numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS harel_savings_pct numeric DEFAULT 7.00,
ADD COLUMN IF NOT EXISTS harel_study_pct numeric DEFAULT 2.50,
ADD COLUMN IF NOT EXISTS harel_travel_pct numeric DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS extra_harel_pct numeric DEFAULT 7.00,
ADD COLUMN IF NOT EXISTS income_sync_mode text DEFAULT 'net';

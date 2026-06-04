-- Fix work_shifts type CHECK constraint
-- The UI sends 'manual_hourly' as a valid shift type but the DB constraint
-- didn't include it, causing every manual-hourly shift save to fail with
-- a CHECK constraint violation error.

ALTER TABLE public.work_shifts DROP CONSTRAINT IF EXISTS work_shifts_type_check;

ALTER TABLE public.work_shifts ADD CONSTRAINT work_shifts_type_check
  CHECK (type IN (
    'morning',
    'afternoon',
    'night',
    'long_morning',
    'long_night',
    'briefing',
    'manual_hourly',
    'vacation',
    'sick'
  ));

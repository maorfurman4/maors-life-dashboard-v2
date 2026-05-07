-- ================================================================
-- Body Progress: add `angle` column + index
-- ================================================================

ALTER TABLE public.body_progress
  ADD COLUMN IF NOT EXISTS angle TEXT NOT NULL DEFAULT 'front';

-- Constraint (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'body_progress_angle_check'
  ) THEN
    ALTER TABLE public.body_progress
      ADD CONSTRAINT body_progress_angle_check
      CHECK (angle IN ('front', 'back', 'side'));
  END IF;
END
$$;

-- Fast per-angle queries
CREATE INDEX IF NOT EXISTS idx_body_progress_user_angle_date
  ON public.body_progress(user_id, angle, date DESC);

-- Add used_at timestamp to coupons for monthly savings tracking
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- Backfill: set used_at = created_at for already-used coupons
UPDATE public.coupons SET used_at = created_at WHERE is_used = TRUE AND used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_coupons_used_at ON public.coupons(user_id, used_at)
  WHERE used_at IS NOT NULL;

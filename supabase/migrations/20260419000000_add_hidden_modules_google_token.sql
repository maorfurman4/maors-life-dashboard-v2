-- Add hidden_modules to user_settings and google_calendar_token
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS hidden_modules JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS google_calendar_token TEXT,
  ADD COLUMN IF NOT EXISTS sport_favorites JSONB DEFAULT '[]'::jsonb;

-- Check if gender already exists in user_profile before adding
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='user_profile' AND column_name='gender'
  ) THEN
    ALTER TABLE user_profile ADD COLUMN gender TEXT;
  END IF;
END $$;

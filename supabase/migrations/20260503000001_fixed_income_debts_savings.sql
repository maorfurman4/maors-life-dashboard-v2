-- ─── Fixed income (recurring income entries) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS fixed_income (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,
  amount         NUMERIC NOT NULL DEFAULT 0,
  category       TEXT NOT NULL DEFAULT 'משכורת',
  day_of_month   INTEGER NOT NULL DEFAULT 1,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE fixed_income ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own fixed_income"
  ON fixed_income FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Debts (move from localStorage to Supabase) ───────────────────────────────
CREATE TABLE IF NOT EXISTS debts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                 TEXT NOT NULL,
  type                 TEXT NOT NULL DEFAULT 'הלוואה',
  principal            NUMERIC NOT NULL DEFAULT 0,
  monthly_payment      NUMERIC NOT NULL DEFAULT 0,
  annual_interest_rate NUMERIC NOT NULL DEFAULT 0,
  months_elapsed       INTEGER NOT NULL DEFAULT 0,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own debts"
  ON debts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Add savings goal amount to user_settings ─────────────────────────────────
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS savings_goal_amount NUMERIC;

-- ============ MARKET_WATCHLIST ============
CREATE TABLE public.market_watchlist (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol     text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, symbol)
);

ALTER TABLE public.market_watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlist" ON public.market_watchlist
  USING (auth.uid() = user_id);
CREATE INDEX idx_watchlist_user ON public.market_watchlist(user_id);

-- ============ MARKET_ALERTS ============
CREATE TABLE public.market_alerts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol       text        NOT NULL,
  target_price numeric     NOT NULL,
  direction    text        NOT NULL CHECK (direction IN ('above','below')),
  is_triggered boolean     NOT NULL DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.market_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON public.market_alerts
  USING (auth.uid() = user_id);
CREATE INDEX idx_alerts_user ON public.market_alerts(user_id);

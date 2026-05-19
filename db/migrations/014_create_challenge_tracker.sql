CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS challenge_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_currency TEXT NOT NULL DEFAULT 'USD' CHECK (account_currency IN ('IDR', 'USD', 'EUR', 'GBP')),
  initial_balance NUMERIC(18, 4) NOT NULL CHECK (initial_balance >= 0),
  current_balance NUMERIC(18, 4) NOT NULL CHECK (current_balance >= 0),
  current_equity NUMERIC(18, 4) NOT NULL CHECK (current_equity >= 0),
  profit_target_percent NUMERIC(8, 4),
  profit_target_amount NUMERIC(18, 4),
  max_daily_loss_percent NUMERIC(8, 4),
  max_daily_loss_amount NUMERIC(18, 4),
  max_overall_drawdown_percent NUMERIC(8, 4),
  max_overall_drawdown_amount NUMERIC(18, 4),
  min_trading_days INTEGER NOT NULL DEFAULT 0 CHECK (min_trading_days >= 0),
  start_date DATE,
  end_date DATE,
  account_type TEXT NOT NULL DEFAULT 'evaluation' CHECK (account_type IN ('personal', 'prop_firm', 'funded', 'evaluation')),
  drawdown_mode TEXT NOT NULL DEFAULT 'static' CHECK (drawdown_mode IN ('static', 'trailing', 'balance_based', 'equity_based')),
  news_trading_allowed BOOLEAN NOT NULL DEFAULT false,
  hold_overnight_allowed BOOLEAN NOT NULL DEFAULT false,
  hold_weekend_allowed BOOLEAN NOT NULL DEFAULT false,
  consistency_rule_percent NUMERIC(8, 4),
  max_lot NUMERIC(18, 4),
  max_risk_per_trade_percent NUMERIC(8, 4),
  max_trades_per_day INTEGER CHECK (max_trades_per_day IS NULL OR max_trades_per_day >= 0),
  preset_id TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_accounts_user_active ON challenge_accounts(user_id, archived_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_accounts_user_created ON challenge_accounts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS challenge_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_account_id UUID NOT NULL REFERENCES challenge_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_date DATE NOT NULL,
  symbol TEXT NOT NULL,
  session TEXT CHECK (session IS NULL OR session IN ('asia', 'london', 'new_york')),
  direction TEXT CHECK (direction IS NULL OR direction IN ('buy', 'sell')),
  entry_price NUMERIC(18, 6),
  stop_loss NUMERIC(18, 6),
  take_profit NUMERIC(18, 6),
  exit_price NUMERIC(18, 6),
  lot_size NUMERIC(18, 4),
  risk_amount NUMERIC(18, 4),
  risk_percent NUMERIC(8, 4),
  result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'be')),
  pnl_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
  pnl_percent NUMERIC(8, 4),
  rr_planned NUMERIC(10, 4),
  rr_realized NUMERIC(10, 4),
  setup_name TEXT,
  entry_reason TEXT,
  exit_reason TEXT,
  emotional_state TEXT CHECK (emotional_state IS NULL OR emotional_state IN ('calm', 'fomo', 'revenge', 'fear', 'greedy', 'hesitant', 'overconfident')),
  mistake_category TEXT CHECK (mistake_category IS NULL OR mistake_category IN ('no_mistake', 'late_entry', 'early_entry', 'moved_sl', 'no_sl', 'overlot', 'revenge_trade', 'news_trade', 'broke_rules', 'bad_setup')),
  confidence_level INTEGER CHECK (confidence_level IS NULL OR confidence_level BETWEEN 1 AND 5),
  discipline_input_score INTEGER CHECK (discipline_input_score IS NULL OR discipline_input_score BETWEEN 1 AND 5),
  trade_quality TEXT CHECK (trade_quality IS NULL OR trade_quality IN ('a_plus', 'a', 'b', 'c', 'd')),
  followed_plan BOOLEAN,
  discipline_score INTEGER NOT NULL DEFAULT 100 CHECK (discipline_score BETWEEN 0 AND 100),
  screenshot_url TEXT,
  evaluation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_trades_account_date ON challenge_trades(challenge_account_id, trade_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_trades_user_date ON challenge_trades(user_id, trade_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_trades_account_result ON challenge_trades(challenge_account_id, result);
CREATE INDEX IF NOT EXISTS idx_challenge_trades_account_symbol ON challenge_trades(challenge_account_id, symbol);

CREATE TABLE IF NOT EXISTS challenge_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_personas_user_created ON challenge_personas(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS challenge_ai_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_account_id UUID NOT NULL REFERENCES challenge_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES challenge_personas(id) ON DELETE SET NULL,
  provider TEXT,
  review_scope TEXT NOT NULL,
  review_style TEXT NOT NULL,
  user_message TEXT,
  system_prompt TEXT NOT NULL,
  context_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_ai_reviews_account_created ON challenge_ai_reviews(challenge_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_ai_reviews_user_created ON challenge_ai_reviews(user_id, created_at DESC);

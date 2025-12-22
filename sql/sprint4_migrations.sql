-- Sprint 4 Database Migrations
-- Recurring Transactions, Budgets, Reminders

-- =============================================================================
-- recurring_transactions table
-- =============================================================================
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  account_id UUID REFERENCES accounts(id),
  category_id UUID REFERENCES categories(id),
  income_type VARCHAR(20),

  -- Schedule
  frequency VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  month INTEGER CHECK (month BETWEEN 0 AND 11),

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_executed DATE,
  execution_count INTEGER DEFAULT 0,

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for recurring_transactions
CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_active ON recurring_transactions(user_id, is_active);

-- RLS for recurring_transactions
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own recurring" ON recurring_transactions;
CREATE POLICY "Users can manage own recurring" ON recurring_transactions
  FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- budgets table
-- =============================================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, category_id, month, year)
);

-- Indexes for budgets
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, year, month);

-- RLS for budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own budgets" ON budgets;
CREATE POLICY "Users can manage own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- reminders table
-- =============================================================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'bill' CHECK (type IN ('bill', 'loan', 'other')),
  amount DECIMAL(15,2),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  remind_days_before INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  loan_id UUID REFERENCES loans(id),
  recurring_id UUID REFERENCES recurring_transactions(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for reminders
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id, is_active);

-- RLS for reminders
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own reminders" ON reminders;
CREATE POLICY "Users can manage own reminders" ON reminders
  FOR ALL USING (auth.uid() = user_id);


-- =============================================================================
-- Add recurring_id to transactions (if not exists)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'recurring_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN recurring_id UUID REFERENCES recurring_transactions(id);
  END IF;
END $$;


-- =============================================================================
-- Helper function: Get month date range
-- =============================================================================
CREATE OR REPLACE FUNCTION get_month_range(p_month INTEGER, p_year INTEGER)
RETURNS TABLE(start_date DATE, end_date DATE)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY SELECT
    make_date(p_year, p_month, 1) as start_date,
    (make_date(p_year, p_month, 1) + INTERVAL '1 month - 1 day')::DATE as end_date;
END;
$$;

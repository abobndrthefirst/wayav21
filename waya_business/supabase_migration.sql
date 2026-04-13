-- ============================================================================
-- Waya Business - Supabase Database Migration
-- Run this in your Supabase SQL Editor to create all required tables
-- ============================================================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── STORES TABLE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  logo TEXT,
  category TEXT,
  phone TEXT,
  address TEXT,
  stamps_required INTEGER NOT NULL DEFAULT 10,
  reward_description TEXT,
  reward_description_ar TEXT,
  qr_code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for owner lookup
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);

-- ─── CUSTOMERS TABLE ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  username TEXT,
  total_visits INTEGER NOT NULL DEFAULT 0,
  current_stamps INTEGER NOT NULL DEFAULT 0,
  total_stamps_earned INTEGER NOT NULL DEFAULT 0,
  total_redemptions INTEGER NOT NULL DEFAULT 0,
  last_visit TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customers_store ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(store_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_username ON customers(store_id, username);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_store_user ON customers(store_id, user_id) WHERE user_id IS NOT NULL;

-- ─── TRANSACTIONS TABLE ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('stamp', 'redeem', 'bonus')),
  stamps_change INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_store ON transactions(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id, created_at DESC);

-- ─── REWARDS TABLE ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  stamps_required INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  times_redeemed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rewards_store ON rewards(store_id);

-- ─── RPC FUNCTIONS ───────────────────────────────────────────────────────────

-- Increment customer stamps (called when adding a stamp)
CREATE OR REPLACE FUNCTION increment_customer_stamps(
  p_customer_id UUID,
  p_stamps INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  UPDATE customers SET
    current_stamps = current_stamps + p_stamps,
    total_stamps_earned = total_stamps_earned + p_stamps,
    total_visits = total_visits + 1,
    last_visit = now(),
    updated_at = now()
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Redeem customer reward (deduct stamps, increment redemptions)
CREATE OR REPLACE FUNCTION redeem_customer_reward(
  p_customer_id UUID,
  p_stamps INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE customers SET
    current_stamps = GREATEST(current_stamps - p_stamps, 0),
    total_redemptions = total_redemptions + 1,
    updated_at = now()
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Monthly growth data for charts
CREATE OR REPLACE FUNCTION get_monthly_growth(p_store_id UUID)
RETURNS TABLE(
  month TEXT,
  customers BIGINT,
  stamps BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc('month', t.created_at), 'Mon') AS month,
    COUNT(DISTINCT t.customer_id) AS customers,
    COUNT(*) FILTER (WHERE t.type = 'stamp') AS stamps
  FROM transactions t
  WHERE t.store_id = p_store_id
    AND t.created_at >= date_trunc('month', now()) - INTERVAL '5 months'
  GROUP BY date_trunc('month', t.created_at)
  ORDER BY date_trunc('month', t.created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── ROW LEVEL SECURITY (RLS) ───────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Stores: owner can CRUD their own stores
CREATE POLICY "Store owner full access" ON stores
  FOR ALL USING (auth.uid() = owner_id);

-- Customers: store owner can manage customers of their stores
CREATE POLICY "Store owner manages customers" ON customers
  FOR ALL USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Transactions: store owner can manage transactions
CREATE POLICY "Store owner manages transactions" ON transactions
  FOR ALL USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- Rewards: store owner can manage rewards
CREATE POLICY "Store owner manages rewards" ON rewards
  FOR ALL USING (
    store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
  );

-- ─── AUTO-UPDATE TIMESTAMPS ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

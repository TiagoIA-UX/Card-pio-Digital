-- =====================================================
-- MIGRATION 030 — Admin Dashboard Modules
-- Profiles, trial management, impersonation, 
-- affiliate conversions, admin feedbacks consolidation
-- =====================================================

-- ─── 1. PROFILES TABLE ──────────────────────────────
-- Extends auth.users with SaaS-specific fields
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nome TEXT,
  avatar_url TEXT,
  telefone TEXT,
  referred_by TEXT,              -- aff_ref code that brought this user
  trial_days INT DEFAULT 7,     -- configurable per user
  trial_ends_at TIMESTAMPTZ,    -- computed on signup
  last_seen_at TIMESTAMPTZ,     -- updated on each request
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends ON profiles(trial_ends_at);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);

-- ─── 2. TRIAL EVENTS TABLE ──────────────────────────
-- Tracks each trial notification/event sent
CREATE TABLE IF NOT EXISTS trial_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'welcome','day3_reminder','day5_urgency','day6_offer',
    'day7_expired','trial_extended','trial_revoked'
  )),
  channel TEXT DEFAULT 'system' CHECK (channel IN ('system','email','whatsapp')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trial_events_user ON trial_events(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_events_type ON trial_events(user_id, event_type);

ALTER TABLE trial_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY trial_events_admin ON trial_events FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
CREATE POLICY trial_events_own ON trial_events FOR SELECT
  USING (auth.uid() = user_id);

-- ─── 3. AFFILIATE CONVERSIONS TABLE ─────────────────
-- Tracks actual conversions (trial→paid) per affiliate
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aff_ref TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  plan_slug TEXT NOT NULL,
  commission_pct DECIMAL(5,2) DEFAULT 20.00,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aconv_aff ON affiliate_conversions(aff_ref);
CREATE INDEX IF NOT EXISTS idx_aconv_user ON affiliate_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_aconv_paid ON affiliate_conversions(paid_at);

ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY aconv_admin ON affiliate_conversions FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));
CREATE POLICY aconv_own ON affiliate_conversions FOR SELECT
  USING (EXISTS (SELECT 1 FROM affiliates WHERE user_id = auth.uid() AND code = aff_ref));

-- ─── 4. ADMIN AUDIT LOG TABLE ───────────────────────
-- Tracks impersonation and critical admin actions
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN (
    'impersonate_start','impersonate_end',
    'trial_extend','trial_revoke',
    'user_suspend','user_activate',
    'plan_change','commission_pay',
    'config_change'
  )),
  target_user_id UUID,
  target_restaurant_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_admin_only ON admin_audit_log FOR ALL
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ─── 5. ADD referred_by TO RESTAURANTS ──────────────
-- Track which affiliate referred each restaurant signup
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'referred_by') THEN
    ALTER TABLE restaurants ADD COLUMN referred_by TEXT;
    CREATE INDEX idx_restaurants_referred ON restaurants(referred_by);
  END IF;
END $$;

-- ─── 6. ADD last_active_at TO RESTAURANTS ───────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'restaurants' AND column_name = 'last_active_at') THEN
    ALTER TABLE restaurants ADD COLUMN last_active_at TIMESTAMPTZ;
  END IF;
END $$;

-- ─── 7. SYNC EXISTING USERS INTO PROFILES ──────────
-- Backfill profiles from auth.users for existing accounts
INSERT INTO profiles (id, email, created_at)
SELECT id, email, created_at FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

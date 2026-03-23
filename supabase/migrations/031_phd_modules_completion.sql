-- =====================================================
-- MIGRATION 031 — PhD Modules Completion
-- profiles.plan, affiliate commission_pct,
-- health_checks table
-- =====================================================
-- ─── 1. PROFILES.PLAN ────────────────────────────────
-- Track user plan status directly on profile
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name = 'plan'
) THEN
ALTER TABLE profiles
ADD COLUMN plan TEXT DEFAULT 'trial' CHECK (
    plan IN ('trial', 'starter', 'pro', 'elite', 'cancelled')
  );
END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
-- ─── 2. AFFILIATES.COMMISSION_PCT ────────────────────
-- Allow per-affiliate commission configuration
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'affiliates'
    AND column_name = 'commission_pct'
) THEN
ALTER TABLE affiliates
ADD COLUMN commission_pct NUMERIC(5, 2) DEFAULT 30.00;
END IF;
END $$;
-- ─── 3. HEALTH_CHECKS TABLE ─────────────────────────
-- Store cron health check results
CREATE TABLE IF NOT EXISTS health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL CHECK (status IN ('ok', 'degraded', 'down')),
  checks JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_checks_created ON health_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status)
WHERE status != 'ok';
-- ─── 4. BACKFILL profiles.plan FROM subscriptions ───
UPDATE profiles p
SET plan = CASE
    WHEN s.status = 'active'
    AND r.plan_slug = 'premium' THEN 'elite'
    WHEN s.status = 'active'
    AND r.plan_slug = 'pro' THEN 'pro'
    WHEN s.status = 'active' THEN 'starter'
    WHEN s.status = 'trial' THEN 'trial'
    WHEN s.status IN ('canceled', 'expired') THEN 'cancelled'
    ELSE 'trial'
  END
FROM restaurants r
  JOIN subscriptions s ON s.restaurant_id = r.id
WHERE r.user_id = p.id
  AND p.plan = 'trial';
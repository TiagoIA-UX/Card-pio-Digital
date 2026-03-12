-- =====================================================
-- ONBOARDING SUBMISSIONS
-- Armazena dados do formulário de onboarding para plano Feito Pra Você
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES template_orders(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_production', 'completed')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id),
  UNIQUE(restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_order ON onboarding_submissions(order_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_restaurant ON onboarding_submissions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_status ON onboarding_submissions(status);

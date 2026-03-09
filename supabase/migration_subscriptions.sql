-- =============================================
-- MIGRAÇÃO: Assinaturas Recorrentes com Mercado Pago
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1) Adicionar campos do Mercado Pago na tabela subscriptions
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
ADD COLUMN IF NOT EXISTS mp_payer_id TEXT,
ADD COLUMN IF NOT EXISTS mp_subscription_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_payments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval ON subscriptions(mp_preapproval_id);

-- 2) Adicionar campo de suspensão no restaurante
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- 3) Tabela de histórico de pagamentos de assinatura
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  mp_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL, -- approved | rejected | pending | refunded
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_subscription ON subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON subscription_payments(status);

-- 4) Tabela de log de ações admin
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- suspend_restaurant | activate_restaurant | change_plan | edit_menu
  target_restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_restaurant ON admin_actions(target_restaurant_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin ON admin_actions(admin_id);

-- 5) Campo para identificar admins
ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Se não conseguir alterar auth.users, criar tabela de admins
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin', -- admin | super_admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) Função para suspender restaurante por inadimplência
CREATE OR REPLACE FUNCTION suspend_restaurant_for_nonpayment(p_restaurant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE restaurants 
  SET 
    suspended = true,
    suspended_reason = 'Inadimplência - Assinatura vencida',
    suspended_at = NOW(),
    ativo = false
  WHERE id = p_restaurant_id;
  
  UPDATE subscriptions
  SET 
    status = 'past_due',
    suspended_at = NOW()
  WHERE restaurant_id = p_restaurant_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) Função para reativar restaurante
CREATE OR REPLACE FUNCTION reactivate_restaurant(p_restaurant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE restaurants 
  SET 
    suspended = false,
    suspended_reason = NULL,
    suspended_at = NULL,
    ativo = true
  WHERE id = p_restaurant_id;
  
  UPDATE subscriptions
  SET 
    status = 'active',
    suspended_at = NULL,
    failed_payments = 0
  WHERE restaurant_id = p_restaurant_id AND status = 'past_due';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) Função para verificar assinaturas vencidas (rodar via cron)
CREATE OR REPLACE FUNCTION check_overdue_subscriptions()
RETURNS TABLE(restaurant_id UUID, user_id UUID, days_overdue INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.restaurant_id,
    s.user_id,
    EXTRACT(DAY FROM NOW() - s.current_period_end)::INTEGER as days_overdue
  FROM subscriptions s
  JOIN restaurants r ON r.id = s.restaurant_id
  WHERE s.status = 'active'
    AND s.current_period_end < NOW()
    AND r.suspended = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) Função para auto-suspender após X dias de atraso
CREATE OR REPLACE FUNCTION auto_suspend_overdue_restaurants(days_tolerance INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  suspended_count INTEGER := 0;
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT restaurant_id 
    FROM check_overdue_subscriptions() 
    WHERE days_overdue > days_tolerance
  LOOP
    PERFORM suspend_restaurant_for_nonpayment(rec.restaurant_id);
    suspended_count := suspended_count + 1;
  END LOOP;
  
  RETURN suspended_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10) RLS para novas tabelas
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Políticas subscription_payments
CREATE POLICY "Usuários veem pagamentos da própria assinatura" ON subscription_payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.id = subscription_payments.subscription_id 
    AND subscriptions.user_id = auth.uid()
  )
);

-- Políticas admin_actions (apenas admins podem ver)
CREATE POLICY "Admins podem ver todas as ações" ON admin_actions
FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins podem criar ações" ON admin_actions
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Políticas admin_users
CREATE POLICY "Admins podem ver lista de admins" ON admin_users
FOR SELECT USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- 11) Criar preapproval plans no Mercado Pago (referência)
-- Os IDs abaixo devem ser criados via API do MP e atualizados aqui
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS mp_preapproval_plan_id TEXT;

-- Atualizar planos com IDs do Mercado Pago (exemplo)
-- UPDATE plans SET mp_preapproval_plan_id = 'SEU_PLAN_ID_BASICO' WHERE slug = 'basico';
-- UPDATE plans SET mp_preapproval_plan_id = 'SEU_PLAN_ID_PRO' WHERE slug = 'pro';
-- UPDATE plans SET mp_preapproval_plan_id = 'SEU_PLAN_ID_PREMIUM' WHERE slug = 'premium';

-- =============================================
-- FIM DA MIGRAÇÃO
-- =============================================

-- =====================================================
-- Migration 026 — Corrige avisos do Supabase Database Linter
--
-- 1) function_search_path_mutable: 7 funções → SET search_path = ''
-- 2) rls_policy_always_true: 2 policies INSERT muito permissivas
-- 3) rls_enabled_no_policy: 6 tabelas com RLS habilitado mas sem policies
--
-- Referência: https://supabase.com/docs/guides/database/database-linter
-- =====================================================

-- =====================================================
-- PARTE 1: FUNÇÕES — SET search_path = ''
-- =====================================================

-- 1.1 update_updated_at (trigger)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1.2 set_updated_at (trigger, afiliados)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 1.3 get_next_order_number (sequencial por restaurante)
CREATE OR REPLACE FUNCTION get_next_order_number(p_restaurant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_pedido), 0) + 1
  INTO next_num
  FROM public.orders
  WHERE restaurant_id = p_restaurant_id
  FOR UPDATE;

  RETURN next_num;
END;
$$;

-- 1.4 suspend_restaurant_for_nonpayment
CREATE OR REPLACE FUNCTION suspend_restaurant_for_nonpayment(p_restaurant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.restaurants
  SET suspended = TRUE,
      suspended_reason = 'Inadimplência - assinatura vencida',
      suspended_at = NOW(),
      ativo = FALSE
  WHERE id = p_restaurant_id;

  UPDATE public.subscriptions
  SET status = 'past_due',
      suspended_at = NOW()
  WHERE restaurant_id = p_restaurant_id AND status = 'active';
END;
$$;

-- 1.5 reactivate_restaurant
CREATE OR REPLACE FUNCTION reactivate_restaurant(p_restaurant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.restaurants
  SET suspended = FALSE,
      suspended_reason = NULL,
      suspended_at = NULL,
      ativo = TRUE
  WHERE id = p_restaurant_id;

  UPDATE public.subscriptions
  SET status = 'active',
      suspended_at = NULL,
      failed_payments = 0
  WHERE restaurant_id = p_restaurant_id AND status IN ('past_due', 'pending');
END;
$$;

-- 1.6 approve_affiliate_commission
CREATE OR REPLACE FUNCTION approve_affiliate_commission(
  p_tenant_id        UUID,
  p_valor_assinatura DECIMAL,
  p_referencia_mes   TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ref_mes  TEXT;
  v_updated  INT := 0;
BEGIN
  v_ref_mes := COALESCE(p_referencia_mes, to_char(NOW(), 'YYYY-MM'));

  -- Aprova comissão do vendedor
  UPDATE public.affiliate_referrals
  SET
    status              = 'aprovado',
    valor_assinatura    = COALESCE(valor_assinatura, p_valor_assinatura),
    comissao            = COALESCE(comissao, ROUND(p_valor_assinatura * 0.30, 2)),
    referencia_mes      = COALESCE(referencia_mes, v_ref_mes)
  WHERE tenant_id = p_tenant_id
    AND status    = 'pendente'
    AND (referencia_mes IS NULL OR referencia_mes = v_ref_mes);

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Aprova comissão do líder (se houver)
  UPDATE public.affiliate_referrals
  SET
    lider_status   = 'aprovado',
    lider_comissao = COALESCE(lider_comissao, ROUND(p_valor_assinatura * 0.10, 2))
  WHERE tenant_id  = p_tenant_id
    AND lider_id IS NOT NULL
    AND lider_status = 'pendente'
    AND (referencia_mes IS NULL OR referencia_mes = v_ref_mes);

  RETURN jsonb_build_object(
    'ok', TRUE,
    'tenant_id', p_tenant_id,
    'referencia_mes', v_ref_mes,
    'rows_updated', v_updated
  );
END;
$$;

-- 1.7 affiliate_pending_balance
CREATE OR REPLACE FUNCTION affiliate_pending_balance(p_affiliate_id UUID)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE(SUM(r.comissao), 0)
      + COALESCE((
          SELECT SUM(r2.lider_comissao)
          FROM public.affiliate_referrals r2
          WHERE r2.lider_id = p_affiliate_id
            AND r2.lider_status = 'aprovado'
        ), 0)
  FROM public.affiliate_referrals r
  WHERE r.affiliate_id = p_affiliate_id
    AND r.status = 'aprovado';
$$;

-- =====================================================
-- PARTE 2: POLICIES INSERT MUITO PERMISSIVAS
-- Substituir WITH CHECK (true) por validação real
-- =====================================================

-- 2.1 orders: exigir que restaurant_id aponte para restaurante ativo
DROP POLICY IF EXISTS "Qualquer um pode criar pedido" ON orders;
CREATE POLICY "Qualquer um pode criar pedido" ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
        AND restaurants.ativo = TRUE
    )
  );

-- 2.2 order_items: exigir que order_id referencie pedido existente
DROP POLICY IF EXISTS "Qualquer um pode criar items de pedido" ON order_items;
CREATE POLICY "Qualquer um pode criar items de pedido" ON order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
    )
  );

-- =====================================================
-- PARTE 3: TABELAS COM RLS HABILITADO MAS SEM POLICIES
-- =====================================================

-- 3.1 bonus_fund — apenas admin autenticado pode ler (service_role bypassa RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'bonus_fund'
  ) THEN
    CREATE POLICY "bonus_fund_admin_read" ON bonus_fund
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- 3.2 coupons — leitura pública de cupons ativos, escrita via service_role
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'coupons'
  ) THEN
    CREATE POLICY "coupons_select_active" ON coupons
      FOR SELECT
      TO anon, authenticated
      USING (
        is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR current_uses < max_uses)
      );
  END IF;
END $$;

-- 3.3 onboarding_submissions — dono vê/cria seus próprios registros
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'onboarding_submissions'
  ) THEN
    CREATE POLICY "onboarding_own_access" ON onboarding_submissions
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 3.4 plans — leitura pública de planos ativos (recria caso tenha sido perdida)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'plans'
  ) THEN
    CREATE POLICY "plans_public_read" ON plans
      FOR SELECT
      TO anon, authenticated
      USING (ativo = true);
  END IF;
END $$;

-- 3.5 template_order_items — dono do pedido pode ver seus itens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'template_order_items'
  ) THEN
    CREATE POLICY "toi_select_own" ON template_order_items
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM template_orders
          WHERE template_orders.id = template_order_items.order_id
            AND template_orders.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 3.6 templates — leitura pública (catálogo de templates)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'templates'
  ) THEN
    CREATE POLICY "templates_public_read" ON templates
      FOR SELECT
      TO anon, authenticated
      USING (status = 'active');
  END IF;
END $$;

-- =====================================================
-- FIM da migration 026
-- =====================================================

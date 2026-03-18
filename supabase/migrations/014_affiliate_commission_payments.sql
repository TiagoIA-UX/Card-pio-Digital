-- =====================================================
-- AFILIADOS v5 — Pagamento automático de comissão
--
-- Fluxo:
--   1. Assinatura renovada → approve_affiliate_commission()
--   2. Admin vê painel com saldos pendentes
--   3. Admin clica "Pagar via PIX" → marcar como pago
-- =====================================================

-- 1. Tabela de pagamentos de comissão (histórico de transferências)
CREATE TABLE IF NOT EXISTS affiliate_commission_payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  valor           DECIMAL(10,2) NOT NULL CHECK (valor > 0),
  referencia_mes  TEXT,                       -- '2026-03' (saldo pago)
  metodo          TEXT NOT NULL DEFAULT 'pix' CHECK (metodo IN ('pix','transferencia','credito')),
  chave_pix_usada TEXT,
  observacao      TEXT,
  pago_por        UUID REFERENCES auth.users(id), -- admin que executou
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acp_affiliate_id ON affiliate_commission_payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_acp_created_at   ON affiliate_commission_payments(created_at);

-- RLS: admin only (leitura aberta para o próprio afiliado via referral_select_own)
ALTER TABLE affiliate_commission_payments ENABLE ROW LEVEL SECURITY;

-- Admin vê tudo (usa service_role no servidor, nunca exposto ao front)
-- Afiliado vê apenas seus próprios pagamentos
CREATE POLICY "acp_select_own" ON affiliate_commission_payments
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- 2. Função: aprovar comissão de um tenant/mês automaticamente
-- Chamada pelo webhook quando subscription_authorized_payment é recebido
CREATE OR REPLACE FUNCTION approve_affiliate_commission(
  p_tenant_id       UUID,
  p_valor_assinatura DECIMAL,
  p_referencia_mes  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ref_mes  TEXT;
  v_updated  INT := 0;
BEGIN
  v_ref_mes := COALESCE(p_referencia_mes, to_char(NOW(), 'YYYY-MM'));

  -- Aprova comissão do vendedor
  UPDATE affiliate_referrals
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
  UPDATE affiliate_referrals
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

-- 3. Função: calcular saldo pendente por afiliado
CREATE OR REPLACE FUNCTION affiliate_pending_balance(p_affiliate_id UUID)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(SUM(r.comissao), 0)
      + COALESCE((
          SELECT SUM(r2.lider_comissao)
          FROM affiliate_referrals r2
          WHERE r2.lider_id = p_affiliate_id
            AND r2.lider_status = 'aprovado'
        ), 0)
  FROM affiliate_referrals r
  WHERE r.affiliate_id = p_affiliate_id
    AND r.status = 'aprovado';
$$;

-- 4. View de saldos para o admin
CREATE OR REPLACE VIEW affiliate_balances AS
SELECT
  a.id,
  a.nome,
  a.code,
  a.chave_pix,
  a.cidade,
  a.estado,
  a.status,
  -- Comissão aprovada (pendente de pagamento)
  COALESCE(
    (SELECT SUM(r.comissao)
       FROM affiliate_referrals r
      WHERE r.affiliate_id = a.id AND r.status = 'aprovado'), 0
  ) +
  COALESCE(
    (SELECT SUM(r.lider_comissao)
       FROM affiliate_referrals r
      WHERE r.lider_id = a.id AND r.lider_status = 'aprovado'), 0
  ) AS saldo_aprovado,
  -- Total pago historicamente
  COALESCE(
    (SELECT SUM(p.valor)
       FROM affiliate_commission_payments p
      WHERE p.affiliate_id = a.id), 0
  ) AS total_pago,
  -- Última vez pago
  (SELECT MAX(p.created_at)
     FROM affiliate_commission_payments p
    WHERE p.affiliate_id = a.id) AS ultimo_pagamento
FROM affiliates a
WHERE a.status = 'ativo';

-- admin via service_role não precisa de GRANT explícito (bypassa RLS)
-- mas damos SELECT para anon/authenticated para eventual uso controlado no front
GRANT SELECT ON affiliate_balances TO authenticated;

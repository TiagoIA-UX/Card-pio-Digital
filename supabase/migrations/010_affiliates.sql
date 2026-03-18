-- =====================================================
-- SISTEMA DE AFILIADOS — MVP
-- Rastreamento de indicação + comissão automática
-- Pagamentos manuais via PIX até escalar
-- =====================================================

-- Tabela de afiliados
CREATE TABLE IF NOT EXISTS affiliates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code          TEXT UNIQUE NOT NULL,           -- código curto ex: "tiago123"
  nome          TEXT NOT NULL,
  chave_pix     TEXT,                           -- chave PIX para pagamento
  status        TEXT NOT NULL DEFAULT 'ativo'
                CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de referências (indicações)
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id      UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  tenant_id         UUID,                       -- restaurante indicado
  plano             TEXT,                       -- 'self-service' | 'feito-pra-voce'
  valor_assinatura  DECIMAL(10,2),
  comissao          DECIMAL(10,2),              -- 30% de valor_assinatura
  referencia_mes    TEXT,                       -- '2026-03'
  status            TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'aprovado', 'pago')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS affiliates_user_id_idx       ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS affiliates_code_idx          ON affiliates(code);
CREATE INDEX IF NOT EXISTS referrals_affiliate_id_idx   ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS referrals_tenant_id_idx      ON affiliate_referrals(tenant_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx         ON affiliate_referrals(status);

-- RLS: usuário só vê seus próprios dados
ALTER TABLE affiliates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Políticas para affiliates
CREATE POLICY "afiliado_select_own" ON affiliates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "afiliado_insert_own" ON affiliates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "afiliado_update_own" ON affiliates
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para referrals (via join com affiliates)
CREATE POLICY "referral_select_own" ON affiliate_referrals
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- Service role pode fazer tudo (para o onboarding inserir referrals)
CREATE POLICY "affiliates_service_all" ON affiliates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "referrals_service_all" ON affiliate_referrals
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

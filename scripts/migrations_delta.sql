-- ========================================================================
-- CARDÁPIO DIGITAL — DELTA DE MIGRATIONS (SQL Editor Supabase)
-- Gerado em: 16/03/2026
--
-- Este arquivo aplica APENAS o que está faltando no banco de produção.
-- Não toca em tabelas existentes (restaurants, orders, plans, etc.).
--
-- O QUE ESTE ARQUIVO FAZ:
--   1. Adiciona colunas faltantes em tabelas existentes
--   2. Cria tabela `affiliates` (sistema de afiliados completo)
--   3. Cria tabela `affiliate_referrals`
--   4. Cria tabela `affiliate_bonuses`
--   5. Cria tabela `affiliate_commission_payments`
--   6. Cria tabela `bonus_fund`
--   7. Cria views e funções do sistema de afiliados
--   8. Aplica tiers, constraints e defaults corretos
--
-- INSTRUÇÃO: Cole tudo, clique Run, confirme o aviso (operações seguras).
-- ========================================================================

BEGIN;

-- ========================================================================
-- PARTE 1 — Colunas faltantes em tabelas existentes
-- ========================================================================

-- orders: troco_para (para pagamento em dinheiro)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS troco_para NUMERIC(10,2);

-- orders: origem_pedido (identificador da origem do pedido)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS origem_pedido TEXT;

-- subscriptions: price_brl (valor em BRL do plano)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price_brl DECIMAL(10,2);

-- restaurants: tenant_id (alias de id, para compatibilidade do código)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE restaurants SET tenant_id = id WHERE tenant_id IS NULL;

-- admin_users: role com constraint e email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'admin_users'
      AND column_name  = 'role'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';
  END IF;
END $$;

ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
    CHECK (role IN ('owner', 'admin', 'support'));

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS email TEXT;

-- ========================================================================
-- PARTE 2 — Tabela affiliates
-- ========================================================================

CREATE TABLE IF NOT EXISTS affiliates (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  code            TEXT        UNIQUE NOT NULL,
  nome            TEXT        NOT NULL,
  chave_pix       TEXT,
  status          TEXT        NOT NULL DEFAULT 'ativo'
                  CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  tier            TEXT        NOT NULL DEFAULT 'trainee',
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  lider_id        UUID,       -- FK adicionada após criação abaixo
  avatar_url      TEXT,
  cidade          TEXT,
  estado          TEXT,
  bio             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK de lider_id para a própria tabela (self-referencial)
ALTER TABLE affiliates
  ADD CONSTRAINT fk_affiliates_lider
    FOREIGN KEY (lider_id) REFERENCES affiliates(id)
    ON DELETE SET NULL
    NOT VALID;  -- NOT VALID = não valida linhas existentes (seguro para inicial)

-- Constraint de tier com os 6 níveis corporativos
ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_tier_check;
ALTER TABLE affiliates
  ADD CONSTRAINT affiliates_tier_check
    CHECK (tier IN ('trainee', 'analista', 'coordenador', 'gerente', 'diretor', 'socio'));

-- Índices
CREATE INDEX IF NOT EXISTS affiliates_user_id_idx    ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS affiliates_code_idx       ON affiliates(code);
CREATE INDEX IF NOT EXISTS idx_affiliates_lider_id   ON affiliates(lider_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_tier       ON affiliates(tier);
CREATE INDEX IF NOT EXISTS idx_affiliates_estado     ON affiliates(estado) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_affiliates_cidade     ON affiliates(cidade) WHERE status = 'ativo';

-- RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "afiliado_select_own"   ON affiliates;
DROP POLICY IF EXISTS "afiliado_insert_own"   ON affiliates;
DROP POLICY IF EXISTS "afiliado_update_own"   ON affiliates;
DROP POLICY IF EXISTS "affiliates_service_all" ON affiliates;

CREATE POLICY "afiliado_select_own" ON affiliates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "afiliado_insert_own" ON affiliates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "afiliado_update_own" ON affiliates
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "affiliates_service_all" ON affiliates
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS affiliates_updated_at ON affiliates;
CREATE TRIGGER affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Comments
COMMENT ON COLUMN affiliates.tier IS
  'Tier de carreira: trainee→analista→coordenador→gerente→diretor→socio. DEFAULT=trainee. FONTE DA VERDADE: lib/affiliate-tiers.ts';
COMMENT ON COLUMN affiliates.commission_rate IS
  'Percentual de comissão direta (ex: 30.00, 32.00, 35.00). Atualizado a cada nova indicação.';

-- ========================================================================
-- PARTE 3 — Tabela affiliate_referrals
-- ========================================================================

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id      UUID        REFERENCES affiliates(id) ON DELETE SET NULL,
  tenant_id         UUID,       -- restaurante indicado (restaurants.id)
  plano             TEXT,
  valor_assinatura  DECIMAL(10,2),
  comissao          DECIMAL(10,2),
  referencia_mes    TEXT,
  status            TEXT        NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'aprovado', 'pago')),
  -- Nível 2: líder
  lider_id          UUID        REFERENCES affiliates(id) ON DELETE SET NULL,
  lider_comissao    DECIMAL(10,2),
  lider_status      TEXT        DEFAULT 'pendente'
                    CHECK (lider_status IN ('pendente', 'aprovado', 'pago')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referrals_affiliate_id_idx  ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS referrals_tenant_id_idx     ON affiliate_referrals(tenant_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx        ON affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_lider_id      ON affiliate_referrals(lider_id);

ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referral_select_own"    ON affiliate_referrals;
DROP POLICY IF EXISTS "referrals_service_all"  ON affiliate_referrals;

CREATE POLICY "referral_select_own" ON affiliate_referrals
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "referrals_service_all" ON affiliate_referrals
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================================================
-- PARTE 4 — Tabela affiliate_bonuses
-- ========================================================================

CREATE TABLE IF NOT EXISTS affiliate_bonuses (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID        REFERENCES affiliates(id) ON DELETE CASCADE,
  nivel           INTEGER     NOT NULL,
  valor_bonus     DECIMAL(10,2) NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'pago')),
  referencia_mes  TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bonuses_affiliate_id_idx ON affiliate_bonuses(affiliate_id);

ALTER TABLE affiliate_bonuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bonus_select_own"     ON affiliate_bonuses;
DROP POLICY IF EXISTS "bonuses_service_all"  ON affiliate_bonuses;

CREATE POLICY "bonus_select_own" ON affiliate_bonuses
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "bonuses_service_all" ON affiliate_bonuses
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================================================
-- PARTE 5 — Tabela affiliate_commission_payments
-- ========================================================================

CREATE TABLE IF NOT EXISTS affiliate_commission_payments (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID        NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  valor           DECIMAL(10,2) NOT NULL CHECK (valor > 0),
  referencia_mes  TEXT,
  metodo          TEXT        NOT NULL DEFAULT 'pix'
                  CHECK (metodo IN ('pix','transferencia','credito')),
  chave_pix_usada TEXT,
  observacao      TEXT,
  pago_por        UUID        REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acp_affiliate_id ON affiliate_commission_payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_acp_created_at   ON affiliate_commission_payments(created_at);

ALTER TABLE affiliate_commission_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acp_select_own" ON affiliate_commission_payments;

CREATE POLICY "acp_select_own" ON affiliate_commission_payments
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- ========================================================================
-- PARTE 6 — Tabela bonus_fund
-- ========================================================================

CREATE TABLE IF NOT EXISTS bonus_fund (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo          VARCHAR(20)  NOT NULL CHECK (tipo IN ('entrada', 'bonus', 'rendimento')),
  valor         NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  restaurant_id UUID         REFERENCES restaurants(id) ON DELETE SET NULL,
  affiliate_id  UUID         REFERENCES affiliates(id)  ON DELETE SET NULL,
  descricao     TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bonus_fund_tipo        ON bonus_fund(tipo);
CREATE INDEX IF NOT EXISTS idx_bonus_fund_created_at  ON bonus_fund(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bonus_fund_restaurant  ON bonus_fund(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bonus_fund_affiliate   ON bonus_fund(affiliate_id);

ALTER TABLE bonus_fund ENABLE ROW LEVEL SECURITY;
-- Acesso exclusivo via service_role (webhooks e APIs admin)

COMMENT ON TABLE bonus_fund IS
  'Fundo de bônus de afiliados. 10% de cada taxa de setup entra como tipo=entrada. Bônus pagos saem como tipo=bonus. CDI manual como tipo=rendimento.';

-- ========================================================================
-- PARTE 7 — Views do sistema de afiliados
-- ========================================================================

-- View: ranking público de afiliados
DROP VIEW IF EXISTS affiliate_ranking;
CREATE OR REPLACE VIEW affiliate_ranking AS
WITH
  direto AS (
    SELECT
      r.affiliate_id,
      COUNT(*)                        AS total_indicados,
      COALESCE(SUM(r.comissao), 0)    AS mrr_direto
    FROM affiliate_referrals r
    WHERE r.status IN ('pendente', 'aprovado')
    GROUP BY r.affiliate_id
  ),
  rede AS (
    SELECT
      r.lider_id,
      COUNT(*)                             AS rede_indicados,
      COALESCE(SUM(r.lider_comissao), 0)  AS mrr_rede
    FROM affiliate_referrals r
    WHERE r.lider_id IS NOT NULL
      AND r.lider_status IN ('pendente', 'aprovado')
    GROUP BY r.lider_id
  ),
  recrutados AS (
    SELECT
      lider_id,
      COUNT(*) AS total_vendedores
    FROM affiliates
    WHERE lider_id IS NOT NULL AND status = 'ativo'
    GROUP BY lider_id
  )
SELECT
  a.id,
  a.avatar_url,
  a.cidade,
  a.estado,
  CASE
    WHEN position(' ' IN a.nome) > 0
    THEN split_part(a.nome, ' ', 1) || ' ' || left(split_part(a.nome, ' ', 2), 1) || '.'
    ELSE a.nome
  END                                                       AS nome_publico,
  COALESCE(rc.total_vendedores, 0)                         AS total_vendedores,
  COALESCE(rc.total_vendedores, 0) >= 5                    AS is_lider,
  COALESCE(d.total_indicados, 0)                           AS total_indicados,
  COALESCE(re.rede_indicados, 0)                          AS rede_indicados,
  COALESCE(d.mrr_direto, 0)                               AS mrr_direto,
  COALESCE(re.mrr_rede, 0)                                AS mrr_rede,
  COALESCE(d.mrr_direto, 0) + COALESCE(re.mrr_rede, 0)   AS mrr_estimado,
  RANK() OVER (
    ORDER BY (COALESCE(d.mrr_direto, 0) + COALESCE(re.mrr_rede, 0)) DESC
  ) AS posicao
FROM affiliates a
LEFT JOIN direto d      ON d.affiliate_id = a.id
LEFT JOIN rede re       ON re.lider_id    = a.id
LEFT JOIN recrutados rc ON rc.lider_id    = a.id
WHERE a.status = 'ativo';

GRANT SELECT ON affiliate_ranking TO anon, authenticated;

-- View: mapa de afiliados por cidade
DROP VIEW IF EXISTS affiliate_city_map;
CREATE OR REPLACE VIEW affiliate_city_map AS
SELECT
  COALESCE(a.estado, 'Não informado')  AS estado,
  COALESCE(a.cidade, 'Não informado')  AS cidade,
  COUNT(DISTINCT a.id)                 AS total_afiliados,
  COUNT(DISTINCT r.tenant_id)          AS total_restaurantes
FROM affiliates a
LEFT JOIN affiliate_referrals r
  ON r.affiliate_id = a.id
  AND r.status IN ('aprovado', 'pago')
WHERE a.status = 'ativo'
GROUP BY a.estado, a.cidade
ORDER BY total_restaurantes DESC, total_afiliados DESC;

GRANT SELECT ON affiliate_city_map TO anon, authenticated;

-- View: saldos para o admin
CREATE OR REPLACE VIEW affiliate_balances AS
SELECT
  a.id,
  a.nome,
  a.code,
  a.chave_pix,
  a.cidade,
  a.estado,
  a.status,
  COALESCE(
    (SELECT SUM(r.comissao) FROM affiliate_referrals r
      WHERE r.affiliate_id = a.id AND r.status = 'aprovado'), 0)
  +
  COALESCE(
    (SELECT SUM(r.lider_comissao) FROM affiliate_referrals r
      WHERE r.lider_id = a.id AND r.lider_status = 'aprovado'), 0)
  AS saldo_aprovado,
  COALESCE(
    (SELECT SUM(p.valor) FROM affiliate_commission_payments p
      WHERE p.affiliate_id = a.id), 0)
  AS total_pago,
  COALESCE(
    (SELECT SUM(r.comissao) FROM affiliate_referrals r
      WHERE r.affiliate_id = a.id AND r.status = 'pendente'), 0)
  AS saldo_pendente_analise
FROM affiliates a
WHERE a.status != 'suspenso';

-- View: saldo do fundo de bônus
CREATE OR REPLACE VIEW bonus_fund_saldo AS
SELECT
  GREATEST(
    0,
    COALESCE(SUM(CASE WHEN tipo IN ('entrada', 'rendimento') THEN valor ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN tipo = 'bonus' THEN valor ELSE 0 END), 0)
  ) AS saldo_atual,
  COUNT(*) FILTER (WHERE tipo = 'entrada')     AS total_entradas,
  COUNT(*) FILTER (WHERE tipo = 'bonus')       AS total_saques,
  COUNT(*) FILTER (WHERE tipo = 'rendimento')  AS total_rendimentos,
  COALESCE(SUM(CASE WHEN tipo = 'entrada'     THEN valor ELSE 0 END), 0) AS soma_entradas,
  COALESCE(SUM(CASE WHEN tipo = 'bonus'       THEN valor ELSE 0 END), 0) AS soma_saques,
  COALESCE(SUM(CASE WHEN tipo = 'rendimento'  THEN valor ELSE 0 END), 0) AS soma_rendimentos
FROM bonus_fund;

-- ========================================================================
-- PARTE 8 — Funções do sistema de afiliados
-- ========================================================================

-- Função: aprovar comissão automaticamente após pagamento de assinatura
CREATE OR REPLACE FUNCTION approve_affiliate_commission(
  p_tenant_id        UUID,
  p_valor_assinatura DECIMAL,
  p_referencia_mes   TEXT DEFAULT NULL
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

  UPDATE affiliate_referrals
  SET
    status           = 'aprovado',
    valor_assinatura = COALESCE(valor_assinatura, p_valor_assinatura),
    comissao         = COALESCE(comissao, ROUND(p_valor_assinatura * 0.30, 2)),
    referencia_mes   = COALESCE(referencia_mes, v_ref_mes)
  WHERE tenant_id   = p_tenant_id
    AND status      = 'pendente'
    AND (referencia_mes IS NULL OR referencia_mes = v_ref_mes);

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  UPDATE affiliate_referrals
  SET
    lider_status   = 'aprovado',
    lider_comissao = COALESCE(lider_comissao, ROUND(p_valor_assinatura * 0.10, 2))
  WHERE tenant_id    = p_tenant_id
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

-- Função: saldo pendente por afiliado
CREATE OR REPLACE FUNCTION affiliate_pending_balance(p_affiliate_id UUID)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(SUM(r.comissao), 0)
    + COALESCE(
        (SELECT SUM(r2.lider_comissao)
           FROM affiliate_referrals r2
          WHERE r2.lider_id = p_affiliate_id
            AND r2.lider_status = 'aprovado'), 0)
  FROM affiliate_referrals r
  WHERE r.affiliate_id = p_affiliate_id
    AND r.status = 'aprovado';
$$;

-- ========================================================================
-- PARTE 9 — Owner bootstrap (admin_users seed)
-- ========================================================================
DO $$
DECLARE
  v_owner_email TEXT := 'globemarket7@gmail.com';
  v_user_id     UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_owner_email
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    INSERT INTO admin_users (user_id, email, role)
    VALUES (v_user_id, v_owner_email, 'owner')
    ON CONFLICT (user_id)
    DO UPDATE SET role = 'owner', email = v_owner_email;
  END IF;
END $$;

COMMIT;
-- ========================================================================
-- FIM DO DELTA — todas as tabelas e funções do sistema de afiliados
-- foram criadas. Tabelas existentes (restaurants, orders, plans, etc.)
-- não foram modificadas estruturalmente.
-- ========================================================================

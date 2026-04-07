-- =====================================================
-- 053: Configuração fiscal do delivery (NFC-e direto Sefaz)
-- Armazena certificado A1 e dados fiscais de cada delivery
-- Custo: R$0 — sem intermediário
-- =====================================================
-- Tabela principal de configuração fiscal
CREATE TABLE IF NOT EXISTS fiscal_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  -- Dados do emitente (CNPJ, IE, etc)
  cnpj TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  inscricao_estadual TEXT NOT NULL,
  regime_tributario INTEGER NOT NULL DEFAULT 1,
  -- 1=Simples Nacional
  -- Endereço fiscal
  logradouro TEXT NOT NULL,
  numero TEXT NOT NULL DEFAULT 'S/N',
  bairro TEXT NOT NULL,
  municipio TEXT NOT NULL,
  codigo_municipio TEXT NOT NULL,
  -- Código IBGE 7 dígitos
  uf TEXT NOT NULL CHECK (char_length(uf) = 2),
  cep TEXT NOT NULL,
  -- Certificado A1 (criptografado)
  certificado_storage_path TEXT,
  -- caminho no Supabase Storage (bucket privado)
  certificado_senha_encrypted TEXT,
  -- senha do .pfx (protegida por RLS, só o dono lê)
  certificado_validade TIMESTAMPTZ,
  -- Configurações de emissão
  ambiente TEXT NOT NULL DEFAULT 'homologacao' CHECK (ambiente IN ('homologacao', 'producao')),
  serie_nfce INTEGER NOT NULL DEFAULT 1,
  proximo_numero_nfce INTEGER NOT NULL DEFAULT 1,
  -- NCM e CFOP padrão para os produtos
  ncm_padrao TEXT NOT NULL DEFAULT '21069090',
  -- Preparações alimentícias
  cfop_padrao TEXT NOT NULL DEFAULT '5102',
  -- Venda mercadoria
  csosn_padrao TEXT NOT NULL DEFAULT '102',
  -- Simples Nacional sem crédito
  -- Status
  ativo BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Constraint: 1 config por restaurante
  CONSTRAINT uq_fiscal_config_restaurant UNIQUE (restaurant_id)
);
-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_fiscal_config_restaurant ON fiscal_config(restaurant_id);
-- Trigger updated_at
CREATE TRIGGER trg_fiscal_config_updated_at BEFORE
UPDATE ON fiscal_config FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- Log de notas emitidas
CREATE TABLE IF NOT EXISTS fiscal_notas_emitidas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE
  SET NULL,
    -- Dados da NFC-e
    numero_nfce INTEGER NOT NULL,
    serie INTEGER NOT NULL DEFAULT 1,
    chave_acesso TEXT,
    protocolo TEXT,
    codigo_status INTEGER,
    motivo TEXT,
    -- Valor
    valor_total NUMERIC(10, 2) NOT NULL,
    -- Ambiente
    ambiente TEXT NOT NULL DEFAULT 'homologacao',
    -- Status: autorizada, rejeitada, cancelada
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (
      status IN (
        'pendente',
        'autorizada',
        'rejeitada',
        'cancelada'
      )
    ),
    -- XML armazenado no Storage
    xml_storage_path TEXT,
    -- Timestamps
    emitida_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fiscal_notas_restaurant ON fiscal_notas_emitidas(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_notas_order ON fiscal_notas_emitidas(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_notas_chave ON fiscal_notas_emitidas(chave_acesso);
-- RPC para reservar número sequencial da NFC-e (atômico)
CREATE OR REPLACE FUNCTION get_next_nfce_number(p_restaurant_id UUID) RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE v_numero INTEGER;
BEGIN
UPDATE fiscal_config
SET proximo_numero_nfce = proximo_numero_nfce + 1,
  updated_at = NOW()
WHERE restaurant_id = p_restaurant_id
  AND ativo = true
RETURNING proximo_numero_nfce - 1 INTO v_numero;
IF v_numero IS NULL THEN RAISE EXCEPTION 'Configuração fiscal não encontrada ou inativa para restaurant_id %',
p_restaurant_id;
END IF;
RETURN v_numero;
END;
$$;
-- RLS: dono do restaurante pode ver/editar sua config fiscal
ALTER TABLE fiscal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_notas_emitidas ENABLE ROW LEVEL SECURITY;
-- Policy: dono pode gerenciar sua config
CREATE POLICY fiscal_config_owner ON fiscal_config FOR ALL USING (
  restaurant_id IN (
    SELECT id
    FROM restaurants
    WHERE user_id = auth.uid()
  )
);
CREATE POLICY fiscal_notas_owner ON fiscal_notas_emitidas FOR ALL USING (
  restaurant_id IN (
    SELECT id
    FROM restaurants
    WHERE user_id = auth.uid()
  )
);
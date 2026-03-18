-- =====================================================
-- Migration 022 — Corrigir defaults/constraints de affiliates
--
-- PROBLEMA: migration 017 não está wrapped em transação.
-- Se o passo 4 (ADD CONSTRAINT) executou mas o passo 5
-- (SET DEFAULT 'trainee') não, o banco ficou com:
--   CHECK (tier IN ('trainee', ...))   ← nova constraint
--   DEFAULT 'vendedor'                 ← valor antigo da 012
-- → qualquer INSERT sem tier explícito usa DEFAULT 'vendedor'
--   → viola CHECK → "Erro ao criar afiliado" no cadastro.
--
-- FIX: reaplicar idempotentemente os valores corretos.
-- =====================================================

-- 1. Garantir que commission_rate existe (caso migration 017 não tenha rodado)
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 30.00;

-- 2. Remover constraint atual (seja ela a nova OU a antiga)
ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_tier_check;

-- 3. Corrigir linhas com tier legado antes de recriar a constraint
UPDATE affiliates
  SET tier = 'trainee'
  WHERE tier IS NULL
     OR tier NOT IN ('trainee', 'analista', 'coordenador', 'gerente', 'diretor', 'socio');

-- 4. Garantir que o DEFAULT é 'trainee' ANTES de adicionar a constraint
--    (este é o passo que pode ter falhado em 017)
ALTER TABLE affiliates ALTER COLUMN tier SET DEFAULT 'trainee';

-- 5. Recriar constraint correta
ALTER TABLE affiliates
  ADD CONSTRAINT affiliates_tier_check
    CHECK (tier IN ('trainee', 'analista', 'coordenador', 'gerente', 'diretor', 'socio'));

-- 6. Backfill commission_rate onde está 0 (possível rollback parcial de 017)
UPDATE affiliates
  SET commission_rate = CASE tier
    WHEN 'socio'   THEN 35.00
    WHEN 'diretor' THEN 32.00
    ELSE 30.00
  END
  WHERE commission_rate = 0 OR commission_rate IS NULL;

COMMENT ON COLUMN affiliates.tier IS
  'Tier de carreira: trainee→analista→coordenador→gerente→diretor→socio. '
  'DEFAULT=trainee. FONTE DA VERDADE: lib/affiliate-tiers.ts';

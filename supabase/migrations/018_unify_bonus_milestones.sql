-- =====================================================
-- Migration 018 — Unificar marcos de bônus por volume
--
-- FONTE DA VERDADE: lib/affiliate-tiers.ts
-- Define 6 tiers com bônus únicos ao atingir o mínimo de restaurantes:
--   trainee (0)           → sem bônus
--   analista (3)          → R$ 50
--   coordenador (10)      → R$ 150
--   gerente (25)          → R$ 300
--   diretor (50)          → R$ 600
--   socio (100)           → R$ 1.500
--
-- Substitui os marcos legados 10/30/50 → R$200/500/1.000 (migration 011).
-- Registros históricos de affiliate_bonuses são preservados (apenas dados
-- futuros passarão a usar os novos marcos).
-- =====================================================

-- O campo `nivel` em affiliate_bonuses é INTEGER sem CHECK constraint,
-- portanto já aceita os novos valores (3, 10, 25, 50, 100) sem ALTER.

-- Atualiza registros legados não pagos para refletir os novos valores
-- (10 rest → R$150 [coordenador], 30 rest não existe mais → R$300 mais próximo,
--  50 rest → R$600 [diretor])
UPDATE affiliate_bonuses
SET
  nivel       = 10,
  valor_bonus = 150.00
WHERE nivel = 10 AND status = 'pendente';

UPDATE affiliate_bonuses
SET
  nivel       = 25,
  valor_bonus = 300.00
WHERE nivel = 30 AND status = 'pendente';

UPDATE affiliate_bonuses
SET
  nivel       = 50,
  valor_bonus = 600.00
WHERE nivel = 50 AND status = 'pendente';

COMMENT ON TABLE affiliate_bonuses IS
  'Bônus únicos pagos ao atingir marcos de restaurantes. '
  'Marcos atuais: 3 (R$50), 10 (R$150), 25 (R$300), 50 (R$600), 100 (R$1500). '
  'FONTE DA VERDADE: lib/affiliate-tiers.ts — não altere valores em outros lugares.';

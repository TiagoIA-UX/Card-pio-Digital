-- =====================================================
-- Migration 020 — Escala de bônus corrigida (v5 definitivo)
--
-- Nova escala aprovada (proporcional ao volume):
--   trainee     (0  rest) → R$  0   (sem bônus)
--   analista    (3  rest) → R$  0   (sem bônus)
--   coordenador (10 rest) → R$ 10
--   gerente     (25 rest) → R$ 25
--   diretor     (50 rest) → R$ 50
--   socio      (100 rest) → R$100   ← corrigido (era R$50)
--
-- Total acumulado 0→100 rest: R$185
-- Empresa fatura R$3.900+/mês com 100 restaurantes — margem sustentável.
-- FONTE DA VERDADE: lib/affiliate-tiers.ts
-- =====================================================

-- Atualiza apenas registros PENDENTES (direito adquirido nunca é reduzido)
UPDATE affiliate_bonuses SET valor_bonus =  10.00 WHERE nivel = 10  AND status = 'pendente';
UPDATE affiliate_bonuses SET valor_bonus =  25.00 WHERE nivel = 25  AND status = 'pendente';
UPDATE affiliate_bonuses SET valor_bonus =  50.00 WHERE nivel = 50  AND status = 'pendente';
UPDATE affiliate_bonuses SET valor_bonus = 100.00 WHERE nivel = 100 AND status = 'pendente';

-- Zera bônus de níveis sem prêmio (trainee=0 / analista=3 não tem bônus)
UPDATE affiliate_bonuses SET valor_bonus =   0.00 WHERE nivel IN (0, 3) AND status = 'pendente';

-- Atualiza comentário da tabela para refletir nova escala
COMMENT ON TABLE affiliate_bonuses IS
  'Bônus únicos pagos ao atingir marcos de restaurantes. '
  'Escala v5: 10→R$10, 25→R$25, 50→R$50, 100→R$100. '
  'Total acumulado 0→100 rest: R$185 (margem empresa: ~59% por restaurante). '
  'FONTE DA VERDADE: lib/affiliate-tiers.ts — não altere valores em outros lugares.';

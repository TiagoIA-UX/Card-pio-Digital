-- =====================================================
-- Migration 020 — Corrige escala de bônus do nível Sócio
--
-- Migration 019 fixou socio (100 rest) em R$50 igualando ao Diretor.
-- Nova escala aprovada:
--   coordenador (10)  → R$10
--   gerente     (25)  → R$25
--   diretor     (50)  → R$50
--   socio      (100)  → R$100  ← corrigido aqui
--
-- Total acumulado 0→100 rest: R$185 (era R$135 após migration 019).
-- Empresa fatura R$3.900+/mês com 100 restaurantes — margem sustentável.
-- FONTE DA VERDADE: lib/affiliate-tiers.ts
-- =====================================================

-- Atualiza apenas registros PENDENTES (direito adquirido preservado)
UPDATE affiliate_bonuses
SET valor_bonus = 100.00
WHERE nivel = 100 AND status = 'pendente';

-- Atualiza comentário da tabela para refletir nova escala
COMMENT ON TABLE affiliate_bonuses IS
  'Bônus únicos pagos ao atingir marcos de restaurantes. '
  'Marcos atuais (v4): 10→R$10, 25→R$25, 50→R$50, 100→R$100. '
  'Total acumulado 0→100 rest: R$185 (margem empresa: ~59% por restaurante). '
  'FONTE DA VERDADE: lib/affiliate-tiers.ts — não altere valores em outros lugares.';

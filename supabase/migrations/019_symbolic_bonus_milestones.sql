-- =====================================================
-- Migration 019 — Bônus simbólicos (auditoria financeira)
--
-- Reduz bônus por volume para valores que não comprometem a margem.
-- Margem atual: ~59% por restaurante ativo c/ afiliado (R$35-39/mês).
--
-- Bônus antigos (acumulado 0→100 rest): R$2.600  ← insustentável
-- Bônus novos  (acumulado 0→100 rest): R$  135  ← simbólico ✅
--
-- Nova escala (FONTE: lib/affiliate-tiers.ts):
--   trainee   (0)   → R$0
--   analista  (3)   → R$0   (primeiro marco real é em 10 rest)
--   coordenador(10) → R$10  (empresa já fatura R$390+/mês com 10 rest)
--   gerente  (25)   → R$25  (empresa fatura R$975+/mês com 25 rest)
--   diretor  (50)   → R$50  (empresa fatura R$1.900+/mês com 50 rest)
--   socio   (100)   → R$50  (bônus não escala além do Diretor)
-- =====================================================

-- Atualiza registros PENDENTES com valores do esquema antigo
UPDATE affiliate_bonuses
SET valor_bonus = 0.00
WHERE nivel = 3 AND status = 'pendente';

UPDATE affiliate_bonuses
SET valor_bonus = 10.00
WHERE nivel = 10 AND status = 'pendente';

UPDATE affiliate_bonuses
SET valor_bonus = 25.00
WHERE nivel = 25 AND status = 'pendente';

UPDATE affiliate_bonuses
SET valor_bonus = 50.00
WHERE nivel = 50 AND status = 'pendente';

UPDATE affiliate_bonuses
SET valor_bonus = 50.00
WHERE nivel = 100 AND status = 'pendente';

-- Registros já PAGOS não são alterados (direito adquirido)

COMMENT ON TABLE affiliate_bonuses IS
  'Bônus únicos pagos ao atingir marcos de restaurantes. '
  'Marcos atuais (v3, simbólicos): 10→R$10, 25→R$25, 50→R$50, 100→R$50. '
  'Total acumulado 0→100 rest: R$135 (margem empresa: ~59% por restaurante). '
  'FONTE DA VERDADE: lib/affiliate-tiers.ts — não altere valores em outros lugares.';

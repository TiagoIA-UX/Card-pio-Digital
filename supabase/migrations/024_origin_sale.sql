-- =====================================================
-- 024: Coluna origin_sale para rastreamento de canal de venda
-- Permite distinguir vendas diretas do admin x afiliados x orgânicas
-- Guard de comissão: admin_direct → 0% comissão afiliado
-- =====================================================

-- Adicionar coluna na tabela restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS origin_sale TEXT DEFAULT 'organic';

-- Constraint para garantir valores válidos
ALTER TABLE restaurants
  ADD CONSTRAINT chk_origin_sale
  CHECK (origin_sale IN ('organic', 'affiliate', 'admin_direct'));

-- Index para queries de relatório por canal
CREATE INDEX IF NOT EXISTS idx_restaurants_origin_sale
  ON restaurants (origin_sale);

-- Comentário para documentação
COMMENT ON COLUMN restaurants.origin_sale IS
  'Canal de origem da venda: organic (site/tráfego), affiliate (indicação), admin_direct (venda presencial do admin - 100% receita)';

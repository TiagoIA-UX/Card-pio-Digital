-- ========================================
-- Chave PIX do Delivery
-- Migração 046
-- ========================================
-- Permite que o dono do delivery cadastre sua chave PIX
-- para ser exibida aos clientes no checkout de pedidos.
-- ========================================
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS chave_pix TEXT DEFAULT NULL;
COMMENT ON COLUMN public.restaurants.chave_pix IS 'Chave PIX do delivery (CPF, CNPJ, email, telefone ou aleatória) exibida ao cliente no checkout';
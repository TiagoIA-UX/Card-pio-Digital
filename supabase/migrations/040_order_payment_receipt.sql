-- =============================================
-- MIGRATION 040: comprovante PIX em orders
-- =============================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS comprovante_url TEXT;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS comprovante_key TEXT;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS comprovante_enviado_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN orders.comprovante_url IS 'URL pública do comprovante anexado ao pedido';
COMMENT ON COLUMN orders.comprovante_key IS 'Chave do comprovante no bucket R2';
COMMENT ON COLUMN orders.comprovante_enviado_at IS 'Data e hora do envio do comprovante';
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS template_slug VARCHAR(30) DEFAULT 'restaurante',
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS endereco_texto TEXT,
  ADD COLUMN IF NOT EXISTS customizacao JSONB DEFAULT '{}'::jsonb;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS origem_pedido VARCHAR(20) DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS mesa_numero VARCHAR(20);

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_origem_pedido_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_origem_pedido_check
  CHECK (origem_pedido IN ('online', 'mesa'));

CREATE INDEX IF NOT EXISTS idx_orders_origem_pedido ON orders(origem_pedido);
CREATE INDEX IF NOT EXISTS idx_orders_mesa_numero ON orders(mesa_numero);
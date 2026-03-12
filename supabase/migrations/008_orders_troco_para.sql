-- Adiciona coluna troco_para na tabela orders para pedidos pagos em dinheiro
ALTER TABLE orders ADD COLUMN IF NOT EXISTS troco_para DECIMAL(10,2);

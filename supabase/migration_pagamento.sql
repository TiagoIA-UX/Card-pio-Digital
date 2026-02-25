-- =============================================
-- MIGRAÇÃO: Adicionar campos de pagamento e template
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Adicionar campos de controle de pagamento na tabela restaurants
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS status_pagamento VARCHAR(20) DEFAULT 'pendente' 
  CHECK (status_pagamento IN ('pendente', 'aguardando', 'ativo', 'expirado', 'cancelado'));

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS plano VARCHAR(20) DEFAULT 'free'
  CHECK (plano IN ('free', 'self-service', 'feito-pra-voce'));

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(10,2) DEFAULT 0;

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMP WITH TIME ZONE;

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS comprovante_url TEXT;

-- Campo para template escolhido
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'restaurante'
  CHECK (template IN ('restaurante', 'pizzaria', 'lanchonete', 'bar', 'cafeteria', 'acai', 'sushi'));

-- Índice para buscar por status de pagamento
CREATE INDEX IF NOT EXISTS idx_restaurants_status_pagamento ON restaurants(status_pagamento);

-- =============================================
-- Para ativar um cliente após receber o PIX:
-- =============================================
-- UPDATE restaurants 
-- SET 
--   status_pagamento = 'ativo',
--   plano = 'self-service',
--   valor_pago = 297.00,
--   data_pagamento = NOW()
-- WHERE slug = 'nome-do-restaurante';

-- =============================================
-- Para ver todos os pagamentos pendentes:
-- =============================================
-- SELECT nome, slug, telefone, template, plano, created_at 
-- FROM restaurants 
-- WHERE status_pagamento = 'aguardando'
-- ORDER BY created_at DESC;

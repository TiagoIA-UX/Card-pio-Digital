-- Cupom para primeiros clientes e conhecidos
-- 20% de desconto, máximo 10 usos, válido por 60 dias
-- Código: GANHEI20%

-- Garante que a tabela coupons existe (caso migrations rodem sem schema completo)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_uses, expires_at, is_active)
VALUES (
  'GANHEI20%',
  'percentage',
  20,
  0,
  10,
  NOW() + INTERVAL '60 days',
  true
)
ON CONFLICT (code) DO UPDATE SET
  discount_value = EXCLUDED.discount_value,
  max_uses = EXCLUDED.max_uses,
  expires_at = EXCLUDED.expires_at,
  is_active = EXCLUDED.is_active;

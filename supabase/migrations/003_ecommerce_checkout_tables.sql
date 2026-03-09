-- =====================================================
-- E-COMMERCE / ONBOARDING CHECKOUT TABLES
-- Garante as tabelas usadas por template checkout e onboarding
-- =====================================================

CREATE TABLE IF NOT EXISTS template_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_id UUID,
  payment_method TEXT,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_orders_user ON template_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_template_orders_status ON template_orders(status);
CREATE INDEX IF NOT EXISTS idx_template_orders_number ON template_orders(order_number);

CREATE TABLE IF NOT EXISTS template_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID,
  template_id UUID,
  template_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_order_items_order ON template_order_items(order_id);

CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  template_id UUID,
  order_id UUID,
  license_key TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON user_purchases(user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'coupons'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'template_orders_coupon_id_fkey'
  ) THEN
    ALTER TABLE template_orders
      ADD CONSTRAINT template_orders_coupon_id_fkey
      FOREIGN KEY (coupon_id) REFERENCES coupons(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'template_orders_user_id_fkey'
  ) THEN
    ALTER TABLE template_orders
      ADD CONSTRAINT template_orders_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'templates'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'template_order_items_template_id_fkey'
  ) THEN
    ALTER TABLE template_order_items
      ADD CONSTRAINT template_order_items_template_id_fkey
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'template_order_items_order_id_fkey'
  ) THEN
    ALTER TABLE template_order_items
      ADD CONSTRAINT template_order_items_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES template_orders(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_purchases_user_id_fkey'
  ) THEN
    ALTER TABLE user_purchases
      ADD CONSTRAINT user_purchases_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'templates'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_purchases_template_id_fkey'
  ) THEN
    ALTER TABLE user_purchases
      ADD CONSTRAINT user_purchases_template_id_fkey
      FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_purchases_order_id_fkey'
  ) THEN
    ALTER TABLE user_purchases
      ADD CONSTRAINT user_purchases_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES template_orders(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE template_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'template_orders'
      AND policyname = 'Usuários podem ver próprios pedidos'
  ) THEN
    CREATE POLICY "Usuários podem ver próprios pedidos" ON template_orders
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_purchases'
      AND policyname = 'Usuários podem ver próprias compras'
  ) THEN
    CREATE POLICY "Usuários podem ver próprias compras" ON user_purchases
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS trigger_template_orders_updated_at ON template_orders;
    CREATE TRIGGER trigger_template_orders_updated_at
      BEFORE UPDATE ON template_orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

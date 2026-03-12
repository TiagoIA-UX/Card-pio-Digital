-- =============================================
-- CARDÁPIO DIGITAL - SCHEMA SQL
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: restaurants
-- =============================================
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  slogan VARCHAR(255),
  cor_primaria VARCHAR(7) DEFAULT '#f97316',
  cor_secundaria VARCHAR(7) DEFAULT '#ea580c',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_restaurants_user_id ON restaurants(user_id);

-- =============================================
-- TABELA: products
-- =============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  imagem_url TEXT,
  categoria VARCHAR(100) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_products_restaurant ON products(restaurant_id);
CREATE INDEX idx_products_categoria ON products(restaurant_id, categoria);
CREATE INDEX idx_products_ativo ON products(restaurant_id, ativo);

-- =============================================
-- TABELA: orders
-- =============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  numero_pedido INTEGER NOT NULL,
  cliente_nome VARCHAR(255),
  cliente_telefone VARCHAR(20),
  tipo_entrega VARCHAR(20) DEFAULT 'retirada' CHECK (tipo_entrega IN ('entrega', 'retirada')),
  endereco_rua VARCHAR(255),
  endereco_bairro VARCHAR(100),
  endereco_complemento VARCHAR(255),
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, numero_pedido)
);

-- Índices
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(restaurant_id, status);
CREATE INDEX idx_orders_created ON orders(restaurant_id, created_at DESC);

-- =============================================
-- TABELA: order_items
-- =============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  nome_snapshot VARCHAR(255) NOT NULL,
  preco_snapshot NUMERIC(10,2) NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- =============================================
-- SEQUENCE: Para número de pedido por restaurante
-- Usando função para garantir sequência isolada
-- =============================================
CREATE OR REPLACE FUNCTION get_next_order_number(p_restaurant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(numero_pedido), 0) + 1 
  INTO next_num
  FROM orders
  WHERE restaurant_id = p_restaurant_id
  FOR UPDATE;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Auto-update updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_restaurants_updated
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RESTAURANTS: Dono pode ver/editar, público pode ver restaurantes ativos
CREATE POLICY "Restaurantes públicos são visíveis"
  ON restaurants FOR SELECT
  USING (ativo = true);

CREATE POLICY "Dono pode ver seu restaurante"
  ON restaurants FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Dono pode editar seu restaurante"
  ON restaurants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário autenticado pode criar restaurante"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- PRODUCTS: Públicos se restaurante ativo, dono pode CRUD
CREATE POLICY "Produtos de restaurantes ativos são visíveis"
  ON products FOR SELECT
  USING (
    ativo = true AND
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = products.restaurant_id 
      AND restaurants.ativo = true
    )
  );

CREATE POLICY "Dono pode ver todos seus produtos"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = products.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Dono pode criar produtos"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = products.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Dono pode editar produtos"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = products.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Dono pode deletar produtos"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = products.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- ORDERS: Qualquer um pode criar, dono pode ver/editar
CREATE POLICY "Qualquer um pode criar pedido"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Dono pode ver pedidos do restaurante"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = orders.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Dono pode atualizar pedidos"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = orders.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- ORDER_ITEMS: Segue regras do pedido pai
CREATE POLICY "Qualquer um pode criar items de pedido"
  ON order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Dono pode ver items dos pedidos"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_items.order_id
      AND restaurants.user_id = auth.uid()
    )
  );

-- =============================================
-- STORAGE BUCKET (executar separadamente)
-- =============================================
-- No Supabase Dashboard > Storage:
-- 1. Criar bucket "images" 
-- 2. Tornar público
-- 3. Adicionar políticas:

-- Policy para upload (apenas autenticado):
-- CREATE POLICY "Usuários autenticados podem fazer upload"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Policy para visualização pública:
-- CREATE POLICY "Imagens são públicas"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'images');

-- =============================================
-- E-COMMERCE: TEMPLATES
-- =============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 247,
  original_price DECIMAL(10,2),
  category TEXT NOT NULL DEFAULT 'restaurante',
  image_url TEXT,
  preview_url TEXT,
  features JSONB DEFAULT '[]',
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  sales_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(2,1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_status ON templates(status);
CREATE INDEX IF NOT EXISTS idx_templates_featured ON templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug);

-- =============================================
-- E-COMMERCE: AVALIAÇÕES
-- =============================================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_template ON reviews(template_id);

-- =============================================
-- E-COMMERCE: CARRINHO
-- =============================================
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);

-- =============================================
-- E-COMMERCE: CUPONS
-- =============================================
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

-- =============================================
-- E-COMMERCE: PEDIDOS DE TEMPLATES
-- =============================================
CREATE TABLE IF NOT EXISTS template_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  coupon_id UUID REFERENCES coupons(id),
  payment_method TEXT,
  payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_orders_user ON template_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_template_orders_status ON template_orders(status);
CREATE INDEX IF NOT EXISTS idx_template_orders_number ON template_orders(order_number);

-- =============================================
-- E-COMMERCE: ITENS DO PEDIDO
-- =============================================
CREATE TABLE IF NOT EXISTS template_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES template_orders(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_order_items_order ON template_order_items(order_id);

-- =============================================
-- E-COMMERCE: COMPRAS/LICENÇAS
-- =============================================
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  order_id UUID REFERENCES template_orders(id) ON DELETE SET NULL,
  license_key TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON user_purchases(user_id);

-- =============================================
-- RLS: E-COMMERCE
-- =============================================
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates são públicos" ON templates 
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem gerenciar próprio carrinho" ON cart_items 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver próprios pedidos" ON template_orders 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver próprias compras" ON user_purchases 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Reviews são públicas" ON reviews 
  FOR SELECT USING (true);

CREATE POLICY "Usuários podem criar reviews" ON reviews 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- FUNÇÕES: E-COMMERCE
-- =============================================

-- Gerar license key
CREATE OR REPLACE FUNCTION generate_license_key()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(
    substr(md5(random()::text), 1, 4) || '-' ||
    substr(md5(random()::text), 1, 4) || '-' ||
    substr(md5(random()::text), 1, 4) || '-' ||
    substr(md5(random()::text), 1, 4)
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar license key
CREATE OR REPLACE FUNCTION set_license_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.license_key IS NULL THEN
    NEW.license_key := generate_license_key();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_license_key ON user_purchases;
CREATE TRIGGER trigger_set_license_key
  BEFORE INSERT ON user_purchases
  FOR EACH ROW
  EXECUTE FUNCTION set_license_key();

-- Incrementar uso do cupom
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons 
  SET current_uses = current_uses + 1 
  WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DADOS INICIAIS: TEMPLATES
-- =============================================
INSERT INTO templates (slug, name, description, price, original_price, category, image_url, is_featured, is_new, is_bestseller, sales_count, rating_avg, rating_count)
VALUES 
  ('restaurante', 'Restaurante / Marmitaria', 'Cardápio ideal para restaurantes, marmitarias e self-service. Organizado por pratos executivos, porções e bebidas.', 247, 297, 'restaurante', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80', true, false, true, 156, 4.8, 42),
  ('pizzaria', 'Pizzaria', 'Cardápio completo para pizzarias com opções de tamanhos, sabores e bordas recheadas.', 247, 297, 'pizzaria', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', true, false, false, 89, 4.7, 28),
  ('lanchonete', 'Hamburgueria / Lanchonete', 'Cardápio para lanchonetes e hamburguerias artesanais. Com adicionais e combos personalizados.', 247, 297, 'lanchonete', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80', false, true, false, 67, 4.9, 19),
  ('bar', 'Bar / Pub', 'Cardápio para bares, pubs e casas noturnas. Com drinks, cervejas artesanais e petiscos.', 247, 297, 'bar', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80', false, false, false, 34, 4.6, 12),
  ('cafeteria', 'Cafeteria', 'Cardápio para cafeterias, padarias e confeitarias. Com cafés especiais, doces e salgados.', 247, 297, 'cafeteria', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80', false, true, false, 45, 4.8, 15),
  ('acai', 'Açaíteria', 'Cardápio para açaíterias e lanchonetes naturais. Com tigelas, copos e adicionais.', 247, 297, 'acai', 'https://images.unsplash.com/photo-1590080874088-eec64895b423?w=600&auto=format&fit=crop&q=80', false, false, false, 28, 4.5, 9),
  ('sushi', 'Japonês / Sushi', 'Cardápio para restaurantes japoneses e sushis. Com sashimis, rolls e temakis.', 247, 297, 'sushi', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&auto=format&fit=crop&q=80', true, false, false, 52, 4.7, 18)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- DADOS INICIAIS: CUPONS
-- =============================================
INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_uses, expires_at)
VALUES 
  ('BEMVINDO10', 'percentage', 10, 0, 100, NOW() + INTERVAL '30 days'),
  ('DESCONTO50', 'fixed', 50, 200, 50, NOW() + INTERVAL '15 days')
ON CONFLICT (code) DO NOTHING;

-- =============================================
-- FUNÇÕES RPC ADICIONAIS
-- =============================================

-- Incrementar contador de vendas do template
CREATE OR REPLACE FUNCTION increment_template_sales(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE templates 
  SET sales_count = sales_count + 1 
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se usuário tem acesso a um template
CREATE OR REPLACE FUNCTION user_has_template_access(p_user_id UUID, p_template_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_purchases 
    WHERE user_id = p_user_id 
    AND template_id = p_template_id 
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gerar número de pedido único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FIM DO SCHEMA
-- =============================================
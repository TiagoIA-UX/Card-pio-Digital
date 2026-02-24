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
-- DADOS DE EXEMPLO (opcional)
-- =============================================
-- Descomente para criar um restaurante de teste

/*
INSERT INTO restaurants (user_id, nome, slug, telefone, slogan)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Pizzaria Demo',
  'pizzaria-demo',
  '5511999999999',
  'A melhor pizza da cidade!'
);

INSERT INTO products (restaurant_id, nome, descricao, preco, categoria)
VALUES 
  ((SELECT id FROM restaurants WHERE slug = 'pizzaria-demo'), 'Pizza Margherita', 'Molho de tomate, mussarela e manjericão', 45.90, 'Pizzas'),
  ((SELECT id FROM restaurants WHERE slug = 'pizzaria-demo'), 'Pizza Calabresa', 'Calabresa, cebola e mussarela', 42.90, 'Pizzas'),
  ((SELECT id FROM restaurants WHERE slug = 'pizzaria-demo'), 'Coca-Cola 2L', 'Refrigerante 2 litros', 12.00, 'Bebidas');
*/

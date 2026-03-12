-- =============================================
-- MIGRATION: Categorias e Template do Restaurante
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Adicionar campo template_slug no restaurante
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS template_slug TEXT DEFAULT 'lanchonete';

-- 2. Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_ordem ON categories(restaurant_id, ordem);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_categories_updated ON categories;
CREATE TRIGGER trigger_categories_updated
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS para categorias
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categorias de restaurantes ativos são visíveis publicamente
CREATE POLICY "Categorias públicas são visíveis"
  ON categories FOR SELECT
  USING (
    ativo = true AND
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = categories.restaurant_id 
      AND restaurants.ativo = true
    )
  );

-- Dono pode ver todas suas categorias
CREATE POLICY "Dono pode ver suas categorias"
  ON categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = categories.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Dono pode criar categorias
CREATE POLICY "Dono pode criar categorias"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = categories.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Dono pode editar categorias
CREATE POLICY "Dono pode editar categorias"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = categories.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Dono pode deletar categorias
CREATE POLICY "Dono pode deletar categorias"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = categories.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- 3. Adicionar campo categoria_id nos produtos (referência opcional)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- 4. Criar tabela de admins master
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para admins
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver lista de admins"
  ON admin_users FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- 5. Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM admin_users WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Políticas adicionais para admins acessarem tudo
CREATE POLICY "Admins podem ver todos restaurantes"
  ON restaurants FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins podem editar todos restaurantes"
  ON restaurants FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins podem ver todos produtos"
  ON products FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins podem editar todos produtos"
  ON products FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins podem deletar todos produtos"
  ON products FOR DELETE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins podem ver todas categorias"
  ON categories FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins podem editar todas categorias"
  ON categories FOR UPDATE
  USING (is_admin(auth.uid()));

-- 7. View para listar clientes com seus restaurantes
CREATE OR REPLACE VIEW admin_clients_view AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  r.id as restaurant_id,
  r.nome as restaurant_name,
  r.slug,
  r.template_slug,
  r.ativo,
  r.plan_slug,
  (SELECT COUNT(*) FROM products WHERE restaurant_id = r.id) as total_products,
  (SELECT COUNT(*) FROM orders WHERE restaurant_id = r.id) as total_orders
FROM auth.users u
LEFT JOIN restaurants r ON r.user_id = u.id
ORDER BY u.created_at DESC;

-- Dar permissão para admins na view
GRANT SELECT ON admin_clients_view TO authenticated;

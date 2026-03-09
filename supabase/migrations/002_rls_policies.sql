-- =====================================================
-- PIZZADIGITAL SAAS - ROW LEVEL SECURITY POLICIES
-- Isolamento total entre tenants
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_crusts ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_flavors ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Plans não precisa de RLS (público)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS: plans (Público - todos podem ler)
-- =====================================================
DROP POLICY IF EXISTS "plans_select_all" ON plans;
CREATE POLICY "plans_select_all" ON plans
  FOR SELECT
  TO authenticated, anon
  USING (ativo = true);

-- =====================================================
-- POLÍTICAS: tenants
-- =====================================================

-- Leitura pública do tenant (para cardápio público)
DROP POLICY IF EXISTS "tenants_select_public" ON tenants;
CREATE POLICY "tenants_select_public" ON tenants
  FOR SELECT
  TO anon
  USING (ativo = true);

-- Usuários autenticados veem seu próprio tenant
DROP POLICY IF EXISTS "tenants_select_own" ON tenants;
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT
  TO authenticated
  USING (
    id = get_current_tenant_id()
    OR ativo = true -- Para ver cardápio de outros
  );

-- Apenas owner pode atualizar tenant
DROP POLICY IF EXISTS "tenants_update_own" ON tenants;
CREATE POLICY "tenants_update_own" ON tenants
  FOR UPDATE
  TO authenticated
  USING (id = get_current_tenant_id() AND is_tenant_owner())
  WITH CHECK (id = get_current_tenant_id() AND is_tenant_owner());

-- Insert é feito via função de onboarding (service role)

-- =====================================================
-- POLÍTICAS: users
-- =====================================================

-- Usuário vê apenas usuários do seu tenant
DROP POLICY IF EXISTS "users_select_own_tenant" ON users;
CREATE POLICY "users_select_own_tenant" ON users
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- Usuário pode atualizar seu próprio perfil
DROP POLICY IF EXISTS "users_update_self" ON users;
CREATE POLICY "users_update_self" ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Owner pode gerenciar usuários do tenant
DROP POLICY IF EXISTS "users_insert_owner" ON users;
CREATE POLICY "users_insert_owner" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_tenant_id() AND is_tenant_owner());

DROP POLICY IF EXISTS "users_delete_owner" ON users;
CREATE POLICY "users_delete_owner" ON users
  FOR DELETE
  TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_tenant_owner() AND id != auth.uid());

-- =====================================================
-- POLÍTICAS: subscriptions
-- =====================================================

DROP POLICY IF EXISTS "subscriptions_select_own" ON subscriptions;
CREATE POLICY "subscriptions_select_own" ON subscriptions
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- Updates via service role apenas

-- =====================================================
-- POLÍTICAS: categories
-- =====================================================

-- Público pode ver categorias ativas
DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT
  TO anon
  USING (ativo = true);

-- Autenticados veem suas categorias
DROP POLICY IF EXISTS "categories_select_own" ON categories;
CREATE POLICY "categories_select_own" ON categories
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR ativo = true -- Para ver cardápio de outros
  );

-- CRUD próprio tenant
DROP POLICY IF EXISTS "categories_insert_own" ON categories;
CREATE POLICY "categories_insert_own" ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "categories_update_own" ON categories;
CREATE POLICY "categories_update_own" ON categories
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "categories_delete_own" ON categories;
CREATE POLICY "categories_delete_own" ON categories
  FOR DELETE
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- POLÍTICAS: products
-- =====================================================

DROP POLICY IF EXISTS "products_select_public" ON products;
CREATE POLICY "products_select_public" ON products
  FOR SELECT
  TO anon
  USING (disponivel = true);

DROP POLICY IF EXISTS "products_select_own" ON products;
CREATE POLICY "products_select_own" ON products
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR disponivel = true
  );

DROP POLICY IF EXISTS "products_insert_own" ON products;
CREATE POLICY "products_insert_own" ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "products_update_own" ON products;
CREATE POLICY "products_update_own" ON products
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "products_delete_own" ON products;
CREATE POLICY "products_delete_own" ON products
  FOR DELETE
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- POLÍTICAS: product_sizes
-- =====================================================

DROP POLICY IF EXISTS "product_sizes_select_public" ON product_sizes;
CREATE POLICY "product_sizes_select_public" ON product_sizes
  FOR SELECT
  TO anon
  USING (ativo = true);

DROP POLICY IF EXISTS "product_sizes_select_own" ON product_sizes;
CREATE POLICY "product_sizes_select_own" ON product_sizes
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR ativo = true
  );

DROP POLICY IF EXISTS "product_sizes_insert_own" ON product_sizes;
CREATE POLICY "product_sizes_insert_own" ON product_sizes
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "product_sizes_update_own" ON product_sizes;
CREATE POLICY "product_sizes_update_own" ON product_sizes
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "product_sizes_delete_own" ON product_sizes;
CREATE POLICY "product_sizes_delete_own" ON product_sizes
  FOR DELETE
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- POLÍTICAS: product_crusts
-- =====================================================

DROP POLICY IF EXISTS "product_crusts_select_public" ON product_crusts;
CREATE POLICY "product_crusts_select_public" ON product_crusts
  FOR SELECT
  TO anon
  USING (disponivel = true);

DROP POLICY IF EXISTS "product_crusts_select_own" ON product_crusts;
CREATE POLICY "product_crusts_select_own" ON product_crusts
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR disponivel = true
  );

DROP POLICY IF EXISTS "product_crusts_insert_own" ON product_crusts;
CREATE POLICY "product_crusts_insert_own" ON product_crusts
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "product_crusts_update_own" ON product_crusts;
CREATE POLICY "product_crusts_update_own" ON product_crusts
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "product_crusts_delete_own" ON product_crusts;
CREATE POLICY "product_crusts_delete_own" ON product_crusts
  FOR DELETE
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- POLÍTICAS: product_flavors
-- =====================================================

DROP POLICY IF EXISTS "product_flavors_select_public" ON product_flavors;
CREATE POLICY "product_flavors_select_public" ON product_flavors
  FOR SELECT
  TO anon
  USING (disponivel = true);

DROP POLICY IF EXISTS "product_flavors_select_own" ON product_flavors;
CREATE POLICY "product_flavors_select_own" ON product_flavors
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR disponivel = true
  );

DROP POLICY IF EXISTS "product_flavors_insert_own" ON product_flavors;
CREATE POLICY "product_flavors_insert_own" ON product_flavors
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "product_flavors_update_own" ON product_flavors;
CREATE POLICY "product_flavors_update_own" ON product_flavors
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "product_flavors_delete_own" ON product_flavors;
CREATE POLICY "product_flavors_delete_own" ON product_flavors
  FOR DELETE
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- POLÍTICAS: add_ons
-- =====================================================

DROP POLICY IF EXISTS "add_ons_select_public" ON add_ons;
CREATE POLICY "add_ons_select_public" ON add_ons
  FOR SELECT
  TO anon
  USING (disponivel = true);

DROP POLICY IF EXISTS "add_ons_select_own" ON add_ons;
CREATE POLICY "add_ons_select_own" ON add_ons
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR disponivel = true
  );

DROP POLICY IF EXISTS "add_ons_insert_own" ON add_ons;
CREATE POLICY "add_ons_insert_own" ON add_ons
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "add_ons_update_own" ON add_ons;
CREATE POLICY "add_ons_update_own" ON add_ons
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "add_ons_delete_own" ON add_ons;
CREATE POLICY "add_ons_delete_own" ON add_ons
  FOR DELETE
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- POLÍTICAS: promotions
-- =====================================================

DROP POLICY IF EXISTS "promotions_select_public" ON promotions;
CREATE POLICY "promotions_select_public" ON promotions
  FOR SELECT
  TO anon
  USING (ativo = true AND (data_fim IS NULL OR data_fim > NOW()));

DROP POLICY IF EXISTS "promotions_select_own" ON promotions;
CREATE POLICY "promotions_select_own" ON promotions
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR (ativo = true AND (data_fim IS NULL OR data_fim > NOW()))
  );

DROP POLICY IF EXISTS "promotions_insert_own" ON promotions;
CREATE POLICY "promotions_insert_own" ON promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "promotions_update_own" ON promotions;
CREATE POLICY "promotions_update_own" ON promotions
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "promotions_delete_own" ON promotions;
CREATE POLICY "promotions_delete_own" ON promotions
  FOR DELETE
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- =====================================================
-- POLÍTICAS: orders
-- =====================================================

-- Pedidos são privados do tenant
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- Anon pode criar pedidos (checkout público)
DROP POLICY IF EXISTS "orders_insert_anon" ON orders;
CREATE POLICY "orders_insert_anon" ON orders
  FOR INSERT
  TO anon
  WITH CHECK (true); -- Validação feita na API

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "orders_update_own" ON orders;
CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE
  TO authenticated
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Não permite deletar pedidos, apenas cancelar

-- =====================================================
-- POLÍTICAS: order_items
-- =====================================================

DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
CREATE POLICY "order_items_select_own" ON order_items
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS "order_items_insert_anon" ON order_items;
CREATE POLICY "order_items_insert_anon" ON order_items
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "order_items_insert_own" ON order_items;
CREATE POLICY "order_items_insert_own" ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = get_current_tenant_id());

-- =====================================================
-- POLÍTICAS: metrics_daily
-- =====================================================

DROP POLICY IF EXISTS "metrics_daily_select_own" ON metrics_daily;
CREATE POLICY "metrics_daily_select_own" ON metrics_daily
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_tenant_id());

-- Insert/Update via função (service role)

-- =====================================================
-- POLÍTICAS: audit_logs
-- =====================================================

DROP POLICY IF EXISTS "audit_logs_select_own" ON audit_logs;
CREATE POLICY "audit_logs_select_own" ON audit_logs
  FOR SELECT
  TO authenticated
  USING (tenant_id = get_current_tenant_id() AND is_tenant_owner());

-- Insert via trigger (service role)

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Garantir que anon pode acessar tabelas públicas
GRANT SELECT ON plans TO anon;
GRANT SELECT ON tenants TO anon;
GRANT SELECT ON categories TO anon;
GRANT SELECT ON products TO anon;
GRANT SELECT ON product_sizes TO anon;
GRANT SELECT ON product_crusts TO anon;
GRANT SELECT ON product_flavors TO anon;
GRANT SELECT ON add_ons TO anon;
GRANT SELECT ON promotions TO anon;
GRANT INSERT ON orders TO anon;
GRANT INSERT ON order_items TO anon;

-- Authenticated tem acesso completo às suas tabelas
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON categories TO authenticated;
GRANT ALL ON products TO authenticated;
GRANT ALL ON product_sizes TO authenticated;
GRANT ALL ON product_crusts TO authenticated;
GRANT ALL ON product_flavors TO authenticated;
GRANT ALL ON add_ons TO authenticated;
GRANT ALL ON promotions TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON metrics_daily TO authenticated;
GRANT SELECT ON audit_logs TO authenticated;
GRANT SELECT ON plans TO authenticated;

-- Sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

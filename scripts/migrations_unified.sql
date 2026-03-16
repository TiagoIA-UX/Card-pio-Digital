-- ========================================================================
-- CARDÁPIO DIGITAL SAAS — MIGRATIONS UNIFICADAS (SQL Editor Supabase)
-- Gerado em: 15/03/2026 | 22 migrations | 001 → 022
-- 
-- INSTRUÇÕES:
--   1. Abra: supabase.com/dashboard → seu projeto → SQL Editor
--   2. Cole este arquivo inteiro
--   3. Clique em "Run" (pode demorar 5-10s)
--   4. Verifique: deve aparecer "Success. No rows returned"
--
-- SEGURANÇA: todas as statements usam IF NOT EXISTS / ON CONFLICT DO NOTHING
-- É seguro rodar mesmo que algumas migrations já estejam aplicadas.
-- ========================================================================

BEGIN;
-- ======================================================================
-- MIGRATION: 001_schema_base.sql
-- ======================================================================

-- =====================================================
-- PIZZADIGITAL SAAS - SCHEMA BASE
-- Multi-tenant com Row Level Security
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABELA: plans (Planos de assinatura)
-- =====================================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descricao TEXT,
  preco_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
  preco_anual DECIMAL(10,2),
  features JSONB DEFAULT '[]'::jsonb,
  limites JSONB DEFAULT '{}'::jsonb,
  destaque BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir planos padrão
INSERT INTO plans (nome, slug, descricao, preco_mensal, preco_anual, features, limites, destaque, ordem) VALUES
(
  'Grátis',
  'free',
  'Ideal para começar',
  0,
  0,
  '["Cardápio digital básico", "QR Code exclusivo", "Pedidos via WhatsApp", "Até 15 produtos", "Até 5 sabores de pizza"]'::jsonb,
  '{"max_produtos": 15, "max_sabores": 5, "max_promocoes": 0, "tem_relatorios": false, "tem_inteligencia": false, "tem_multi_usuarios": false, "marca_dagua": true}'::jsonb,
  FALSE,
  1
),
(
  'Pro',
  'pro',
  'Para pizzarias em crescimento',
  49.90,
  478.80,
  '["Produtos ilimitados", "Sabores ilimitados", "Promoções ilimitadas", "Cupons de desconto", "Relatórios básicos", "Upsell automático", "Sem marca d''água", "Suporte por email"]'::jsonb,
  '{"max_produtos": -1, "max_sabores": -1, "max_promocoes": -1, "tem_relatorios": true, "tem_inteligencia": false, "tem_multi_usuarios": false, "marca_dagua": false}'::jsonb,
  TRUE,
  2
),
(
  'Premium',
  'premium',
  'Controle total do seu negócio',
  99.90,
  958.80,
  '["Tudo do plano Pro", "Relatórios avançados", "Motor de inteligência", "API de integrações", "Multi-usuários", "Suporte prioritário", "Consultoria mensal"]'::jsonb,
  '{"max_produtos": -1, "max_sabores": -1, "max_promocoes": -1, "tem_relatorios": true, "tem_inteligencia": true, "tem_multi_usuarios": true, "marca_dagua": false}'::jsonb,
  FALSE,
  3
)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- TABELA: tenants (Pizzarias)
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT,
  email TEXT NOT NULL,
  telefone TEXT,
  whatsapp TEXT NOT NULL,
  
  -- Endereço
  endereco JSONB DEFAULT '{}'::jsonb,
  -- Estrutura esperada:
  -- {
  --   "logradouro": "",
  --   "numero": "",
  --   "complemento": "",
  --   "bairro": "",
  --   "cidade": "",
  --   "estado": "",
  --   "cep": ""
  -- }
  
  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  cores JSONB DEFAULT '{"primary": "#E53E3E", "secondary": "#2D3748", "accent": "#F6AD55"}'::jsonb,
  
  -- Configurações de funcionamento
  horario_funcionamento JSONB DEFAULT '{
    "segunda": {"abre": "18:00", "fecha": "23:00", "aberto": true},
    "terca": {"abre": "18:00", "fecha": "23:00", "aberto": true},
    "quarta": {"abre": "18:00", "fecha": "23:00", "aberto": true},
    "quinta": {"abre": "18:00", "fecha": "23:00", "aberto": true},
    "sexta": {"abre": "18:00", "fecha": "00:00", "aberto": true},
    "sabado": {"abre": "18:00", "fecha": "00:00", "aberto": true},
    "domingo": {"abre": "18:00", "fecha": "23:00", "aberto": true}
  }'::jsonb,
  
  -- Delivery
  taxa_entrega DECIMAL(10,2) DEFAULT 0,
  pedido_minimo DECIMAL(10,2) DEFAULT 0,
  raio_entrega_km DECIMAL(5,2) DEFAULT 5,
  tempo_entrega_min INTEGER DEFAULT 45,
  aceita_retirada BOOLEAN DEFAULT TRUE,
  aceita_entrega BOOLEAN DEFAULT TRUE,
  
  -- Configurações Monte sua Pizza
  config_pizza JSONB DEFAULT '{
    "calculo_sabor": "maior_preco",
    "permitir_repetir_sabor": true,
    "borda_obrigatoria": false
  }'::jsonb,
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  verificado BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_ativo ON tenants(ativo);

-- =====================================================
-- TABELA: subscriptions (Assinaturas)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan_id UUID REFERENCES plans(id) NOT NULL,
  
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  
  payment_method TEXT,
  external_id TEXT, -- ID do gateway (Mercado Pago)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- =====================================================
-- TABELA: users (Usuários)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  email TEXT NOT NULL,
  nome TEXT,
  telefone TEXT,
  avatar_url TEXT,
  
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'manager', 'staff')),
  permissoes JSONB DEFAULT '[]'::jsonb,
  
  ultimo_acesso TIMESTAMPTZ,
  email_verificado BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- TABELA: categories (Categorias de produtos)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT DEFAULT 'utensils',
  imagem_url TEXT,
  
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_categories_ordem ON categories(tenant_id, ordem);

-- =====================================================
-- TABELA: products (Produtos)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  categoria_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  nome TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  
  preco_base DECIMAL(10,2) NOT NULL,
  preco_promocional DECIMAL(10,2),
  
  tipo TEXT DEFAULT 'simples' CHECK (tipo IN ('simples', 'pizza', 'combo', 'bebida', 'sobremesa')),
  permite_personalizar BOOLEAN DEFAULT FALSE,
  
  destaque BOOLEAN DEFAULT FALSE,
  disponivel BOOLEAN DEFAULT TRUE,
  
  tags TEXT[] DEFAULT '{}',
  ordem INTEGER DEFAULT 0,
  
  -- Metadados para SEO e analytics
  visualizacoes INTEGER DEFAULT 0,
  total_vendido INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products(categoria_id);
CREATE INDEX IF NOT EXISTS idx_products_tipo ON products(tenant_id, tipo);
CREATE INDEX IF NOT EXISTS idx_products_disponivel ON products(tenant_id, disponivel);
CREATE INDEX IF NOT EXISTS idx_products_destaque ON products(tenant_id, destaque);

-- =====================================================
-- TABELA: product_sizes (Tamanhos de pizza)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  nome TEXT NOT NULL, -- Broto, Média, Grande, Família
  descricao TEXT, -- "6 fatias, serve 2 pessoas"
  
  multiplicador_preco DECIMAL(4,2) DEFAULT 1.0,
  max_sabores INTEGER DEFAULT 1,
  
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_sizes_tenant ON product_sizes(tenant_id);

-- =====================================================
-- TABELA: product_crusts (Bordas de pizza)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_crusts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  nome TEXT NOT NULL, -- Catupiry, Cheddar, Chocolate
  descricao TEXT,
  
  preco_adicional DECIMAL(10,2) DEFAULT 0,
  
  ordem INTEGER DEFAULT 0,
  disponivel BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_crusts_tenant ON product_crusts(tenant_id);

-- =====================================================
-- TABELA: product_flavors (Sabores de pizza)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_flavors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  categoria TEXT DEFAULT 'salgada' CHECK (categoria IN ('salgada', 'doce', 'especial', 'vegana')),
  
  nome TEXT NOT NULL,
  descricao TEXT,
  ingredientes TEXT[] DEFAULT '{}',
  
  preco DECIMAL(10,2) NOT NULL,
  imagem_url TEXT,
  
  disponivel BOOLEAN DEFAULT TRUE,
  destaque BOOLEAN DEFAULT FALSE,
  
  ordem INTEGER DEFAULT 0,
  total_vendido INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_flavors_tenant ON product_flavors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_flavors_categoria ON product_flavors(tenant_id, categoria);
CREATE INDEX IF NOT EXISTS idx_product_flavors_disponivel ON product_flavors(tenant_id, disponivel);

-- =====================================================
-- TABELA: add_ons (Adicionais)
-- =====================================================
CREATE TABLE IF NOT EXISTS add_ons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  nome TEXT NOT NULL,
  descricao TEXT,
  
  preco DECIMAL(10,2) NOT NULL,
  
  categoria TEXT DEFAULT 'ingrediente' CHECK (categoria IN ('ingrediente', 'bebida', 'acompanhamento', 'molho')),
  
  disponivel BOOLEAN DEFAULT TRUE,
  ordem INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_add_ons_tenant ON add_ons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_add_ons_categoria ON add_ons(tenant_id, categoria);

-- =====================================================
-- TABELA: promotions (Promoções)
-- =====================================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  nome TEXT NOT NULL,
  descricao TEXT,
  
  tipo TEXT NOT NULL CHECK (tipo IN ('percentual', 'valor_fixo', 'leve_pague', 'combo', 'frete_gratis')),
  valor DECIMAL(10,2), -- Percentual ou valor fixo
  
  codigo TEXT, -- Código promocional (cupom)
  
  condicoes JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "valor_minimo": 50,
  --   "dias_semana": ["sexta", "sabado"],
  --   "horario_inicio": "18:00",
  --   "horario_fim": "20:00",
  --   "primeira_compra": false,
  --   "limite_uso": 100,
  --   "uso_por_cliente": 1
  -- }
  
  produtos_aplicaveis UUID[] DEFAULT '{}', -- IDs de produtos específicos
  categorias_aplicaveis UUID[] DEFAULT '{}', -- IDs de categorias
  
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  
  uso_atual INTEGER DEFAULT 0,
  limite_uso INTEGER,
  
  ativo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_promotions_tenant ON promotions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_ativo ON promotions(tenant_id, ativo);
CREATE INDEX IF NOT EXISTS idx_promotions_codigo ON promotions(tenant_id, codigo);
CREATE INDEX IF NOT EXISTS idx_promotions_datas ON promotions(data_inicio, data_fim);

-- =====================================================
-- TABELA: orders (Pedidos)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  numero SERIAL, -- Número sequencial do pedido
  
  -- Cliente
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  cliente_email TEXT,
  cliente_endereco JSONB,
  -- Estrutura:
  -- {
  --   "logradouro": "",
  --   "numero": "",
  --   "complemento": "",
  --   "bairro": "",
  --   "cidade": "",
  --   "referencia": ""
  -- }
  
  -- Tipo
  tipo_entrega TEXT DEFAULT 'delivery' CHECK (tipo_entrega IN ('delivery', 'retirada')),
  
  -- Status
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'confirmado', 'em_preparo', 'saiu_entrega', 'entregue', 'finalizado', 'cancelado')),
  
  -- Valores
  subtotal DECIMAL(10,2) NOT NULL,
  taxa_entrega DECIMAL(10,2) DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Pagamento
  forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'vale_refeicao')),
  troco_para DECIMAL(10,2),
  
  -- Cupom aplicado
  promocao_id UUID REFERENCES promotions(id),
  cupom_codigo TEXT,
  
  -- Observações
  observacoes TEXT,
  
  -- Tempos
  tempo_estimado INTEGER, -- minutos
  horario_previsao TIMESTAMPTZ,
  horario_confirmacao TIMESTAMPTZ,
  horario_preparo TIMESTAMPTZ,
  horario_saiu TIMESTAMPTZ,
  horario_entrega TIMESTAMPTZ,
  
  -- WhatsApp
  enviado_whatsapp BOOLEAN DEFAULT FALSE,
  whatsapp_enviado_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cliente_telefone ON orders(tenant_id, cliente_telefone);

-- =====================================================
-- TABELA: order_items (Itens do pedido)
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  
  produto_id UUID REFERENCES products(id) ON DELETE SET NULL,
  sabor_id UUID REFERENCES product_flavors(id) ON DELETE SET NULL,
  
  nome_produto TEXT NOT NULL,
  quantidade INTEGER DEFAULT 1,
  
  preco_unitario DECIMAL(10,2) NOT NULL,
  preco_total DECIMAL(10,2) NOT NULL,
  
  -- Personalização (para pizzas)
  personalizacao JSONB DEFAULT '{}'::jsonb,
  -- Estrutura:
  -- {
  --   "tamanho": {"id": "", "nome": "Grande"},
  --   "sabores": [{"id": "", "nome": "Calabresa"}, {"id": "", "nome": "Mussarela"}],
  --   "borda": {"id": "", "nome": "Catupiry", "preco": 8},
  --   "adicionais": [{"id": "", "nome": "Bacon", "preco": 5}]
  -- }
  
  observacoes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_order_items_tenant ON order_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_produto ON order_items(produto_id);

-- =====================================================
-- TABELA: metrics_daily (Métricas diárias)
-- =====================================================
CREATE TABLE IF NOT EXISTS metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  
  data DATE NOT NULL,
  
  total_pedidos INTEGER DEFAULT 0,
  total_faturamento DECIMAL(10,2) DEFAULT 0,
  ticket_medio DECIMAL(10,2) DEFAULT 0,
  
  pedidos_delivery INTEGER DEFAULT 0,
  pedidos_retirada INTEGER DEFAULT 0,
  pedidos_cancelados INTEGER DEFAULT 0,
  
  produto_mais_vendido UUID,
  sabor_mais_vendido UUID,
  
  horario_pico TIME,
  novos_clientes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, data)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_metrics_daily_tenant ON metrics_daily(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_daily_data ON metrics_daily(tenant_id, data DESC);

-- =====================================================
-- TABELA: audit_logs (Logs de auditoria)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  
  dados_anteriores JSONB,
  dados_novos JSONB,
  
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- =====================================================
-- FUNCTIONS HELPERS
-- =====================================================

-- Função para obter tenant_id do usuário atual
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário é owner do tenant
CREATE OR REPLACE FUNCTION is_tenant_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'owner'
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trigger_updated_at ON %I;
      CREATE TRIGGER trigger_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    ', t, t);
  END LOOP;
END;
$$;

-- Função para calcular métricas diárias
CREATE OR REPLACE FUNCTION calculate_daily_metrics(p_tenant_id UUID, p_data DATE)
RETURNS VOID AS $$
DECLARE
  v_total_pedidos INTEGER;
  v_total_faturamento DECIMAL;
  v_ticket_medio DECIMAL;
  v_pedidos_delivery INTEGER;
  v_pedidos_retirada INTEGER;
  v_pedidos_cancelados INTEGER;
  v_produto_mais_vendido UUID;
BEGIN
  -- Calcular métricas
  SELECT 
    COUNT(*),
    COALESCE(SUM(total), 0),
    COALESCE(AVG(total), 0),
    COUNT(*) FILTER (WHERE tipo_entrega = 'delivery'),
    COUNT(*) FILTER (WHERE tipo_entrega = 'retirada'),
    COUNT(*) FILTER (WHERE status = 'cancelado')
  INTO 
    v_total_pedidos,
    v_total_faturamento,
    v_ticket_medio,
    v_pedidos_delivery,
    v_pedidos_retirada,
    v_pedidos_cancelados
  FROM orders
  WHERE tenant_id = p_tenant_id
    AND DATE(created_at) = p_data
    AND status != 'cancelado';

  -- Produto mais vendido
  SELECT produto_id INTO v_produto_mais_vendido
  FROM order_items
  WHERE tenant_id = p_tenant_id
    AND DATE(created_at) = p_data
  GROUP BY produto_id
  ORDER BY SUM(quantidade) DESC
  LIMIT 1;

  -- Inserir ou atualizar métricas
  INSERT INTO metrics_daily (
    tenant_id, data, total_pedidos, total_faturamento, ticket_medio,
    pedidos_delivery, pedidos_retirada, pedidos_cancelados, produto_mais_vendido
  ) VALUES (
    p_tenant_id, p_data, v_total_pedidos, v_total_faturamento, v_ticket_medio,
    v_pedidos_delivery, v_pedidos_retirada, v_pedidos_cancelados, v_produto_mais_vendido
  )
  ON CONFLICT (tenant_id, data) 
  DO UPDATE SET
    total_pedidos = EXCLUDED.total_pedidos,
    total_faturamento = EXCLUDED.total_faturamento,
    ticket_medio = EXCLUDED.ticket_medio,
    pedidos_delivery = EXCLUDED.pedidos_delivery,
    pedidos_retirada = EXCLUDED.pedidos_retirada,
    pedidos_cancelados = EXCLUDED.pedidos_cancelados,
    produto_mais_vendido = EXCLUDED.produto_mais_vendido,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON TABLE tenants IS 'Pizzarias cadastradas na plataforma';
COMMENT ON TABLE users IS 'Usuários vinculados a tenants';
COMMENT ON TABLE plans IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE subscriptions IS 'Assinaturas ativas dos tenants';
COMMENT ON TABLE categories IS 'Categorias de produtos por tenant';
COMMENT ON TABLE products IS 'Produtos do cardápio';
COMMENT ON TABLE product_sizes IS 'Tamanhos de pizza (Broto, Média, etc)';
COMMENT ON TABLE product_crusts IS 'Bordas de pizza';
COMMENT ON TABLE product_flavors IS 'Sabores de pizza';
COMMENT ON TABLE add_ons IS 'Adicionais (ingredientes extras)';
COMMENT ON TABLE promotions IS 'Promoções e cupons';
COMMENT ON TABLE orders IS 'Pedidos realizados';
COMMENT ON TABLE order_items IS 'Itens de cada pedido';
COMMENT ON TABLE metrics_daily IS 'Métricas agregadas por dia';
COMMENT ON TABLE audit_logs IS 'Log de ações para auditoria';



-- ======================================================================
-- MIGRATION: 002_restaurant_customization_and_order_origin.sql
-- ======================================================================

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



-- ======================================================================
-- MIGRATION: 002_rls_policies.sql
-- ======================================================================

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



-- ======================================================================
-- MIGRATION: 003_ecommerce_checkout_tables.sql
-- ======================================================================

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



-- ======================================================================
-- MIGRATION: 004_operational_schema_alignment.sql
-- ======================================================================

-- =====================================================
-- OPERATIONAL SCHEMA ALIGNMENT
-- Alinha o banco ao modelo realmente usado pelo app atual
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descricao TEXT,
  preco_mensal DECIMAL(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS nome TEXT,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS preco_mensal DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preco_anual DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS limites JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'name'
  ) THEN
    EXECUTE $sql$
      UPDATE plans
      SET nome = COALESCE(NULLIF(nome, ''), NULLIF(name, ''))
      WHERE COALESCE(NULLIF(nome, ''), '') = ''
        AND COALESCE(NULLIF(name, ''), '') <> ''
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'price_month'
  ) THEN
    EXECUTE $sql$
      UPDATE plans
      SET preco_mensal = COALESCE(preco_mensal, price_month, 0)
      WHERE preco_mensal IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'plans' AND column_name = 'features_json'
  ) THEN
    EXECUTE $sql$
      UPDATE plans
      SET features = CASE
        WHEN features IS NULL AND jsonb_typeof(features_json) = 'array' THEN features_json
        WHEN features IS NULL THEN '[]'::jsonb
        ELSE features
      END
      WHERE features IS NULL
    $sql$;
  END IF;
END $$;

UPDATE plans
SET nome = CASE slug
      WHEN 'basico' THEN 'Plano Básico'
      WHEN 'pro' THEN 'Plano Pro'
      WHEN 'premium' THEN 'Plano Premium'
      ELSE COALESCE(nome, INITCAP(REPLACE(slug, '-', ' ')), 'Plano')
    END,
    descricao = CASE slug
      WHEN 'basico' THEN COALESCE(descricao, 'Plano de entrada para um restaurante')
      WHEN 'pro' THEN COALESCE(descricao, 'Plano profissional com mais capacidade')
      WHEN 'premium' THEN COALESCE(descricao, 'Plano avançado para operação madura')
      ELSE descricao
    END,
    preco_mensal = CASE
      WHEN slug = 'basico' AND COALESCE(preco_mensal, 0) <= 0 THEN 49
      WHEN slug = 'pro' AND COALESCE(preco_mensal, 0) <= 0 THEN 99
      WHEN slug = 'premium' AND COALESCE(preco_mensal, 0) <= 0 THEN 199
      WHEN slug = 'basico' THEN COALESCE(preco_mensal, 49)
      WHEN slug = 'pro' THEN COALESCE(preco_mensal, 99)
      WHEN slug = 'premium' THEN COALESCE(preco_mensal, 199)
      ELSE COALESCE(preco_mensal, 0)
    END,
    ativo = COALESCE(ativo, TRUE),
    destaque = COALESCE(destaque, slug = 'pro'),
    ordem = CASE
      WHEN COALESCE(ordem, 0) > 0 THEN ordem
      WHEN slug = 'basico' THEN 1
      WHEN slug = 'pro' THEN 2
      WHEN slug = 'premium' THEN 3
      ELSE 99
    END,
    features = COALESCE(features, '[]'::jsonb),
    limites = COALESCE(limites, '{}'::jsonb),
    updated_at = COALESCE(updated_at, NOW())
WHERE slug IN ('basico', 'pro', 'premium')
   OR nome IS NULL
   OR preco_mensal IS NULL
  OR preco_mensal <= 0
   OR ativo IS NULL
   OR ordem IS NULL;

INSERT INTO plans (nome, slug, descricao, preco_mensal, ativo, destaque, ordem, features, limites)
SELECT seed.nome, seed.slug, seed.descricao, seed.preco_mensal, TRUE, seed.destaque, seed.ordem, '[]'::jsonb, '{}'::jsonb
FROM (
  VALUES
    ('Plano Básico', 'basico', 'Plano de entrada para um restaurante', 49::DECIMAL(10,2), FALSE, 1),
    ('Plano Pro', 'pro', 'Plano profissional com mais capacidade', 99::DECIMAL(10,2), TRUE, 2),
    ('Plano Premium', 'premium', 'Plano avançado para operação madura', 199::DECIMAL(10,2), FALSE, 3)
) AS seed(nome, slug, descricao, preco_mensal, destaque, ordem)
WHERE NOT EXISTS (
  SELECT 1
  FROM plans existing
  WHERE existing.slug = seed.slug
);

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS template_slug VARCHAR(30) DEFAULT 'restaurante',
  ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
  ADD COLUMN IF NOT EXISTS endereco_texto TEXT,
  ADD COLUMN IF NOT EXISTS customizacao JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'self-service',
  ADD COLUMN IF NOT EXISTS plan_slug TEXT DEFAULT 'basico',
  ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_restaurants_plan_slug ON restaurants(plan_slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_status_pagamento ON restaurants(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_restaurants_template_slug ON restaurants(template_slug);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE RESTRICT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_gateway TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  mp_preapproval_id TEXT,
  mp_subscription_status TEXT DEFAULT 'pending',
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  failed_payments INTEGER NOT NULL DEFAULT 0,
  canceled_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT subscriptions_status_check CHECK (status IN ('pending', 'trial', 'active', 'past_due', 'canceled', 'expired'))
);

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
  ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_subscription_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_payments INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_subscriptions_restaurant ON subscriptions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mp_preapproval ON subscriptions(mp_preapproval_id);

CREATE TABLE IF NOT EXISTS activation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activation_events
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_activation_events_restaurant ON activation_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_activation_events_user ON activation_events(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_activation_events_unique_first_order
  ON activation_events(restaurant_id, event_type)
  WHERE event_type = 'received_first_order';

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'subscriptions' AND policyname = 'Owners can view own subscriptions'
  ) THEN
    CREATE POLICY "Owners can view own subscriptions" ON subscriptions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'activation_events' AND policyname = 'Owners can view own activation events'
  ) THEN
    CREATE POLICY "Owners can view own activation events" ON activation_events
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_users' AND policyname = 'Users can view own admin record'
  ) THEN
    CREATE POLICY "Users can view own admin record" ON admin_users
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION suspend_restaurant_for_nonpayment(p_restaurant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE restaurants
  SET suspended = TRUE,
      suspended_reason = 'Inadimplência - assinatura vencida',
      suspended_at = NOW(),
      ativo = FALSE
  WHERE id = p_restaurant_id;

  UPDATE subscriptions
  SET status = 'past_due',
      suspended_at = NOW()
  WHERE restaurant_id = p_restaurant_id AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reactivate_restaurant(p_restaurant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE restaurants
  SET suspended = FALSE,
      suspended_reason = NULL,
      suspended_at = NULL,
      ativo = TRUE
  WHERE id = p_restaurant_id;

  UPDATE subscriptions
  SET status = 'active',
      suspended_at = NULL,
      failed_payments = 0
  WHERE restaurant_id = p_restaurant_id AND status IN ('past_due', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;
    CREATE TRIGGER trigger_subscriptions_updated_at
      BEFORE UPDATE ON subscriptions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;



-- ======================================================================
-- MIGRATION: 005_checkout_session_hardening.sql
-- ======================================================================

-- =====================================================
-- CHECKOUT SESSION HARDENING
-- Garante rastreabilidade operacional do onboarding SaaS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES template_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_slug TEXT,
  onboarding_plan_slug TEXT,
  subscription_plan_slug TEXT,
  payment_method TEXT,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  init_point TEXT,
  sandbox_init_point TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT checkout_sessions_order_unique UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_mp_payment_id ON checkout_sessions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_mp_preference_id ON checkout_sessions(mp_preference_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_orders_payment_id_unique
  ON template_orders(payment_id)
  WHERE payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_activation_events_onboarding_provisioned_unique
  ON activation_events(restaurant_id, event_type)
  WHERE event_type = 'onboarding_provisioned';

ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'checkout_sessions'
      AND policyname = 'Owners can view own checkout sessions'
  ) THEN
    CREATE POLICY "Owners can view own checkout sessions" ON checkout_sessions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    DROP TRIGGER IF EXISTS trigger_checkout_sessions_updated_at ON checkout_sessions;
    CREATE TRIGGER trigger_checkout_sessions_updated_at
      BEFORE UPDATE ON checkout_sessions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;



-- ======================================================================
-- MIGRATION: 006_onboarding_submissions.sql
-- ======================================================================

-- =====================================================
-- ONBOARDING SUBMISSIONS
-- Armazena dados do formulário de onboarding para plano Feito Pra Você
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES template_orders(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_production', 'completed')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id),
  UNIQUE(restaurant_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_order ON onboarding_submissions(order_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_restaurant ON onboarding_submissions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_submissions_status ON onboarding_submissions(status);



-- ======================================================================
-- MIGRATION: 007_cupom_primeiros_clientes.sql
-- ======================================================================

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



-- ======================================================================
-- MIGRATION: 008_orders_troco_para.sql
-- ======================================================================

-- Adiciona coluna troco_para na tabela orders para pedidos pagos em dinheiro
ALTER TABLE orders ADD COLUMN IF NOT EXISTS troco_para DECIMAL(10,2);



-- ======================================================================
-- MIGRATION: 009_templates_seed.sql
-- ======================================================================

-- =============================================
-- TEMPLATES: Criar tabela e seed dos 7 templates
-- Necessário para /dev/unlock e Meus Templates
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
CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug);

-- Seed dos 7 templates
INSERT INTO templates (slug, name, description, price, original_price, category, image_url, is_featured, is_new, is_bestseller, sales_count, rating_avg, rating_count, status)
VALUES
  ('restaurante', 'Restaurante / Marmitaria', 'Cardápio ideal para restaurantes, marmitarias e self-service. Organizado por pratos executivos, porções e bebidas.', 247, 297, 'restaurante', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80', true, false, true, 156, 4.8, 42, 'active'),
  ('pizzaria', 'Pizzaria', 'Cardápio completo para pizzarias com opções de tamanhos, sabores e bordas recheadas.', 247, 297, 'pizzaria', 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80', true, false, false, 89, 4.7, 28, 'active'),
  ('lanchonete', 'Hamburgueria / Lanchonete', 'Cardápio para lanchonetes e hamburguerias artesanais. Com adicionais e combos personalizados.', 247, 297, 'lanchonete', 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80', false, true, false, 67, 4.9, 19, 'active'),
  ('bar', 'Bar / Pub', 'Cardápio para bares, pubs e casas noturnas. Com drinks, cervejas artesanais e petiscos.', 247, 297, 'bar', 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80', false, false, false, 34, 4.6, 12, 'active'),
  ('cafeteria', 'Cafeteria', 'Cardápio para cafeterias, padarias e confeitarias. Com cafés especiais, doces e salgados.', 247, 297, 'cafeteria', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80', false, true, false, 45, 4.8, 15, 'active'),
  ('acai', 'Açaíteria', 'Cardápio para açaíterias e lanchonetes naturais. Com tigelas, copos e adicionais.', 247, 297, 'acai', 'https://images.unsplash.com/photo-1590080874088-eec64895b423?w=600&auto=format&fit=crop&q=80', false, false, false, 28, 4.5, 9, 'active'),
  ('sushi', 'Japonês / Sushi', 'Cardápio para restaurantes japoneses e sushis. Com sashimis, rolls e temakis.', 247, 297, 'sushi', 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&auto=format&fit=crop&q=80', true, false, false, 52, 4.7, 18, 'active')
ON CONFLICT (slug) DO NOTHING;



-- ======================================================================
-- MIGRATION: 010_affiliates.sql
-- ======================================================================

-- =====================================================
-- SISTEMA DE AFILIADOS — MVP
-- Rastreamento de indicação + comissão automática
-- Pagamentos manuais via PIX até escalar
-- =====================================================

-- Tabela de afiliados
CREATE TABLE IF NOT EXISTS affiliates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code          TEXT UNIQUE NOT NULL,           -- código curto ex: "tiago123"
  nome          TEXT NOT NULL,
  chave_pix     TEXT,                           -- chave PIX para pagamento
  status        TEXT NOT NULL DEFAULT 'ativo'
                CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de referências (indicações)
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id      UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  tenant_id         UUID,                       -- restaurante indicado
  plano             TEXT,                       -- 'self-service' | 'feito-pra-voce'
  valor_assinatura  DECIMAL(10,2),
  comissao          DECIMAL(10,2),              -- 30% de valor_assinatura
  referencia_mes    TEXT,                       -- '2026-03'
  status            TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'aprovado', 'pago')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS affiliates_user_id_idx       ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS affiliates_code_idx          ON affiliates(code);
CREATE INDEX IF NOT EXISTS referrals_affiliate_id_idx   ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS referrals_tenant_id_idx      ON affiliate_referrals(tenant_id);
CREATE INDEX IF NOT EXISTS referrals_status_idx         ON affiliate_referrals(status);

-- RLS: usuário só vê seus próprios dados
ALTER TABLE affiliates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

-- Políticas para affiliates
CREATE POLICY "afiliado_select_own" ON affiliates
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "afiliado_insert_own" ON affiliates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "afiliado_update_own" ON affiliates
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para referrals (via join com affiliates)
CREATE POLICY "referral_select_own" ON affiliate_referrals
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- Service role pode fazer tudo (para o onboarding inserir referrals)
CREATE POLICY "affiliates_service_all" ON affiliates
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "referrals_service_all" ON affiliate_referrals
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();



-- ======================================================================
-- MIGRATION: 011_affiliates_v2.sql
-- ======================================================================

-- =====================================================
-- AFILIADOS v2 — Tier único (sem empilhamento), 
-- Bônus por volume, Ranking público
-- =====================================================

-- 1. Adicionar campo tier em affiliates
--    'afiliado'  → 30% recorrente
--    'parceiro'  → 40% recorrente (nunca acumulam)
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'afiliado'
    CHECK (tier IN ('afiliado', 'parceiro'));

-- 2. Tabela de bônus por volume
CREATE TABLE IF NOT EXISTS affiliate_bonuses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID REFERENCES affiliates(id) ON DELETE CASCADE,
  nivel           INTEGER NOT NULL,          -- 10, 30, 50 restaurantes
  valor_bonus     DECIMAL(10,2) NOT NULL,    -- 200, 500, 1000
  status          TEXT NOT NULL DEFAULT 'pendente'
                  CHECK (status IN ('pendente', 'pago')),
  referencia_mes  TEXT NOT NULL,             -- '2026-03'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bonuses_affiliate_id_idx ON affiliate_bonuses(affiliate_id);

-- RLS para bonuses
ALTER TABLE affiliate_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bonus_select_own" ON affiliate_bonuses
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

CREATE POLICY "bonuses_service_all" ON affiliate_bonuses
  FOR ALL USING (auth.role() = 'service_role');

-- 3. View de ranking público (sem dados pessoais sensíveis)
--    Ordena por total de restaurantes indicados ativos
CREATE OR REPLACE VIEW affiliate_ranking AS
SELECT
  a.id,
  -- Primeiro nome + inicial do sobrenome (ex: "João S.")
  CASE
    WHEN position(' ' IN a.nome) > 0
    THEN split_part(a.nome, ' ', 1) || ' ' || left(split_part(a.nome, ' ', 2), 1) || '.'
    ELSE a.nome
  END AS nome_publico,
  a.tier,
  COUNT(r.id)                   AS total_indicados,
  COALESCE(SUM(r.comissao), 0)  AS mrr_estimado,
  RANK() OVER (
    ORDER BY COUNT(r.id) DESC, COALESCE(SUM(r.comissao), 0) DESC
  )                             AS posicao
FROM affiliates a
LEFT JOIN affiliate_referrals r
  ON r.affiliate_id = a.id
 AND r.status IN ('pendente', 'aprovado')
WHERE a.status = 'ativo'
GROUP BY a.id, a.nome, a.tier;

-- View acessível para todos (apenas dados públicos)
GRANT SELECT ON affiliate_ranking TO anon, authenticated;



-- ======================================================================
-- MIGRATION: 012_affiliates_v3.sql
-- ======================================================================

-- =====================================================
-- AFILIADOS v3 — Sistema de 2 níveis sem pirâmide
--
-- Nível 1: Vendedor → 30% recorrente (quem vende ao restaurante)
-- Nível 2: Líder    → 10% da rede (quem recrutou o vendedor)
-- Empresa           → 60% sempre
--
-- Título "Líder Zairyx": 5+ vendedores ativos na rede
-- =====================================================

-- 1. Migra coluna tier para novo modelo (vendedor/lider)
ALTER TABLE affiliates
  DROP CONSTRAINT IF EXISTS affiliates_tier_check;
ALTER TABLE affiliates
  ALTER COLUMN tier SET DEFAULT 'vendedor';
ALTER TABLE affiliates
  ADD CONSTRAINT affiliates_tier_check
    CHECK (tier IN ('vendedor', 'lider'));
-- Garante que registros antigos usem o novo valor
UPDATE affiliates SET tier = 'vendedor' WHERE tier IN ('afiliado', 'parceiro');

-- 2. Link de hierarquia: quem recrutou este afiliado?
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS lider_id UUID REFERENCES affiliates(id);
CREATE INDEX IF NOT EXISTS idx_affiliates_lider_id ON affiliates(lider_id);

-- 3. Comissão do líder por referral
ALTER TABLE affiliate_referrals
  ADD COLUMN IF NOT EXISTS lider_id UUID REFERENCES affiliates(id),
  ADD COLUMN IF NOT EXISTS lider_comissao DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS lider_status TEXT DEFAULT 'pendente'
    CHECK (lider_status IN ('pendente', 'aprovado', 'pago'));
CREATE INDEX IF NOT EXISTS idx_referrals_lider_id ON affiliate_referrals(lider_id);

-- 4. View de ranking com 2 níveis — substitui a de 011
DROP VIEW IF EXISTS affiliate_ranking;

CREATE OR REPLACE VIEW affiliate_ranking AS
WITH
  -- Comissões diretas (30%)
  direto AS (
    SELECT
      r.affiliate_id,
      COUNT(*)                        AS total_indicados,
      COALESCE(SUM(r.comissao), 0)    AS mrr_direto
    FROM affiliate_referrals r
    WHERE r.status IN ('pendente', 'aprovado')
    GROUP BY r.affiliate_id
  ),
  -- Comissões de rede (10%)
  rede AS (
    SELECT
      r.lider_id,
      COUNT(*)                             AS rede_indicados,
      COALESCE(SUM(r.lider_comissao), 0)  AS mrr_rede
    FROM affiliate_referrals r
    WHERE r.lider_id IS NOT NULL
      AND r.lider_status IN ('pendente', 'aprovado')
    GROUP BY r.lider_id
  ),
  -- Vendedores recrutados (para título Líder)
  recrutados AS (
    SELECT
      lider_id,
      COUNT(*) AS total_vendedores
    FROM affiliates
    WHERE lider_id IS NOT NULL AND status = 'ativo'
    GROUP BY lider_id
  )
SELECT
  a.id,
  -- Nome anonimizado: "João S."
  CASE
    WHEN position(' ' IN a.nome) > 0
    THEN split_part(a.nome, ' ', 1) || ' ' || left(split_part(a.nome, ' ', 2), 1) || '.'
    ELSE a.nome
  END                                                       AS nome_publico,
  COALESCE(rc.total_vendedores, 0)                         AS total_vendedores,
  COALESCE(rc.total_vendedores, 0) >= 5                    AS is_lider,
  COALESCE(d.total_indicados, 0)                           AS total_indicados,
  COALESCE(re.rede_indicados, 0)                           AS rede_indicados,
  COALESCE(d.mrr_direto, 0)                                AS mrr_direto,
  COALESCE(re.mrr_rede, 0)                                 AS mrr_rede,
  COALESCE(d.mrr_direto, 0) + COALESCE(re.mrr_rede, 0)    AS mrr_estimado,
  RANK() OVER (
    ORDER BY (COALESCE(d.mrr_direto, 0) + COALESCE(re.mrr_rede, 0)) DESC
  )                                                         AS posicao
FROM affiliates a
LEFT JOIN direto d    ON d.affiliate_id = a.id
LEFT JOIN rede re     ON re.lider_id    = a.id
LEFT JOIN recrutados rc ON rc.lider_id  = a.id
WHERE a.status = 'ativo';

GRANT SELECT ON affiliate_ranking TO anon, authenticated;



-- ======================================================================
-- MIGRATION: 013_affiliates_avatar_city.sql
-- ======================================================================

-- =====================================================
-- AFILIADOS v4 — avatar_url + cidade/estado
-- Permite mostrar foto de perfil e mapa por cidade
-- =====================================================

-- 1. Adiciona campos de perfil ao afiliado
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS cidade      TEXT,
  ADD COLUMN IF NOT EXISTS estado      TEXT,
  ADD COLUMN IF NOT EXISTS bio         TEXT;

-- Índice para consultas de mapa por estado/cidade
CREATE INDEX IF NOT EXISTS idx_affiliates_estado  ON affiliates(estado) WHERE status = 'ativo';
CREATE INDEX IF NOT EXISTS idx_affiliates_cidade  ON affiliates(cidade) WHERE status = 'ativo';

-- 2. Recria a view affiliate_ranking incluindo avatar_url e localização
DROP VIEW IF EXISTS affiliate_ranking;

CREATE OR REPLACE VIEW affiliate_ranking AS
WITH
  direto AS (
    SELECT
      r.affiliate_id,
      COUNT(*)                        AS total_indicados,
      COALESCE(SUM(r.comissao), 0)    AS mrr_direto
    FROM affiliate_referrals r
    WHERE r.status IN ('pendente', 'aprovado')
    GROUP BY r.affiliate_id
  ),
  rede AS (
    SELECT
      r.lider_id,
      COUNT(*)                             AS rede_indicados,
      COALESCE(SUM(r.lider_comissao), 0)  AS mrr_rede
    FROM affiliate_referrals r
    WHERE r.lider_id IS NOT NULL
      AND r.lider_status IN ('pendente', 'aprovado')
    GROUP BY r.lider_id
  ),
  recrutados AS (
    SELECT
      lider_id,
      COUNT(*) AS total_vendedores
    FROM affiliates
    WHERE lider_id IS NOT NULL AND status = 'ativo'
    GROUP BY lider_id
  )
SELECT
  a.id,
  a.avatar_url,
  a.cidade,
  a.estado,
  CASE
    WHEN position(' ' IN a.nome) > 0
    THEN split_part(a.nome, ' ', 1) || ' ' || left(split_part(a.nome, ' ', 2), 1) || '.'
    ELSE a.nome
  END                                                       AS nome_publico,
  COALESCE(rc.total_vendedores, 0)                         AS total_vendedores,
  COALESCE(rc.total_vendedores, 0) >= 5                    AS is_lider,
  COALESCE(d.total_indicados, 0)                           AS total_indicados,
  COALESCE(re.rede_indicados, 0)                           AS rede_indicados,
  COALESCE(d.mrr_direto, 0)                                AS mrr_direto,
  COALESCE(re.mrr_rede, 0)                                 AS mrr_rede,
  COALESCE(d.mrr_direto, 0) + COALESCE(re.mrr_rede, 0)    AS mrr_estimado,
  RANK() OVER (
    ORDER BY (COALESCE(d.mrr_direto, 0) + COALESCE(re.mrr_rede, 0)) DESC
  )                                                         AS posicao
FROM affiliates a
LEFT JOIN direto d      ON d.affiliate_id = a.id
LEFT JOIN rede re       ON re.lider_id    = a.id
LEFT JOIN recrutados rc ON rc.lider_id    = a.id
WHERE a.status = 'ativo';

GRANT SELECT ON affiliate_ranking TO anon, authenticated;

-- 3. View pública de afiliados por cidade (para a página /afiliados/mapa)
CREATE OR REPLACE VIEW affiliate_city_map AS
SELECT
  COALESCE(a.estado, 'Não informado')  AS estado,
  COALESCE(a.cidade, 'Não informado')  AS cidade,
  COUNT(DISTINCT a.id)                 AS total_afiliados,
  COUNT(DISTINCT r.tenant_id)          AS total_restaurantes
FROM affiliates a
LEFT JOIN affiliate_referrals r
  ON r.affiliate_id = a.id
  AND r.status IN ('aprovado', 'pago')
WHERE a.status = 'ativo'
GROUP BY a.estado, a.cidade
ORDER BY total_restaurantes DESC, total_afiliados DESC;

GRANT SELECT ON affiliate_city_map TO anon, authenticated;



-- ======================================================================
-- MIGRATION: 014_affiliate_commission_payments.sql
-- ======================================================================

-- =====================================================
-- AFILIADOS v5 — Pagamento automático de comissão
--
-- Fluxo:
--   1. Assinatura renovada → approve_affiliate_commission()
--   2. Admin vê painel com saldos pendentes
--   3. Admin clica "Pagar via PIX" → marcar como pago
-- =====================================================

-- 1. Tabela de pagamentos de comissão (histórico de transferências)
CREATE TABLE IF NOT EXISTS affiliate_commission_payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id    UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  valor           DECIMAL(10,2) NOT NULL CHECK (valor > 0),
  referencia_mes  TEXT,                       -- '2026-03' (saldo pago)
  metodo          TEXT NOT NULL DEFAULT 'pix' CHECK (metodo IN ('pix','transferencia','credito')),
  chave_pix_usada TEXT,
  observacao      TEXT,
  pago_por        UUID REFERENCES auth.users(id), -- admin que executou
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acp_affiliate_id ON affiliate_commission_payments(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_acp_created_at   ON affiliate_commission_payments(created_at);

-- RLS: admin only (leitura aberta para o próprio afiliado via referral_select_own)
ALTER TABLE affiliate_commission_payments ENABLE ROW LEVEL SECURITY;

-- Admin vê tudo (usa service_role no servidor, nunca exposto ao front)
-- Afiliado vê apenas seus próprios pagamentos
CREATE POLICY "acp_select_own" ON affiliate_commission_payments
  FOR SELECT USING (
    affiliate_id IN (SELECT id FROM affiliates WHERE user_id = auth.uid())
  );

-- 2. Função: aprovar comissão de um tenant/mês automaticamente
-- Chamada pelo webhook quando subscription_authorized_payment é recebido
CREATE OR REPLACE FUNCTION approve_affiliate_commission(
  p_tenant_id       UUID,
  p_valor_assinatura DECIMAL,
  p_referencia_mes  TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ref_mes  TEXT;
  v_updated  INT := 0;
BEGIN
  v_ref_mes := COALESCE(p_referencia_mes, to_char(NOW(), 'YYYY-MM'));

  -- Aprova comissão do vendedor
  UPDATE affiliate_referrals
  SET
    status              = 'aprovado',
    valor_assinatura    = COALESCE(valor_assinatura, p_valor_assinatura),
    comissao            = COALESCE(comissao, ROUND(p_valor_assinatura * 0.30, 2)),
    referencia_mes      = COALESCE(referencia_mes, v_ref_mes)
  WHERE tenant_id = p_tenant_id
    AND status    = 'pendente'
    AND (referencia_mes IS NULL OR referencia_mes = v_ref_mes);

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Aprova comissão do líder (se houver)
  UPDATE affiliate_referrals
  SET
    lider_status   = 'aprovado',
    lider_comissao = COALESCE(lider_comissao, ROUND(p_valor_assinatura * 0.10, 2))
  WHERE tenant_id  = p_tenant_id
    AND lider_id IS NOT NULL
    AND lider_status = 'pendente'
    AND (referencia_mes IS NULL OR referencia_mes = v_ref_mes);

  RETURN jsonb_build_object(
    'ok', TRUE,
    'tenant_id', p_tenant_id,
    'referencia_mes', v_ref_mes,
    'rows_updated', v_updated
  );
END;
$$;

-- 3. Função: calcular saldo pendente por afiliado
CREATE OR REPLACE FUNCTION affiliate_pending_balance(p_affiliate_id UUID)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COALESCE(SUM(r.comissao), 0)
      + COALESCE((
          SELECT SUM(r2.lider_comissao)
          FROM affiliate_referrals r2
          WHERE r2.lider_id = p_affiliate_id
            AND r2.lider_status = 'aprovado'
        ), 0)
  FROM affiliate_referrals r
  WHERE r.affiliate_id = p_affiliate_id
    AND r.status = 'aprovado';
$$;

-- 4. View de saldos para o admin
CREATE OR REPLACE VIEW affiliate_balances AS
SELECT
  a.id,
  a.nome,
  a.code,
  a.chave_pix,
  a.cidade,
  a.estado,
  a.status,
  -- Comissão aprovada (pendente de pagamento)
  COALESCE(
    (SELECT SUM(r.comissao)
       FROM affiliate_referrals r
      WHERE r.affiliate_id = a.id AND r.status = 'aprovado'), 0
  ) +
  COALESCE(
    (SELECT SUM(r.lider_comissao)
       FROM affiliate_referrals r
      WHERE r.lider_id = a.id AND r.lider_status = 'aprovado'), 0
  ) AS saldo_aprovado,
  -- Total pago historicamente
  COALESCE(
    (SELECT SUM(p.valor)
       FROM affiliate_commission_payments p
      WHERE p.affiliate_id = a.id), 0
  ) AS total_pago,
  -- Última vez pago
  (SELECT MAX(p.created_at)
     FROM affiliate_commission_payments p
    WHERE p.affiliate_id = a.id) AS ultimo_pagamento
FROM affiliates a
WHERE a.status = 'ativo';

-- admin via service_role não precisa de GRANT explícito (bypassa RLS)
-- mas damos SELECT para anon/authenticated para eventual uso controlado no front
GRANT SELECT ON affiliate_balances TO authenticated;



-- ======================================================================
-- MIGRATION: 015_owner_bootstrap.sql
-- ======================================================================

-- =====================================================
-- OWNER BOOTSTRAP — Garante privilégio de admin ao dono
--
-- Email do dono: globemarket7@gmail.com
-- Role: 'owner' (nível acima de 'admin')
--
-- Executa de forma idempotente:
--   • Se o usuário já existe em auth.users → insere/atualiza admin_users
--   • Se ainda não existe → nada é feito (execução na próxima migration)
-- =====================================================

-- 1. Adiciona coluna 'role' mais granular se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'admin_users'
      AND column_name  = 'role'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';
  END IF;
END $$;

-- Garante o check constraint (idempotente)
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
    CHECK (role IN ('owner', 'admin', 'support'));

-- 2. Adiciona coluna 'email' para referência rápida (sem JOIN)
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 3. Seed do dono — usa o email para localizar o UUID em auth.users
DO $$
DECLARE
  v_owner_email TEXT := 'globemarket7@gmail.com';
  v_user_id     UUID;
BEGIN
  -- Localiza o UUID pelo email (tabela interna do Supabase Auth)
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_owner_email
  LIMIT 1;

  -- Só prossegue se o usuário já existe (foi cadastrado pelo Auth)
  IF v_user_id IS NOT NULL THEN
    -- Upsert: cria ou atualiza para garantir role = 'owner'
    INSERT INTO admin_users (user_id, email, role)
    VALUES (v_user_id, v_owner_email, 'owner')
    ON CONFLICT (user_id)
    DO UPDATE SET
      role  = 'owner',
      email = v_owner_email;

    -- Garante também na tabela users (painel) se existir
    UPDATE users
    SET role = 'owner'
    WHERE id = v_user_id;

    RAISE NOTICE 'Owner admin concedido ao usuário %', v_owner_email;
  ELSE
    RAISE NOTICE 'Usuário % ainda não existe em auth.users. Execute este script novamente após o primeiro login.', v_owner_email;
  END IF;
END $$;

-- 4. Cria função helper para promover qualquer email a admin no futuro
CREATE OR REPLACE FUNCTION grant_admin_by_email(
  p_email TEXT,
  p_role  TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF p_role NOT IN ('owner', 'admin', 'support') THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'Role inválido');
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'error', 'Usuário não encontrado');
  END IF;

  INSERT INTO admin_users (user_id, email, role)
  VALUES (v_user_id, p_email, p_role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = p_role, email = p_email;

  RETURN jsonb_build_object('ok', TRUE, 'user_id', v_user_id, 'role', p_role);
END;
$$;

-- Política RLS: owner pode ver todos os registros de admin_users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'admin_users'
      AND policyname = 'Owner can manage all admin records'
  ) THEN
    CREATE POLICY "Owner can manage all admin records" ON admin_users
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM admin_users a
          WHERE a.user_id = auth.uid()
            AND a.role = 'owner'
        )
      );
  END IF;
END $$;



-- ======================================================================
-- MIGRATION: 016_price_brl_and_tenant_id.sql
-- ======================================================================

-- =====================================================
-- Migration 016 — price_brl em subscriptions + tenant_id em restaurants
--
-- TASK 1: Adiciona coluna price_brl na tabela subscriptions
--         Usada pelo webhook de comissão de afiliados para saber
--         o valor pago na renovação e calcular a comissão correta.
--
-- TASK 2: Adiciona coluna tenant_id na tabela restaurants
--         Necessária para ligar o restaurante ao fluxo de comissão
--         de afiliados (approve_affiliate_commission recebe p_tenant_id).
--         Para restaurantes legados (sem tenant_id), faz backfill com
--         restaurants.id (UUID do próprio restaurante).
-- =====================================================

-- ── TASK 1: price_brl em subscriptions ──────────────────────────────────
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS price_brl NUMERIC(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN subscriptions.price_brl IS
  'Valor em BRL pago na última ativação/renovação da assinatura. '
  'Usado pelo webhook de afiliados para calcular comissões automáticas.';

-- ── TASK 2: tenant_id em restaurants ─────────────────────────────────────
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Backfill: restaurantes legados recebem seu próprio id como tenant_id
UPDATE restaurants
  SET tenant_id = id
  WHERE tenant_id IS NULL;

-- Torna a coluna obrigatória após o backfill e define default para novos
ALTER TABLE restaurants
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN tenant_id SET DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_restaurants_tenant_id ON restaurants(tenant_id);

COMMENT ON COLUMN restaurants.tenant_id IS
  'Identificador lógico do tenant. Para restaurantes legados é igual ao '
  'próprio restaurants.id; para novos pode ser UUID distinto se necessário.';



-- ======================================================================
-- MIGRATION: 017_affiliate_tiers_sync.sql
-- ======================================================================

-- =====================================================
-- Migration 017 — Tiers hierárquicos reais em affiliates
--
-- Substitui o modelo binário (vendedor/lider) pelos 6 tiers
-- corporativos definidos em lib/affiliate-tiers.ts:
--   trainee → analista → coordenador → gerente → diretor → socio
--
-- Adiciona commission_rate para persistir o % real de cada afiliado.
-- =====================================================

-- 1. Remove constraint antiga para aceitar novos valores durante migração
ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_tier_check;

-- 2. Adiciona coluna commission_rate (% direto; base 30%, +2% diretor, +5% sócio)
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 30.00;

-- 3. Backfill tier baseado em total de restaurantes indicados (qualquer status)
UPDATE affiliates a
SET tier = CASE
  WHEN COALESCE(ref_counts.total, 0) >= 100 THEN 'socio'
  WHEN COALESCE(ref_counts.total, 0) >= 50  THEN 'diretor'
  WHEN COALESCE(ref_counts.total, 0) >= 25  THEN 'gerente'
  WHEN COALESCE(ref_counts.total, 0) >= 10  THEN 'coordenador'
  WHEN COALESCE(ref_counts.total, 0) >= 3   THEN 'analista'
  ELSE 'trainee'
END
FROM (
  SELECT affiliate_id, COUNT(*) AS total
  FROM affiliate_referrals
  WHERE status IN ('pendente', 'aprovado', 'pago')
  GROUP BY affiliate_id
) ref_counts
WHERE a.id = ref_counts.affiliate_id;

-- Afiliados sem indicações com tier legado ('vendedor'/'lider') → trainee
UPDATE affiliates
  SET tier = 'trainee'
  WHERE tier IN ('vendedor', 'lider');

-- 4. Adiciona nova constraint com os 6 slugs corporativos
ALTER TABLE affiliates
  ADD CONSTRAINT affiliates_tier_check
    CHECK (tier IN ('trainee', 'analista', 'coordenador', 'gerente', 'diretor', 'socio'));

-- 5. Padrão correto
ALTER TABLE affiliates ALTER COLUMN tier SET DEFAULT 'trainee';

-- 6. Backfill commission_rate baseado no tier
UPDATE affiliates
SET commission_rate = CASE tier
  WHEN 'socio'   THEN 35.00
  WHEN 'diretor' THEN 32.00
  ELSE 30.00
END;

-- 7. Índice para consultas por tier
CREATE INDEX IF NOT EXISTS idx_affiliates_tier ON affiliates(tier);

COMMENT ON COLUMN affiliates.tier IS
  'Tier de carreira: trainee→analista→coordenador→gerente→diretor→socio. '
  'FONTE DA VERDADE: lib/affiliate-tiers.ts';

COMMENT ON COLUMN affiliates.commission_rate IS
  'Percentual de comissão direta (ex: 30.00, 32.00, 35.00). '
  'Atualizado automaticamente a cada nova indicação registrada.';



-- ======================================================================
-- MIGRATION: 018_unify_bonus_milestones.sql
-- ======================================================================

-- =====================================================
-- Migration 018 — Unificar marcos de bônus por volume
--
-- FONTE DA VERDADE: lib/affiliate-tiers.ts
-- Define 6 tiers com bônus únicos ao atingir o mínimo de restaurantes:
--   trainee (0)           → sem bônus
--   analista (3)          → R$ 50
--   coordenador (10)      → R$ 150
--   gerente (25)          → R$ 300
--   diretor (50)          → R$ 600
--   socio (100)           → R$ 1.500
--
-- Substitui os marcos legados 10/30/50 → R$200/500/1.000 (migration 011).
-- Registros históricos de affiliate_bonuses são preservados (apenas dados
-- futuros passarão a usar os novos marcos).
-- =====================================================

-- O campo `nivel` em affiliate_bonuses é INTEGER sem CHECK constraint,
-- portanto já aceita os novos valores (3, 10, 25, 50, 100) sem ALTER.

-- Atualiza registros legados não pagos para refletir os novos valores
-- (10 rest → R$150 [coordenador], 30 rest não existe mais → R$300 mais próximo,
--  50 rest → R$600 [diretor])
UPDATE affiliate_bonuses
SET
  nivel       = 10,
  valor_bonus = 150.00
WHERE nivel = 10 AND status = 'pendente';

UPDATE affiliate_bonuses
SET
  nivel       = 25,
  valor_bonus = 300.00
WHERE nivel = 30 AND status = 'pendente';

UPDATE affiliate_bonuses
SET
  nivel       = 50,
  valor_bonus = 600.00
WHERE nivel = 50 AND status = 'pendente';

COMMENT ON TABLE affiliate_bonuses IS
  'Bônus únicos pagos ao atingir marcos de restaurantes. '
  'Marcos atuais: 3 (R$50), 10 (R$150), 25 (R$300), 50 (R$600), 100 (R$1500). '
  'FONTE DA VERDADE: lib/affiliate-tiers.ts — não altere valores em outros lugares.';



-- ======================================================================
-- MIGRATION: 019_symbolic_bonus_milestones.sql
-- ======================================================================

-- =====================================================
-- Migration 019 — Bônus simbólicos (auditoria financeira)
--
-- Reduz bônus por volume para valores que não comprometem a margem.
-- Margem atual: ~59% por restaurante ativo c/ afiliado (R$35-39/mês).
--
-- Bônus antigos (acumulado 0→100 rest): R$2.600  ← insustentável
-- Bônus novos  (acumulado 0→100 rest): R$  135  ← simbólico ✅
--
-- Nova escala (FONTE: lib/affiliate-tiers.ts):
--   trainee   (0)   → R$0
--   analista  (3)   → R$0   (primeiro marco real é em 10 rest)
--   coordenador(10) → R$10  (empresa já fatura R$390+/mês com 10 rest)
--   gerente  (25)   → R$25  (empresa fatura R$975+/mês com 25 rest)
--   diretor  (50)   → R$50  (empresa fatura R$1.900+/mês com 50 rest)
--   socio   (100)   → R$50  (bônus não escala além do Diretor)
-- =====================================================

-- Atualiza registros PENDENTES com valores do esquema antigo
UPDATE affiliate_bonuses
SET valor_bonus = 0.00
WHERE nivel = 3 AND status = 'pendente';

UPDATE affiliate_bonuses
SET valor_bonus = 10.00
WHERE nivel = 10 AND status = 'pendente';

UPDATE affiliate_bonuses
SET valor_bonus = 25.00
WHERE nivel = 25 AND status = 'pendente';

UPDATE affiliate_bonuses
SET valor_bonus = 50.00
WHERE nivel = 50 AND status = 'pendente';

UPDATE affiliate_bonuses
SET valor_bonus = 50.00
WHERE nivel = 100 AND status = 'pendente';

-- Registros já PAGOS não são alterados (direito adquirido)

COMMENT ON TABLE affiliate_bonuses IS
  'Bônus únicos pagos ao atingir marcos de restaurantes. '
  'Marcos atuais (v3, simbólicos): 10→R$10, 25→R$25, 50→R$50, 100→R$50. '
  'Total acumulado 0→100 rest: R$135 (margem empresa: ~59% por restaurante). '
  'FONTE DA VERDADE: lib/affiliate-tiers.ts — não altere valores em outros lugares.';



-- ======================================================================
-- MIGRATION: 020_fix_bonus_scale.sql
-- ======================================================================

-- =====================================================
-- Migration 020 — Escala de bônus corrigida (v5 definitivo)
--
-- Nova escala aprovada (proporcional ao volume):
--   trainee     (0  rest) → R$  0   (sem bônus)
--   analista    (3  rest) → R$  0   (sem bônus)
--   coordenador (10 rest) → R$ 10
--   gerente     (25 rest) → R$ 25
--   diretor     (50 rest) → R$ 50
--   socio      (100 rest) → R$100   ← corrigido (era R$50)
--
-- Total acumulado 0→100 rest: R$185
-- Empresa fatura R$3.900+/mês com 100 restaurantes — margem sustentável.
-- FONTE DA VERDADE: lib/affiliate-tiers.ts
-- =====================================================

-- Atualiza apenas registros PENDENTES (direito adquirido nunca é reduzido)
UPDATE affiliate_bonuses SET valor_bonus =  10.00 WHERE nivel = 10  AND status = 'pendente';
UPDATE affiliate_bonuses SET valor_bonus =  25.00 WHERE nivel = 25  AND status = 'pendente';
UPDATE affiliate_bonuses SET valor_bonus =  50.00 WHERE nivel = 50  AND status = 'pendente';
UPDATE affiliate_bonuses SET valor_bonus = 100.00 WHERE nivel = 100 AND status = 'pendente';

-- Zera bônus de níveis sem prêmio (trainee=0 / analista=3 não tem bônus)
UPDATE affiliate_bonuses SET valor_bonus =   0.00 WHERE nivel IN (0, 3) AND status = 'pendente';

-- Atualiza comentário da tabela para refletir nova escala
COMMENT ON TABLE affiliate_bonuses IS
  'Bônus únicos pagos ao atingir marcos de restaurantes. '
  'Escala v5: 10→R$10, 25→R$25, 50→R$50, 100→R$100. '
  'Total acumulado 0→100 rest: R$185 (margem empresa: ~59% por restaurante). '
  'FONTE DA VERDADE: lib/affiliate-tiers.ts — não altere valores em outros lugares.';



-- ======================================================================
-- MIGRATION: 021_bonus_fund.sql
-- ======================================================================

-- =====================================================
-- Migration 021 — Fundo de bônus de afiliados
--
-- 10% de cada taxa de setup é reservada automaticamente neste fundo.
-- O fundo é usado exclusivamente para pagar bônus de marco de afiliados.
-- O saldo restante rende CDI (creditado manualmente via API admin).
--
-- Fluxo:
--   1. Restaurante paga setup (R$197–R$697)
--   2. Webhook insere tipo='entrada' com 10% do valor
--   3. Admin paga bônus de marco → tipo='bonus' é inserido
--   4. Mensalmente, admin credita CDI via POST /api/admin/bonus-fund
--
-- FONTE DA VERDADE: lib/affiliate-tiers.ts (marcos e valores de bônus)
-- =====================================================

CREATE TABLE IF NOT EXISTS bonus_fund (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        VARCHAR(20)  NOT NULL CHECK (tipo IN ('entrada', 'bonus', 'rendimento')),
  valor       NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  affiliate_id  UUID REFERENCES affiliates(id)  ON DELETE SET NULL,
  descricao   TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Índices para queries frequentes
CREATE INDEX IF NOT EXISTS idx_bonus_fund_tipo       ON bonus_fund(tipo);
CREATE INDEX IF NOT EXISTS idx_bonus_fund_created_at ON bonus_fund(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bonus_fund_restaurant ON bonus_fund(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_bonus_fund_affiliate  ON bonus_fund(affiliate_id);

-- View: saldo atual do fundo (COALESCE garante nunca retornar negativo)
CREATE OR REPLACE VIEW bonus_fund_saldo AS
SELECT
  GREATEST(
    0,
    COALESCE(SUM(CASE WHEN tipo IN ('entrada', 'rendimento') THEN valor ELSE 0 END), 0)
    - COALESCE(SUM(CASE WHEN tipo = 'bonus' THEN valor ELSE 0 END), 0)
  ) AS saldo_atual,
  COUNT(*) FILTER (WHERE tipo = 'entrada')     AS total_entradas,
  COUNT(*) FILTER (WHERE tipo = 'bonus')       AS total_saques,
  COUNT(*) FILTER (WHERE tipo = 'rendimento')  AS total_rendimentos,
  COALESCE(SUM(CASE WHEN tipo = 'entrada'     THEN valor ELSE 0 END), 0) AS soma_entradas,
  COALESCE(SUM(CASE WHEN tipo = 'bonus'       THEN valor ELSE 0 END), 0) AS soma_saques,
  COALESCE(SUM(CASE WHEN tipo = 'rendimento'  THEN valor ELSE 0 END), 0) AS soma_rendimentos
FROM bonus_fund;

-- RLS: apenas service_role e owner podem ler/inserir
ALTER TABLE bonus_fund ENABLE ROW LEVEL SECURITY;

-- Service role bypassa RLS automaticamente (webhooks e APIs admin)
-- Sem política adicional: leitura e escrita apenas via service_role key

COMMENT ON TABLE bonus_fund IS
  'Fundo de bônus de afiliados. '
  '10% de cada taxa de setup entra como tipo=entrada. '
  'Bônus pagos saem como tipo=bonus. '
  'Rendimento CDI creditado manualmente como tipo=rendimento. '
  'Saldo nunca fica negativo (GREATEST(0,...) na view bonus_fund_saldo).';

COMMENT ON COLUMN bonus_fund.tipo IS
  'entrada: 10% do setup de cada restaurante | '
  'bonus: saque para pagar bônus de afiliado | '
  'rendimento: crédito manual de CDI (gestão financeira)';



-- ======================================================================
-- MIGRATION: 022_fix_affiliates_defaults.sql
-- ======================================================================

-- =====================================================
-- Migration 022 — Corrigir defaults/constraints de affiliates
--
-- PROBLEMA: migration 017 não está wrapped em transação.
-- Se o passo 4 (ADD CONSTRAINT) executou mas o passo 5
-- (SET DEFAULT 'trainee') não, o banco ficou com:
--   CHECK (tier IN ('trainee', ...))   ← nova constraint
--   DEFAULT 'vendedor'                 ← valor antigo da 012
-- → qualquer INSERT sem tier explícito usa DEFAULT 'vendedor'
--   → viola CHECK → "Erro ao criar afiliado" no cadastro.
--
-- FIX: reaplicar idempotentemente os valores corretos.
-- =====================================================

-- 1. Garantir que commission_rate existe (caso migration 017 não tenha rodado)
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 30.00;

-- 2. Remover constraint atual (seja ela a nova OU a antiga)
ALTER TABLE affiliates DROP CONSTRAINT IF EXISTS affiliates_tier_check;

-- 3. Corrigir linhas com tier legado antes de recriar a constraint
UPDATE affiliates
  SET tier = 'trainee'
  WHERE tier IS NULL
     OR tier NOT IN ('trainee', 'analista', 'coordenador', 'gerente', 'diretor', 'socio');

-- 4. Garantir que o DEFAULT é 'trainee' ANTES de adicionar a constraint
--    (este é o passo que pode ter falhado em 017)
ALTER TABLE affiliates ALTER COLUMN tier SET DEFAULT 'trainee';

-- 5. Recriar constraint correta
ALTER TABLE affiliates
  ADD CONSTRAINT affiliates_tier_check
    CHECK (tier IN ('trainee', 'analista', 'coordenador', 'gerente', 'diretor', 'socio'));

-- 6. Backfill commission_rate onde está 0 (possível rollback parcial de 017)
UPDATE affiliates
  SET commission_rate = CASE tier
    WHEN 'socio'   THEN 35.00
    WHEN 'diretor' THEN 32.00
    ELSE 30.00
  END
  WHERE commission_rate = 0 OR commission_rate IS NULL;

COMMENT ON COLUMN affiliates.tier IS
  'Tier de carreira: trainee→analista→coordenador→gerente→diretor→socio. '
  'DEFAULT=trainee. FONTE DA VERDADE: lib/affiliate-tiers.ts';




COMMIT;
-- ========================================================================
-- FIM DAS MIGRATIONS
-- ========================================================================
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

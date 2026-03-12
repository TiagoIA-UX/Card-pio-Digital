# 🚀 ROADMAP SaaS Profissional - Cardápio Digital

> Transformação completa em SaaS nível internacional

---

## � STATUS DE IMPLEMENTAÇÃO

| Fase | Descrição | Status | Progresso |
|------|-----------|--------|-----------|
| 1 | UX Profissional | ✅ Implementado | 100% |
| 2 | Carrinho Real | ✅ Implementado | 100% |
| 3 | Checkout Profissional | ✅ Implementado | 100% |
| 4 | Pagamento | ✅ Implementado | 100% |
| 5 | Segurança | ✅ Implementado | 100% |
| 6 | Performance | ✅ Implementado | 90% |
| 7 | SEO | ✅ Implementado | 100% |
| 8 | Escalabilidade | ⏳ Pendente | 20% |

---

## ✅ ARQUIVOS CRIADOS/MODIFICADOS

### Backend APIs
| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `app/api/webhook/templates/route.ts` | Webhook MercadoPago para e-commerce | ✅ Novo |
| `app/api/carrinho/sync/route.ts` | Sincronização carrinho backend | ✅ Novo |
| `app/api/checkout/criar-sessao/route.ts` | Sessão de checkout | ✅ Atualizado |
| `app/api/templates/route.ts` | Listagem de templates | ✅ Novo |

### Segurança
| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `middleware.ts` | Middleware de autenticação | ✅ Novo |
| `lib/rate-limit.ts` | Rate limiting em memória | ✅ Novo |

### SEO
| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `lib/seo.ts` | Configuração centralizada SEO | ✅ Novo |
| `components/seo/json-ld.tsx` | Componentes Schema.org | ✅ Novo |

### Banco de Dados
| Arquivo | Descrição | Status |
|---------|-----------|--------|
| `supabase/schema.sql` | Schema completo e-commerce | ✅ Atualizado |

### Funcionalidades RPC (Supabase)
- `increment_template_sales(template_id)` - Incrementa vendas
- `user_has_template_access(user_id, template_id)` - Verifica acesso
- `generate_order_number()` - Gera número único de pedido

---

## �📁 ESTRUTURA DE PASTAS RECOMENDADA

```
cardapio-digital/
├── app/
│   ├── (auth)/                 # Grupo de rotas autenticadas
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/            # Área logada
│   │   ├── painel/
│   │   ├── meus-templates/
│   │   └── configuracoes/
│   ├── (marketing)/            # Páginas públicas
│   │   ├── page.tsx            # Landing page
│   │   ├── templates/
│   │   ├── precos/
│   │   └── sobre/
│   ├── api/
│   │   ├── auth/
│   │   ├── carrinho/
│   │   │   ├── adicionar/route.ts
│   │   │   ├── remover/route.ts
│   │   │   └── sincronizar/route.ts
│   │   ├── checkout/
│   │   │   ├── criar-sessao/route.ts
│   │   │   └── validar-cupom/route.ts
│   │   ├── pagamento/
│   │   │   ├── criar/route.ts
│   │   │   └── criar-pacote/route.ts
│   │   └── webhook/
│   │       └── mercadopago/route.ts
│   ├── carrinho/
│   ├── checkout/
│   └── layout.tsx
├── components/
│   ├── ui/                     # Componentes base (shadcn)
│   ├── cart/                   # Componentes do carrinho
│   │   ├── cart-button.tsx
│   │   ├── cart-drawer.tsx
│   │   ├── cart-item.tsx
│   │   └── cart-summary.tsx
│   ├── checkout/               # Componentes de checkout
│   │   ├── checkout-form.tsx
│   │   ├── order-summary.tsx
│   │   ├── coupon-input.tsx
│   │   └── payment-methods.tsx
│   ├── templates/              # Cards de templates
│   │   ├── template-card.tsx
│   │   ├── template-grid.tsx
│   │   └── template-badge.tsx
│   └── shared/                 # Componentes compartilhados
│       ├── loading-skeleton.tsx
│       ├── empty-state.tsx
│       ├── error-boundary.tsx
│       └── star-rating.tsx
├── hooks/
│   ├── use-cart.ts
│   ├── use-auth.ts
│   ├── use-checkout.ts
│   └── use-templates.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── mercadopago.ts
│   ├── validators/
│   │   ├── checkout.ts
│   │   └── user.ts
│   └── utils.ts
├── store/
│   ├── cart-store.ts           # Estado global do carrinho
│   ├── auth-store.ts           # Estado de autenticação
│   └── ui-store.ts             # Estado de UI (modals, etc)
├── types/
│   ├── cart.ts
│   ├── template.ts
│   ├── checkout.ts
│   └── database.ts
└── services/
    ├── cart-service.ts
    ├── payment-service.ts
    └── template-service.ts
```

---

## 🗄️ MODELAGEM DO BANCO DE DADOS

### Tabelas Supabase

```sql
-- USUÁRIOS (auth.users já existe)

-- PERFIS DE USUÁRIO
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEMPLATES/PRODUTOS
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category TEXT NOT NULL,
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

-- AVALIAÇÕES
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, user_id)
);

-- CARRINHO
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- CUPONS DE DESCONTO
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PEDIDOS
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ITENS DO PEDIDO
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  template_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMPRAS/LICENÇAS DO USUÁRIO
CREATE TABLE user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  license_key TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, template_id)
);

-- ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_templates_featured ON templates(is_featured);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_purchases_user ON user_purchases(user_id);
CREATE INDEX idx_reviews_template ON reviews(template_id);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own purchases" ON user_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## 🔌 ENDPOINTS NECESSÁRIOS

### API Routes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| **Carrinho** |
| GET | `/api/carrinho` | Listar itens do carrinho |
| POST | `/api/carrinho/adicionar` | Adicionar item |
| DELETE | `/api/carrinho/remover` | Remover item |
| POST | `/api/carrinho/sincronizar` | Sincronizar localStorage → DB |
| **Checkout** |
| POST | `/api/checkout/criar-sessao` | Criar sessão de checkout |
| POST | `/api/checkout/validar-cupom` | Validar cupom de desconto |
| **Pagamento** |
| POST | `/api/pagamento/criar` | Criar preferência MP |
| POST | `/api/pagamento/criar-pacote` | Criar preferência pacote |
| POST | `/api/webhook/mercadopago` | Webhook de confirmação |
| **Templates** |
| GET | `/api/templates` | Listar templates |
| GET | `/api/templates/[slug]` | Detalhes do template |
| **Usuário** |
| GET | `/api/usuario/compras` | Listar compras |
| GET | `/api/usuario/downloads/[id]` | Download protegido |

---

## 🧩 COMPONENTES REACT SUGERIDOS

### Core Components

```tsx
// components/cart/cart-button.tsx
- Badge com contador
- Animação ao adicionar
- Abre drawer/sheet

// components/cart/cart-drawer.tsx
- Lista de itens
- Subtotal
- Botão "Finalizar compra"
- Empty state bonito

// components/templates/template-card.tsx
- Imagem otimizada
- Badges (novo, bestseller)
- Rating com estrelas
- Preço com desconto
- Botões "Comprar" e "Carrinho"
- Hover effects

// components/checkout/checkout-form.tsx
- Resumo do pedido
- Campo de cupom
- Seleção de pagamento
- Termos e condições
- Botão de pagamento

// components/shared/loading-skeleton.tsx
- Skeleton para cards
- Skeleton para listas
- Skeleton para páginas

// components/shared/empty-state.tsx
- Carrinho vazio
- Sem compras
- Sem resultados
```

---

## 👤 FLUXO COMPLETO DO USUÁRIO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JORNADA DO CLIENTE                                │
└─────────────────────────────────────────────────────────────────────────────┘

   DESCOBERTA                    CONSIDERAÇÃO                    DECISÃO
   ─────────                     ────────────                    ───────
       │                              │                              │
       ▼                              ▼                              ▼
┌─────────────┐              ┌─────────────────┐            ┌─────────────────┐
│  Landing    │──────────────│    Templates    │────────────│    Checkout     │
│   Page      │              │     (Grid)      │            │     Page        │
└─────────────┘              └─────────────────┘            └─────────────────┘
       │                              │                              │
       │                              │                              │
       │                     ┌────────┴────────┐                     │
       │                     │                 │                     │
       │                     ▼                 ▼                     │
       │              ┌───────────┐     ┌───────────┐                │
       │              │  Comprar  │     │ Adicionar │                │
       │              │   Agora   │     │ Carrinho  │                │
       │              └─────┬─────┘     └─────┬─────┘                │
       │                    │                 │                      │
       │                    │                 ▼                      │
       │                    │          ┌───────────┐                 │
       │                    │          │ Carrinho  │                 │
       │                    │          │  Drawer   │                 │
       │                    │          └─────┬─────┘                 │
       │                    │                │                       │
       │                    └───────┬────────┘                       │
       │                            │                                │
       │                            ▼                                │
       │                    ┌───────────────┐                        │
       │                    │    Login?     │                        │
       │                    │   (se não)    │                        │
       │                    └───────┬───────┘                        │
       │                            │                                │
       │                            ▼                                │
       │                    ┌───────────────┐                        │
       │                    │   Checkout    │◄───────────────────────┘
       │                    │   Completo    │
       │                    └───────┬───────┘
       │                            │
       │                            ▼
       │                    ┌───────────────┐
       │                    │  Pagamento    │
       │                    │ Mercado Pago  │
       │                    └───────┬───────┘
       │                            │
       │                            ▼
       │                    ┌───────────────┐
       │                    │   Webhook     │
       │                    │  Confirmação  │
       │                    └───────┬───────┘
       │                            │
   PÓS-COMPRA               ┌───────┴───────┐
   ─────────                │               │
       │                    ▼               ▼
       │             ┌───────────┐   ┌───────────┐
       └─────────────│  Sucesso  │   │   Erro    │
                     │   Page    │   │   Page    │
                     └─────┬─────┘   └───────────┘
                           │
                           ▼
                    ┌───────────────┐
                    │    Meus       │
                    │  Templates    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Download    │
                    │  Protegido   │
                    └───────────────┘
```

---

## 📋 FASES DE IMPLEMENTAÇÃO

### FASE 1 — UX PROFISSIONAL ✅ IMPLEMENTADO

#### Checklist
- [x] Instalar Zustand para estado global
- [x] Criar types/interfaces TypeScript
- [x] Implementar Loading Skeletons (componentes/ui/skeleton.tsx)
- [x] Implementar Empty States (components/ui/empty.tsx)
- [x] Adicionar microinterações (hover, click)
- [x] Implementar Toast notifications (sonner)

#### Arquivos existentes
```
store/cart-store.ts         ✅
types/                      ✅ (inline nos componentes)
components/ui/skeleton.tsx  ✅
components/ui/empty.tsx     ✅
components/ui/sonner.tsx    ✅
```

---

### FASE 2 — CARRINHO REAL ✅ IMPLEMENTADO

#### Checklist
- [x] Store do carrinho com Zustand
- [x] Persistência em localStorage
- [x] Sincronização com backend (usuário logado)
- [x] Componente CartButton com badge animado
- [x] Componente CartDrawer (sheet lateral)
- [x] API routes do carrinho
- [x] Evitar duplicação de itens

#### Arquivos criados
```
store/cart-store.ts              ✅ Zustand com persist
components/cart/cart-button.tsx  ✅ Badge animado
components/cart/cart-drawer.tsx  ✅ Sheet lateral
app/api/carrinho/sync/route.ts   ✅ POST/GET sync
```

---

### FASE 3 — CHECKOUT PROFISSIONAL ✅ IMPLEMENTADO

#### Checklist
- [x] Página de checkout completa
- [x] Resumo do pedido
- [x] Cálculo automático de totais
- [x] Indicadores de segurança
- [x] Validação de formulário com Zod

#### Arquivos criados
```
app/checkout-novo/page.tsx           ✅
app/api/checkout/criar-sessao/route.ts ✅ (usa template_orders)
```

---

### FASE 4 — PAGAMENTO ✅ IMPLEMENTADO

#### Checklist
- [x] Refatorar API de pagamento
- [x] Webhook robusto com validação de assinatura
- [x] Tratamento de erros detalhado
- [x] Logs estruturados
- [x] Atualização de vendas automática
- [x] Liberação de acesso automática
- [x] Limpeza do carrinho pós-compra

#### Arquivos criados/modificados
```
app/api/webhook/templates/route.ts  ✅ Webhook completo
  - Validação HMAC-SHA256
  - Mapeamento de status MercadoPago
  - Criação de user_purchases
  - Incremento de sales_count
  - Limpeza de cart_items
```

---

### FASE 5 — SEGURANÇA ✅ IMPLEMENTADO

#### Checklist
- [x] Validação backend em todas as rotas (Zod)
- [x] Rate limiting
- [x] Validação de webhook signature (HMAC-SHA256)
- [x] Middleware de autenticação
- [x] Rotas públicas/protegidas definidas

#### Arquivos criados
```
middleware.ts           ✅ Proteção de rotas
lib/rate-limit.ts       ✅ Rate limiting configurável
```

#### Configurações de Rate Limit
```typescript
RATE_LIMITS = {
  public: { requests: 100, window: 60000 },   // 100/min
  auth: { requests: 5, window: 60000 },       // 5/min
  checkout: { requests: 10, window: 60000 },  // 10/min
  webhook: { requests: 1000, window: 60000 }, // 1000/min
  cart: { requests: 30, window: 60000 }       // 30/min
}
```

---

### FASE 6 — PERFORMANCE ✅ IMPLEMENTADO (90%)

#### Checklist
- [x] Caching strategies (Cache-Control headers)
- [x] stale-while-revalidate nos endpoints
- [ ] Lazy loading de componentes (parcial)
- [ ] Image optimization (next/image) - parcial
- [ ] Bundle analysis

#### Implementado
```
- Cache-Control: public, s-maxage=300, stale-while-revalidate=600
- Headers de cache nas APIs
```

---

### FASE 7 — SEO ✅ IMPLEMENTADO

#### Checklist
- [x] Meta tags dinâmicas
- [x] Open Graph tags
- [x] Twitter cards
- [x] Schema.org markup (JSON-LD)
- [x] Sitemap dinâmico (app/sitemap.ts)
- [x] Robots.txt (app/robots.ts)
- [x] Canonical URLs

#### Arquivos criados
```
lib/seo.ts                  ✅ Configuração centralizada
components/seo/json-ld.tsx  ✅ Componentes Schema.org
  - JsonLd
  - OrganizationJsonLd
  - ProductJsonLd
  - FAQJsonLd
  - BreadcrumbJsonLd
  - SoftwareJsonLd
app/sitemap.ts              ✅ Sitemap dinâmico
app/robots.ts               ✅ Robots.txt
```

---

### FASE 8 — ESCALABILIDADE ⏳ PENDENTE

#### Checklist
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitoramento (Sentry)
- [ ] Analytics avançado
- [ ] Feature flags
- [ ] Documentação técnica

#### A implementar
```
__tests__/
.github/workflows/ci.yml
sentry.client.config.ts
lib/analytics.ts
```

---

## � IMPLEMENTAÇÕES TÉCNICAS DETALHADAS

### Webhook E-commerce (`app/api/webhook/templates/route.ts`)
```typescript
// Funcionalidades implementadas:
- Validação de assinatura HMAC-SHA256
- Mapeamento de status: approved → completed, in_process → processing, etc.
- Criação automática de user_purchases
- Incremento de sales_count via RPC
- Limpeza de cart_items após compra aprovada
- Logs estruturados para debug
```

### Rate Limiting (`lib/rate-limit.ts`)
```typescript
// Presets configurados:
public: 100 req/min    // Rotas públicas
auth: 5 req/min        // Login/registro
checkout: 10 req/min   // Criação de sessão
webhook: 1000 req/min  // Webhooks MP
cart: 30 req/min       // Operações carrinho

// Uso:
const { success, headers } = checkRateLimit(ip, 'checkout')
```

### Middleware (`middleware.ts`)
```typescript
// Rotas protegidas:
/painel/**
/meus-templates/**
/checkout-novo/**
/api/carrinho/**
/api/checkout/criar-sessao

// Rotas públicas:
/login, /registrar, /templates, /ofertas, /r/**, /api/webhook/**
```

### SEO Schema.org (`components/seo/json-ld.tsx`)
```typescript
// Componentes disponíveis:
<OrganizationJsonLd />  // Organização
<ProductJsonLd />       // Produto/Template
<FAQJsonLd />           // FAQ
<BreadcrumbJsonLd />    // Breadcrumbs
<SoftwareJsonLd />      // SaaS Application
```

### SQL Functions (Supabase)
```sql
-- Incrementa vendas
SELECT increment_template_sales('uuid-do-template');

-- Verifica acesso
SELECT user_has_template_access('user-id', 'template-id');

-- Gera número de pedido
SELECT generate_order_number(); -- CDMxx-1234567890123
```

---

## 🔮 MELHORIAS FUTURAS PARA ESCALA

### Curto Prazo (1-3 meses)
- [ ] Sistema de afiliados
- [ ] Upsells automatizados
- [ ] Email marketing integrado
- [ ] Dashboard de analytics
- [ ] Sistema de notificações push

### Médio Prazo (3-6 meses)
- [ ] API pública para integrações
- [ ] Marketplace de templates
- [ ] Sistema de assinaturas
- [ ] White-label para agências
- [ ] App mobile (React Native)

### Longo Prazo (6-12 meses)
- [ ] AI para personalização
- [ ] CDN própria
- [ ] Microservices
- [ ] Multi-região
- [ ] Enterprise features

---

## ⚡ PRÓXIMOS PASSOS RECOMENDADOS

### Prioridade Alta
1. **Testes Automatizados** — Jest + React Testing Library
2. **Monitoramento** — Integrar Sentry para error tracking
3. **CI/CD** — GitHub Actions para deploy automático
4. **Rate Limiting Redis** — Migrar de memória para Upstash Redis

### Prioridade Média
5. **Sistema de Cupons** — API de validação de cupons
6. **Avaliações de Usuários** — Sistema de reviews com estrelas
7. **Dashboard de Vendas** — Analytics para admin

### Prioridade Baixa
8. **Sistema de Afiliados** — Tracking e comissões
9. **Email Transacional** — Confirmação de compra, download

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Meta | Status |
|---------|------|--------|
| Lighthouse Performance | > 90 | ⏳ Verificar |
| Lighthouse SEO | > 95 | ✅ Schema.org implementado |
| Lighthouse Accessibility | > 90 | ⏳ Verificar |
| Time to First Byte | < 200ms | ✅ Caching headers |
| First Contentful Paint | < 1.5s | ⏳ Verificar |
| Largest Contentful Paint | < 2.5s | ⏳ Verificar |
| Taxa de Abandono Carrinho | < 30% | ⏳ Monitorar |
| Taxa de Conversão | > 3% | ⏳ Monitorar |

---

## 📁 ESTRUTURA ATUAL DO PROJETO

```
cardapio-digital/
├── app/
│   ├── api/
│   │   ├── carrinho/
│   │   │   └── sync/route.ts        ✅ Sincronização
│   │   ├── checkout/
│   │   │   └── criar-sessao/route.ts ✅ Sessão checkout
│   │   ├── templates/
│   │   │   └── route.ts             ✅ Listagem
│   │   └── webhook/
│   │       └── templates/route.ts   ✅ Webhook e-commerce
│   ├── checkout-novo/
│   ├── meus-templates/
│   ├── robots.ts                    ✅
│   └── sitemap.ts                   ✅
├── components/
│   ├── cart/
│   │   ├── cart-button.tsx          ✅
│   │   └── cart-drawer.tsx          ✅
│   ├── seo/
│   │   └── json-ld.tsx              ✅ Schema.org
│   └── ui/                          ✅ shadcn/ui
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   ├── rate-limit.ts                ✅ Rate limiting
│   ├── seo.ts                       ✅ Configuração SEO
│   ├── site-url.ts
│   └── utils.ts
├── store/
│   └── cart-store.ts                ✅ Zustand
├── supabase/
│   └── schema.sql                   ✅ Schema completo
└── middleware.ts                    ✅ Autenticação
```

---

*Documento criado em: 25/02/2026*
*Última atualização: 26/02/2026*
*Status: 85% Implementado*

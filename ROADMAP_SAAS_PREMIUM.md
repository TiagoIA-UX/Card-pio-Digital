# 🍕 PizzaDigital SaaS Premium - Roadmap de Implementação

> **Versão:** 1.0  
> **Data:** Março 2026  
> **Stack:** Next.js 15 + Supabase + Vercel (Planos Gratuitos)  
> **Duração Estimada:** 7-8 semanas

---

## 📋 ÍNDICE DE FASES

| Fase | Nome                      | Duração | Status |
| ---- | ------------------------- | ------- | ------ |
| 0    | Setup & Arquitetura Base  | 2 dias  | ✅     |
| 1    | Multi-Tenant & Database   | 4 dias  | 🔄     |
| 2    | Autenticação & Onboarding | 3 dias  | ⬜     |
| 3    | Cardápio Digital Público  | 5 dias  | ⬜     |
| 4    | Monte sua Pizza           | 4 dias  | ⬜     |
| 5    | Dashboard do Dono         | 6 dias  | ⬜     |
| 6    | Sistema de Planos         | 4 dias  | ⬜     |
| 7    | Inteligência Comercial    | 3 dias  | ⬜     |
| 8    | QR Code & WhatsApp        | 2 dias  | ⬜     |
| 9    | Performance & Segurança   | 3 dias  | ⬜     |
| 10   | Testes & Deploy           | 3 dias  | ⬜     |

---

## 🚀 FASE 0: Setup & Arquitetura Base

**Duração:** 2 dias | **Prioridade:** CRÍTICA

### 0.1 Estrutura de Pastas

- [x] Criar estrutura modular por domínio
- [x] Configurar paths aliases no tsconfig
- [x] Criar barrel exports (index.ts)

```
/app
  /api                    # API Routes
  /(auth)                 # Grupo de rotas auth
    /login
    /cadastro
    /recuperar-senha
  /(dashboard)            # Grupo de rotas painel
    /painel
      /page.tsx
      /produtos
      /pedidos
      /relatorios
      /configuracoes
  /(public)               # Grupo de rotas públicas
    /r/[slug]             # Cardápio público
    /monte-sua-pizza/[slug]
/components
  /ui                     # Componentes base (shadcn)
  /features               # Componentes de feature
    /cardapio
    /carrinho
    /monte-pizza
    /dashboard
  /shared                 # Componentes compartilhados
/lib
  /supabase
    /client.ts
    /server.ts
    /admin.ts
  /utils
  /validations
/services                 # Camada de serviços
  /tenant
  /product
  /order
  /subscription
/modules                  # Lógica de negócio
  /pricing
  /whatsapp
  /qrcode
  /analytics
/types                    # TypeScript types
  /database.ts
  /api.ts
  /entities.ts
/hooks                    # React hooks
  /use-tenant.ts
  /use-cart.ts
  /use-subscription.ts
/store                    # Zustand stores
  /cart-store.ts
  /ui-store.ts
```

### 0.2 Configurações Base

- [ ] Atualizar `next.config.mjs` para subdomínios
- [ ] Configurar variáveis de ambiente
- [ ] Setup ESLint + Prettier
- [ ] Configurar Tailwind com design system

### 0.3 Design System

- [ ] Definir cores da marca (primária, secundária, accent)
- [ ] Configurar tipografia (Inter/Poppins)
- [ ] Criar tokens de espaçamento
- [ ] Configurar componentes shadcn/ui

---

## 🗄️ FASE 1: Multi-Tenant & Database

**Duração:** 4 dias | **Prioridade:** CRÍTICA

### 1.1 Schema do Banco de Dados

#### Tabela: `tenants` (Pizzarias)

```sql
- [ ] Criar tabela tenants
  - id: uuid PRIMARY KEY
  - slug: text UNIQUE (url amigável)
  - nome: text NOT NULL
  - nome_fantasia: text
  - cnpj: text
  - email: text NOT NULL
  - telefone: text
  - whatsapp: text NOT NULL
  - endereco: jsonb
  - logo_url: text
  - banner_url: text
  - cores: jsonb (primary, secondary, accent)
  - horario_funcionamento: jsonb
  - taxa_entrega: decimal
  - pedido_minimo: decimal
  - raio_entrega_km: decimal
  - aceita_retirada: boolean DEFAULT true
  - aceita_entrega: boolean DEFAULT true
  - ativo: boolean DEFAULT true
  - trial_ends_at: timestamptz
  - created_at: timestamptz
  - updated_at: timestamptz
```

#### Tabela: `users`

```sql
- [ ] Criar tabela users
  - id: uuid PRIMARY KEY (ref auth.users)
  - tenant_id: uuid REFERENCES tenants
  - email: text NOT NULL
  - nome: text
  - telefone: text
  - role: text DEFAULT 'owner'
  - avatar_url: text
  - ultimo_acesso: timestamptz
  - created_at: timestamptz
  - updated_at: timestamptz
```

#### Tabela: `roles_permissions`

```sql
- [ ] Criar tabela roles
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - nome: text NOT NULL
  - permissoes: jsonb
  - created_at: timestamptz
```

#### Tabela: `categories`

```sql
- [ ] Criar tabela categories
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - nome: text NOT NULL
  - descricao: text
  - icone: text
  - ordem: integer DEFAULT 0
  - ativo: boolean DEFAULT true
  - created_at: timestamptz
  - updated_at: timestamptz
```

#### Tabela: `products`

```sql
- [ ] Criar tabela products
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - categoria_id: uuid REFERENCES categories
  - nome: text NOT NULL
  - descricao: text
  - imagem_url: text
  - preco_base: decimal NOT NULL
  - preco_promocional: decimal
  - tipo: text ('simples', 'pizza', 'combo')
  - permite_personalizar: boolean DEFAULT false
  - destaque: boolean DEFAULT false
  - disponivel: boolean DEFAULT true
  - ordem: integer DEFAULT 0
  - tags: text[]
  - created_at: timestamptz
  - updated_at: timestamptz
```

#### Tabela: `product_sizes` (Tamanhos de Pizza)

```sql
- [ ] Criar tabela product_sizes
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - nome: text NOT NULL (Broto, Média, Grande, Família)
  - descricao: text (ex: "6 fatias, serve 2")
  - multiplicador_preco: decimal DEFAULT 1.0
  - max_sabores: integer DEFAULT 1
  - ordem: integer DEFAULT 0
  - ativo: boolean DEFAULT true
  - created_at: timestamptz
```

#### Tabela: `product_crusts` (Bordas)

```sql
- [ ] Criar tabela product_crusts
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - nome: text NOT NULL
  - preco_adicional: decimal DEFAULT 0
  - disponivel: boolean DEFAULT true
  - ordem: integer DEFAULT 0
  - created_at: timestamptz
```

#### Tabela: `product_flavors` (Sabores de Pizza)

```sql
- [ ] Criar tabela product_flavors
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - categoria_id: uuid (salgada, doce, especial)
  - nome: text NOT NULL
  - descricao: text
  - ingredientes: text[]
  - preco: decimal NOT NULL
  - imagem_url: text
  - disponivel: boolean DEFAULT true
  - destaque: boolean DEFAULT false
  - ordem: integer DEFAULT 0
  - created_at: timestamptz
  - updated_at: timestamptz
```

#### Tabela: `add_ons` (Adicionais)

```sql
- [ ] Criar tabela add_ons
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - nome: text NOT NULL
  - preco: decimal NOT NULL
  - categoria: text (ingrediente, bebida, sobremesa)
  - disponivel: boolean DEFAULT true
  - ordem: integer DEFAULT 0
  - created_at: timestamptz
```

#### Tabela: `orders`

```sql
- [ ] Criar tabela orders
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - numero: serial (número do pedido)
  - cliente_nome: text
  - cliente_telefone: text
  - cliente_endereco: jsonb
  - tipo_entrega: text ('delivery', 'retirada')
  - status: text DEFAULT 'novo'
  - subtotal: decimal
  - taxa_entrega: decimal DEFAULT 0
  - desconto: decimal DEFAULT 0
  - total: decimal NOT NULL
  - forma_pagamento: text
  - observacoes: text
  - tempo_estimado: integer (minutos)
  - enviado_whatsapp: boolean DEFAULT false
  - created_at: timestamptz
  - updated_at: timestamptz
```

#### Tabela: `order_items`

```sql
- [ ] Criar tabela order_items
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - order_id: uuid REFERENCES orders
  - produto_id: uuid REFERENCES products
  - nome_produto: text NOT NULL
  - quantidade: integer DEFAULT 1
  - preco_unitario: decimal NOT NULL
  - preco_total: decimal NOT NULL
  - personalizacao: jsonb (tamanho, sabores, borda, adicionais)
  - observacoes: text
  - created_at: timestamptz
```

#### Tabela: `plans`

```sql
- [ ] Criar tabela plans
  - id: uuid PRIMARY KEY
  - nome: text NOT NULL
  - slug: text UNIQUE
  - descricao: text
  - preco_mensal: decimal NOT NULL
  - preco_anual: decimal
  - features: jsonb
  - limites: jsonb
  - destaque: boolean DEFAULT false
  - ativo: boolean DEFAULT true
  - ordem: integer DEFAULT 0
  - created_at: timestamptz
```

#### Tabela: `subscriptions`

```sql
- [ ] Criar tabela subscriptions
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants UNIQUE
  - plan_id: uuid REFERENCES plans
  - status: text DEFAULT 'trial'
  - trial_ends_at: timestamptz
  - current_period_start: timestamptz
  - current_period_end: timestamptz
  - cancel_at: timestamptz
  - canceled_at: timestamptz
  - payment_method: text
  - external_id: text (id do gateway)
  - created_at: timestamptz
  - updated_at: timestamptz
```

#### Tabela: `promotions`

```sql
- [ ] Criar tabela promotions
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - nome: text NOT NULL
  - descricao: text
  - tipo: text ('percentual', 'valor_fixo', 'leve_pague', 'combo')
  - valor: decimal
  - codigo: text
  - condicoes: jsonb
  - produtos_aplicaveis: uuid[]
  - data_inicio: timestamptz
  - data_fim: timestamptz
  - ativo: boolean DEFAULT true
  - created_at: timestamptz
```

#### Tabela: `metrics_daily`

```sql
- [ ] Criar tabela metrics_daily
  - id: uuid PRIMARY KEY
  - tenant_id: uuid REFERENCES tenants
  - data: date NOT NULL
  - total_pedidos: integer DEFAULT 0
  - total_faturamento: decimal DEFAULT 0
  - ticket_medio: decimal DEFAULT 0
  - pedidos_delivery: integer DEFAULT 0
  - pedidos_retirada: integer DEFAULT 0
  - produto_mais_vendido: uuid
  - horario_pico: time
  - novos_clientes: integer DEFAULT 0
  - created_at: timestamptz
  - UNIQUE(tenant_id, data)
```

### 1.2 Políticas RLS

```sql
- [ ] Habilitar RLS em todas as tabelas
- [ ] Criar política SELECT para tenants (próprio tenant)
- [ ] Criar política INSERT para tenants
- [ ] Criar política UPDATE para tenants
- [ ] Criar política DELETE para tenants
- [ ] Replicar políticas para todas as tabelas com tenant_id
- [ ] Criar função helper get_tenant_id()
- [ ] Testar isolamento entre tenants
```

### 1.3 Índices de Performance

```sql
- [ ] Índice em tenant_id (todas as tabelas)
- [ ] Índice em slug (tenants)
- [ ] Índice em categoria_id (products)
- [ ] Índice em order_id (order_items)
- [ ] Índice em status + tenant_id (orders)
- [ ] Índice em data + tenant_id (metrics_daily)
- [ ] Índice composto (tenant_id, created_at) para queries comuns
```

### 1.4 Triggers e Functions

```sql
- [ ] Trigger updated_at automático
- [ ] Trigger para calcular metrics_daily
- [ ] Function para gerar número do pedido
- [ ] Function para validar slug único
- [ ] Function para calcular totais do pedido
```

---

## 🔐 FASE 2: Autenticação & Onboarding

**Duração:** 3 dias | **Prioridade:** ALTA

### 2.1 Supabase Auth Setup

- [ ] Configurar Supabase Auth
- [ ] Habilitar provedores (Email, Google)
- [ ] Configurar templates de email
- [ ] Configurar redirect URLs

### 2.2 Middleware de Autenticação

```typescript
- [ ] Criar middleware.ts
  - Verificar sessão
  - Validar tenant do usuário
  - Redirecionar se não autenticado
  - Proteger rotas /painel/*
```

### 2.3 Fluxo de Cadastro (Onboarding)

- [ ] Página /cadastro
  - Step 1: Email + Senha
  - Step 2: Dados da Pizzaria (nome, telefone, WhatsApp)
  - Step 3: Slug (URL personalizada)
  - Step 4: Logo upload (opcional)
- [ ] Criar tenant automaticamente
- [ ] Criar subscription com trial 30 dias
- [ ] Redirecionar para /painel

### 2.4 Fluxo de Login

- [ ] Página /login
  - Email + Senha
  - Link "Esqueci minha senha"
  - Link para cadastro
- [ ] Verificar tenant do usuário
- [ ] Redirecionar para /painel

### 2.5 Recuperação de Senha

- [ ] Página /recuperar-senha
- [ ] Envio de email
- [ ] Página de reset

### 2.6 Hooks de Auth

```typescript
- [ ] useAuth() - estado de autenticação
- [ ] useTenant() - dados do tenant atual
- [ ] useSubscription() - dados do plano
- [ ] usePermissions() - verificar permissões
```

---

## 🍽️ FASE 3: Cardápio Digital Público

**Duração:** 5 dias | **Prioridade:** ALTA

### 3.1 Página do Cardápio `/r/[slug]`

- [ ] Layout responsivo (mobile-first)
- [ ] Header com logo e info da pizzaria
- [ ] Status aberto/fechado (baseado em horário)
- [ ] Navegação por categorias (sticky)
- [ ] Lista de produtos por categoria
- [ ] Card de produto com imagem, nome, descrição, preço
- [ ] Badge de promoção
- [ ] Badge de destaque
- [ ] Skeleton loading

### 3.2 Filtros e Busca

- [ ] Barra de busca
- [ ] Filtro por faixa de preço
- [ ] Filtro por categoria
- [ ] Ordenação (preço, mais vendidos)

### 3.3 Modal de Produto

- [ ] Imagem ampliada
- [ ] Descrição completa
- [ ] Variações (se houver)
- [ ] Seletor de quantidade
- [ ] Observações
- [ ] Botão adicionar ao carrinho

### 3.4 Carrinho

- [ ] Drawer lateral (mobile) / sidebar (desktop)
- [ ] Lista de itens
- [ ] Editar quantidade
- [ ] Remover item
- [ ] Subtotal
- [ ] Taxa de entrega (se delivery)
- [ ] Desconto (se cupom)
- [ ] Total
- [ ] Persistência (localStorage + Zustand)

### 3.5 Checkout

- [ ] Tipo de entrega (Delivery / Retirada)
- [ ] Dados do cliente (nome, telefone)
- [ ] Endereço (se delivery)
- [ ] Forma de pagamento
- [ ] Observações gerais
- [ ] Resumo do pedido
- [ ] Botão "Enviar pedido via WhatsApp"

### 3.6 Integração WhatsApp

```typescript
- [ ] Função formatarPedidoWhatsApp()
  - Nome do cliente
  - Telefone
  - Tipo entrega
  - Endereço (se delivery)
  - Lista de itens formatada
  - Observações
  - Total
  - Horário do pedido
- [ ] Gerar link wa.me com mensagem
- [ ] Abrir WhatsApp
```

### 3.7 Promoções Visuais

- [ ] Banner de promoção no topo
- [ ] Tag de desconto no produto
- [ ] Preço riscado + preço promocional
- [ ] Timer de promoção (se tempo limitado)

### 3.8 Upsell Automático

- [ ] Sugestão de bebida ao adicionar pizza
- [ ] Sugestão de sobremesa no checkout
- [ ] "Clientes também pediram"

---

## 🍕 FASE 4: Monte sua Pizza

**Duração:** 4 dias | **Prioridade:** ALTA

### 4.1 Interface do Builder

- [ ] Layout step-by-step ou all-in-one
- [ ] Progress bar de etapas
- [ ] Preview visual da pizza (ilustrativo)

### 4.2 Step 1: Tamanho

- [ ] Cards de tamanho (Broto, Média, Grande, Família)
- [ ] Descrição (fatias, serve X pessoas)
- [ ] Preço base
- [ ] Info de máximo de sabores

### 4.3 Step 2: Sabores

- [ ] Grid de sabores por categoria
- [ ] Filtro (salgadas, doces, especiais)
- [ ] Busca de sabor
- [ ] Seleção limitada pelo tamanho
- [ ] Indicador "X de Y sabores selecionados"
- [ ] Card com ingredientes

### 4.4 Step 3: Borda

- [ ] Lista de bordas disponíveis
- [ ] Preço adicional
- [ ] Opção "Sem borda recheada"

### 4.5 Step 4: Adicionais

- [ ] Lista de ingredientes extras
- [ ] Preço de cada adicional
- [ ] Checkbox múltiplo

### 4.6 Cálculo de Preço

```typescript
- [ ] Função calcularPrecoPizza()
  - Preço base do tamanho
  - Média ou maior preço dos sabores
  - Adicional da borda
  - Soma dos adicionais
  - Aplicar promoções se houver
```

### 4.7 Resumo e Adicionar

- [ ] Resumo da pizza montada
- [ ] Preço total calculado
- [ ] Campo de observações
- [ ] Seletor de quantidade
- [ ] Botão adicionar ao carrinho

### 4.8 Regras Configuráveis

```typescript
- [ ] Hook useConfigMontePizza()
  - Calcular por maior preço ou média
  - Permitir repetir sabor
  - Mínimo de sabores por tamanho
  - Bordas obrigatórias ou não
```

---

## 📊 FASE 5: Dashboard do Dono

**Duração:** 6 dias | **Prioridade:** ALTA

### 5.1 Layout do Painel

- [ ] Sidebar com navegação
- [ ] Header com info do usuário
- [ ] Breadcrumbs
- [ ] Layout responsivo
- [ ] Theme light/dark

### 5.2 Tela Inicial (Home)

- [ ] Card: Total de pedidos hoje
- [ ] Card: Faturamento do dia
- [ ] Card: Ticket médio
- [ ] Card: Produto mais vendido
- [ ] Gráfico: Vendas por hora (últimas 24h)
- [ ] Comparativo: Hoje vs Ontem
- [ ] Lista: Últimos 5 pedidos
- [ ] Alerta: Itens com estoque baixo

### 5.3 Gestão de Produtos

- [ ] Listagem com DataTable
- [ ] Filtro por categoria
- [ ] Filtro por status (ativo/inativo)
- [ ] Busca por nome
- [ ] Ordenação por colunas
- [ ] Toggle ativar/desativar inline
- [ ] Edição de preço inline
- [ ] Modal de criar/editar produto
- [ ] Upload de imagem
- [ ] Drag and drop para reordenar
- [ ] Ações em lote (ativar, desativar, excluir)

### 5.4 Gestão de Categorias

- [ ] CRUD de categorias
- [ ] Reordenação drag and drop
- [ ] Ícone por categoria

### 5.5 Gestão de Sabores (Monte sua Pizza)

- [ ] CRUD de sabores
- [ ] Vincular a categoria (salgada, doce)
- [ ] Lista de ingredientes
- [ ] Upload de imagem

### 5.6 Gestão de Tamanhos/Bordas

- [ ] CRUD de tamanhos
- [ ] Configurar multiplicador de preço
- [ ] Configurar máximo de sabores
- [ ] CRUD de bordas
- [ ] Preço adicional

### 5.7 Gestão de Pedidos

- [ ] Lista em tempo real (polling/realtime)
- [ ] Filtro por status
- [ ] Filtro por período
- [ ] Filtro por tipo (delivery/retirada)
- [ ] Card do pedido expandível
- [ ] Alterar status (Novo → Em preparo → Saiu para entrega → Finalizado)
- [ ] Imprimir comanda
- [ ] Reenviar para WhatsApp

### 5.8 Promoções

- [ ] CRUD de promoções
- [ ] Tipos: Percentual, Valor fixo, Leve X Pague Y, Combo
- [ ] Selecionar produtos aplicáveis
- [ ] Período de validade
- [ ] Código promocional
- [ ] Toggle ativar/desativar

### 5.9 Configurações

- [ ] Dados da pizzaria
- [ ] Logo e banner
- [ ] Cores do cardápio
- [ ] Horário de funcionamento
- [ ] Taxa de entrega
- [ ] Pedido mínimo
- [ ] Raio de entrega
- [ ] Integração WhatsApp
- [ ] Configurações do Monte sua Pizza

### 5.10 Preview do Cardápio

- [ ] Visualização em tempo real
- [ ] Simular mobile/desktop
- [ ] Link para abrir em nova aba

---

## 💳 FASE 6: Sistema de Planos

**Duração:** 4 dias | **Prioridade:** ALTA

### 6.1 Definição dos Planos

#### Plano Grátis (Free)

```yaml
- Limite: 15 produtos
- Limite: 5 sabores de pizza
- Cardápio digital básico
- QR Code
- Pedidos via WhatsApp
- Sem promoções
- Sem relatórios
- Marca d'água "PizzaDigital"
```

#### Plano Pro (R$ 49/mês)

```yaml
- Produtos ilimitados
- Sabores ilimitados
- Promoções ilimitadas
- Relatórios básicos
- Cupons de desconto
- Upsell automático
- Sem marca d'água
- Suporte por email
```

#### Plano Premium (R$ 99/mês)

```yaml
- Tudo do Pro
- Relatórios avançados
- Motor de inteligência
- API de integrações
- Multi-usuários
- Suporte prioritário
- Consultoria mensal
```

### 6.2 Middleware de Validação

```typescript
- [ ] Criar middleware checkPlanFeature()
- [ ] Verificar limite de produtos
- [ ] Verificar acesso a promoções
- [ ] Verificar acesso a relatórios
- [ ] Bloquear features não disponíveis
- [ ] Mostrar modal de upgrade
```

### 6.3 Página de Planos

- [ ] Página /painel/planos
- [ ] Comparativo de features
- [ ] Destaque no plano recomendado
- [ ] Toggle mensal/anual
- [ ] Desconto no plano anual

### 6.4 Trial Automático

- [ ] 30 dias de Premium grátis
- [ ] Banner de dias restantes
- [ ] Email de lembrete (7 dias, 3 dias, 1 dia)
- [ ] Downgrade automático ao expirar

### 6.5 Checkout de Assinatura

- [ ] Integração Mercado Pago Checkout Pro
- [ ] Criar preferência de pagamento
- [ ] Webhook de confirmação
- [ ] Atualizar subscription no banco
- [ ] Email de confirmação

### 6.6 Portal do Assinante

- [ ] Ver plano atual
- [ ] Histórico de pagamentos
- [ ] Atualizar forma de pagamento
- [ ] Cancelar assinatura
- [ ] Fazer upgrade/downgrade

---

## 🧠 FASE 7: Inteligência Comercial

**Duração:** 3 dias | **Prioridade:** MÉDIA

### 7.1 Relatórios SQL

#### Faturamento por Período

```sql
- [ ] Query: faturamento diário/semanal/mensal
- [ ] Gráfico de linha temporal
- [ ] Comparativo com período anterior
```

#### Produtos Mais Vendidos

```sql
- [ ] Query: ranking de produtos
- [ ] Quantidade vendida
- [ ] Faturamento por produto
- [ ] Gráfico de barras
```

#### Ticket Médio

```sql
- [ ] Query: ticket médio por período
- [ ] Evolução do ticket médio
- [ ] Comparativo dia da semana
```

#### Horários de Pico

```sql
- [ ] Query: pedidos por hora
- [ ] Heatmap semanal
- [ ] Identificar horários lentos
```

### 7.2 Dashboard de Relatórios

- [ ] Página /painel/relatorios
- [ ] Filtro por período
- [ ] Export para CSV
- [ ] Gráficos interativos (Recharts)

### 7.3 Motor de Sugestões

```typescript
- [ ] Identificar produtos parados (sem venda 7+ dias)
- [ ] Sugerir promoção para produtos parados
- [ ] Identificar combos frequentes
- [ ] Sugerir novos combos
- [ ] Alertar baixo estoque
```

### 7.4 Cálculos Automáticos

- [ ] Popular metrics_daily via trigger
- [ ] Calcular rankings semanais
- [ ] Identificar tendências

---

## 📱 FASE 8: QR Code & WhatsApp

**Duração:** 2 dias | **Prioridade:** MÉDIA

### 8.1 Gerador de QR Code

- [ ] Página /painel/qrcode
- [ ] Gerar QR Code automaticamente
- [ ] Customizar cores do QR
- [ ] Adicionar logo no centro
- [ ] Download PNG (alta resolução)
- [ ] Download SVG
- [ ] Preview de impressão A4

### 8.2 Templates de Impressão

- [ ] Template para mesa
- [ ] Template para banner
- [ ] Template para adesivo
- [ ] Instruções de uso

### 8.3 WhatsApp Estruturado

```typescript
- [ ] Template de mensagem configurável
- [ ] Variáveis dinâmicas
- [ ] Preview da mensagem
- [ ] Testar envio
```

### 8.4 Notificações WhatsApp (Futuro)

- [ ] Preparar estrutura para WhatsApp Business API
- [ ] Notificação de pedido recebido
- [ ] Notificação de status

---

## ⚡ FASE 9: Performance & Segurança

**Duração:** 3 dias | **Prioridade:** ALTA

### 9.1 Otimização de Performance

- [ ] Implementar Server Components
- [ ] Lazy loading de componentes pesados
- [ ] Otimização de imagens (next/image)
- [ ] Implementar ISR onde aplicável
- [ ] Code splitting automático
- [ ] Prefetch de rotas críticas

### 9.2 Cache e Revalidação

- [ ] Cache de cardápio público (revalidate 60s)
- [ ] Cache de configurações do tenant
- [ ] Invalidar cache ao editar produto

### 9.3 Banco de Dados

- [ ] Revisar índices
- [ ] Otimizar queries N+1
- [ ] Implementar paginação
- [ ] Connection pooling

### 9.4 Segurança

- [ ] Validar todos inputs (Zod)
- [ ] Sanitizar dados
- [ ] Rate limiting em API
- [ ] Headers de segurança
- [ ] CORS configurado
- [ ] Audit log de ações críticas

### 9.5 Testes de RLS

- [ ] Testar isolamento entre tenants
- [ ] Testar acesso não autorizado
- [ ] Testar edge cases

---

## 🚀 FASE 10: Testes & Deploy

**Duração:** 3 dias | **Prioridade:** CRÍTICA

### 10.1 Testes

- [ ] Testar fluxo de cadastro
- [ ] Testar fluxo de login
- [ ] Testar CRUD de produtos
- [ ] Testar Monte sua Pizza
- [ ] Testar carrinho e checkout
- [ ] Testar geração WhatsApp
- [ ] Testar relatórios
- [ ] Testar upgrade de plano
- [ ] Testar em mobile real

### 10.2 Deploy Vercel

- [ ] Configurar projeto na Vercel
- [ ] Configurar variáveis de ambiente
- [ ] Configurar domínio
- [ ] Configurar wildcard subdomain
- [ ] Testar deploy preview
- [ ] Deploy produção

### 10.3 Supabase Produção

- [ ] Criar projeto produção
- [ ] Executar migrations
- [ ] Configurar Auth
- [ ] Configurar Storage
- [ ] Configurar backups

### 10.4 Monitoramento

- [ ] Configurar Vercel Analytics
- [ ] Configurar error tracking (Sentry - free tier)
- [ ] Configurar uptime monitoring

### 10.5 Documentação

- [ ] README atualizado
- [ ] Guia de contribuição
- [ ] Documentação de API
- [ ] Guia do usuário (dono da pizzaria)

---

## 📈 MÉTRICAS DE SUCESSO

### Técnicas

- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Core Web Vitals verdes

### Negócio

- [ ] Onboarding < 5 minutos
- [ ] Primeiro pedido < 1 hora após setup
- [ ] Conversão trial → pago > 10%
- [ ] Churn < 5% mensal

---

## 🔮 BACKLOG FUTURO (v2.0+)

- [ ] App nativo (React Native)
- [ ] Painel de entregadores
- [ ] Integração iFood
- [ ] Integração Rappi
- [ ] Programa de fidelidade
- [ ] Avaliações de clientes
- [ ] Chat interno
- [ ] Múltiplas unidades por tenant
- [ ] Franquias
- [ ] White label total

---

## 📅 CRONOGRAMA SUGERIDO

| Semana | Fases       | Entregável                   |
| ------ | ----------- | ---------------------------- |
| 1      | 0, 1        | Arquitetura + Database       |
| 2      | 2, 3        | Auth + Cardápio Público      |
| 3      | 4           | Monte sua Pizza              |
| 4      | 5 (parte 1) | Dashboard - Home + Produtos  |
| 5      | 5 (parte 2) | Dashboard - Pedidos + Config |
| 6      | 6           | Sistema de Planos            |
| 7      | 7, 8        | Inteligência + QR/WhatsApp   |
| 8      | 9, 10       | Performance + Deploy         |

---

**Total de Tarefas:** ~200 checkboxes  
**Estimativa:** 39 dias úteis (~8 semanas)  
**Complexidade:** Alta  
**ROI Esperado:** Plataforma SaaS completa, escalável e profissional

---

> 💡 **Dica:** Execute as tarefas na ordem das fases. Cada fase depende da anterior. Marque os checkboxes conforme completar cada item.

> ⚠️ **Importante:** Este roadmap assume dedicação full-time. Para tempo parcial, multiplique a estimativa por 2-3x.

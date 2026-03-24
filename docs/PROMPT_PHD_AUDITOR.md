# PROMPT PHD — AUDITOR CIRÚRGICO ZAIRYX v2.0

> **Uso**: Colar este prompt no Cursor/Copilot antes de editar qualquer arquivo do repositório `TiagoIA-UX/Cardapio-Digital`. Ele contextualiza o LLM com o estado real do código, padrões reais e anti-patterns reais do projeto.

---

## CONTEXTO DO REPOSITÓRIO

**Produto**: SaaS B2B de cardápio digital para operações reais de alimentação no Brasil.
**Stack**: Next.js 16 App Router + React 19 + TypeScript strict · Tailwind CSS 4 · Radix UI + shadcn/ui · Supabase Auth + Postgres + RLS · Zustand · Mercado Pago · Upstash Redis · Cloudflare R2 · Playwright (E2E) + tsx --test (unit).
**Site público**: https://zairyx.com — deploy via Vercel a partir de `main`.

### Fluxo Principal

```
landing → /templates (escolha de template) → /comprar/[template] (checkout)
→ webhook POST /api/webhook/mercadopago (provisioning após pagamento)
→ /painel (dashboard do restaurante)
→ /r/[slug] (cardápio público)
```

> ⚠️ `/api/checkout/criar-sessao` está **DEPRECATED** (retorna 410 Gone). O checkout atual é em `/comprar/[template]`.

### Multi-tenant

O sistema suporta **múltiplos cardápios por usuário**. Nunca reassumir modelo single-restaurant em queries, telas ou provisioning.

---

## TABELAS REAIS (Supabase)

```sql
-- Núcleo do cardápio
restaurants        -- cardápios dos usuários (multi-tenant: user_id)
products           -- itens do cardápio
categories         -- categorias de produtos
orders             -- pedidos dos clientes
order_items        -- itens de cada pedido

-- SaaS / Subscriptions
users              -- perfis de usuários autenticados
tenants            -- tenants SaaS
subscriptions      -- planos ativos dos tenants
plans              -- definição de planos (basico, pro, premium)

-- Marketplace de templates
templates          -- templates disponíveis para compra (seed: 009_templates_seed.sql)
user_purchases     -- compras de templates (status: 'active' | 'pending')
template_orders    -- pedidos via Mercado Pago
checkout_sessions  -- sessões de checkout
webhook_events     -- idempotência de eventos Mercado Pago

-- Afiliados
affiliates                  -- programa de parceiros
affiliate_commissions       -- comissões devidas

-- Suporte / Freelancers / Penalidades
support_tickets      -- tickets com SLA (30min first response)
support_messages     -- mensagens dos tickets
freelancers          -- prestadores de serviço
freelancer_jobs      -- trabalhos do marketplace
affiliate_penalties  -- penalidades progressivas (warning → commission_reduction → client_loss)
system_logs          -- audit log de ações
```

**37 migrations** em `supabase/migrations/` — nunca modificar migrations existentes. Sempre criar nova.

---

## IMPORTS REAIS

```typescript
// ──── Supabase (ÚNICO ponto de criação de clientes) ────
import { createClient } from '@/lib/supabase/client'         // Client Components ('use client')
import { createClient } from '@/lib/supabase/server'         // Server Components / Route Handlers
import { createAdminClient } from '@/lib/supabase/admin'     // Webhooks / scripts privilegiados

// ──── Tipos ────
import type { Restaurant, Order, Product, Plan, Tenant, Subscription } from '@/types/database'
import type { ApiResponse, PaginatedResponse } from '@/types/database'
import type { SupportTicket, AffiliatePenalty, FreelancerJob } from '@/types/support'
import type { Template, TemplateCategory } from '@/types/template'
import type { CartItem, AppliedCoupon, CartStore } from '@/types/cart'
import type { CheckoutSession, PaymentMethod } from '@/types/checkout'

// ──── Serviços ────
import { getTenantBySlug, getCardapioPublico } from '@/services/tenant.service'
import { getPlans, createTrialSubscription, canAddProduct } from '@/services/subscription.service'
import { getOrders, createOrder, getTodayStats } from '@/services/order.service'
import { applyStrike } from '@/services/penalty.service'
import { createJob, assignJob } from '@/services/freelancer.service'

// ──── Helpers de template ────
import { normalizeTemplateSlug, TEMPLATE_PRESETS, parseRestaurantCustomization } from '@/lib/restaurant-customization'
import { buildRestaurantInstallation, slugifyRestaurantName, ONBOARDING_PLAN_CONFIG } from '@/lib/restaurant-onboarding'

// ──── Pagamentos ────
import { validateMercadoPagoWebhookSignature } from '@/lib/mercadopago-webhook'
import { createMercadoPagoPaymentClient } from '@/lib/mercadopago'
import { mapMercadoPagoStatus } from '@/lib/payment-status'

// ──── Infra ────
import { getRequestSiteUrl } from '@/lib/site-url'
import { notifyPaymentApproved, notifyPaymentRejected } from '@/lib/notifications'
```

### Templates Válidos (RestaurantTemplateSlug)

```
restaurante · pizzaria · lanchonete · bar · cafeteria · acai · sushi · adega ·
mercadinho · padaria · sorveteria · acougue · hortifruti · petshop · doceria
```

`normalizeTemplateSlug(value)` retorna `'restaurante'` se o valor for inválido/nulo — usar sempre.

---

## VARIÁVEIS DE AMBIENTE REAIS

**Server-side** (nunca expor no client):
```
MP_ACCESS_TOKEN            SUPABASE_SERVICE_ROLE_KEY    SUPABASE_PROJECT_REF
MP_WEBHOOK_SECRET          RESEND_API_KEY               RESEND_FROM_DOMAIN
UPSTASH_REDIS_REST_URL     UPSTASH_REDIS_REST_TOKEN     ADMIN_SECRET_KEY
INTERNAL_API_SECRET        CRON_SECRET                  BASE_URL            OWNER_EMAIL
```

**Public** (NEXT_PUBLIC_):
```
NEXT_PUBLIC_SUPABASE_URL           NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL               NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY
NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY   NEXT_PUBLIC_MERCADO_PAGO_ENV
NEXT_PUBLIC_ALLOW_DEV_UNLOCK       NEXT_PUBLIC_SENTRY_DSN
```

Se uma env var obrigatória estiver ausente, **falhar explicitamente** — nunca usar fallback fictício.

---

## PROTOCOLO DE AUDITORIA — 7 PASSOS

### PASSO 0 — Contexto do arquivo

1. O arquivo já existe? Se sim, ler CADA LINHA antes de propor qualquer mudança.
2. Qual é o propósito no sistema? (Server Component / Client Component / Route Handler / Service / Hook / Store / Type)
3. Quem importa este arquivo? Mapear impacto cascata.
4. Há migration SQL relacionada?

### PASSO 1 — Leitura completa

- [ ] Propósito declarado (comentários, nome, localização)?
- [ ] Imports externos e internos usados?
- [ ] Tabelas Supabase acessadas e cliente correto (`client` / `server` / `admin`)?
- [ ] `'use client'` está presente? É necessário?
- [ ] Estados e efeitos com todas as dependências?
- [ ] Error handling em todas as chamadas assíncronas?
- [ ] Filtros multi-tenant em todas as queries (`user_id`, `restaurant_id`)?

### PASSO 2 — Varredura de bugs

#### 🔴 Críticos

| Problema | Padrão Bugado | Correção |
|----------|---------------|----------|
| `.single()` com 0 rows possível | `.select().eq().single()` → erro PGRST116 | `.maybeSingle()` |
| Cross-tenant sem filtro | `from('restaurants').select()` sem `eq('user_id')` | Adicionar filtro |
| Webhook sem assinatura | Processar antes de `validateMercadoPagoWebhookSignature()` | Validar primeiro |
| `catch (err: any)` | Viola TypeScript strict | `catch (err) { err instanceof Error ? ... }` |
| `Math.random()` para tokens | Não criptográfico | `crypto.randomUUID()` |
| Env var sem verificação | `process.env.X!` sem check | `if (!X) throw new Error(...)` |

#### 🟡 Importantes

| Problema | Padrão Bugado | Correção |
|----------|---------------|----------|
| Multi-restaurant bloqueado | `if (existingRestaurant) redirect('/painel')` | Comparar `restaurantCount >= purchaseCount` |
| `useEffect` sem deps | Loop infinito ou stale closure | Incluir todas as deps |
| `window.location.href` | Ignora Router | `router.replace()` |
| `<img>` no lugar de `<Image>` | Sem otimização LCP | `next/image` |
| API sem rate limit | Abuso possível | Upstash Redis rate limit |
| API sem Zod | Input não validado | `z.parse()` |

### PASSO 3 — Comparação com mercado

- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- Next.js App Router: https://nextjs.org/docs/app
- Mercado Pago Webhooks: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
- Zod: https://zod.dev
- Upstash Rate Limit: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview

### PASSO 4 — Classificação

- 🔴 **CRÍTICO** — Quebra funcionalidade, expõe dado, permite acesso não autorizado
- 🟡 **IMPORTANTE** — Degrada UX, viola padrões, TypeScript strict
- 🔵 **MELHORIA** — Qualidade, performance, DX

### PASSO 5 — Arquivo corrigido

Regras absolutas:

1. Copiar estilo — identação, aspas, nomes do arquivo original
2. Zero `any` — TypeScript strict
3. Imports com `@/` — nunca caminhos relativos longos
4. `next/image` — nunca `<img>`
5. Supabase: `client` (browser) / `server` (server) / `admin` (webhook only)
6. Nunca modificar migrations antigas — criar nova em `supabase/migrations/`
7. Nunca criar segundo cliente Supabase fora de `lib/supabase/`
8. Build DEVE passar — `npm run build` sem erros

### PASSO 6 — Verificação

- [ ] `npm run build` sem erros?
- [ ] `npm run lint` sem erros?
- [ ] `npm test` passa?
- [ ] Nenhuma regressão nos arquivos importadores?
- [ ] RLS protege os dados da feature?

### PASSO 7 — Impacto em outros arquivos

```
lib/restaurant-onboarding.ts alterado?
  → Verificar tests/onboarding-and-templates.test.ts (atualizar fixtures)
  → Verificar app/painel/criar-restaurante/page.tsx
  → Verificar app/api/webhook/mercadopago/route.ts

lib/restaurant-customization.ts alterado?
  → Verificar todos os importadores de normalizeTemplateSlug e TEMPLATE_PRESETS

types/database.ts alterado?
  → Verificar todos os arquivos que importam esses tipos

services/*.service.ts alterado?
  → Verificar todos os importadores do serviço

Nova tabela Supabase adicionada?
  → Criar migration em supabase/migrations/
  → Adicionar tipos em types/database.ts
  → Adicionar serviço em services/ se necessário
```

---

## ANTI-PATTERNS DO ZAIRYX

Padrões que este projeto **NÃO deve usar** (baseado em bugs reais):

```typescript
// ❌ NUNCA: .single() quando 0 rows é possível
supabase.from('restaurants').select('id').eq('user_id', uid).single()
// ✅ SEMPRE: .maybeSingle()
supabase.from('restaurants').select('id').eq('user_id', uid).maybeSingle()

// ❌ NUNCA: bloquear criação se "já tem algum restaurante"
//   (quebra o modelo multi-restaurant para usuários com múltiplas compras)
const { data: existing } = await supabase.from('restaurants').select('id').eq('user_id', uid).single()
if (existing) { router.replace('/painel'); return }
// ✅ SEMPRE: comparar contagem (restaurantes criados vs compras ativas)
const [{ count: resCount }, { count: purchCount }] = await Promise.all([
  supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('user_id', uid),
  supabase.from('user_purchases').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'active'),
])
if ((resCount ?? 0) > 0 && (resCount ?? 0) >= (purchCount ?? 0)) { router.replace('/painel'); return }

// ❌ NUNCA: catch (err: any)
} catch (err: any) { setError(err.message) }
// ✅ SEMPRE: type-safe
} catch (err) { setError(err instanceof Error ? err.message : 'Erro inesperado') }

// ❌ NUNCA: cliente Supabase fora de lib/supabase/
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)
// ✅ SEMPRE: usar clientes oficiais do projeto
import { createClient } from '@/lib/supabase/client'       // browser
import { createClient } from '@/lib/supabase/server'       // server
import { createAdminClient } from '@/lib/supabase/admin'   // admin only

// ❌ NUNCA: validar webhook depois de processar
const payment = await mercadopago.get({ id: paymentId })
const isValid = validateMercadoPagoWebhookSignature(...)
// ✅ SEMPRE: validar ANTES de qualquer processamento
const isValid = validateMercadoPagoWebhookSignature(xSignature, xRequestId, dataId, secret)
if (!isValid) return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })

// ❌ NUNCA: referenciar criar-sessao como ativo
// app/api/checkout/criar-sessao/route.ts está DEPRECATED — retorna 410 Gone
// ✅ SEMPRE: checkout atual fica em /comprar/[template]

// ❌ NUNCA: Math.random() para tokens
const token = Math.random().toString(36)
// ✅ SEMPRE: crypto
const token = crypto.randomUUID()

// ❌ NUNCA: <img> para imagens de conteúdo
<img src={product.imagem_url} alt={product.nome} />
// ✅ SEMPRE: next/image
<Image src={product.imagem_url} alt={product.nome} width={80} height={80} />
```

---

## DECISÕES ARQUITETURAIS

| Decisão | Motivo |
|---------|--------|
| **Zustand (não Context)** | Context causa re-renders em toda a árvore. Zustand é granular e persistível com `persist`. |
| **Cloudflare R2 (não S3 direto)** | Egress gratuito, menor latência no Brasil, sem custo por acesso. |
| **Upstash Redis (não Redis próprio)** | Serverless-native, sem conexão persistente — compatível com Vercel Edge. |
| **`proxy.ts` (não `middleware.ts`)** | O middleware padrão do Next.js tem restrições no Edge Runtime. |
| **Admin client só em webhooks** | `SUPABASE_SERVICE_ROLE_KEY` bypassa RLS — expor em Client Components seria falha de segurança. |
| **`maybeSingle()` no lugar de `single()`** | `single()` lança PGRST116 se 0 ou N rows — causa crashes silenciosos. |
| **Idempotência via `webhook_events`** | Mercado Pago pode reenviar o mesmo evento — INSERT com `onConflict: 'event_id'` garante processamento único. |
| **`scope: 'global'` no signOut** | Revoga refresh tokens no servidor, impedindo sessões stale após logout. |

---

## DEPENDÊNCIAS ENTRE MÓDULOS

```
app/painel/criar-restaurante/page.tsx
  └── lib/restaurant-onboarding.ts (buildRestaurantInstallation)
       └── lib/restaurant-customization.ts (normalizeTemplateSlug, TEMPLATE_PRESETS)
       └── lib/templates-config.ts (getRestaurantTemplateConfig)
       └── lib/pricing.ts (getTemplatePrice)
       └── lib/template-product-images.ts

app/api/webhook/mercadopago/route.ts
  └── lib/mercadopago-webhook.ts (validateMercadoPagoWebhookSignature)
  └── lib/mercadopago.ts (createMercadoPagoPaymentClient)
  └── lib/restaurant-onboarding.ts (buildRestaurantInstallation)
  └── lib/supabase/admin.ts (createAdminClient)
  └── lib/notifications.ts

app/meus-templates/page.tsx
  └── lib/supabase/client.ts
  └── tables: user_purchases, templates, template_orders, restaurants

store/cart-store.ts
  └── app/api/checkout/validar-cupom/route.ts
  └── lib/supabase/client.ts
```

---

## PADRÃO DE COMMITS

```
feat: adiciona suporte a múltiplos cardápios por usuário
fix: corrige redirect incorreto em criar-restaurante para multi-restaurant
fix: usa maybeSingle() em vez de single() em queries de verificação
docs: atualiza PROMPT_PHD_AUDITOR com anti-patterns reais
chore: marca criar-sessao como deprecated no zairyx.mdc
test: adiciona teste para segundo cardápio
refactor: extrai lógica de acesso a serviço separado
```

---

## PADRÃO DE TESTES

```typescript
// Unitários: tsx --test tests/**/*.test.ts
// Localização: tests/

// Ao alterar lib/pricing.ts ou lib/restaurant-onboarding.ts:
// → Atualizar tests/onboarding-and-templates.test.ts

// E2E: npx playwright test
// Ao alterar fluxo de compra: npm run simulate:onboarding

// Scripts de teste específicos:
// npm run test:webhook  — testa webhook MP com payload real
// npm run test:r2       — testa upload para Cloudflare R2
// npm run test:e2e:checkout — testa fluxo de compra completo
```

---

## CHECKLIST PRÉ-COMMIT

```bash
npm run build     # DEVE passar sem erros
npm run lint      # DEVE passar sem erros
npm test          # DEVE passar
# ou em um único comando:
npm run audit:full
```

---

*Versão v2.0 — 2026-03-24 — Gerada a partir da auditoria cirúrgica real do repositório.*

# PLANO DE ISOLAMENTO DE DOMÍNIOS — ZAIRYX / CARDÁPIO DIGITAL

> **Nível**: Arquitetura de Software — Engenharia de Produção
> **Data**: 05/04/2026
> **Status**: Aprovado para execução

---

## 1. DIAGNÓSTICO REAL DO CODEBASE (DADOS, NÃO OPINIÃO)

| Métrica                    | Valor    |
| -------------------------- | -------- |
| API Routes                 | 61       |
| Lib files                  | 71       |
| Services                   | 7        |
| Scripts                    | 40+      |
| **Total arquivos lógicos** | **~190** |

### Domínios identificados por análise de dependência

| Domínio                                               | Arquivos | Estado Atual                 |
| ----------------------------------------------------- | -------- | ---------------------------- |
| **CORE** (cardápio, pedidos, pagamento, onboarding)   | ~66      | Monolítico, tudo acoplado    |
| **IMAGE** (R2, geração, auditoria, templates visuais) | ~31      | Scripts soltos, sem contrato |
| **AFFILIATE** (comissões, tiers, payout, penalidades) | ~12      | **Desativado (410 Gone)**    |
| **ZAEA** (orchestrator, scanner, surgeon, dispatch)   | ~6       | Isolado no GitHub Actions    |
| **AUTH** (admin, roles, repo-access, auditoria)       | ~10      | Acoplado ao CORE             |
| **MARKETING** (SEO, templates, pricing, analytics)    | ~15      | Espalhado                    |
| **INFRA** (supabase clients, rate-limit, utils)       | ~29      | Compartilhado por todos      |
| **SUPPORT** (tickets, SLA, chat, feedback)            | ~9       | Semi-isolado                 |

---

## 2. A RESPOSTA DA IA ANTERIOR — AVALIAÇÃO

### O que ela acertou

- ✅ Separar lógica ANTES de separar infra
- ✅ Não depender do orquestrador para organizar
- ✅ APIs internas como fronteira entre domínios
- ✅ Logs por domínio para debug isolado

### O que ela errou ou simplificou demais

- ❌ Tratou como "5 fases genéricas" sem dizer QUAIS arquivos mover para ONDE
- ❌ Não mediu o acoplamento real entre domínios
- ❌ Não priorizou baseado em dados (ex: AFFILIATE já está desativado, não é prioridade)
- ❌ Falou "validações locais" sem definir contratos de interface
- ❌ O conselho "logs por domínio" é insuficiente — precisa de error boundaries reais

---

## 3. PLANO DE EXECUÇÃO CONCRETO — 5 FASES

### FASE 1 — BOUNDED CONTEXTS (Semana 1-2)

**Objetivo**: Reorganizar pastas SEM quebrar nenhuma funcionalidade.

#### Estrutura alvo

```text
lib/
  domains/
    core/           ← cardápio, pedidos, checkout, delivery
      index.ts      ← barrel export (public API do domínio)
      cardapio-renderer.ts
      checkout-wizard.ts
      delivery-payment.ts
      delivery-mode.ts
      delivery-assistant.ts
      mercadopago.ts
      mercadopago-webhook.ts
      mercadopago-webhook-processing.ts
      payment-status.ts
      payment-mode.ts
      pix.ts
      coupon-validation.ts
      active-restaurant.ts
      restaurant-onboarding.ts
      restaurant-customization.ts
      onboarding-checkout.ts
      onboarding-provisioning.ts
      network-expansion.ts
      commercial-entitlements.ts
      minimercado-catalog.ts
      fiscal.ts
      fiscal-dispatch.ts
      tax-document.ts
      setup-wizard.ts
      panel-setup.ts
      panel/

    affiliate/      ← comissões, tiers, payout (DESATIVADO)
      index.ts
      affiliate-payout.ts
      affiliate-tiers.ts
      get-affiliate-tier.ts
      payout-batches.ts

    image/          ← upload, R2, geração, validação
      index.ts
      r2.ts
      template-product-images.ts
      generated-template-product-images.ts
      image-validation.ts

    zaea/           ← orchestrator, agentes, AI learning
      index.ts
      orchestrator.ts
      ai-learning.ts
      maestro.ts

    auth/           ← admin, roles, repo-access
      index.ts
      admin-auth.ts
      admin-audit.ts
      auth-access.ts
      private-repo-access.ts
      private-repo-access-ledger.ts
      login-guidance.ts

    marketing/      ← SEO, templates catalog, analytics
      index.ts
      templates-config.ts
      template-purchases.ts
      template-demo.ts
      pricing.ts
      google-search-console.ts
      google-maps.ts
      seo.ts
      analytics.ts
      lifecycle/

  shared/           ← infra que TODOS usam (não pertence a domínio)
    supabase/
    rate-limit.ts
    site-url.ts
    brand.ts
    format-currency.ts
    password-rules.ts
    utils.ts
    middleware-security.ts
    error-tracking.ts
    notifications.ts
```

#### Regra de ouro

> **Domínio A nunca importa diretamente de Domínio B.**
> Sempre usa `import { x } from '@/lib/domains/b'` (barrel export).
> Isso cria um contrato explícito entre domínios.

#### Execução da Fase 1

1. Criar pastas `lib/domains/{core,affiliate,image,zaea,auth,marketing}`
2. Mover arquivos (sem alterar conteúdo)
3. Criar `index.ts` em cada domínio com exports públicos
4. Atualizar todos os imports (find & replace em batch)
5. Rodar `npx tsc --noEmit` — zero erros = fase concluída
6. Rodar todos os testes: `npx tsx --test tests/**/*.test.ts`

---

### FASE 2 — CONTRATOS DE INTERFACE (Semana 2-3)

**Objetivo**: Cada domínio define sua API pública via TypeScript interfaces.

#### Exemplo — Domínio IMAGE

```typescript
// lib/domains/image/contracts.ts
export interface ImageService {
  upload(file: File, bucket: string): Promise<{ url: string; key: string }>
  validate(file: File): { valid: boolean; error?: string }
  delete(key: string): Promise<void>
  getTemplateImages(templateId: string): Record<string, string>
}
```

#### Exemplo — Domínio AFFILIATE

```typescript
// lib/domains/affiliate/contracts.ts
export interface AffiliateService {
  getTier(affiliateId: string): Promise<AffiliateTier>
  calculateCommission(saleAmount: number, tier: AffiliateTier): number
  getPayoutSchedule(): PayoutDates
  processBatch(batchId: string): Promise<PayoutResult>
}
```

#### Execução da Fase 2

1. Para cada domínio, criar `contracts.ts` com interfaces
2. Implementar factory function: `createImageService()`, `createAffiliateService()`
3. Rotas API continuam funcionando — só mudam os imports internos

---

### FASE 3 — LOGGER POR DOMÍNIO + ERROR BOUNDARIES (Semana 3-4)

**Objetivo**: Quando algo quebra, saber EXATAMENTE qual domínio causou.

#### Implementação da Fase 3

```typescript
// lib/shared/domain-logger.ts
export function createDomainLogger(domain: string) {
  return {
    info: (msg: string, meta?: Record<string, unknown>) =>
      logToSupabase({ level: 'info', domain, message: msg, metadata: meta }),
    warn: (msg: string, meta?: Record<string, unknown>) =>
      logToSupabase({ level: 'warn', domain, message: msg, metadata: meta }),
    error: (msg: string, error?: Error, meta?: Record<string, unknown>) =>
      logToSupabase({ level: 'error', domain, message: msg, stack: error?.stack, metadata: meta }),
  }
}

// Uso em cada domínio:
// lib/domains/image/index.ts
const log = createDomainLogger('image')
```

#### Tabela Supabase

```sql
CREATE TABLE domain_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL,        -- 'core', 'image', 'affiliate', 'zaea'
  level TEXT NOT NULL,         -- 'info', 'warn', 'error'
  message TEXT NOT NULL,
  stack TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_domain_logs_domain ON domain_logs(domain);
CREATE INDEX idx_domain_logs_level ON domain_logs(level);
CREATE INDEX idx_domain_logs_created ON domain_logs(created_at DESC);
```

#### Execução da Fase 3

1. Criar `lib/shared/domain-logger.ts`
2. Migration Supabase para `domain_logs`
3. Substituir `console.log/error` nos domínios pelo logger
4. Dashboard admin: `/admin/logs?domain=image&level=error`

---

### FASE 4 — VALIDAÇÃO NAS FRONTEIRAS (Semana 4-5)

**Objetivo**: Cada domínio rejeita input inválido na entrada, não no meio.

#### Padrão — Zod Schema por domínio

```typescript
// lib/domains/core/schemas.ts
export const OrderInputSchema = z.object({
  restaurantId: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  deliveryMode: z.enum(['whatsapp', 'terminal', 'hybrid']),
})

// lib/domains/image/schemas.ts
export const ImageUploadSchema = z.object({
  file: z.instanceof(File),
  bucket: z.enum(['logos', 'products', 'heroes', 'proofs']),
  maxSizeKB: z.number().default(2048),
})
```

#### Execução da Fase 4

1. Criar `schemas.ts` em cada domínio com validações Zod
2. Cada API route valida input com schema do domínio ANTES de processar
3. Se validação falha → retorna 400 com erro estruturado + domínio no log

---

### FASE 5 — HEALTH CHECK POR DOMÍNIO (Semana 5-6)

**Objetivo**: Saber se cada domínio está saudável independentemente.

#### Implementação da Fase 5

```typescript
// app/api/health/domains/route.ts
export async function GET() {
  const checks = await Promise.allSettled([
    checkCore(), // DB connection, orders table
    checkImage(), // R2 connection, bucket access
    checkAffiliate(), // affiliate tables (se ativo)
    checkZaea(), // agent_tasks table
    checkAuth(), // admin_users table
  ])

  return NextResponse.json({
    domains: {
      core: checks[0].status === 'fulfilled' ? checks[0].value : { healthy: false },
      image: checks[1].status === 'fulfilled' ? checks[1].value : { healthy: false },
      // ...
    },
    overall: checks.every((c) => c.status === 'fulfilled'),
  })
}
```

---

## 4. O QUE NÃO FAZER AGORA

| Ação                                           | Por quê não                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| Criar microserviços separados                  | Complexidade prematura — monolito organizado é melhor que microserviços bagunçados |
| Implementar ZAEA como orquestrador de domínios | ZAEA é para CI/CD, não para runtime. Misturar os dois gera confusão                |
| Extrair Affiliate para serviço independente    | Já está desativado (410). Não gaste energia nisso agora                            |
| Criar API Gateway                              | Você tem 1 app Next.js. Gateway é para quando tiver 3+ serviços                    |
| Kubernetes / Docker Compose                    | Você está na Vercel. Não precisa de container orchestration                        |

---

## 5. QUANDO O ORQUESTRADOR (ZAEA) ENTRA

O ZAEA **já existe** e **já funciona** para CI/CD (Scanner → Surgeon → Notifier → Validator).

Ele NÃO precisa virar "gerente de domínios em runtime". Isso é papel da **arquitetura** (fases 1-5 acima).

O ZAEA pode **evoluir** para:

1. **Monitor de health** — rodar health check dos domínios e alertar
2. **Auto-fix** — quando detectar erro em domínio, abrir PR com correção
3. **Deploy gating** — só fazer deploy se todos os domínios estão saudáveis

Mas isso é **FASE 6+**, depois que as fases 1-5 estiverem estáveis.

---

## 6. MÉTRICAS DE SUCESSO

| Fase   | Critério de "Pronto"                                                                             |
| ------ | ------------------------------------------------------------------------------------------------ |
| Fase 1 | `npx tsc --noEmit` limpo + todos os testes passando + nenhum import cruzando domínios sem barrel |
| Fase 2 | Cada domínio tem `contracts.ts` + factory function                                               |
| Fase 3 | Zero `console.log` direto em código de domínio + tabela `domain_logs` populando                  |
| Fase 4 | Cada API route tem validação Zod na entrada + erros 400 com `{ domain, error }`                  |
| Fase 5 | `/api/health/domains` retornando status de todos os domínios                                     |

---

## 7. ORDEM DE PRIORIDADE (BASEADA EM DADOS)

1. **CORE** — é o maior (66 arquivos), mais acoplado, mais crítico
2. **IMAGE** — 31 arquivos soltos, fácil de isolar, ganho rápido
3. **AUTH** — 10 arquivos, bem definido, baixo risco
4. **MARKETING** — 15 arquivos, já semi-isolado
5. **ZAEA** — 6 arquivos, já quase isolado (vive no GitHub Actions)
6. **AFFILIATE** — 12 arquivos, **desativado**, última prioridade

---

## RESUMO EXECUTIVO

A IA anterior **acertou a direção** mas **errou na profundidade**. O plano dela era genérico ("separe lógica, crie APIs internas, adicione logs"). O plano acima é concreto: diz QUAIS arquivos vão para ONDE, QUAIS interfaces criar, QUAL tabela SQL, e COMO medir se cada fase terminou.

**Resposta direta à sua pergunta**: Sim, faz total sentido isolar domínios SEM o orquestrador. O orquestrador (ZAEA) é ferramenta de CI/CD, não de arquitetura de domínios. A organização vem da **estrutura de pastas + contratos TypeScript + logs por domínio**.

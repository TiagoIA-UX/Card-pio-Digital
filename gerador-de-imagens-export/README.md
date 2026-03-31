<div align="center">

# Gerador de Imagens IA

**Módulo SaaS de geração de imagens com Inteligência Artificial**

[![Parte do Cardápio Digital](https://img.shields.io/badge/parte%20de-Zairyx%20Cardápio%20Digital-brightgreen)](https://github.com/TiagoIA-UX/Cardapio-Digital)
[![License: BSL 1.1](https://img.shields.io/badge/License-BSL%201.1-blue.svg)](https://github.com/TiagoIA-UX/Cardapio-Digital/blob/main/LICENSE)
[![Demo](https://img.shields.io/badge/demo-zairyx.com%2Fgerador--imagens-orange)](https://zairyx.com/gerador-imagens)

[Demo ao Vivo](https://zairyx.com/gerador-imagens) · [Repositório Principal](https://github.com/TiagoIA-UX/Cardapio-Digital) · [Contato](mailto:tiago@tiagoia.dev)

</div>

---

## O que é este módulo?

O **Gerador de Imagens IA** é um módulo SaaS completo — integrado ao [Cardápio Digital / Zairyx](https://github.com/TiagoIA-UX/Cardapio-Digital) — que permite gerar imagens profissionais de produtos, comidas, logos e conteúdo visual usando Inteligência Artificial.

O módulo funciona com modelo de **créditos pré-pagos** (compra avulsa via Mercado Pago), suporta 3 providers de IA e inclui validação visual automática com Gemini Vision.

```
Usuário digita prompt → Escolhe estilo → Gera imagem (1 crédito)
                                              ↓
                           Gemini Vision analisa qualidade
                                              ↓
                     Se reprovada → Retry automático (até 3×)
                                              ↓
                              Imagem aprovada exibida
```

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| **3 Providers de IA** | Pollinations.ai (grátis), DALL-E 3 (OpenAI), Gemini Imagen 3 |
| **6 Estilos** | Comida, Packshot, Lifestyle, Abstrato, Produto E-commerce, Logo |
| **Geração em Lote** | Até 877 imagens por job (Pollinations) ou 50 (DALL-E/Gemini) |
| **Validação Visual** | Gemini 1.5 Flash analisa qualidade + retry automático |
| **Sistema de Créditos** | 3 créditos grátis + pacotes pagos via Mercado Pago |
| **Checkpoint/Resume** | Jobs em lote salvam progresso a cada 10 itens |
| **Histórico** | Todas as gerações salvas por usuário |
| **Páginas Co-branded** | URLs parceiras com identidade visual customizada |
| **Rate Limiting** | Upstash Redis — proteção por IP e por usuário |
| **Auth** | Supabase Auth — créditos vinculados à conta |

---

## Demo

Acesse [https://zairyx.com/gerador-imagens](https://zairyx.com/gerador-imagens) para ver o módulo funcionando ao vivo.

**Exemplos de prompts para testar:**
- `Pizza margherita com molho de tomate fresco e mussarela`
- `Hambúrguer artesanal duplo com queijo cheddar e bacon crocante`
- `Açaí na tigela com granola, banana e mel`
- `Logotipo minimalista para restaurante italiano`

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, Tailwind CSS 4, Radix UI |
| Backend | Next.js API Routes |
| Banco de Dados | Supabase (PostgreSQL) com RLS |
| Autenticação | Supabase Auth |
| Pagamento | Mercado Pago (checkout, PIX, cartão) |
| IA — Geração | Pollinations.ai · OpenAI DALL-E 3 · Google Imagen 3 |
| IA — Validação | Gemini 1.5 Flash (Vision) |
| Rate Limiting | Upstash Redis |
| Linguagem | TypeScript 5 (strict) |

---

## Estrutura de Arquivos

```
lib/
  ai-image-generator.ts          ← Core: providers, estilos, batch, créditos
  ai-image-validator.ts          ← Validação visual com Gemini Vision
  ai-image-generator-partners.ts ← Config de parceiros co-branded

app/
  gerador-imagens/
    page.tsx                     ← Página principal (SSR + metadata)
    client.tsx                   ← UI React com estado completo
    p/[partnerSlug]/
      page.tsx                   ← Página co-branded (SSR + metadata)
      client.tsx                 ← UI co-branded do parceiro

  api/
    gerador-imagens/
      gerar/route.ts             ← POST — gerar uma imagem
      lote/
        route.ts                 ← POST — criar job em lote
        [jobId]/route.ts         ← GET (poll) / DELETE (cancelar) job
      creditos/route.ts          ← GET — saldo e histórico
      comprar/route.ts           ← POST — criar preferência Mercado Pago
    webhook/
      gerador-imagens/route.ts   ← POST — webhook Mercado Pago (idempotente)

supabase/
  migration_ai_image_generator.sql ← Schema completo + funções RPC

tests/
  ai-image-generator.test.ts    ← 40 testes unitários (funções puras)
  ai-image-validator.test.ts    ← 18 testes unitários (parser + retry)
```

---

## Pacotes de Créditos

| Pacote | Créditos | Preço | Preço/crédito |
|---|---|---|---|
| **Starter** | 10 | R$9,90 | R$0,99 |
| **Básico** | 50 | R$29,90 | R$0,60 |
| **Profissional** ⭐ | 150 | R$69,90 | R$0,47 |
| **Ilimitado** | 500 | R$149,90 | R$0,30 |
| **Grátis (boas-vindas)** | 3 | R$0 | — |

> Cada imagem gerada consome 1 crédito. Créditos nunca expiram.

---

## Providers de IA

### 1. Pollinations.ai (Padrão — Grátis)

- **Custo:** Zero — sem API key necessária
- **Qualidade:** ⭐⭐⭐ (boa para cardápios e produtos)
- **Modelo:** Flux (qualidade superior ao modelo padrão)
- **Limite:** 877 imagens/lote (catálogo completo de templates)
- **Como funciona:** Monta URL com o prompt codificado — a imagem é renderizada pelo Pollinations quando o browser carrega a URL.

```
https://image.pollinations.ai/prompt/{prompt-codificado}
  ?width=800&height=800
  &seed=123456
  &nologo=true
  &model=flux
  &enhance=true
  &safe=true
```

### 2. DALL-E 3 via OpenAI (Premium)

- **Custo:** ~$0.04/imagem (`standard`, 1024×1024)
- **Qualidade:** ⭐⭐⭐⭐⭐
- **API Key:** `OPENAI_API_KEY`
- **Rate limit:** ~4 imagens/minuto (Tier 1)
- **Limite por lote:** 50 imagens

### 3. Gemini Imagen 3 via Google (Premium)

- **Custo:** ~$0.04/imagem
- **Qualidade:** ⭐⭐⭐⭐⭐
- **API Key:** `GEMINI_API_KEY`
- **Rate limit:** ~60 imagens/minuto
- **Limite por lote:** 50 imagens
- **Parâmetros:** `aspectRatio=1:1`, `safetyFilterLevel=BLOCK_ONLY_HIGH`, `personGeneration=DONT_ALLOW`

---

## Estilos de Imagem

| Estilo | Label | Uso típico |
|---|---|---|
| `food` | 🍕 Comida / Cardápio | Pratos, sobremesas, bebidas |
| `packshot` | 📦 Produto em Fundo Branco | E-commerce, catálogos |
| `lifestyle` | ✨ Lifestyle / Ambiente | Instagram, editorial |
| `abstract` | 🎨 Arte Abstrata | Fundos, banners |
| `product` | 🛒 Produto E-commerce | Produtos gerais |
| `logo` | 🏷️ Logo / Marca | Identidade visual |

Cada estilo adiciona automaticamente um **preset profissional** ao final do prompt. Por exemplo, `food` adiciona:

```
restaurant menu photography, appetizing, realistic plating, commercial food styling,
high resolution, vivid colors, soft natural lighting, no text, no watermark, no people
```

---

## API Reference

### `POST /api/gerador-imagens/gerar`

Gera uma única imagem. Consome 1 crédito do usuário autenticado (ou permite sem auth para testes, sem consumo).

**Request:**
```json
{
  "prompt": "Pizza margherita com molho de tomate fresco",
  "style": "food",
  "width": 800,
  "height": 800,
  "provider": "pollinations",
  "validate": true
}
```

**Response 200:**
```json
{
  "success": true,
  "imageUrl": "https://image.pollinations.ai/prompt/...",
  "provider": "pollinations",
  "width": 800,
  "height": 800,
  "validation": {
    "score": 82,
    "issues": [],
    "skipped": false,
    "attempts": 1
  }
}
```

**Response 402 (sem créditos):**
```json
{
  "error": "Créditos insuficientes",
  "code": "INSUFFICIENT_CREDITS",
  "message": "Você não tem créditos suficientes. Adquira um pacote para continuar."
}
```

**Rate limit:** 10 req/minuto por IP

---

### `POST /api/gerador-imagens/lote`

Cria um job de geração em lote. Autenticação obrigatória.

**Request:**
```json
{
  "prompts": [
    { "prompt": "Pizza margherita", "style": "food" },
    { "prompt": "Hambúrguer artesanal", "style": "food" },
    { "prompt": "Logotipo pizzaria", "style": "logo" }
  ],
  "provider": "pollinations",
  "validate": true
}
```

**Response 202:**
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "total": 3,
  "estimatedSeconds": 6,
  "provider": "pollinations",
  "pollUrl": "/api/gerador-imagens/lote/550e8400-e29b-41d4-a716-446655440000"
}
```

**Limites:**
- Pollinations: até 877 prompts/lote
- DALL-E / Gemini: até 50 prompts/lote
- Rate limit: 5 req/minuto

---

### `GET /api/gerador-imagens/lote/{jobId}`

Consulta o progresso de um job em lote. Autenticação obrigatória.

**Response 200:**
```json
{
  "jobId": "550e8400-...",
  "status": "completed",
  "total": 3,
  "done": 3,
  "errors": 0,
  "pending": 0,
  "percent": 100,
  "creditsCharged": 3,
  "provider": "pollinations",
  "items": [
    {
      "index": 0,
      "prompt": "Pizza margherita",
      "style": "food",
      "imageUrl": "https://image.pollinations.ai/prompt/...",
      "status": "done"
    }
  ],
  "createdAt": "2026-03-31T13:00:00Z",
  "updatedAt": "2026-03-31T13:00:06Z"
}
```

**Status possíveis:** `pending` | `processing` | `completed` | `failed` | `cancelled`

**Rate limit:** 60 req/minuto (polling frequente OK)

---

### `DELETE /api/gerador-imagens/lote/{jobId}`

Cancela um job pendente ou em processamento.

**Response 200:**
```json
{ "success": true, "jobId": "550e8400-...", "status": "cancelled" }
```

---

### `GET /api/gerador-imagens/creditos`

Retorna saldo e histórico de gerações do usuário.

**Response 200 (autenticado):**
```json
{
  "authenticated": true,
  "credits_available": 47,
  "credits_used": 12,
  "free_credits_given": true,
  "recent_generations": [
    {
      "id": "uuid",
      "prompt": "Pizza margherita",
      "style": "food",
      "image_url": "https://...",
      "provider": "pollinations",
      "created_at": "2026-03-31T13:00:00Z"
    }
  ]
}
```

**Response 200 (não autenticado):**
```json
{
  "authenticated": false,
  "credits_available": 0,
  "credits_used": 0,
  "free_credits_given": false
}
```

---

### `POST /api/gerador-imagens/comprar`

Cria uma preferência de pagamento no Mercado Pago para comprar créditos. Autenticação obrigatória.

**Request:**
```json
{ "packSlug": "pro" }
```

**Slugs válidos:** `starter` | `basic` | `pro` | `unlimited`

**Response 200:**
```json
{
  "success": true,
  "checkoutUrl": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
  "sandboxCheckoutUrl": "https://sandbox.mercadopago.com.br/...",
  "preferenceId": "...",
  "orderId": "uuid"
}
```

---

### `POST /api/webhook/gerador-imagens`

Webhook do Mercado Pago — adiciona créditos automaticamente após pagamento aprovado.

> **Idempotente:** Processar o mesmo webhook duas vezes não dobra os créditos.

**Configurar no painel Mercado Pago:**
```
URL: https://seu-dominio.com/api/webhook/gerador-imagens
Eventos: payment
```

---

## Validação Visual com Gemini Vision

Após cada geração, o módulo pode analisar automaticamente a imagem produzida usando **Gemini 1.5 Flash Vision**. O objetivo é garantir qualidade antes de entregar ao usuário.

### O que é verificado

| Critério | Penalidade |
|---|---|
| Texto/watermark indesejado | Alta |
| Conteúdo diferente do prompt | Rejeição |
| Imagem borrada ou distorcida | Média |
| Pessoas visíveis (indesejável em produto) | Média |
| Score geral de qualidade | — |

### Lógica de retry

```
Tentativa 1 → score >= 70: ✅ aprovada, retorna imediatamente
            → score 40-69: ⚠ aceitável, retorna
            → score < 40:  ❌ rejeitada → Tentativa 2 (novo seed)
Tentativa 2 → mesma lógica...
Tentativa 3 → retorna a melhor imagem obtida até então
```

### Configuração

```env
GEMINI_API_KEY=AIza...   # Se não configurado: bypass automático (sem bloquear a geração)
```

### Como funciona internamente

```typescript
// lib/ai-image-validator.ts

// 1. Busca a imagem como buffer (não usa fileUri — só funciona com gs://)
const imgResponse = await fetch(imageUrl)
const buffer = await imgResponse.arrayBuffer()
const imageBase64 = Buffer.from(buffer).toString('base64')

// 2. Envia via inlineData para o Gemini Vision
{
  inlineData: {
    mimeType: 'image/jpeg',
    data: imageBase64,
  }
}

// 3. Retorna análise estruturada
{
  "score": 85,
  "matches_prompt": true,
  "has_unwanted_text": false,
  "has_visible_people": false,
  "is_blurry_or_distorted": false,
  "issues": [],
  "suggestion": null
}
```

---

## Schema do Banco de Dados

Execute a migration em `supabase/migration_ai_image_generator.sql` no SQL Editor do Supabase.

### Tabelas

#### `ai_image_orders` — Pedidos de créditos
```sql
id                    UUID PRIMARY KEY
user_id               UUID → auth.users
mp_preference_id      TEXT
mp_payment_id         TEXT
mp_external_reference TEXT UNIQUE
pack_slug             TEXT  -- 'starter' | 'basic' | 'pro' | 'unlimited'
credits_amount        INTEGER
amount_paid           NUMERIC(10,2)
status                TEXT  -- 'pending' | 'approved' | 'rejected' | 'cancelled'
payment_method        TEXT  -- 'pix' | 'credit_card'
approved_at           TIMESTAMPTZ
metadata              JSONB
```

#### `ai_image_credits` — Saldo por usuário
```sql
id                  UUID PRIMARY KEY
user_id             UUID UNIQUE → auth.users
credits_available   INTEGER DEFAULT 0
credits_used        INTEGER DEFAULT 0
free_credits_given  BOOLEAN DEFAULT false
```

#### `ai_image_generations` — Histórico de gerações
```sql
id                UUID PRIMARY KEY
user_id           UUID → auth.users
prompt            TEXT
translated_prompt TEXT
style             TEXT  -- 'food' | 'packshot' | ...
image_url         TEXT
provider          TEXT  -- 'pollinations' | 'dalle' | 'gemini'
width             INTEGER
height            INTEGER
credits_charged   INTEGER DEFAULT 1
metadata          JSONB  -- validation_score, attempts, batch_job_id
```

#### `ai_image_batch_jobs` — Jobs em lote
```sql
id              UUID PRIMARY KEY
user_id         UUID → auth.users
status          TEXT  -- 'pending'|'processing'|'completed'|'failed'|'cancelled'
provider        TEXT
total           INTEGER
done            INTEGER
errors          INTEGER
credits_charged INTEGER
items           JSONB  -- lista de BatchItem com progresso incremental
metadata        JSONB
```

### Funções RPC (SECURITY DEFINER)

| Função | Descrição |
|---|---|
| `give_free_ai_image_credits(user_id)` | Dá 3 créditos grátis ao novo usuário (idempotente) |
| `add_ai_image_credits(user_id, credits)` | Adiciona créditos comprados |
| `consume_ai_image_credit(user_id, amount)` | Consome créditos atomicamente, retorna `boolean` |

---

## Configuração

### 1. Variáveis de Ambiente

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Mercado Pago — para pagamento de créditos
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...  # ou TEST-... para sandbox
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=APP_USR-...
MP_WEBHOOK_SECRET=chave-forte-gerada   # opcional mas recomendado
MERCADO_PAGO_ENV=sandbox               # 'sandbox' ou 'production'
NEXT_PUBLIC_MERCADO_PAGO_ENV=sandbox

# Providers de IA (todos opcionais — Pollinations funciona sem key)
OPENAI_API_KEY=sk-...                  # Para DALL-E 3
GEMINI_API_KEY=AIza...                 # Para Imagen 3 + validação visual

# Rate limiting (opcional — funciona em memória sem isso)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 2. Aplicar a Migration

No [SQL Editor do Supabase](https://app.supabase.com/project/_/sql):

```sql
-- Cole o conteúdo de supabase/migration_ai_image_generator.sql
```

Ou usando a CLI:
```bash
supabase db push
```

### 3. Configurar Webhook no Mercado Pago

1. Acesse o [painel do Mercado Pago](https://www.mercadopago.com.br/developers/panel)
2. Vá em **Notificações → Webhooks**
3. Adicione a URL: `https://seu-dominio.com/api/webhook/gerador-imagens`
4. Selecione o evento: **Pagamentos**
5. Copie o `secret` gerado e coloque em `MP_WEBHOOK_SECRET`

---

## Instalação

### Pré-requisitos

- Node.js 20+
- Conta no Supabase (banco de dados)
- Conta no Mercado Pago (pagamentos) — opcional para testes
- API key do Gemini (validação visual) — opcional

### Setup

```bash
# 1. Clone o repositório principal
git clone https://github.com/TiagoIA-UX/Cardapio-Digital.git
cd Cardapio-Digital

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# 4. Aplique a migration do Gerador de Imagens
# No SQL Editor do Supabase, cole o conteúdo de:
# supabase/migration_ai_image_generator.sql

# 5. Inicie o servidor
npm run dev

# Para testar Mercado Pago localmente (requer HTTPS):
npm run dev:https
```

Acesse [http://localhost:3000/gerador-imagens](http://localhost:3000/gerador-imagens).

---

## Testes

```bash
# Instale dependências primeiro
npm install

# Rode os testes do módulo
npx tsx --test tests/ai-image-generator.test.ts
npx tsx --test tests/ai-image-validator.test.ts

# Resultado esperado:
# ✔ buildFullPrompt (5 testes)
# ✔ buildPollinationsUrl (4 testes)
# ✔ estimateBatchCost (3 testes)
# ✔ validateBatchInput (6 testes)
# ✔ buildBatchItems (3 testes)
# ✔ calcBatchPercent (4 testes)
# ✔ getMaxBatchSize (2 testes)
# ✔ getCreditPack + CREDIT_PACKS (3 testes)
# ✔ parseAnalysisResponse (9 testes)
# ✔ shouldRetryGeneration (9 testes)
```

---

## Páginas Co-branded

O módulo suporta páginas co-branded com identidade visual customizada para parceiros.

### URL Pattern
```
/gerador-imagens/p/[slug-do-parceiro]
```

### Exemplo
```
/gerador-imagens/p/blog-da-elisa   ← parceria com Blog da Elisa
/gerador-imagens/p/zairyx          ← alias da página principal
```

### Adicionar novo parceiro

Edite `lib/ai-image-generator-partners.ts`:

```typescript
{
  slug: 'meu-parceiro',
  name: 'Meu Parceiro',
  displayName: 'Meu Parceiro — Descrição',
  tagline: 'Slogan da página co-branded',
  description: 'Descrição mais longa para o hero...',
  logoText: 'Meu Parceiro',
  logoEmoji: '🚀',
  accentColorClass: 'text-blue-500',
  websiteUrl: 'https://meuparceiro.com',
  affiliateId: 'meu-parceiro',          // para rastreamento de receita
  targetAudience: 'Descrição do público-alvo',
  useCases: [
    'Caso de uso 1',
    'Caso de uso 2',
  ],
  ctaLabel: 'Texto do botão principal',
}
```

---

## Fluxo de Pagamento Completo

```
Usuário clica "Comprar Pacote Pro"
  ↓
POST /api/gerador-imagens/comprar { packSlug: "pro" }
  ↓
  Cria registro em ai_image_orders (status: 'pending')
  Cria preferência no Mercado Pago
  Retorna checkoutUrl
  ↓
Usuário paga no Mercado Pago (PIX ou cartão)
  ↓
POST /api/webhook/gerador-imagens ← Mercado Pago notifica
  ↓
  Valida assinatura do webhook (MP_WEBHOOK_SECRET)
  Verifica se já processou (idempotência)
  Atualiza ai_image_orders (status: 'approved')
  Chama add_ai_image_credits() → credita ao usuário
  ↓
Usuário volta ao /gerador-imagens?status=sucesso&pack=pro
  ↓
Créditos disponíveis imediatamente
```

---

## Segurança

| Aspecto | Implementação |
|---|---|
| Autenticação | Supabase Auth — sessão server-side |
| Autorização de créditos | `consume_ai_image_credit()` — função RPC atômica com `FOR UPDATE` |
| RLS | Todas as tabelas com Row Level Security |
| Validação de input | Zod schema em todos os endpoints |
| Rate limiting | Dual-layer: in-memory (edge) + Upstash Redis |
| Webhook | Assinatura HMAC via `validateMercadoPagoWebhookSignature()` |
| Idempotência | `UNIQUE` em `mp_external_reference` + check de status |
| Preço | Calculado server-side — nunca confia no frontend |

---

## Exemplos de Uso via curl

```bash
# Gerar uma imagem (sem auth — bypass de crédito)
curl -X POST https://zairyx.com/api/gerador-imagens/gerar \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Pizza margherita","style":"food","provider":"pollinations"}'

# Consultar saldo (requer cookie de sessão)
curl https://zairyx.com/api/gerador-imagens/creditos \
  -H "Cookie: sb-...-auth-token=..."

# Criar job em lote (requer auth)
curl -X POST https://zairyx.com/api/gerador-imagens/lote \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-...-auth-token=..." \
  -d '{
    "prompts": [
      {"prompt": "Pizza margherita", "style": "food"},
      {"prompt": "Açaí na tigela", "style": "food"}
    ],
    "provider": "pollinations"
  }'

# Consultar progresso do job
curl https://zairyx.com/api/gerador-imagens/lote/{jobId} \
  -H "Cookie: sb-...-auth-token=..."
```

---

## Roadmap

- [ ] Interface de download em lote (ZIP com todas as imagens)
- [ ] Geração com referência de imagem (img2img)
- [ ] Integração com editor de cardápio (salvar diretamente no produto)
- [ ] API pública com autenticação por chave (para integrações externas)
- [ ] Webhooks de progresso do job (Server-Sent Events)
- [ ] Histórico com busca e filtros
- [ ] Upscaling automático (2× e 4×)

---

## Licença

Este módulo faz parte do **Cardápio Digital / Zairyx** e é licenciado sob a **Business Source License 1.1 (BSL)**.

- **Uso não-comercial:** livre para desenvolvimento, estudo e uso pessoal
- **Uso comercial:** requer licença comercial — [tiago@tiagoia.dev](mailto:tiago@tiagoia.dev)
- **Conversão:** em 2030-03-19, converte automaticamente para Apache 2.0

---

## Contato

- **Email:** tiago@tiagoia.dev
- **Site:** [https://zairyx.com](https://zairyx.com)
- **Demo:** [https://zairyx.com/gerador-imagens](https://zairyx.com/gerador-imagens)
- **Repositório principal:** [TiagoIA-UX/Cardapio-Digital](https://github.com/TiagoIA-UX/Cardapio-Digital)

---

<div align="center">

**Gerador de Imagens IA** · Parte do ecossistema **Zairyx**

*Gere imagens profissionais para o seu negócio em segundos*

</div>

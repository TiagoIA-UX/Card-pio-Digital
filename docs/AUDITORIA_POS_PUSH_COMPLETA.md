# AUDITORIA PÓS-PUSH — CARDÁPIO DIGITAL v2.0

> **Data:** Março 2026
> **Escopo:** 40 arquivos alterados, 1.289 inserções, 1.014 remoções desde último push (`f4080bc`)
> **Commits auditados:** 7 commits (`df822f6` → `25c6345`)
> **Branch:** `rename/cardapio-digital`

---

## RESUMO EXECUTIVO

| Categoria        | 🔴 Crítico    | ⚠️ Médio | 🟡 Baixo | ✅ OK  |
| ---------------- | ------------- | -------- | -------- | ------ |
| TypeScript/Build | 0 (corrigido) | 0        | 0        | ✅     |
| Segurança (API)  | 3             | 8        | 5        | 10     |
| Copy/Marketing   | 4 (órfãos)    | 7        | 4        | 4      |
| Editor/Painel    | 0             | 5        | 6        | 3      |
| Infraestrutura   | 1             | 1        | 0        | 2      |
| **TOTAL**        | **8**         | **21**   | **15**   | **19** |

---

## 1. TYPESCRIPT/BUILD — ✅ LIMPO

**10 erros encontrados e corrigidos nesta auditoria:**

| #    | Arquivo                                  | Erro                                                                      | Status       |
| ---- | ---------------------------------------- | ------------------------------------------------------------------------- | ------------ |
| 1    | `app/api/chat/route.ts`                  | `adega` ausente no `Record<RestaurantTemplateSlug, string>`               | ✅ CORRIGIDO |
| 2    | `app/api/webhook/mercadopago/route.ts`   | `webhook_secret_missing` ausente no tipo `WebhookEvent`                   | ✅ CORRIGIDO |
| 3-6  | `components/pricing-section.tsx`         | `template.slug` (`string`) passado onde esperava `RestaurantTemplateSlug` | ✅ CORRIGIDO |
| 7-10 | `components/sections/SecaoConversao.tsx` | Mesmo problema de tipo em `getTemplatePricing()`                          | ✅ CORRIGIDO |

**Resultado:** `npx tsc --noEmit` → 0 erros.

---

## 2. SEGURANÇA — ROTAS API

### 🔴 CRÍTICO

#### 2.1 — `/api/afiliados/indicacao` — Service Role Key Exposta

```
Rota compara Bearer token com SUPABASE_SERVICE_ROLE_KEY diretamente.
Se `.env` vazar, qualquer atacante pode registrar comissões falsas.
```

**Recomendação:** Transformar em chamada interna (webhook → webhook) com HMAC ou shared secret dedicado, sem expor service role key.

#### 2.2 — `/api/dev/unlock-all-templates` — Controle por NODE_ENV

```
Usa process.env.NODE_ENV === 'development' || ALLOW_DEV_UNLOCK === 'true'.
Em produção, se NODE_ENV não for exatamente 'production' ou ALLOW_DEV_UNLOCK estiver setado, a rota fica acessível.
```

**Recomendação:** Deletar essa rota ou proteger com `requireAdmin('owner')`.

#### 2.3 — `/api/onboarding/submit` — Sem Schema para Objeto Profundo

```
Aceita { checkout, restaurant_id, data } onde `data` é um objeto aninhado
(categorias → produtos) sem validação Zod — risco de DoS via payload gigante.
```

**Recomendação:** Adicionar schema Zod com `.max()` para arrays e `.max()` para strings.

### ⚠️ MÉDIO

| #    | Rota                                | Problema                                                                    |
| ---- | ----------------------------------- | --------------------------------------------------------------------------- |
| 2.4  | `/api/carrinho/sync` GET            | IDOR potencial — aceita `userId` param sem validar se é do user autenticado |
| 2.5  | `/api/admin/clientes` POST          | Switch de actions sem whitelist formal                                      |
| 2.6  | `/api/admin/afiliados/comissoes`    | Sem schema Zod para body                                                    |
| 2.7  | `/api/afiliados/me` GET             | 5 queries paralelas sem rate limit — potencial DoS                          |
| 2.8  | `/api/afiliados/me` PATCH           | `avatar_url` aceita qualquer string (sem validação de URL)                  |
| 2.9  | `/api/afiliados/registrar`          | Body parsing com `.catch(() => ({}))` — permite request sem body            |
| 2.10 | `/api/chat` + `/api/chat/afiliados` | Sem Zod, mensagem do usuário vai direto ao prompt (Groq injection)          |
| 2.11 | `/api/orders`                       | Validação manual rigorosa mas sem Zod — risco de slip-up futuro             |

### ✅ ROTAS SEGURAS

| Rota                                | Motivo                                          |
| ----------------------------------- | ----------------------------------------------- |
| `/api/pagamento/iniciar-onboarding` | Zod completo, rate limit, auth getUser()        |
| `/api/templates`                    | Whitelist em sort/order, cache, rate limit      |
| `/api/upload`                       | Magic bytes, MIME whitelist, 2MB limit          |
| `/api/checkout/validar-cupom`       | Zod, rate limit                                 |
| `/api/pagamento/status`             | Auth + rate limit + user ownership check        |
| `/api/admin/metrics`                | Admin-only, queries seguras                     |
| `/api/afiliados/ranking`            | Pública intencional, cache, sem dados sensíveis |
| `/api/afiliados/saldo-info`         | Auth getUser(), leitura pura                    |
| `/api/webhook/mercadopago`          | Signature validation + idempotência             |
| `/api/webhook/subscriptions`        | Signature validation + idempotência             |

---

## 3. INFRAESTRUTURA

### 🔴 CRÍTICO

#### 3.1 — Security Headers Ausentes

```
next.config.mjs não tem `headers()`.
vercel.json tem apenas CORS para /api/(.*)
Faltam: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
```

**Impacto:** Vulnerável a XSS, clickjacking e MIME sniffing.
**Recomendação:** Adicionar `headers()` em `next.config.mjs`.

### ⚠️ MÉDIO

#### 3.2 — `vercel.json` CORS sem origin

```
Access-Control-Allow-Methods e Allow-Headers definidos, mas sem
Access-Control-Allow-Origin — navegadores bloqueiam sem isso.
```

**Nota:** Possivelmente OK se Next.js middleware trata CORS via headers na response.

---

## 4. COPY/MARKETING

### 🔴 COMPONENTES ÓRFÃOS (não usados, mas existem no repositório)

| Componente                            | Problema                                                         | Importado? |
| ------------------------------------- | ---------------------------------------------------------------- | ---------- |
| `components/header.tsx`               | Logo "TemplateHub" — identidade errada                           | ❌ Não     |
| `components/hero-section.tsx`         | "Templates Premium para Acelerar seus Projetos" — produto errado | ❌ Não     |
| `components/faq-section.tsx`          | FAQs sobre Notion/TypeScript/Figma — contexto errado             | ❌ Não     |
| `components/testimonials-section.tsx` | 5/6 depoimentos de developers/startup founders — persona errada  | ❌ Não     |
| `components/cta-section.tsx`          | "500 desenvolvedores" — audiência errada                         | ❌ Não     |

**Recomendação:** Deletar todos os 5 ou reescrever completamente para restaurantes.

### ⚠️ MÉDIO

| #   | Arquivo                           | Problema                                                                |
| --- | --------------------------------- | ----------------------------------------------------------------------- |
| 4.1 | `components/pricing-section.tsx`  | Menciona "templates" quando deveria dizer "cardápios"                   |
| 4.2 | `app/precos/page.tsx`             | Não reforça "0% comissão por pedido" como diferencial principal         |
| 4.3 | `app/templates/page.tsx`          | Copy ambígua — mistura "templates de código" com "modelos de cardápio"  |
| 4.4 | `components/footer.tsx`           | Falta CNPJ visível e endereço comercial                                 |
| 4.5 | `app/afiliados/page.tsx`          | Palavra "Simbólico" nos bônus desestimula adesão                        |
| 4.6 | `app/precos/page.tsx`             | Falta ancoragem financeira (quanto perde com iFood vs quanto paga aqui) |
| 4.7 | `app/page.tsx` + `SecaoConversao` | Gatilhos neurocomportamentais aplicados parcialmente                    |

### ✅ COPY BEM ALINHADA

| Arquivo                          | Status                                                            |
| -------------------------------- | ----------------------------------------------------------------- |
| `app/page.tsx` (hero)            | ✅ "Venda pelo seu próprio canal, sem pagar comissão" — excelente |
| `app/ofertas/page.tsx`           | ✅ Copy alinhada com pricing dinâmico                             |
| `app/afiliados/page.tsx` (corpo) | ✅ "Ganhe comissões indicando restaurantes" — correto             |
| `app/layout.tsx` (metadata)      | ✅ SEO correto — title, keywords, og definidos                    |

---

## 5. PRICING + CHECKOUT + PAGAMENTO

### ✅ CONSOLIDADO

| Aspecto                    | Status | Detalhes                                               |
| -------------------------- | ------ | ------------------------------------------------------ |
| Fonte central de preços    | ✅     | `lib/pricing.ts` — única fonte de verdade              |
| 8 templates com preço      | ✅     | Todos com complexidade 1/2/3, PIX e cartão             |
| Parcelamento               | ✅     | Até 12x com taxa 2,99%/mês via `calcParcelaMensal()`   |
| Cupom de desconto          | ✅     | Validação server-side em `/api/checkout/validar-cupom` |
| Checkout por template      | ✅     | `/comprar/[template]` com Zod, auth, rate limit        |
| Webhook Mercado Pago       | ✅     | Signature validation + idempotência                    |
| Provisionamento automático | ✅     | Webhook → cria restaurante + slug + template           |
| Planos recorrentes         | ✅     | Básico R$59/mês, Pro R$89/mês                          |
| Formas de pagamento        | ✅     | PIX, cartão (até 12x), boleto, débito, carteira MP     |

---

## 6. EDITOR + PAINEL

### ⚠️ MÉDIO

| #   | Arquivo                                                  | Problema                                                           |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| 6.1 | `app/painel/editor/page.tsx`                             | Labels hardcoded ('Fazer pedido', 'Abrir WhatsApp') — criar config |
| 6.2 | `app/painel/configuracoes/page.tsx`                      | 19+ useState — considerar useReducer                               |
| 6.3 | `app/painel/produtos/page.tsx`                           | Limites de plano (60/200 produtos) hardcoded no componente         |
| 6.4 | `app/painel/planos/page.tsx`                             | Planos hardcoded, sem upgrade UI funcional                         |
| 6.5 | `components/template-editor/cardapio-editor-preview.tsx` | 19+ props — prop drilling excessivo                                |

### 🟡 BAIXO

| #    | Problema                                                                            |
| ---- | ----------------------------------------------------------------------------------- |
| 6.6  | `afiliados/configuracoes` — PIX regex hardcoded (deveria ser lib/pix-validation.ts) |
| 6.7  | `template-card.tsx` — sem fallback de imagem quebrada                               |
| 6.8  | `template-preview-page.tsx` — sem Error Boundary                                    |
| 6.9  | Diversos — `aria-label` ausente em toggles e botões interativos                     |
| 6.10 | `produtos/page.tsx` — sem paginação para listas grandes                             |
| 6.11 | `editor/page.tsx` — `window.location` sem SSR guard (tem fallback)                  |

---

## 7. TEMPLATES (lib/templates-config.ts)

### ✅ COMPLETO

| Template    | Produtos | Categorias | Marcas Reais                         | Status |
| ----------- | -------- | ---------- | ------------------------------------ | ------ |
| Restaurante | 47       | 8          | Moquecas, peixes, litoral            | ✅     |
| Pizzaria    | 48       | 8          | Calzones, Nutella, Ovomaltine        | ✅     |
| Lanchonete  | 46       | 10         | Artesanais, Wraps, Milk Shakes       | ✅     |
| Bar/Pub     | 55       | 9          | Brahma, Heineken, Tanqueray, Absolut | ✅     |
| Cafeteria   | 43       | 8          | Bebidas Geladas, Toasts              | ✅     |
| Açaí        | 38       | 7          | Pitaya, Cupuaçu, Whey                | ✅     |
| Sushi       | 46       | 9          | Sashimis, Niguiris, Sake Azuma Kirin | ✅     |
| Adega       | 83       | 15         | Kits Praia, vinhos, destilados       | ✅     |

**Total:** 406 produtos, 74 categorias — todos com descrições reais, preços coerentes, nomes de marcas legítimas.

---

## PLANO DE AÇÃO PRIORITIZADO

### 🔴 P0 — BLOQUEIA PRODUÇÃO (resolver antes do deploy)

| #   | Ação                                                                             | Arquivo(s)                                  | Esforço |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------- | ------- |
| 1   | Adicionar security headers (CSP, HSTS, X-Frame, X-Content-Type, Referrer-Policy) | `next.config.mjs`                           | ~15 min |
| 2   | Corrigir `/api/afiliados/indicacao` — remover exposição de service role key      | `app/api/afiliados/indicacao/route.ts`      | ~30 min |
| 3   | Proteger `/api/dev/unlock-all-templates` com `requireAdmin` ou deletar           | `app/api/dev/unlock-all-templates/route.ts` | ~5 min  |
| 4   | Adicionar Zod em `/api/onboarding/submit` para `data` object                     | `app/api/onboarding/submit/route.ts`        | ~30 min |

### ⚠️ P1 — MELHORIA SIGNIFICATIVA (próximo sprint)

| #   | Ação                                                                                                | Arquivo(s)                       |
| --- | --------------------------------------------------------------------------------------------------- | -------------------------------- |
| 5   | Deletar 5 componentes órfãos (header, hero, faq, testimonials, cta) ou reescrever para restaurantes | `components/`                    |
| 6   | Fixar IDOR em `/api/carrinho/sync` GET — ignorar userId param, usar apenas auth                     | `app/api/carrinho/sync/route.ts` |
| 7   | Adicionar Zod em rotas admin (comissoes, clientes, team)                                            | `app/api/admin/`                 |
| 8   | Rate limit em `/api/afiliados/me` GET                                                               | `app/api/afiliados/me/route.ts`  |
| 9   | Validar `avatar_url` como URL em `/api/afiliados/me` PATCH                                          | `app/api/afiliados/me/route.ts`  |
| 10  | Reforçar "0% comissão" em `precos/page.tsx`                                                         | `app/precos/page.tsx`            |

### 🟡 P2 — QUALIDADE DE CÓDIGO (backlog)

| #   | Ação                                                       |
| --- | ---------------------------------------------------------- |
| 11  | Mover labels hardcoded para config (`config/ui-labels.ts`) |
| 12  | Mover limites de plano para DB/config                      |
| 13  | Refatorar estado do editor com useReducer                  |
| 14  | Adicionar regime fiscal (CNPJ) no footer                   |
| 15  | Adicionar aria-labels em componentes interativos           |

---

## CONCLUSÃO

O projeto está **operacionalmente funcional** com fluxo de compra/checkout/pagamento sólido. Os 10 erros TypeScript foram corrigidos durante esta auditoria. As 3 vulnerabilidades críticas de segurança (service role key exposta, rota dev sem proteção, onboarding sem schema) devem ser resolvidas **antes do próximo deploy**. Os componentes órfãos com copy de developer templates devem ser removidos para evitar confusão em futuros desenvolvedores. O pricing está centralizado e consistente em 100% das páginas.

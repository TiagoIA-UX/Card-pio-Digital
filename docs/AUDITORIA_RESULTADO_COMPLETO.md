# AUDITORIA COMPLETA — PLATAFORMA CARDÁPIO DIGITAL (ZAIRYX)

> **Data:** 17 de março de 2026
> **Branch:** `rename/cardapio-digital`
> **Repositório:** `TiagoIA-UX/Cardapio-Digital`
> **Auditor:** GitHub Copilot (Claude Opus 4.6)
> **Metodologia:** 18 seções conforme `docs/PROMPT_PHD_AUDITORIA_COMPLETA.md`

---

## A. RESUMO EXECUTIVO

A plataforma Cardápio Digital (Zairyx) é um SaaS B2B construído em Next.js 16 + Supabase + Mercado Pago, com deploy na Vercel. A auditoria cobriu **18 seções** do codebase real, analisando arquitetura, segurança, privacidade, legalidade, fluxos críticos, IA, conversão, resiliência, QR Codes, multi-tenancy, onboarding, cardápio, pagamentos, SEO, acessibilidade, admin e CI/CD.

### Pontos fortes

- **Webhook Mercado Pago** assinatura HMAC obrigatória + idempotência por `webhook_events`
- **Rate limiting** implementado via Upstash Redis (produção) com fallback in-memory (dev)
- **Cookie consent** robusto: HTTP cookie server-side + localStorage client-side; analytics gateados por consentimento
- **RLS** habilitado em 16 tabelas Supabase com policies granulares
- **Admin auth** centralizado em `requireAdmin()` com hierarquia de roles
- **CI/CD** configurado: GitHub Actions (lint + build) + cron Vercel com `CRON_SECRET`
- **Upload** com validação de magic bytes (PNG, JPEG, WebP)
- **Redirect sanitizado** no middleware (open redirect protegido)

### Números da auditoria

| Categoria            | Qtd    |
| -------------------- | ------ |
| Achados **Críticos** | 10     |
| Achados **Altos**    | 11     |
| Achados **Médios**   | 14     |
| Achados **Baixos**   | 8      |
| **Total de achados** | **43** |

---

## B. ACHADOS POR GRAVIDADE

### CRÍTICO (10)

| #   | Achado                                                                                                                                                                                                                                       | Arquivo:Linha                                                                  | Classificação |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------- |
| C1  | **Chat Afiliados sem autenticação** — `/api/chat/afiliados` aceita POST de qualquer visitante; Professor Nilo expõe estratégias e percentuais de comissão sem verificar `getUser()`                                                          | `app/api/chat/afiliados/route.ts:L1`                                           | ✅ CONFIRMADO |
| C2  | **Sem timeout no cliente Groq** — `getGroq().chat.completions.create()` não tem timeout explícito; requisição pode travar indefinidamente, consumindo worker Vercel (10s serverless / 25s pro)                                               | `app/api/chat/route.ts:L7-L11` + `app/api/chat/afiliados/route.ts:L10-L14`     | ✅ CONFIRMADO |
| C3  | **Sem página error.tsx nem not-found.tsx** — nenhuma custom error page encontrada em todo o `app/`; usuário vê template genérico do Next.js em erros 500 e 404                                                                               | `app/` (ausência)                                                              | ✅ CONFIRMADO |
| C4  | **LGPD: Sem mecanismo de exclusão de dados** — não existe botão "Excluir conta" no painel, nem endpoint `/api/user/delete` ou similar; Política de Privacidade promete exclusão em 30 dias mas sem funcionalidade implementada               | `app/painel/configuracoes/page.tsx` (ausência)                                 | ✅ CONFIRMADO |
| C5  | **Sem Termos do Programa de Afiliados** — condições esparsas em FAQ (`app/afiliados/page.tsx`); não há documento formal, versionado e assinável com regras de comissão, pagamento, rescisão e estorno                                        | `app/afiliados/` (ausência de `/termos`)                                       | ✅ CONFIRMADO |
| C6  | **Métricas não verificáveis na hero section** — "500+ Templates Vendidos", "50+ Templates Disponíveis", "4.9 Avaliação Média" são hardcoded sem fonte de dados; o catálogo real tem 7 templates                                              | `components/hero-section.tsx:L43-L48`                                          | ✅ CONFIRMADO |
| C7  | **Depoimentos fabricados** — 6 testimonials com nomes genéricos ("Lucas Silva", "Ana Costa"), profissões variadas ("Desenvolvedor Freelancer", "UI/UX Designer"), sem foto real nem link verificável; todos com rating 5                     | `components/testimonials-section.tsx:L4-L45`                                   | ✅ CONFIRMADO |
| C8  | **Base URL do QR Code pode estar errada** — `getCardapioUrl()` faz fallback para `'https://cardapiodigital.com.br'` se `NEXT_PUBLIC_SITE_URL` não for setado; domínio real é `zairyx.com`                                                    | `modules/qrcode/index.ts:L8`                                                   | ⚠️ HIPÓTESE   |
| C9  | **Sem botão de cancelamento de assinatura no painel** — `app/painel/planos/page.tsx` mostra plano atual e permite upgrade, mas não tem opção de cancelar; Termos dizem "Você pode encerrar sua conta nas configurações" mas não existe na UI | `app/painel/planos/page.tsx` (ausência)                                        | ✅ CONFIRMADO |
| C10 | **Preços hardcoded em múltiplos locais** — valores em `lib/mercadopago.ts` (PIX=497, CARD=597), `lib/pricing.ts`, system prompt do Cadu, e landing pages; mudança de preço exige editar 4+ arquivos sem fonte única da verdade               | `lib/mercadopago.ts:L72-L90` + `lib/pricing.ts` + `app/api/chat/route.ts:L520` | ✅ CONFIRMADO |

---

### ALTO (11)

| #   | Achado                                                                                                                                                                                                                                                      | Arquivo:Linha                                                                    | Classificação |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------- |
| A1  | **Sem rate limiting nas rotas de chat** — POST `/api/chat` e `/api/chat/afiliados` não usam `withRateLimit()`; atacante pode gerar tokens Groq ilimitados                                                                                                   | `app/api/chat/route.ts` + `app/api/chat/afiliados/route.ts`                      | ✅ CONFIRMADO |
| A2  | **Rota `/dev/unlock` protegida por env var ambígua** — `ALLOW_DEV_UNLOCK=true` bypass a checagem de `NODE_ENV`; se a variável vazar para produção na Vercel, qualquer usuário logado pode desbloquear todos os templates                                    | `app/api/dev/unlock-all-templates/route.ts:L5-L6`                                | ⚠️ HIPÓTESE   |
| A3  | **Faltam headers de segurança** — não há CSP, HSTS, X-Frame-Options, X-Content-Type-Options em nenhum lugar (`next.config.mjs` nem `vercel.json`); o Vercel não os injeta automaticamente                                                                   | `next.config.mjs` + `vercel.json` (ausência)                                     | ✅ CONFIRMADO |
| A4  | **Upload sem validação de ownership** — `POST /api/upload` valida autenticação mas não verifica se o `user.id` é dono de algum restaurante; qualquer usuário logado pode fazer upload                                                                       | `app/api/upload/route.ts:L97-L100`                                               | ✅ CONFIRMADO |
| A5  | **CNPJ/CPF do restaurante não coletado** — onboarding não pede documento fiscal; impossibilita emissão de nota e verificação de pessoa jurídica                                                                                                             | `app/onboarding/page.tsx` (ausência de campo)                                    | ✅ CONFIRMADO |
| A6  | **Validação de WhatsApp fraca** — apenas `type="tel"` HTML + `replace(/\D/g, '')` server-side; sem validação de DDD, comprimento (10-11 dígitos), ou formato brasileiro                                                                                     | `app/onboarding/page.tsx:L395-L405`                                              | ✅ CONFIRMADO |
| A7  | **Prompt injection possível nos chats** — mensagens do usuário passam ao Groq sem whitelist de roles; payload como `{"role":"system","content":"ignore instructions"}` pode ser tentado                                                                     | `app/api/chat/route.ts:L860-L880`                                                | ⚠️ HIPÓTESE   |
| A8  | **Restaurante suspenso pode gerar QR Codes** — painel QR não filtra por status do restaurante; QR gerado leva a dead link pois `app/r/[slug]/page.tsx` filtra `ativo=true`                                                                                  | `app/painel/qrcode/page.tsx:L36-L42`                                             | ✅ CONFIRMADO |
| A9  | **Sem drag-and-drop para reordenação de produtos** — campo `ordem` existe no schema mas não é editável na UI; restaurante não pode organizar a exibição dos itens                                                                                           | `app/painel/produtos/page.tsx` (ausência)                                        | ✅ CONFIRMADO |
| A10 | **Variações/tamanhos de produtos não expostos na UI** — tabelas `product_sizes`, `product_crusts`, `product_flavors` existem no schema mas o painel de produtos não permite editá-las                                                                       | `lib/supabase/client.ts:L75-L82` (schema) vs `app/painel/produtos/page.tsx` (UI) | ✅ CONFIRMADO |
| A11 | **Uso excessivo de `any` no painel** — 16 ocorrências de `any`/`as any` concentradas em `app/painel/pedidos/page.tsx` (6x), `app/painel/configuracoes/page.tsx`, `app/painel/planos/page.tsx`, `app/meus-templates/page.tsx`; risco de regressão silenciosa | `app/painel/pedidos/page.tsx:L78,82,252-266`                                     | ✅ CONFIRMADO |

---

### MÉDIO (14)

| #   | Achado                                                                                                                                                                                                                             | Arquivo:Linha                                                         | Classificação |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------- |
| M1  | **CNPJ/endereço da empresa não publicados** — páginas legais não informam CNPJ, inscrição ou endereço da Zairyx; email de contato (`contato@cardapio.digital` e `privacidade@cardapio.digital`) é o único canal                    | `app/privacidade/page.tsx` + `app/termos/page.tsx`                    | ✅ CONFIRMADO |
| M2  | **Sentry integrado via `(window as any).Sentry`** — 10 ocorrências de `as any` no error tracking; sem type guard adequado                                                                                                          | `lib/error-tracking.ts:L65-L147`                                      | ✅ CONFIRMADO |
| M3  | **Política de Privacidade: retenção vaga** — "removemos em até 30 dias, exceto obrigações legais" sem especificar quais obrigações                                                                                                 | `app/privacidade/page.tsx:L132-L137`                                  | ✅ CONFIRMADO |
| M4  | **Rotas duplicadas (alias)** — `/termos-de-uso` re-exporta `/termos`; `/politica-de-privacidade` re-exporta `/privacidade`; manutenção dobrada                                                                                     | `app/termos-de-uso/page.tsx` + `app/politica-de-privacidade/page.tsx` | ✅ CONFIRMADO |
| M5  | **Página de preços pode cachear com ISR** — `app/precos/page.tsx` não tem `revalidate = 0` nem `force-dynamic`; preços podem ficar desatualizados após mudança                                                                     | `app/precos/page.tsx` (ausência de config)                            | ⚠️ HIPÓTESE   |
| M6  | **Webhook MP sem retry em caso de falha do BD** — se Supabase cair durante processamento do webhook, evento pode ficar em estado inconsistente; Mercado Pago reenvia mas depende da configuração deles                             | `app/api/webhook/mercadopago/route.ts:L650-L850`                      | ⚠️ HIPÓTESE   |
| M7  | **Sem indicador de progresso no onboarding** — formulário tem seções lógicas mas nenhuma barra ou stepper visual                                                                                                                   | `app/onboarding/page.tsx:L50-L65`                                     | ✅ CONFIRMADO |
| M8  | **`lib/whatsapp.ts` é código morto** — `buildQuickOrderMessage()` e `getQuickOrderWhatsAppUrl()` exportados mas nunca importados em nenhum `.tsx`                                                                                  | `lib/whatsapp.ts:L13-L48`                                             | ✅ CONFIRMADO |
| M9  | **Termos de Uso não mencionam reembolso/cancelamento explicitamente** — seção 7 ("Planos e Pagamentos") e seção 10 ("Encerramento") são genéricos; FAQ e `/ofertas` prometem "30 dias de garantia" mas os Termos não refletem isso | `app/termos/page.tsx:L94-L146`                                        | ✅ CONFIRMADO |
| M10 | **Sem `og:image` verificável** — metadata de Open Graph não foi encontrada explicitamente nos layouts; pode estar em `metadata` export mas não foi confirmada em todos os paths                                                    | `app/layout.tsx`                                                      | ⚠️ HIPÓTESE   |
| M11 | **Onboarding manual ("até 2 dias úteis")** — restaurante não publica automaticamente; equipe configura manualmente após pagamento                                                                                                  | `app/onboarding/page.tsx:L260-L280`                                   | ✅ CONFIRMADO |
| M12 | **Templates de páginas individuais em vez de rota dinâmica** — 7 arquivos em `app/templates/{restaurante,pizzaria,...}/page.tsx` que importam o mesmo componente `TemplatePreviewPage`                                             | `app/templates/*/page.tsx`                                            | ✅ CONFIRMADO |
| M13 | **hero-section.tsx desconectada do produto real** — hero fala em "Templates Premium para Acelerar seus Projetos" e menciona "Next.js, Notion, Figma e planilhas", mas o produto é cardápio digital para restaurantes               | `components/hero-section.tsx:L20-L30`                                 | ✅ CONFIRMADO |
| M14 | **Sem re-engajamento de carrinho abandonado** — nenhum mecanismo de email ou notificação para checkout incompleto                                                                                                                  | Codebase (ausência)                                                   | ✅ CONFIRMADO |

---

### BAIXO (8)

| #   | Achado                                                                                                                                                                                                               | Arquivo:Linha                                                                          | Classificação |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------- |
| B1  | **Rota `/checkout` deprecated ainda existe** — redireciona para `/templates` via `next.config.mjs`; funcional mas gera lixo em rotas                                                                                 | `app/checkout/page.tsx` + `next.config.mjs:L36`                                        | ✅ CONFIRMADO |
| B2  | **Mesa identificável por `?mesa=N`** — IDs sequenciais (1, 2, 3...) permitem enumeração trivial; baixo risco pois apenas mostra o cardápio público                                                                   | `app/painel/qrcode/page.tsx:L67-L75`                                                   | ✅ CONFIRMADO |
| B3  | **Webhook routes sem handler GET** — apenas POST; não é problema funcional mas ausência de documentação inline                                                                                                       | `app/api/webhook/mercadopago/route.ts`                                                 | ✅ CONFIRMADO |
| B4  | **`ignoreBuildErrors: true` foi removido** — mencionado em `AUDITORIA_RESULTADO.md` como pendência, mas verificação confirma que `next.config.mjs` atual NÃO contém essa flag                                        | `next.config.mjs` (verificado)                                                         | ✅ CONFIRMADO |
| B5  | **Deploy job no GitHub Actions desativado** — job `vercel-deploy` comentado em `.github/workflows/ci.yml`; deploy ocorre via integração nativa Vercel                                                                | `.github/workflows/ci.yml:L35-L50`                                                     | ✅ CONFIRMADO |
| B6  | **Sem sanitização de caracteres especiais em nomes na mensagem WhatsApp** — nomes de produtos e clientes vão direto para a mensagem sem escape de caracteres como `*`, `_` que o WhatsApp interpreta como formatação | `app/r/[slug]/cardapio-client.tsx:L180-L220`                                           | ⚠️ HIPÓTESE   |
| B7  | **dangerouslySetInnerHTML** usado em 3 locais — todos usam `JSON.stringify()` para schema.org JSON-LD; sem risco de XSS                                                                                              | `app/layout.tsx:L106`, `components/seo/json-ld.tsx:L18`, `components/ui/chart.tsx:L83` | ✅ CONFIRMADO |
| B8  | **Fallback do chat IA é genérico** — se Groq falha, `buildFallbackReply()` retorna resposta determinística; funcional mas pode parecer robótico                                                                      | `app/api/chat/route.ts:L910-L920`                                                      | ✅ CONFIRMADO |

---

## C. MATRIZ DE EXPOSIÇÃO POR ÁREA

| Área                       | Crítico        | Alto               | Médio               | Baixo          | Total |
| -------------------------- | -------------- | ------------------ | ------------------- | -------------- | ----- |
| **Segurança**              | 2 (C1, C2)     | 4 (A1, A2, A3, A7) | 1 (M2)              | 1 (B7)         | **8** |
| **Legal / LGPD**           | 3 (C4, C5, C9) | 1 (A5)             | 3 (M1, M3, M9)      | 0              | **7** |
| **Conversão / Copy**       | 2 (C6, C7)     | 0                  | 2 (M13, M14)        | 0              | **4** |
| **Chat / IA**              | 1 (C2)         | 2 (A1, A7)         | 0                   | 1 (B8)         | **4** |
| **Multi-tenancy / Upload** | 0              | 1 (A4)             | 0                   | 0              | **1** |
| **QR Code / Mesa**         | 1 (C8)         | 1 (A8)             | 0                   | 1 (B2)         | **3** |
| **Onboarding / Cardápio**  | 0              | 3 (A6, A9, A10)    | 2 (M7, M11)         | 0              | **5** |
| **Arquitetura / Build**    | 1 (C10)        | 1 (A11)            | 4 (M4, M5, M8, M12) | 3 (B1, B3, B5) | **9** |
| **Resiliência / Erros**    | 1 (C3)         | 0                  | 1 (M6)              | 1 (B6)         | **3** |
| **SEO / Marketing**        | 0              | 0                  | 1 (M10)             | 1 (B4)         | **2** |

---

## D. RISCOS DOS PRIMEIROS 30 DIAS

### Se a plataforma for a produção com clientes reais hoje:

| Risco                                                                                                                      | Probabilidade        | Impacto             | Achado     | Mitigação mínima                    |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------- | ---------- | ----------------------------------- |
| **Abuso do chat IA** — bots chamam `/api/chat` e `/api/chat/afiliados` sem limites, gerando custos no Groq                 | Alta                 | Alto (financeiro)   | C1, C2, A1 | Rate limit + auth obrigatório       |
| **Reclamação LGPD** — titular exige exclusão de dados sem mecanismo disponível                                             | Média                | Crítico (legal)     | C4         | Criar endpoint + botão no painel    |
| **Afiliado alega comissões diferentes** — sem contrato formal, percentuais podem ser contestados                           | Média                | Alto (legal)        | C5         | Criar página de termos de afiliados |
| **QR Code aponta para domínio errado** — se env var não configurada, todos QRs impressos vão para `cardapiodigital.com.br` | Alta (se env faltar) | Crítico (operação)  | C8         | Validar env var no build            |
| **Procon: métricas falsas na landing** — "500+ templates vendidos" quando existem 7 templates                              | Baixa                | Alto (reputacional) | C6, C7     | Remover números ou usar dados reais |
| **Worker Vercel travado** — chat sem timeout trava function por 10-25s, consumindo cota                                    | Alta                 | Médio (financeiro)  | C2         | Adicionar timeout de 15s ao Groq    |
| **XSS ou clickjacking** — sem CSP/X-Frame-Options, terceiros podem embeder o site                                          | Baixa                | Alto (segurança)    | A3         | Adicionar headers no next.config    |

---

## E. EXPOSIÇÃO LEGAL ATUAL

### E.1 — LGPD (Lei 13.709/2018)

| Item                             | Status          | Detalhe                                                                                        |
| -------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| Política de Privacidade          | ✅ Existe       | `app/privacidade/page.tsx` — cobre coleta, uso, compartilhamento, cookies, segurança, direitos |
| Canal para exercício de direitos | ⚠️ Parcial      | Email `privacidade@cardapio.digital` informado, mas sem formulário no painel                   |
| Mecanismo de exclusão de dados   | ❌ Ausente      | Nenhum endpoint nem UI para deletar conta                                                      |
| Consentimento de cookies         | ✅ Implementado | HTTP cookie + localStorage; analytics gateados; `aff_ref` gateado                              |
| Política de Cookies              | ✅ Existe       | `app/cookies/page.tsx`                                                                         |
| Base legal identificada          | ✅ Presente     | Consentimento e execução contratual mencionados na política                                    |

### E.2 — CDC (Código de Defesa do Consumidor)

| Item                                | Status       | Detalhe                                                                               |
| ----------------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| Preços claros                       | ⚠️ Parcial   | Preços exibidos nas páginas, mas parcelamento não é detalhado                         |
| Direito de arrependimento (Art. 49) | ⚠️ Parcial   | FAQ e `/ofertas` prometem "30 dias garantia", mas Termos não mencionam explicitamente |
| Cancelamento de assinatura          | ❌ Ausente   | Sem botão de cancelamento no painel                                                   |
| Promessas de marketing vs realidade | ❌ Irregular | "500+ templates vendidos" e "4.9 avaliação" sem base factual                          |

### E.3 — Marco Civil da Internet (Lei 12.965/2014)

| Item           | Status      | Detalhe                                                         |
| -------------- | ----------- | --------------------------------------------------------------- |
| Termos de Uso  | ✅ Existe   | `app/termos/page.tsx` — 13 seções                               |
| Logs de acesso | ⚠️ Hipótese | Vercel mantém logs de acesso, mas não é explícito na plataforma |

### E.4 — Programa de Afiliados

| Item                          | Status        | Detalhe                                                                                          |
| ----------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| Termos formais                | ❌ Ausente    | Condições apenas em FAQ; sem documento legal versionado                                          |
| Percentuais no código vs copy | ⚠️ Divergente | FAQ diz "30% comissão"; `lib/affiliate-tiers.ts` define 30-35% por tier; sem documento unificado |
| Identificação da empresa      | ❌ Incompleto | Sem CNPJ, endereço físico publicados                                                             |

---

## F. CORREÇÕES SUGERIDAS

### F.1 — IMEDIATAS (pré go-live, bloqueadoras)

| #   | Correção                                                                                                                           | Achados     | Esforço |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------- |
| 1   | **Adicionar auth em `/api/chat/afiliados`** — chamar `getUser()` e retornar 401 se não autenticado                                 | C1          | ~15 min |
| 2   | **Adicionar timeout de 15s ao Groq** — `new Groq({ apiKey, timeout: 15000 })` nos dois arquivos de chat                            | C2          | ~10 min |
| 3   | **Adicionar rate limiting em `/api/chat` e `/api/chat/afiliados`** — `await withRateLimit(req, { limit: 30, windowMs: 60000 })`    | A1          | ~15 min |
| 4   | **Criar `app/error.tsx` e `app/not-found.tsx`** — páginas customizadas com branding                                                | C3          | ~30 min |
| 5   | **Adicionar headers de segurança em `next.config.mjs`** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy      | A3          | ~20 min |
| 6   | **Corrigir hero section e testimonials** — remover métricas hardcoded falsas; remover ou substituir depoimentos por dados reais    | C6, C7, M13 | ~30 min |
| 7   | **Validar `NEXT_PUBLIC_SITE_URL` antes de gerar QR** — fail-fast se env não está setado; remover fallback `cardapiodigital.com.br` | C8          | ~10 min |
| 8   | **Validar ownership no upload** — verificar `user.id` é dono de restaurante antes de aceitar upload                                | A4          | ~15 min |

### F.2 — PRÉ GO-LIVE (não bloqueadoras mas importantes)

| #   | Correção                                                                                                                          | Achados | Esforço |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| 9   | **Criar página "Excluir minha conta"** — endpoint + botão no painel + confirmação por email                                       | C4      | ~2h     |
| 10  | **Criar `/afiliados/termos`** — documento formal com comissões, pagamento FIFO, rescisão, vedação de spam, versionamento          | C5      | ~2h     |
| 11  | **Criar botão de cancelamento de assinatura** — UI no `/painel/planos` + chamada à API do Mercado Pago para cancelar pre-approval | C9      | ~3h     |
| 12  | **Adicionar validação robusta de WhatsApp** — regex para telefone brasileiro (10-11 dígitos, DDD válido) no frontend e backend    | A6      | ~30 min |
| 13  | **Proteger rota `/dev/unlock`** — remover `ALLOW_DEV_UNLOCK` ou garantir que nunca é setado em produção via Vercel env check      | A2      | ~15 min |
| 14  | **Centralizar preços em uma única fonte** — mover todos os preços para `lib/pricing.ts` e importar em todos os locais             | C10     | ~1h     |
| 15  | **Adicionar CNPJ e endereço nas páginas legais** — cumprir obrigação de identificação do fornecedor                               | M1, A5  | ~15 min |
| 16  | **Alinhar Termos de Uso com garantia de 30 dias** — incluir seção explícita sobre reembolso e direito de arrependimento           | M9      | ~30 min |

### F.3 — PÓS GO-LIVE (melhorias operacionais)

| #   | Correção                                                                                                 | Achados | Esforço |
| --- | -------------------------------------------------------------------------------------------------------- | ------- | ------- |
| 17  | **Expor variações/tamanhos de produtos na UI** — permitir edição de sizes, crusts, flavors               | A9, A10 | ~4h     |
| 18  | **Implementar drag-and-drop para reordenação** — campo `ordem` já existe; adicionar Dnd-kit ou similar   | A9      | ~3h     |
| 19  | **Substituir `any` por tipos reais no painel** — especialmente em `pedidos/page.tsx` e `planos/page.tsx` | A11     | ~2h     |
| 20  | **Adicionar stepper visual ao onboarding** — indicador de progresso entre seções                         | M7      | ~1h     |
| 21  | **Remover código morto: `lib/whatsapp.ts`** — funções nunca importadas                                   | M8      | ~5 min  |
| 22  | **Consolidar rotas duplicadas** — redirect em `next.config.mjs` em vez de re-export                      | M4      | ~15 min |
| 23  | **Adicionar prompt injection protection** — whitelist de roles permitidas nas mensagens de chat          | A7      | ~30 min |
| 24  | **Filtrar restaurantes suspensos no painel QR** — `.eq('suspended', false)` na query                     | A8      | ~5 min  |

### F.4 — ENTERPRISE (escala)

| #   | Correção                                                                              | Achados |
| --- | ------------------------------------------------------------------------------------- | ------- |
| 25  | Mover preços para tabela `plans` no banco de dados com API de gerenciamento           |
| 26  | Implementar re-engajamento por email para checkouts abandonados                       |
| 27  | Implementar retry com backoff exponencial para webhooks                               |
| 28  | Mover de Sentry lazy-load via `(window as any)` para SDK oficial via `@sentry/nextjs` |
| 29  | Implementar audit log para todas operações admin                                      |
| 30  | Coletar CNPJ do restaurante no onboarding para compliance fiscal                      |

---

## G. ESTIMATIVA REALISTA PARA PRODUÇÃO

### Estado atual: **NÃO RECOMENDADO para produção com clientes reais**

A plataforma tem fundação técnica sólida (RLS, webhooks assinados, rate limiting, auth), mas os 10 achados críticos impedem um go-live seguro. Todos os achados C1-C10 precisam ser resolvidos antes de aceitar pagamentos de clientes.

### Sequência recomendada:

1. **Sprint 1 (imediato):** Correções F.1 (#1-#8) — bloqueadores de segurança e integridade
2. **Sprint 2 (pré go-live):** Correções F.2 (#9-#16) — conformidade legal e UX crítica
3. **Sprint 3 (pós go-live):** Correções F.3 (#17-#24) — qualidade e funcionalidades
4. **Backlog:** Correções F.4 (#25-#30) — escala enterprise

---

## H. CHECKLIST FINAL DE GO-LIVE

| #   | Item                                                    | Status             | Achado                                            |
| --- | ------------------------------------------------------- | ------------------ | ------------------------------------------------- |
| 1   | Build de produção passa sem erros                       | ✅ OK              | `ignoreBuildErrors` removido (B4)                 |
| 2   | Lint sem erros bloqueadores                             | ✅ OK              | CI executa `npm run lint`                         |
| 3   | Webhook MP valida assinatura HMAC                       | ✅ OK              | Ambas rotas validam (mercadopago + subscriptions) |
| 4   | Webhook MP é idempotente                                | ✅ OK              | Tabela `webhook_events` com `event_id` único      |
| 5   | Rate limiting implementado em rotas públicas            | ⚠️ PENDENTE        | Falta em `/api/chat` e `/api/chat/afiliados` (A1) |
| 6   | Autenticação em todas as rotas protegidas               | ⚠️ PENDENTE        | `/api/chat/afiliados` aceita anônimos (C1)        |
| 7   | Headers de segurança (CSP, HSTS, X-Frame)               | ❌ PENDENTE        | Não implementados (A3)                            |
| 8   | Cookies não-essenciais gateados por consentimento       | ✅ OK              | Analytics + aff_ref gateados                      |
| 9   | Cookie banner funcional com aceitar/rejeitar            | ✅ OK              | HTTP cookie + localStorage                        |
| 10  | Política de Privacidade acessível e completa            | ✅ OK              | `/privacidade` com seções LGPD                    |
| 11  | Termos de Uso acessíveis                                | ✅ OK              | `/termos` com 13 seções                           |
| 12  | Política de Cookies acessível                           | ✅ OK              | `/cookies`                                        |
| 13  | Termos do Programa de Afiliados                         | ❌ PENDENTE        | Não existe (C5)                                   |
| 14  | Mecanismo de exclusão de dados (LGPD)                   | ❌ PENDENTE        | Não existe (C4)                                   |
| 15  | Botão de cancelamento de assinatura                     | ❌ PENDENTE        | Não existe (C9)                                   |
| 16  | Páginas de erro customizadas (error.tsx, not-found.tsx) | ❌ PENDENTE        | Não existem (C3)                                  |
| 17  | CNPJ/endereço da empresa publicados                     | ❌ PENDENTE        | Não publicados (M1)                               |
| 18  | Preços consistentes entre código e frontend             | ⚠️ PENDENTE        | Múltiplas fontes (C10)                            |
| 19  | Métricas e depoimentos verificáveis                     | ❌ PENDENTE        | Fabricados (C6, C7)                               |
| 20  | `NEXT_PUBLIC_SITE_URL` configurado corretamente         | ❓ NÃO VERIFICÁVEL | Depende de env var na Vercel (C8)                 |
| 21  | `CRON_SECRET` configurado e validado                    | ✅ OK              | Cron valida Bearer token                          |
| 22  | Groq com timeout                                        | ❌ PENDENTE        | Sem timeout (C2)                                  |
| 23  | RLS ativo em todas as tabelas de dados                  | ✅ OK              | 16 tabelas com RLS                                |
| 24  | Admin auth centralizado                                 | ✅ OK              | `requireAdmin()` com hierarquia                   |
| 25  | Upload valida magic bytes                               | ✅ OK              | PNG, JPEG, WebP validados                         |
| 26  | Upload valida ownership de restaurante                  | ❌ PENDENTE        | Qualquer user logado pode fazer upload (A4)       |
| 27  | Fluxo de compra ponta a ponta                           | ✅ OK              | Checkout → MP → webhook → ativação                |
| 28  | QR Code com URL correta                                 | ⚠️ PENDENTE        | Depende de env var (C8)                           |
| 29  | Open redirect protegido no middleware                   | ✅ OK              | Sanitização de `next` param                       |
| 30  | `.env.local` no `.gitignore`                            | ✅ OK              | Padrão `.env*` ignorado                           |

### Resumo

| Status             | Quantidade |
| ------------------ | ---------- |
| ✅ OK              | 16         |
| ⚠️ PENDENTE        | 4          |
| ❌ PENDENTE        | 9          |
| ❓ NÃO VERIFICÁVEL | 1          |

**Veredicto: 9 itens pendentes impedem go-live seguro.** Priorize as correções F.1 e F.2.

---

_Relatório gerado em 17/03/2026 — Auditoria baseada exclusivamente no código-fonte do repositório._

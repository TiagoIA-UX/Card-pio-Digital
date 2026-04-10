---
description: >
  REGRA ABSOLUTA DE PROTEÇÃO — Aplica-se a TODA interação com o codebase.
  Qualquer agente de IA, copiloto ou assistente DEVE ler e obedecer este documento
  antes de modificar qualquer arquivo do projeto.
applyTo:
  - '**/*'
---

# 🔒 PROTOCOLO DE PROTEÇÃO DE CÓDIGO VALIDADO — PHD LEVEL

> **Classificação**: CRÍTICO — IMUTÁVEL SEM AUTORIZAÇÃO EXPLÍCITA DO OWNER  
> **Versão**: 1.0.0 — 07/04/2026  
> **Autor**: Tiago (Owner) + Zaea AI  
> **Escopo**: Todo o repositório Cardapio-Digital (TiagoIA-UX/Cardapio-Digital)

---

## §1 — PRINCÍPIO FUNDAMENTAL

Este projeto possui **código validado em produção** com testes automatizados aprovados,
fluxos de pagamento reais (MercadoPago), integrações fiscais (NFC-e), e 17+ templates
de canal digital ativos. **Qualquer modificação que quebre funcionalidade existente
pode causar prejuízo financeiro real aos clientes da plataforma.**

### Regra de Ouro

> **NUNCA modifique lógica de negócio, fluxos de dados, schemas de banco, ou contratos
> de API sem ANTES perguntar ao owner e receber confirmação EXPLÍCITA.**

---

## §2 — ZONAS DE PROTEÇÃO (CÓDIGO BLINDADO)

Os arquivos abaixo estão **VALIDADOS E TESTADOS**. Alterações permitidas:
apenas CSS/layout visual, correção de typos em strings, ou adições aditivas
que não alterem assinaturas existentes.

### 2.1 — NÚCLEO DE NEGÓCIO (PROIBIDO ALTERAR LÓGICA)

```
lib/domains/core/cardapio-renderer.ts       # Renderização do cardápio
lib/domains/core/delivery-payment.ts        # Formas de pagamento do delivery
lib/domains/core/payment-mode.ts            # Modos de pagamento
lib/domains/core/payment-status.ts          # Status de pagamento
lib/domains/core/pix.ts                     # Geração/validação PIX
lib/domains/core/mercadopago.ts             # Integração MercadoPago
lib/domains/core/mercadopago-webhook.ts     # Webhook MercadoPago
lib/domains/core/mercadopago-webhook-events.ts
lib/domains/core/mercadopago-webhook-processing.ts
lib/domains/core/mercadopago-webhook-monitoring.ts
lib/domains/core/mercadopago-legacy-restaurant-payment.ts
lib/domains/core/mercadopago-onboarding-payment.ts
lib/domains/core/onboarding-checkout.ts     # Checkout de onboarding
lib/domains/core/onboarding-checkout-creation.ts
lib/domains/core/onboarding-provisioning.ts # Provisionamento pós-compra
lib/domains/core/checkout-wizard.ts         # Wizard de checkout
lib/domains/core/coupon-validation.ts       # Validação de cupons
lib/domains/core/fiscal.ts                  # Sistema fiscal
lib/domains/core/fiscal-dispatch.ts         # Despacho fiscal
lib/domains/core/nfce-payload.ts            # Payload NFC-e
lib/domains/core/tax-document.ts            # Documentos fiscais
lib/domains/core/schemas.ts                 # Schemas Zod (contratos)
lib/domains/core/contracts.ts               # Tipos/interfaces base
lib/domains/core/commercial-entitlements.ts # Planos e limites comerciais
lib/domains/core/whatsapp.ts                # Integração WhatsApp
lib/domains/core/delivery-assistant.ts      # Assistente IA do delivery
lib/domains/core/delivery-mode.ts           # Modos de entrega
lib/domains/core/active-restaurant.ts       # Contexto do restaurante ativo
lib/domains/core/restaurant-customization.ts # Customização visual
lib/domains/core/setup-wizard.ts            # Wizard de configuração
lib/domains/core/panel-setup.ts             # Setup do painel
```

### 2.2 — STORES (ESTADO GLOBAL — PROIBIDO ALTERAR SHAPE)

```
store/cart-store.ts                         # Carrinho de compras
store/order-cart-store.ts                   # Carrinho de pedidos
store/index.ts                              # Barrel exports
```

### 2.3 — SERVIÇOS (CAMADA DE DADOS — PROIBIDO ALTERAR CONTRATOS)

```
services/order.service.ts                   # CRUD de pedidos
services/product.service.ts                 # CRUD de produtos
services/subscription.service.ts            # Assinaturas
services/tenant.service.ts                  # Tenants/deliverys
services/penalty.service.ts                 # Penalidades
services/support.service.ts                 # Suporte
```

### 2.4 — MIGRATIONS SQL (PROIBIDO ALTERAR ARQUIVOS EXISTENTES)

```
supabase/migrations/001_schema_base.sql → 058_auto_response_financial_hardening.sql
```

**Regra**: NUNCA edite uma migration existente. Novas alterações = nova migration
com número sequencial (ex: `059_nome.sql`).

### 2.5 — API ROUTES DE PAGAMENTO E WEBHOOK (PROIBIDO ALTERAR)

```
app/api/webhook/mercadopago/route.ts        # Webhook MercadoPago (dinheiro real)
app/api/webhook/subscriptions/route.ts      # Webhook assinaturas
app/api/pagamento/*/route.ts                # Rotas de pagamento (8 rotas)
app/api/cron/*/route.ts                     # CRONs automatizados (8 rotas)
```

### 2.6 — TEMPLATES VALIDADOS (17 TEMPLATES PRONTOS)

```
lib/domains/marketing/templates-config.ts   # Configuração central dos templates
lib/domains/image/generated-template-product-images.ts  # Imagens geradas por IA
lib/domains/image/template-product-images.ts  # Resolução de imagens
app/templates/*/page.tsx                    # 17 páginas de template
components/templates/template-preview-page.tsx
components/templates/template-card.tsx
```

### 2.7 — AUTENTICAÇÃO E SEGURANÇA (PROIBIDO ALTERAR)

```
lib/domains/auth/admin-auth.ts              # Autenticação admin (roles)
lib/shared/supabase/admin.ts                # Client admin (service role)
lib/shared/supabase/server.ts               # Client server
lib/shared/supabase/client.ts               # Client browser
lib/shared/rate-limit.ts                    # Rate limiting
middleware.ts                               # Middleware de segurança
```

---

## §3 — TESTES (BARREIRA DE VALIDAÇÃO)

### 3.1 — Testes existentes NÃO podem ser removidos ou desabilitados

```
tests/*.test.ts                             # 37+ unit tests
tests/e2e/*.spec.ts                         # 21+ E2E tests
tests/e2e/cart/*.spec.ts                    # Cart tests
tests/e2e/checkout/*.spec.ts                # Checkout tests
tests/e2e/resilience/*.spec.ts              # Edge cases
tests/e2e/ux/*.spec.ts                      # UX hints
backend/tests/test_incident_ops.py          # Backend tests
```

### 3.2 — Regra de cobertura

- Toda alteração em arquivo protegido DEVE passar nos testes existentes
- Se um teste quebrar pela sua alteração → **REVERTA a alteração, não o teste**
- Novos testes são SEMPRE bem-vindos (aditivos)

---

## §4 — ALTERAÇÕES PERMITIDAS SEM AUTORIZAÇÃO

As seguintes modificações são seguras e NÃO exigem confirmação:

| Tipo                | Exemplo                                  | Condição                         |
| ------------------- | ---------------------------------------- | -------------------------------- |
| CSS/Layout visual   | Tailwind classes, responsive breakpoints | Não alterar lógica JS/TS         |
| Correção de typo    | String de UI com erro ortográfico        | Não alterar keys/IDs             |
| Novas páginas admin | `app/admin/nova-pagina/page.tsx`         | Não alterar pages existentes     |
| Novas API routes    | `app/api/admin/novo-endpoint/route.ts`   | Protegida por `requireAdmin()`   |
| Novas migrations    | `supabase/migrations/059_nova.sql`       | Não alterar existentes           |
| Novos testes        | `tests/novo-teste.test.ts`               | Aditivo, não modifica existentes |
| Novos componentes   | `components/nova-feature.tsx`            | Não alterar existentes           |
| Documentação        | `*.md` na raiz ou `docs/`                | Sempre permitido                 |

---

## §5 — PROTOCOLO DE ALTERAÇÃO EM CÓDIGO PROTEGIDO

Se for absolutamente necessário alterar código protegido:

1. **PARE** — Informe o owner qual arquivo e qual linha será alterada
2. **JUSTIFIQUE** — Explique por que a alteração é necessária
3. **MOSTRE O DIFF** — Apresente exatamente o que muda (antes/depois)
4. **IMPACTO** — Liste todos os arquivos que podem ser afetados
5. **TESTES** — Rode todos os testes ANTES e DEPOIS da alteração
6. **AGUARDE** — Só prossiga com confirmação explícita ("ok", "pode fazer", "aprovado")

---

## §6 — CHECKLIST DE SEGURANÇA PRÉ-COMMIT

Antes de qualquer commit, verifique:

- [ ] Nenhum arquivo da §2 teve lógica alterada sem autorização
- [ ] Nenhum teste da §3 foi removido, desabilitado ou teve assertion relaxada
- [ ] Nenhuma migration existente foi editada (apenas novas criadas)
- [ ] Nenhuma env var ou secret foi exposta em código
- [ ] `requireAdmin()` presente em toda nova rota admin
- [ ] Validação Zod presente em todo novo endpoint POST
- [ ] Rate limiting presente em endpoints públicos
- [ ] Testes passando (`npm test`)

---

## §7 — INVENTÁRIO DE TESTES VALIDADOS

### Unit Tests (37 arquivos)

| Teste                             | Domínio protegido         |
| --------------------------------- | ------------------------- |
| `checkout-wizard.test.ts`         | Fluxo de checkout         |
| `commercial-entitlements.test.ts` | Planos comerciais         |
| `commercial-flow.test.ts`         | Fluxo comercial completo  |
| `mercadopago-*.test.ts` (5)       | Pagamentos MercadoPago    |
| `fiscal-*.test.ts` (2)            | Sistema fiscal / NFC-e    |
| `nfce-payload.test.ts`            | Payload NFC-e             |
| `order-guards.test.ts`            | Guards de pedidos         |
| `pix-payment-status.test.ts`      | Status PIX                |
| `schemas-validation.test.ts`      | Schemas Zod               |
| `template-*.test.ts` (4)          | Templates e catálogo      |
| `onboarding-*.test.ts` (3)        | Onboarding e provisioning |
| `admin-*.test.ts` (2)             | Segurança admin           |
| `editor-*.test.ts` (3)            | Editor de cardápio        |
| `panel-*.test.ts` (4)             | Painel do delivery        |
| `image-validation.test.ts`        | Validação de imagens      |
| `rate-limit.test.ts`              | Rate limiting             |
| `middleware-security.test.ts`     | Middleware                |

### E2E Tests (21 arquivos)

| Teste                            | Fluxo protegido        |
| -------------------------------- | ---------------------- |
| `checkout-happy-path.spec.ts`    | Compra completa        |
| `checkout-happy.spec.ts`         | Checkout feliz         |
| `checkout-validation.spec.ts`    | Validações checkout    |
| `cart-behavior.spec.ts`          | Comportamento carrinho |
| `security-audit.spec.ts`         | Auditoria de segurança |
| `security-comprehensive.spec.ts` | Segurança completa     |
| `admin.spec.ts`                  | Painel admin           |
| `admin-audit.spec.ts`            | Auditoria admin        |
| `cliente.spec.ts`                | Jornada do cliente     |
| `landing-conversion.spec.ts`     | Conversão de landing   |

---

## §9 — INTEGRIDADE ÉTICA: PROIBIÇÃO DE DADOS FALSOS

### 9.1 — Princípio

> **Este projeto NÃO trabalha com dados falsos, métricas inventadas, avaliações fake,
> depoimentos fictícios disfarçados de reais, ou qualquer artifício que engane o
> usuário/cliente sobre a autenticidade das informações.**

Violações deste princípio podem gerar **processos judiciais (CDC, LGPD, CONAR)**,
destruir a credibilidade da marca e causar dano irreparável ao negócio.

### 9.2 — PROIBIDO (LISTA EXPLÍCITA)

| Prática proibida                         | Exemplo                                         | Risco                             |
| ---------------------------------------- | ----------------------------------------------- | --------------------------------- |
| Avaliações/reviews fake                  | Estrelas, notas, NPS inventados                 | CDC Art. 37 (propaganda enganosa) |
| Depoimentos fictícios como reais         | "João da Pizzaria X disse..." sem ser real      | CONAR / CDC                       |
| Métricas infladas                        | "500+ clientes" sem base de dados real          | Propaganda enganosa               |
| Contadores falsos                        | "127 pessoas vendo agora" sem dados reais       | Manipulação                       |
| Urgência fabricada                       | Countdown fake, "últimas vagas" sem limite real | Dark pattern                      |
| Escassez artificial                      | "Vagas limitadas" quando não há limite          | Dark pattern                      |
| Fotos de "clientes" com banco de imagens | Rostos de stock como prova social               | Fraude                            |
| Badges/selos não conquistados            | "Certificado por X" sem certificação real       | Falsidade                         |

### 9.3 — PERMITIDO (COM TRANSPARÊNCIA)

| Prática permitida          | Condição obrigatória                                            |
| -------------------------- | --------------------------------------------------------------- |
| Cenários ilustrativos      | Rotular CLARAMENTE como "cenário ilustrativo" ou "simulação"    |
| Simulações de economia     | Mostrar premissas do cálculo (ex: "baseado em comissão de X%")  |
| Dados de concorrentes      | Citar fonte verificável (Reclame Aqui, site oficial, data)      |
| Comparativos de preço      | Dados públicos com fonte e data de consulta                     |
| Projeções de resultado     | Usar "até", "potencial", "estimativa" — nunca afirmar como fato |
| Protótipos de prova social | Seção vazia com "Em breve, depoimentos reais aparecerão aqui"   |

### 9.4 — Regra para Agentes de IA

> **Nenhum agente de IA pode sugerir, criar ou implementar dados falsos neste projeto.**
> Se uma sugestão de melhoria envolve "criar depoimentos", "adicionar avaliações",
> ou "inserir números de clientes", o agente DEVE:
>
> 1. Recusar a implementação com dados inventados
> 2. Sugerir alternativa transparente (simulação rotulada, coleta real futura)
> 3. Informar o owner sobre o risco ético/legal

---

## §8 — PROTEÇÃO CRÍTICA: VERCEL CLI PROIBIDO

### 8.1 — Incidente de Perda de Dados (10/04/2026)

Vercel CLI executou `vercel deploy` e **apagou 52 variáveis de ambiente** do `.env.local`
durante sync automático, incluindo credenciais de pagamento, API keys e secrets críticos.

### 8.2 — REGRA ABSOLUTA: NUNCA usar Vercel CLI para deploys

**Comandos PROIBIDOS neste projeto:**

```bash
vercel deploy          # ❌ PROIBIDO - sobrescreve .env.local
vercel pull            # ❌ PROIBIDO - sync destrutivo
vercel env pull        # ❌ PROIBIDO - remove variáveis locais
vercel env sync        # ❌ PROIBIDO - sync forçado
```

**Motivo:** Vercel CLI faz sync automático de environment variables do cloud,
**SOBRESCREVENDO e REMOVENDO** todas as variáveis que não existem no painel da Vercel.
Isso causa perda de credenciais críticas armazenadas apenas localmente.

### 8.3 — Workflow CORRETO para deploys

**✅ MÉTODO APROVADO: GitHub Integration (deploy automático)**

```bash
git add .
git commit -m "descrição"
git push origin main
# Vercel detecta push automaticamente e faz deploy
```

**Vantagens:**

- Zero risco de perda de `.env.local`
- Deploy automático em cada push
- Mais rápido e confiável
- Sem necessidade de tokens locais ou CLI

### 8.4 — Proteções Existentes

- ✅ Backup automático em `.env-backups/` (script `protect-env.ps1`)
- ✅ `.env.local` protegido no `.gitignore`
- ✅ Múltiplos backups timestamped

**Restauração de emergência:**

```powershell
cp .env-backups/2026-04-07_20-10-26_.env.local .env.local
```

### 8.5 — Instrução para Agentes de IA

**Qualquer agente que sugerir Vercel CLI deploy DEVE:**

1. **PARAR** e alertar sobre risco de perda de `.env.local`
2. Sugerir alternativa via GitHub Integration (git push)
3. Obter confirmação EXPLÍCITA do owner antes de prosseguir
4. NUNCA executar comandos `vercel deploy`, `vercel pull` ou `vercel env *` sem autorização

**Exception:** Vercel CLI permitido APENAS para comandos read-only:

- `vercel logs` (leitura de logs)
- `vercel inspect <url>` (inspeção de deploy)

### 8.6 — Configuração de Environment Variables

**MÉTODO APROVADO: Script automatizado (seguro)**

Para sincronizar variáveis do `.env.local` para a Vercel:

```powershell
.\scripts\sync-env-to-vercel.ps1 -Environment production
```

**O que o script faz:**

- ✅ Lê variáveis do `.env.local` (NÃO modifica o arquivo)
- ✅ Filtra variáveis locais (GITHUB_TOKEN, VERCEL_TOKEN, etc.)
- ✅ Usa API REST da Vercel (mais seguro que CLI)
- ✅ Skip automático de variáveis já existentes (ENV_CONFLICT)
- ✅ Relatório detalhado de sucesso/conflitos

**Variáveis excluídas (ficam apenas no localhost):**

- VERCEL_TOKEN, GITHUB_TOKEN, RENDER_API_KEY
- FORGE*GITHUB*\* (projeto ForgeOps AI separado)
- ALERT_WEBHOOK_URL (localhost:8000)

**Após sync, triggar deploy:**

```bash
git commit --allow-empty -m "apply new env vars"
git push origin main
```

---

## §9 — ASSINATURA DE PROTEÇÃO

Este documento foi criado para proteger o patrimônio de código do projeto
Cardápio Digital / Zairyx, garantindo que funcionalidades validadas em produção
não sejam quebradas por alterações inadvertidas de qualquer agente automatizado.

**Qualquer agente de IA que ignore este protocolo estará causando risco financeiro
e operacional ao projeto e seus clientes.**

```
HASH DE REFERÊNCIA: Este documento é a fonte de verdade.
DATA DE VALIDAÇÃO: 10/04/2026
OWNER: Tiago (globemarket7@gmail.com)
STATUS: ATIVO — APLICA-SE A TODOS OS AGENTES
ÚLTIMA ATUALIZAÇÃO: 10/04/2026 - Proteção Vercel CLI adicionada
```

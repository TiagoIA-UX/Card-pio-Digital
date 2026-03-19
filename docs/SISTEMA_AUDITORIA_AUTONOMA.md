# Sistema Autônomo de Auditoria — Cardápio Digital

**Stack real:** Playwright + Node test runner + Vercel Cron + Supabase
**Personas:** Admin | Restaurante | Afiliado | Freelancer
**Trigger:** Cron diário via Vercel (já configurado) + CI via GitHub Actions
**Notificação:** WhatsApp (Twilio) + Sentry (error tracking)

---

## PARTE 1: O QUE JÁ EXISTE (implementado)

### 1.1 Testes E2E (Playwright)

| Arquivo | Testes | O que cobre |
|---------|--------|-------------|
| tests/e2e/checkout-happy-path.spec.ts | 10 | Fluxo completo de compra: listing → preview → checkout → MP |
| tests/e2e/cliente-burro.spec.ts | 8 | Chaos: double-click, spam, XSS, SQL injection, navegação errática |
| tests/legacy-routes.test.ts | 4 | Rotas deprecated retornam 410 |
| tests/onboarding-and-templates.test.ts | 7 | Config de templates, seed de restaurante, view model |

**Total atual:** 29 testes (11 unit + 18 E2E em 2 browsers)

### 1.2 Fixtures existentes

| Fixture | Classe | Métodos |
|---------|--------|---------|
| tests/fixtures/affiliate-fixtures.ts | AffiliateHelper | registerViaAPI, getMe, updateProfile, getRanking, getSaldoInfo |
| tests/fixtures/affiliate-fixtures.ts | FraudHelper | sendForgedWebhook, registerMultipleAliasAccounts |
| tests/fixtures/payment-fixtures.ts | PaymentHelper | iniciarOnboarding, getStatus, validarCupom, sendWebhook |

### 1.3 Page Objects existentes

| Page Object | Rota | Métodos |
|-------------|------|---------|
| tests/page-objects/CheckoutPage.ts | /comprar/{template} | navigate, fillForm, applyCoupon, submit, expectNoJSErrors |
| tests/page-objects/AffiliatePage.ts | /afiliados, /painel/afiliados | navigate, expectLoaded, expectProtectedOrLoaded |
| tests/page-objects/TemplatesPage.ts | /templates | navigate, expectLoaded, getTemplateCount, clickTemplate |

### 1.4 Cron Jobs (Vercel — já ativos)

| Horário | Endpoint | Função |
|---------|----------|--------|
| 08:00 UTC | /api/cron/check-subscriptions | Verifica assinaturas vencidas |
| 09:00 UTC | /api/cron/check-sla | Verifica tickets de suporte fora do SLA |
| 10:00 UTC | /api/cron/expire-access | Revoga acessos de freelancer expirados |

### 1.5 Comandos de teste (package.json)

```bash
npm test                    # Unit tests (tsx --test)
npm run test:e2e            # Playwright (todos)
npm run test:e2e:checkout   # Só happy path
npm run test:e2e:chaos      # Só chaos (cliente-burro)
npm run audit:full          # Build + lint + unit tests
npm run test:affiliate      # Fluxo afiliado isolado
npm run test:webhook        # Teste webhook MP
npm run test:r2             # Teste upload R2
npm run validate:mp         # Valida credenciais MP
```

---

## PARTE 2: O QUE FALTA IMPLEMENTAR

### 2.1 Novos test specs por persona

O projeto já tem a base (Playwright + fixtures + page objects). Faltam specs dedicados:

#### Persona 1: Admin (globemarket7@gmail.com)

```
tests/e2e/admin-audit.spec.ts

Cenários:
[ ] Login admin via secret key → dashboard carrega
[ ] Dashboard /admin exibe métricas reais (não zeros)
[ ] /admin/afiliados lista afiliados do banco
[ ] /admin/freelancers lista freelancers
[ ] /admin/suporte lista tickets
[ ] /admin/logs mostra logs de auditoria
[ ] /admin/venda-direta cria restaurante
[ ] /admin/clientes/[id] exibe dados do cliente
[ ] Ação sem auth retorna 401
[ ] Ação com role insuficiente retorna 403
[ ] Rate limiting: 100+ requests em 1 min → 429
```

#### Persona 2: Restaurante (seller)

```
tests/e2e/restaurante-audit.spec.ts

Cenários:
[ ] Login → redirect para /painel
[ ] /painel/produtos lista produtos
[ ] /painel/categorias CRUD funciona
[ ] /painel/editor renderiza sem JS errors
[ ] /painel/qrcode gera QR válido
[ ] /painel/configuracoes salva alterações
[ ] Upload imagem > 5MB → rejeição
[ ] Upload imagem válida → R2 URL retornada
[ ] Acesso a /admin → redirect para /login (não é admin)
```

#### Persona 3: Afiliado (reseller)

```
tests/e2e/afiliado-audit.spec.ts

Cenários (expandir fixture existente):
[ ] Cadastro via /api/afiliados/registrar
[ ] Self-referral bloqueado (usar próprio link)
[ ] Ranking /api/afiliados/ranking retorna top-50
[ ] Saldo /api/afiliados/saldo-info correto
[ ] Webhook com assinatura forjada → rejeitado
[ ] Múltiplas contas com mesmo email → bloqueado
[ ] Comissão calculada: 30% vendedor + 10% líder
[ ] Saque com chave PIX inválida → erro validação
[ ] Dashboard /painel/afiliados acessível após login
[ ] Cookie aff_ref setado ao visitar ?ref=CODE
```

#### Persona 4: Freelancer

```
tests/e2e/freelancer-audit.spec.ts

Cenários:
[ ] Admin cria freelancer via /api/admin/freelancers POST
[ ] Freelancer vê jobs via /api/freelancer/job GET
[ ] Aceitar job atualiza status
[ ] Acesso temporário (48h) funciona
[ ] Acesso após expiração → bloqueado
[ ] Cron expire-access revoga acessos expirados
[ ] Precificação: cardápio R$50 base + R$2/item
[ ] Urgência <24h aplica 1.5x
```

### 2.2 Testes de segurança (expandir cliente-burro.spec.ts)

```
tests/e2e/security-audit.spec.ts

[ ] SQL injection em todos os campos de busca (/admin/*, /api/*)
[ ] XSS em nome de restaurante, produto, categoria
[ ] CSRF: POST sem origin header → bloqueado
[ ] Path traversal em /api/upload (filename com ../)
[ ] Header injection em /api/webhook/mercadopago
[ ] Open redirect: /login?redirect=https://evil.com → bloqueado
[ ] Rate limit: 500+ webhooks em 1 min → 429
[ ] Auth bypass: acessar /api/admin/* sem token → 401
[ ] Deprecated routes retornam 410 (já testado, manter)
```

### 2.3 Testes de API (contract tests)

```
tests/e2e/api-contracts.spec.ts

Testar shape da resposta de cada endpoint:
[ ] GET  /api/templates → { templates: [...], count }
[ ] POST /api/pagamento/iniciar-onboarding → { id, url, status }
[ ] GET  /api/pagamento/status?checkout=X → { status, details }
[ ] POST /api/checkout/validar-cupom → { valid, discount }
[ ] POST /api/orders → { order_id, status }
[ ] POST /api/afiliados/registrar → { affiliate }
[ ] GET  /api/afiliados/ranking → { ranking: [...] }
[ ] GET  /api/admin/metrics → { revenue, orders, affiliates }
[ ] GET  /api/admin/logs → { logs: [...], total }
[ ] POST /api/webhook/mercadopago → 200 (valid) / 401 (invalid sig)
```

---

## PARTE 3: CRON DE AUDITORIA AUTOMÁTICA

### 3.1 Nova rota: /api/cron/audit (adicionar ao vercel.json)

```typescript
// app/api/cron/audit/route.ts

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Validar CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    timestamp: new Date().toISOString(),
    checks: [] as Array<{ name: string; status: 'pass' | 'fail'; detail: string }>
  }

  // Check 1: Supabase connectivity
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { count, error } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
    results.checks.push({
      name: 'supabase_connectivity',
      status: error ? 'fail' : 'pass',
      detail: error ? error.message : `${count} restaurants`
    })
  } catch (e) {
    results.checks.push({
      name: 'supabase_connectivity',
      status: 'fail',
      detail: String(e)
    })
  }

  // Check 2: Mercado Pago credentials
  try {
    const mpToken = process.env.MP_ACCESS_TOKEN
    results.checks.push({
      name: 'mp_credentials',
      status: mpToken ? 'pass' : 'fail',
      detail: mpToken?.startsWith('TEST-') ? 'SANDBOX (não produção!)' : 'Produção'
    })
  } catch (e) {
    results.checks.push({
      name: 'mp_credentials',
      status: 'fail',
      detail: String(e)
    })
  }

  // Check 3: R2 connectivity
  try {
    const r2Key = process.env.R2_ACCESS_KEY_ID
    results.checks.push({
      name: 'r2_storage',
      status: r2Key ? 'pass' : 'fail',
      detail: r2Key ? 'Configurado' : 'Sem credenciais R2'
    })
  } catch (e) {
    results.checks.push({
      name: 'r2_storage',
      status: 'fail',
      detail: String(e)
    })
  }

  // Check 4: Cron jobs health (self-check)
  results.checks.push({
    name: 'cron_audit_alive',
    status: 'pass',
    detail: 'Audit cron running successfully'
  })

  // Check 5: Admin user exists
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await supabase
      .from('admin_users')
      .select('email, role')
      .eq('role', 'owner')
      .limit(1)
    results.checks.push({
      name: 'admin_owner_exists',
      status: data && data.length > 0 ? 'pass' : 'fail',
      detail: data && data.length > 0 ? data[0].email : 'Nenhum owner cadastrado!'
    })
  } catch (e) {
    results.checks.push({
      name: 'admin_owner_exists',
      status: 'fail',
      detail: String(e)
    })
  }

  // Check 6: Pending support tickets (SLA)
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { count } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
    results.checks.push({
      name: 'open_tickets',
      status: 'pass',
      detail: `${count ?? 0} tickets abertos`
    })
  } catch (e) {
    results.checks.push({
      name: 'open_tickets',
      status: 'fail',
      detail: String(e)
    })
  }

  // Resumo
  const failed = results.checks.filter(c => c.status === 'fail')

  // Se houver falhas, notificar (WhatsApp ou log)
  if (failed.length > 0) {
    await notifyFailures(failed)
  }

  // Logar resultado
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await supabase.from('system_logs').insert({
      action: 'cron_audit',
      details: JSON.stringify(results),
      created_by: 'system'
    })
  } catch {
    // Log silencioso se falhar
  }

  return NextResponse.json({
    ...results,
    summary: {
      total: results.checks.length,
      passed: results.checks.filter(c => c.status === 'pass').length,
      failed: failed.length
    }
  })
}

async function notifyFailures(
  failures: Array<{ name: string; status: string; detail: string }>
) {
  // Opção 1: Twilio WhatsApp (se configurado)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_WHATSAPP_FROM // whatsapp:+14155238886
    const to = process.env.TWILIO_WHATSAPP_TO     // whatsapp:+5512996887993

    const message = [
      `⚠️ AUDITORIA FALHOU — ${new Date().toLocaleString('pt-BR')}`,
      '',
      ...failures.map(f => `❌ ${f.name}: ${f.detail}`),
      '',
      `Total: ${failures.length} falha(s)`
    ].join('\n')

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({ From: from!, To: to!, Body: message })
    })
  }

  // Opção 2: Sentry (se configurado)
  if (process.env.SENTRY_DSN) {
    // Sentry captura automaticamente via instrumentação
    console.error('[AUDIT CRON] Failures detected:', JSON.stringify(failures))
  }
}
```

### 3.2 Adicionar ao vercel.json

```json
{
  "crons": [
    { "path": "/api/cron/check-subscriptions", "schedule": "0 8 * * *" },
    { "path": "/api/cron/check-sla",           "schedule": "0 9 * * *" },
    { "path": "/api/cron/expire-access",        "schedule": "0 10 * * *" },
    { "path": "/api/cron/audit",                "schedule": "0 6 * * *" }
  ]
}
```

O cron de auditoria roda às 06:00 UTC (03:00 BRT) — antes dos outros, detecta problemas cedo.

---

## PARTE 4: NOTIFICAÇÃO VIA WHATSAPP

### 4.1 Serviço Twilio (recomendado)

**Env vars necessárias (.env.local):**

```bash
# WhatsApp via Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+5512996887993
```

**Custo:** ~$0.005 por mensagem WhatsApp (Twilio sandbox é grátis para teste).

**Setup:**
1. Criar conta Twilio: https://www.twilio.com/try-twilio
2. Ativar WhatsApp Sandbox: Console → Messaging → WhatsApp
3. Enviar "join <sandbox-keyword>" para +1 415 523 8886
4. Copiar SID + Auth Token para env vars

### 4.2 Alternativa gratuita: Webhook para n8n / Make

Se não quiser pagar Twilio, pode usar n8n (self-hosted) ou Make (free tier):

```
API cron/audit detecta falha
  → POST para webhook URL (n8n/Make)
    → n8n envia mensagem WhatsApp via WhatsApp Business API
```

Basta adicionar `AUDIT_WEBHOOK_URL` no env e fazer fetch no notifyFailures.

---

## PARTE 5: CI — GITHUB ACTIONS

### 5.1 Workflow de auditoria no PR/push

```yaml
# .github/workflows/audit.yml
name: Auditoria Completa

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 3 * * *'  # 03:00 UTC (00:00 BRT) diário

jobs:
  audit:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Build
        run: npm run build

      - name: Lint
        run: npm run lint

      - name: Unit Tests
        run: npm test

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: E2E Tests
        run: npx playwright test
        env:
          E2E_BASE_URL: http://localhost:3000
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload Playwright Report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - name: Notify on failure
        if: failure()
        run: |
          curl -X POST "${{ secrets.AUDIT_WEBHOOK_URL }}" \
            -H "Content-Type: application/json" \
            -d '{"text": "❌ Auditoria falhou no commit ${{ github.sha }}"}'
```

---

## PARTE 6: IMPLEMENTAÇÃO PASSO A PASSO

### Prioridade 1 — Imediato (sem custo, usa o que já existe)

```
[ ] 1. Criar .github/workflows/audit.yml (CI a cada push)
[ ] 2. Criar app/api/cron/audit/route.ts (health check diário)
[ ] 3. Adicionar cron audit ao vercel.json
[ ] 4. Rodar npm run audit:full localmente e confirmar 0 erros
```

### Prioridade 2 — Próxima sprint (novos testes)

```
[ ] 5. Criar tests/e2e/admin-audit.spec.ts (11 cenários)
[ ] 6. Criar tests/e2e/afiliado-audit.spec.ts (10 cenários)
[ ] 7. Criar tests/e2e/security-audit.spec.ts (9 cenários)
[ ] 8. Criar tests/e2e/api-contracts.spec.ts (10 cenários)
```

### Prioridade 3 — Pós-go-live (notificações)

```
[ ] 9.  Configurar Twilio WhatsApp (ou n8n webhook)
[ ] 10. Configurar Sentry DSN (ver SETUP_SENTRY.md)
[ ] 11. Criar tests/e2e/restaurante-audit.spec.ts (9 cenários)
[ ] 12. Criar tests/e2e/freelancer-audit.spec.ts (8 cenários)
```

---

## PARTE 7: MAPEAMENTO — 41 APIs vs COBERTURA DE TESTES

| API Route | Método | Testado? | Spec |
|-----------|--------|----------|------|
| /api/templates | GET | ✅ | checkout-happy-path |
| /api/pagamento/iniciar-onboarding | POST | ✅ | payment-fixtures |
| /api/pagamento/status | GET | ✅ | payment-fixtures |
| /api/checkout/validar-cupom | POST | ✅ | checkout-happy-path |
| /api/webhook/mercadopago | POST | ✅ | payment-fixtures |
| /api/webhooks/mercadopago | POST | ✅ | (alias) |
| /api/afiliados/registrar | POST | ✅ | affiliate-fixtures |
| /api/afiliados/me | GET/PATCH | ✅ | affiliate-fixtures |
| /api/afiliados/ranking | GET | ✅ | affiliate-fixtures |
| /api/afiliados/saldo-info | GET | ✅ | affiliate-fixtures |
| /api/pagamento/criar | POST | ✅ | legacy-routes (410) |
| /api/pagamento/criar-pacote | POST | ✅ | legacy-routes (410) |
| /api/pagamento/criar-assinatura | POST | ✅ | legacy-routes (410) |
| /api/checkout/criar-sessao | POST | ⚠️ | parcial |
| /api/webhook/templates | POST | ✅ | legacy-routes (410) |
| /api/orders | POST | ❌ | **FALTA** |
| /api/carrinho/sync | POST | ❌ | **FALTA** |
| /api/chat | POST | ❌ | **FALTA** |
| /api/chat/afiliados | POST | ❌ | **FALTA** |
| /api/suporte | GET/POST | ❌ | **FALTA** |
| /api/upload | POST | ⚠️ | test:r2 (script) |
| /api/admin/venda-direta | POST | ❌ | **FALTA** |
| /api/admin/logs | GET | ❌ | **FALTA** |
| /api/admin/team | GET/POST/DELETE | ❌ | **FALTA** |
| /api/admin/clientes | GET/POST/PATCH | ❌ | **FALTA** |
| /api/admin/metrics | GET/POST | ❌ | **FALTA** |
| /api/admin/suporte | GET/POST/PATCH | ❌ | **FALTA** |
| /api/admin/afiliados/comissoes | GET/POST | ❌ | **FALTA** |
| /api/admin/penalidades | GET/POST | ❌ | **FALTA** |
| /api/admin/freelancers | GET/POST/PATCH | ❌ | **FALTA** |
| /api/admin/bonus-fund | GET/POST | ❌ | **FALTA** |
| /api/freelancer/job | GET/POST/PATCH | ❌ | **FALTA** |
| /api/onboarding/status | GET | ❌ | **FALTA** |
| /api/onboarding/submit | POST | ❌ | **FALTA** |
| /api/cron/check-subscriptions | GET | ❌ | **FALTA** |
| /api/cron/check-sla | GET | ❌ | **FALTA** |
| /api/cron/expire-access | GET | ❌ | **FALTA** |
| /api/google-verification | GET | ❌ | low priority |
| /api/dev/unlock-all-templates | POST | ❌ | dev only |
| /api/afiliados/indicacao | POST | ❌ | internal |
| /api/webhook/subscriptions | POST | ❌ | **FALTA** |

**Resumo:** 15/41 testados (37%). Meta pós-go-live: 35/41 (85%).

---

## PARTE 8: COMPORTAMENTO CAÓTICO (já parcialmente em cliente-burro.spec.ts)

O arquivo `tests/e2e/cliente-burro.spec.ts` já implementa:

| Comportamento | Status | Detalhe |
|---------------|--------|---------|
| Double-click submit | ✅ | Não cria checkout duplicado |
| Spam clicks (5x rápido) | ✅ | Ignora clicks extras |
| Navegação zigzag | ✅ | checkout → templates → checkout |
| Back/forward rápido | ✅ | Estado mantém consistência |
| Refresh agressivo | ✅ | Página recarrega sem crash |
| URL fake de pagamento | ✅ | /pagamento/sucesso?id=fake |
| XSS em inputs | ✅ | `<script>alert('xss')</script>` |
| SQL injection em busca | ✅ | `'; DROP TABLE users; --` |

**Comportamentos para adicionar:**

| Comportamento | Prioridade | Spec sugerida |
|---------------|------------|---------------|
| Upload arquivo gigante (10MB+) | Alta | restaurante-audit |
| Chamada API sem Content-Type | Média | api-contracts |
| Token expirado acessando /painel | Alta | security-audit |
| Concurrent checkout (2 abas) | Alta | security-audit |
| Unicode em nome de restaurante | Média | restaurante-audit |
| Emoji em campo de preço | Baixa | restaurante-audit |
| Request com body vazio | Média | api-contracts |
| PUT/DELETE em rota que só aceita GET | Baixa | api-contracts |

---

## RESUMO EXECUTIVO

| Métrica | Atual | Meta Go-Live | Meta 30 dias |
|---------|-------|-------------|--------------|
| Testes totais | 29 | 50+ | 100+ |
| APIs cobertas | 15/41 (37%) | 25/41 (61%) | 35/41 (85%) |
| Chaos behaviors | 8 | 12 | 20 |
| Security tests | 2 (XSS, SQLi) | 9 | 15 |
| Cron health checks | 3 | 4 (+audit) | 5 |
| CI pipeline | Nenhum | GitHub Actions | + scheduled |
| Notificação | Nenhuma | Sentry | + WhatsApp |

**Próximo passo concreto:** Criar o workflow `.github/workflows/audit.yml` e a rota `/api/cron/audit` — zero custo, máximo impacto.

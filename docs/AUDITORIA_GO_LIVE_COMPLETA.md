# AUDITORIA GO-LIVE — Cardápio Digital

**Data:** 19/03/2026
**Admin:** globemarket7@gmail.com
**Repo:** TiagoIA-UX/Cardapio-Digital (branch main)
**Stack:** Next.js 15 + Supabase + Mercado Pago + Vercel

---

## PARTE 1: STATUS REAL DOS SUBSISTEMAS

### 1.1 Build / Lint / Testes

| Check       | Status | Detalhe                        |
|-------------|--------|--------------------------------|
| Build       | PASS   | `npm run build` sem erros      |
| Lint        | PASS   | 0 erros (921 corrigidos)       |
| Testes      | PASS   | 11/11 passando (Playwright)    |
| TypeScript  | WARN   | `ignoreBuildErrors: true` ativo |

- [ ] Remover `ignoreBuildErrors: true` de next.config.mjs e corrigir erros TS

---

### 1.2 Sistema de Afiliados — IMPLEMENTADO

| Componente               | Status | Arquivo                                     |
|--------------------------|--------|---------------------------------------------|
| Cadastro afiliado        | OK     | app/afiliados/                              |
| Ranking gamificado       | OK     | app/afiliados/ranking/page.tsx              |
| Comissão por venda       | OK     | services/affiliate.service.ts               |
| Webhook idempotente      | OK     | app/api/webhooks/mercadopago/route.ts       |
| Admin: tiers e strikes   | OK     | app/admin/afiliados/page.tsx                |
| Fundo de bônus           | OK     | app/api/admin/bonus-fund/route.ts           |
| Chaos tests (prompts)    | OK     | docs/AFFILIATE_CHAOS_TEST_PROMPT_FINAL.md   |

**Pendente para produção:**
- [ ] Validar fluxo completo com Mercado Pago em produção (não sandbox)
- [ ] Testar saque real via Pix
- [ ] Definir regras de comissão finais com Cadu (ver Parte 5)

---

### 1.3 Sistema de Freelancers — IMPLEMENTADO

**O sistema está 100% implementado no código.** Freelancers são prestadores de serviço contratados pela plataforma para criar/configurar cardápios para restaurantes clientes.

| Componente                 | Status | Arquivo                                  |
|----------------------------|--------|------------------------------------------|
| DB: 4 tabelas + RLS        | OK     | supabase/migrations/027_*.sql            |
| Types                      | OK     | types/support.ts                         |
| Service (lógica negócio)   | OK     | services/freelancer.service.ts           |
| API Admin (CRUD + jobs)    | OK     | app/api/admin/freelancers/route.ts       |
| API Self-service           | OK     | app/api/freelancer/job/route.ts          |
| UI Admin (lista + ações)   | OK     | app/admin/freelancers/page.tsx           |
| Cron: expirar acessos      | OK     | app/api/cron/expire-access/route.ts      |
| Acesso temporário (48h)    | OK     | freelancer_access table + permissões     |
| Precificação automática    | OK     | R$40-100 base + por item + urgência      |

**Tabelas Supabase:**
- `freelancers` — cadastro, skills, rating, status
- `freelancer_jobs` — jobs atribuídos, tipo, preço calculado, status
- `freelancer_access` — acesso temporário ao restaurante (48h), RLS
- `system_logs` — auditoria de ações

**Precificação automática implementada:**

| Tipo           | Base   | Por item | Urgência <24h | Urgência <48h |
|----------------|--------|----------|---------------|---------------|
| Cardápio       | R$ 50  | +R$ 2    | 1.5x          | 1.25x         |
| Design         | R$ 80  | +R$ 5    | 1.5x          | 1.25x         |
| Configuração   | R$ 40  | +R$ 0    | 1.5x          | 1.25x         |
| Personalizado  | R$ 100 | +R$ 10   | 1.5x          | 1.25x         |

**Afiliado vs Freelancer — diferença no código:**
- **Afiliado** = gera link de indicação, ganha comissão passiva por vendas
- **Freelancer** = executa serviço ativo (criar cardápio), ganha pagamento fixo por job
- São sistemas independentes, tabelas separadas, não conflitam

**Pendente para produção:**
- [ ] Decidir se freelancers sobem no MVP ou ficam em beta fechado
- [ ] Criar página pública de cadastro de freelancer (hoje só admin cria)
- [ ] Definir forma de pagamento ao freelancer (Pix manual? Mercado Pago?)

---

### 1.4 Sistema Admin — IMPLEMENTADO

| Página               | Status | Rota                         |
|----------------------|--------|------------------------------|
| Dashboard principal  | OK     | /admin                       |
| Clientes (detalhe)   | OK     | /admin/clientes/[id]         |
| Afiliados            | OK     | /admin/afiliados             |
| Freelancers          | OK     | /admin/freelancers           |
| Suporte (tickets)    | OK     | /admin/suporte               |
| Logs de auditoria    | OK     | /admin/logs                  |
| Venda direta         | OK     | /admin/venda-direta          |
| Métricas             | BÁSICO | /admin/metrics               |

**Auth implementada:** `lib/admin-auth.ts`
- Hierarquia: owner(3) > admin(2) > support(1)
- Dois modos: session cookie (browser) + Bearer token (API)
- Rate limiting configurado por endpoint

**10 APIs Admin implementadas:**
- GET/POST/PATCH /api/admin/freelancers
- GET/POST /api/admin/bonus-fund
- GET /api/admin/logs
- GET /api/admin/metrics
- POST /api/admin/venda-direta
- E outros endpoints de gestão

**Pendente para produção:**
- [ ] Registrar globemarket7@gmail.com como owner na tabela `admin_users`
- [ ] Ativar 2FA para conta admin (Supabase suporta)
- [ ] Adicionar gráficos ao /admin/metrics

---

### 1.5 Infraestrutura — STATUS

| Serviço          | Status      | Detalhe                            |
|------------------|-------------|------------------------------------|
| Supabase (DB)    | CONFIGURADO | 27 migrations, RLS ativado         |
| Mercado Pago     | CONFIGURADO | Prod + Sandbox com webhooks        |
| Cloudflare R2    | CONFIGURADO | CDN em cdn.zairyx.com              |
| Vercel           | CONFIGURADO | 3 cron jobs diários                |
| Groq (chatbot)   | CONFIGURADO | API para chat widget               |
| Sentry           | PENDENTE    | Código pronto, DSN não configurado |
| Redis (Upstash)  | OPCIONAL    | Rate-limiting usa in-memory hoje   |

**Cron jobs ativos (vercel.json):**

| Horário | Job                    | Endpoint                        |
|---------|------------------------|---------------------------------|
| 08:00   | Verificar assinaturas  | /api/cron/check-subscriptions   |
| 09:00   | Verificar SLA suporte  | /api/cron/check-sla             |
| 10:00   | Expirar acessos        | /api/cron/expire-access         |

**Segurança já implementada no código:**
- Headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options (middleware.ts)
- CORS restrito ao domínio (vercel.json)
- Rate-limiting: webhooks 500/min, auth 100/min, API 500/min
- Middleware protege: /painel, /admin, /meus-templates, /onboarding, /status
- RLS ativado em todas as tabelas sensíveis
- Webhook Mercado Pago com validação de assinatura
- Queries parametrizadas (Supabase client, sem SQL raw)
- React escapa HTML (proteção XSS nativa)
- Cookies: httpOnly + secure + SameSite (via Supabase Auth)

---

## PARTE 2: CHECKLIST PRÉ-GO-LIVE

### 2.1 Ações OBRIGATÓRIAS (bloqueiam go-live)

```
[ ] 1. Registrar admin como owner
       SQL no Supabase Dashboard → SQL Editor:
       INSERT INTO admin_users (user_id, role, email)
       VALUES ('<supabase_user_id>', 'owner', 'globemarket7@gmail.com');

[ ] 2. Testar fluxo de compra completo em produção
       /comprar/[template] → login → checkout → Mercado Pago → /pagamento/sucesso
       Confirmar que subscription é criada na tabela

[ ] 3. Testar webhook Mercado Pago em PRODUÇÃO
       Pagamento aprovado → webhook dispara → atualiza assinatura → libera /painel
       Verificar idempotência (enviar mesmo webhook 2x, não duplicar)

[ ] 4. Configurar domínio final na Vercel
       Vercel Dashboard → Settings → Domains → Adicionar domínio
       Atualizar NEXT_PUBLIC_SITE_URL na Vercel com o domínio final

[ ] 5. Verificar TODAS as env vars na Vercel
       Obrigatórias:
       - NEXT_PUBLIC_SUPABASE_URL
       - NEXT_PUBLIC_SUPABASE_ANON_KEY
       - SUPABASE_SERVICE_ROLE_KEY
       - MP_ACCESS_TOKEN (PRODUÇÃO, não test)
       - CRON_SECRET
       - ADMIN_SECRET_KEY
       - NEXT_PUBLIC_SITE_URL (domínio final)
       Opcionais:
       - SENTRY_DSN (se configurar Sentry)
       - R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME

[ ] 6. Remover ignoreBuildErrors: true
       Em next.config.mjs → typescript.ignoreBuildErrors
       Corrigir erros TS que aparecerem no build

[ ] 7. Backup do banco antes do go-live
       Supabase Dashboard → Settings → Database → Backups → Download
```

### 2.2 Ações RECOMENDADAS (melhoram mas não bloqueiam)

```
[ ] 8.  Configurar Sentry (seguir SETUP_SENTRY.md do repo)
[ ] 9.  Configurar email transacional (SendGrid ou Resend)
        Para: confirmação de pedido, notificação de saque, refund
[ ] 10. Status page gratuita (uptimerobot.com)
[ ] 11. Criar 2-3 restaurantes demo para showcase na landing
[ ] 12. Revisar textos de T&C (/termos) e Privacidade (/privacidade)
[ ] 13. Testar cookie consent banner (components/cookie-banner.tsx)
[ ] 14. Testar em mobile: iPhone Safari + Android Chrome
[ ] 15. Configurar Google Analytics / Search Console
```

---

## PARTE 3: ESTRATÉGIA DE DEPLOY

### Deploy via Vercel (recomendado)

```
1. git push origin main
   → Vercel detecta push e inicia build automático
   → Preview deploy é gerado automaticamente

2. Testar no preview URL
   → Fluxo: cadastro → login → compra → pagamento
   → Admin: login → dashboard → ações
   → Mobile: responsive OK?

3. Se preview OK → promover para produção
   → Vercel Dashboard → Deployments → "Promote to Production"

4. Se falhar → rollback instantâneo
   → Vercel Dashboard → deployment anterior → "Redeploy"
```

### Plano de Rollback

```
ROLLBACK RÁPIDO (< 1 min):
  Vercel Dashboard → Deployments → deploy anterior → "Redeploy"
  (Vercel mantém todas as builds anteriores)

ROLLBACK VIA GIT (< 5 min):
  git revert HEAD
  git push origin main
  (Gera novo deploy automático com código anterior)

ROLLBACK DE BANCO (se migration corrompeu dados):
  Supabase Dashboard → Settings → Database → Backups
  Restaurar backup mais recente
  Refazer deploy da versão anterior
```

---

## PARTE 4: SEGURANÇA — IMPLEMENTADO vs PENDENTE

| Controle                  | Status        | Implementação                         |
|---------------------------|---------------|---------------------------------------|
| SQL Injection             | PROTEGIDO     | Supabase client, queries parametrizadas |
| XSS                       | PROTEGIDO     | React escapa HTML nativamente          |
| CSRF                      | PROTEGIDO     | SameSite cookies via Supabase Auth     |
| CORS                      | PROTEGIDO     | Restrito ao domínio (vercel.json)      |
| Rate Limiting             | PROTEGIDO     | In-memory: webhook/auth/API            |
| Auth rotas protegidas     | PROTEGIDO     | middleware.ts protege /painel, /admin  |
| HTTPS                     | PROTEGIDO     | Vercel força SSL automaticamente       |
| Security Headers          | PROTEGIDO     | HSTS, CSP, X-Frame-Options            |
| Senhas                    | PROTEGIDO     | Supabase Auth (bcrypt interno)         |
| RLS (Row Level Security)  | PROTEGIDO     | Todas as tabelas sensíveis             |
| Webhook signature         | PROTEGIDO     | Validação Mercado Pago                 |
| 2FA para admin            | PENDENTE      | Supabase suporta, precisa ativar       |
| Sentry (error tracking)   | PENDENTE      | Código pronto, falta DSN              |
| Dados sensíveis em logs   | VERIFICAR     | Revisar se CPF/token aparece em logs   |
| Backup criptografado      | AUTOMÁTICO    | Supabase faz backup diário             |

---

## PARTE 5: PERGUNTAS PARA O CADU (antes do go-live)

### Bloco 1 — Decisões de MVP

```
1. Freelancers sobem no MVP ou ficam em beta fechado?
   → Se beta: desativar rota pública, manter só admin criando
   → Se MVP: criar página pública de cadastro

2. Quantos restaurantes espera no primeiro mês?
   → Impacta escolha do plano Supabase e limites Vercel

3. Afiliados já podem operar livremente ou aprovação manual?
   → Atualmente qualquer um pode se cadastrar

4. Qual é o domínio final de produção?
   → Precisa configurar na Vercel + NEXT_PUBLIC_SITE_URL
```

### Bloco 2 — Pagamentos

```
5. O MP_ACCESS_TOKEN atual é de PRODUÇÃO ou SANDBOX?
   → Token de teste começa com TEST-, produção com APP_USR-

6. Saque de afiliado: automático via Mercado Pago ou Pix manual?
7. Saque de freelancer: mesma forma ou diferente?
8. Valor mínimo para saque? (R$ 10? R$ 50?)
9. Prazo de saque: imediato (T+0)? ou T+7? T+14?
```

### Bloco 3 — Operacional

```
10. Quem responde suporte? (só Cadu? tem equipe?)
11. SLA de resposta desejado: 4h? 24h? 48h?
    (Cron job de SLA já roda diariamente às 09:00)
12. Se o site cair de madrugada, quem é notificado?
    → Configurar Sentry/Uptime Robot para alertar
13. Precisa de integração com WhatsApp Business?
```

---

## PARTE 6: CRITÉRIOS DE SUCESSO

| Métrica                      | Meta           |
|------------------------------|----------------|
| Uptime                       | > 99%          |
| Page load (P95)              | < 3s           |
| Zero perda de dados          | Obrigatório    |
| Webhook processado           | 100%           |
| Admin funcional              | 100%           |
| Checkout funcional           | 100%           |
| Taxa de chargeback           | < 1%           |
| Tempo de resposta suporte    | < 24h          |

---

## ORDEM DE EXECUÇÃO

```
CONCLUÍDO:
  [x] Build passing (0 erros)
  [x] Lint passing (921 → 0 erros)
  [x] Testes passing (11/11 Playwright)
  [x] Push para GitHub (TiagoIA-UX/Cardapio-Digital)
  [x] Chaos test docs integrados

PRÓXIMO (nesta ordem):
  [ ] Responder perguntas da Parte 5 com Cadu
  [ ] Executar checklist 2.1 (7 ações obrigatórias)
  [ ] Testar fluxo completo no preview URL da Vercel
  [ ] Deploy produção (NÃO fazer em sexta-feira!)
  [ ] Monitorar 24h pós-deploy
```

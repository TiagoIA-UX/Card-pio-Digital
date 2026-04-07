# Governança de Migrations — Cardápio Digital SaaS

> **Regra de ouro: 100% do schema é versionado. 0% no painel manual.**

---

## Por que isso importa

Alterar policies, tabelas ou funções diretamente no Supabase Dashboard cria **drift** entre o banco de produção e o repositório.

Consequências diretas:

- Deploy em novo ambiente quebra silenciosamente
- Restore de backup reverte as mudanças manuais
- Outro dev fica com schema diferente
- CI/CD não consegue validar o estado real do banco

**Exemplo real (07/04/2026):** 3 policies (`org_admin_all`, `promo_admin_all`, `org_members_admin`) foram criadas no painel. O Sentinel detectou como permissivas mas não tinham migration de origem — impossível rastrear quando/por quem foram criadas.

---

## Regras obrigatórias

### ❌ Proibido

- Criar tabelas no Supabase Dashboard
- Criar/alterar policies pelo Supabase Dashboard
- Criar/alterar funções pelo Supabase Dashboard
- Alterar tipos e constraints diretamente no banco
- Rodar SQL manual em produção sem criar migration correspondente

### ✅ Obrigatório

- Toda mudança de schema via arquivo `supabase/migrations/NNN_descricao.sql`
- Numeração sequencial: `001_`, `002_`, ..., `057_`
- SQL testado localmente antes de aplicar em produção
- Comentário no arquivo explicando o motivo da mudança

---

## Formato padrão de migration

```sql
-- ============================================================
-- NNN — Título descritivo da migration
-- Motivo: o que está sendo corrigido/adicionado e por quê
-- ============================================================

-- ── 1. Nome da seção ─────────────────────────────────────────
ALTER TABLE tabela ...;
```

---

## Checklist de segurança em RLS

Antes de criar qualquer policy, confirmar:

- [ ] A tabela tem `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
- [ ] A policy especifica explicitamente `TO role` (ex: `TO service_role`, `TO authenticated`)
- [ ] Policies de backend usam `TO service_role`
- [ ] Policies de usuário usam `TO authenticated` com `USING (tenant_id = auth.uid())` ou equivalente
- [ ] **Nunca** usar `FOR ALL USING (true)` sem `TO role` — isso vira `public`
- [ ] Tabelas financeiras (`cobrancas_pix`, `subscriptions`, `orders`) e de dados pessoais (`users`, `profiles`) têm políticas mais restritivas

### Níveis de risco (classificação do `platform_health_check`)

| `risk_level` | Roles na policy             | Ação necessária           |
| ------------ | --------------------------- | ------------------------- |
| `critical`   | `public`, `anon`, ou vazio  | Bloquear imediatamente    |
| `high`       | `authenticated`             | Revisar com urgência      |
| `medium`     | Outra role não-service_role | Revisar na próxima sprint |
| _(excluído)_ | `service_role` only         | OK — backend intencional  |

---

## Auditoria de tabelas sensíveis

### Financeiras (acesso apenas via service_role)

| Tabela          | RLS | Policy obrigatória           |
| --------------- | --- | ---------------------------- |
| `cobrancas_pix` | ✅  | `TO service_role`            |
| `subscriptions` | ✅  | `TO service_role`            |
| `orders`        | ✅  | Tenant-scoped + service_role |
| `order_items`   | ✅  | Tenant-scoped + service_role |

### Dados de usuário (acesso tenant-scoped)

| Tabela        | RLS | Policy obrigatória    |
| ------------- | --- | --------------------- |
| `users`       | ✅  | `tenant_id` isolation |
| `tenants`     | ✅  | Owner ou service_role |
| `admin_users` | ✅  | `TO service_role`     |

### Escrita externa (webhooks, ZAEA)

| Tabela            | RLS | Policy obrigatória |
| ----------------- | --- | ------------------ |
| `webhook_events`  | ✅  | `TO service_role`  |
| `agent_tasks`     | ✅  | `TO service_role`  |
| `agent_knowledge` | ✅  | `TO service_role`  |
| `system_alerts`   | ✅  | `TO service_role`  |
| `audit_logs`      | ✅  | `TO service_role`  |

---

## Fluxo de trabalho correto

```
1. Identificar necessidade de mudança no banco
2. Criar arquivo: supabase/migrations/NNN_descricao.sql
3. Testar localmente: supabase db reset (se disponível)
4. Aplicar em produção: Supabase Dashboard → SQL Editor → colar conteúdo
5. Commitar o arquivo no repositório
6. Nunca: alterar o banco antes de criar a migration
```

---

## Verificação automatizada

O `platform_health_check()` (RPC) verifica a cada cron:

- Tabelas sem RLS
- Tabelas com RLS mas sem policies
- Policies permissivas com `risk_level` (`critical` / `high` / `medium`)
- Views com SECURITY DEFINER

O Sentinel Python (`backend/sentinel.py`) dispara alertas Telegram para qualquer achado `critical` ou `high`.

---

_Última atualização: 07/04/2026 — após incidente de drift detectado pelo Sentinel_

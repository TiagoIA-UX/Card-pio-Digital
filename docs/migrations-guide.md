# Guia de Migrations — Cardápio Digital

> **Regra absoluta:** nunca edite o banco de produção sem backup. Nunca rode
> `supabase db reset` em produção (apaga tudo).

---

## 1. Inventário completo (001–022)

| #    | Arquivo                                             | O que faz                                                                                                    | Depende de                 |
| ---- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------- |
| 001  | `001_schema_base.sql`                               | Cria tabelas base: `plans`, `tenants`, `users`, `subscriptions`, `categories`, `products`, `orders`, etc.    | —                          |
| 002a | `002_rls_policies.sql`                              | Habilita RLS e políticas para todas as tabelas de 001                                                        | 001                        |
| 002b | `002_restaurant_customization_and_order_origin.sql` | ADD `template_slug`, `google_maps_url`, `origem_pedido`, `mesa_numero`                                       | 001                        |
| 003  | `003_ecommerce_checkout_tables.sql`                 | Cria `template_orders`, `template_order_items`, `user_purchases`, `coupons`                                  | —                          |
| 004  | `004_operational_schema_alignment.sql`              | Alinha colunas de `plans`, `restaurants`, `subscriptions`, `admin_users`, `activation_events` ao modelo real | 001, 003                   |
| 005  | `005_checkout_session_hardening.sql`                | Cria `checkout_sessions` (FK → `template_orders`); índice único em `payment_id`                              | 003                        |
| 006  | `006_onboarding_submissions.sql`                    | Cria `onboarding_submissions` (FK → `restaurants`, `template_orders`)                                        | 003                        |
| 007  | `007_cupom_primeiros_clientes.sql`                  | Seed do cupom `GANHEI20%` em `coupons`                                                                       | 003                        |
| 008  | `008_orders_troco_para.sql`                         | ADD `troco_para` em `orders`                                                                                 | 001/002b                   |
| 009  | `009_templates_seed.sql`                            | Cria tabela `templates` + seed dos 7 templates                                                               | —                          |
| 010  | `010_affiliates.sql`                                | Cria `affiliates` e `affiliate_referrals` (MVP)                                                              | `auth.users`               |
| 011  | `011_affiliates_v2.sql`                             | ADD `tier` em `affiliates`; cria `affiliate_bonuses`; view `affiliate_ranking`                               | 010                        |
| 012  | `012_affiliates_v3.sql`                             | Refatora `tier` (vendedor/lider); ADD `lider_id`, `lider_comissao` em referrals; view com 2 níveis           | 010, 011                   |
| 013  | `013_affiliates_avatar_city.sql`                    | ADD `avatar_url`, `cidade`, `estado`, `bio` em `affiliates`                                                  | 010–012                    |
| 014  | `014_affiliate_commission_payments.sql`             | Cria `affiliate_commission_payments`; função `approve_affiliate_commission()`                                | 010, 012                   |
| 015  | `015_owner_bootstrap.sql`                           | ADD `role`/`email` em `admin_users`; seed do owner (globemarket7@gmail.com)                                  | `auth.users`               |
| 016  | `016_price_brl_and_tenant_id.sql`                   | ADD `price_brl` em `subscriptions`; ADD `tenant_id` em `restaurants` (backfill c/ próprio id)                | restaurants, subscriptions |
| 017  | `017_affiliate_tiers_sync.sql`                      | 6 tiers reais (trainee→sócio) + `commission_rate` em `affiliates`; DROP+ADD CHECK constraint                 | 010–012                    |
| 018  | `018_unify_bonus_milestones.sql`                    | Atualiza registros PENDENTES de `affiliate_bonuses` para nova escala (marcos 3/10/25/50/100)                 | 011, 017                   |
| 019  | `019_symbolic_bonus_milestones.sql`                 | Reduz valores pendentes para escala simbólica (auditoria financeira)                                         | 011, 017, 018              |
| 020  | `020_fix_bonus_scale.sql`                           | Escala v5 definitiva: 10→R$10, 25→R$25, 50→R$50, 100→R$100                                                   | 011, 017–019               |
| 021  | `021_bonus_fund.sql`                                | Cria `bonus_fund` (FK → `restaurants`, `affiliates`) + view `bonus_fund_saldo`                               | 010, 016                   |
| 022  | `022_fix_affiliates_defaults.sql`                   | Corrige DEFAULT 'trainee' + ADD CONSTRAINT idempotente (fix parcial de 017)                                  | 017                        |

---

## 2. Dependências críticas — ordem obrigatória

```
001 → 002a → 002b → 003 → 004 → 005 → 006
                                          ↓
009 ──────────────────────────────────────+
                                          ↓
010 → 011 → 012 → 013 → 014
  ↓
016 → 017 → 018 → 019 → 020
                              ↓
021 (depende de 010 + 016)
                              ↓
022 (fix de 017 — sempre por último)
```

**Regra:** nunca aplique 017 sem 010+011+012 já estar no banco.  
**Regra:** nunca aplique 021 sem 016 (precisa que `restaurants.id` exista como FK).  
**Regra:** 022 deve ser a última migration de `affiliates` — ela é um fix idempotente.

---

## 3. Como aplicar todas as migrations de uma vez

### Via Supabase CLI (recomendado)

```bash
# 1. Instale o CLI (se não tiver)
npm install -g supabase

# 2. Faça login e link com o projeto
supabase login
supabase link --project-ref SEU_PROJECT_REF

# 3. Aplique todas as migrations pendentes
supabase db push --linked
```

### Via SQL Editor no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard → seu projeto → **SQL Editor**
2. Abra cada arquivo em `supabase/migrations/` na ordem numérica
3. Clique **Run** para cada um

### Via script local (conexão direta)

```bash
# Aplica via psql com a connection string do projeto
psql "$DATABASE_URL" -f supabase/migrations/001_schema_base.sql
psql "$DATABASE_URL" -f supabase/migrations/002_rls_policies.sql
# ... e assim por diante, em ordem
```

---

## 4. Como verificar o estado atual

### Script automatizado (recomendado)

```bash
# Verifica todas as colunas críticas no banco de produção
npx tsx scripts/verify-migrations.ts
```

O script conecta com `SUPABASE_SERVICE_ROLE_KEY`, consulta `information_schema.columns`
e exibe ✅/❌ para cada coluna crítica.

### Via Supabase CLI

```bash
supabase migration list
```

Saída esperada com todas aplicadas:

```
  LOCAL      │ REMOTE │ TIME (UTC)
  ───────────┼────────┼────────────────────────
  20240101…  │ ✔      │ 001_schema_base
  20240101…  │ ✔      │ 002_rls_policies
  ...
  20260315…  │ ✔      │ 022_fix_affiliates_defaults
```

---

## 5. Rollback seguro

| Ambiente     | Estratégia                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| **Local**    | `supabase db reset` — recria tudo do zero a partir das migrations          |
| **Staging**  | `supabase db reset --db-url $STAGING_DB_URL`                               |
| **Produção** | **NUNCA use `db reset`** — faça reversão manual com script SQL de rollback |

### Rollback manual em produção (exemplo para 021)

```sql
-- Reverter migration 021 (bonus_fund)
DROP VIEW  IF EXISTS bonus_fund_saldo;
DROP TABLE IF EXISTS bonus_fund;
```

> ⚠️ Sempre faça backup **antes** de qualquer rollback em produção.

---

## 6. Checklist antes do deploy

```
□ Rodou: npx tsx scripts/verify-migrations.ts  (zero falhas)?
□ Backup do banco feito (Supabase Dashboard → Settings → Backups)?
□ Migrations foram testadas em staging antes de produção?
□ Nenhuma coluna crítica retornou ❌ no verify-migrations?
□ SUPABASE_SERVICE_ROLE_KEY está configurado no Vercel/produção?
```

---

## 7. Tabelas críticas e suas colunas obrigatórias

| Tabela                          | Colunas obrigatórias                                                                                    | Migration       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------- |
| `affiliates`                    | `id`, `user_id`, `code`, `lider_id`, `tier`, `commission_rate`, `avatar_url`, `cidade`, `estado`, `bio` | 010+012+013+017 |
| `affiliate_referrals`           | `id`, `affiliate_id`, `lider_id`, `lider_comissao`, `comissao`                                          | 010+012         |
| `affiliate_bonuses`             | `id`, `affiliate_id`, `nivel`, `valor_bonus`, `status`                                                  | 011             |
| `affiliate_commission_payments` | `id`, `affiliate_id`, `valor`, `chave_pix_usada`                                                        | 014             |
| `bonus_fund`                    | `id`, `tipo`, `valor`, `restaurant_id`, `affiliate_id`                                                  | 021             |
| `restaurants`                   | `id`, `tenant_id`, `template_slug`                                                                      | 002b+016        |
| `subscriptions`                 | `id`, `price_brl`                                                                                       | 016             |
| `template_orders`               | `id`, `metadata`, `payment_id`                                                                          | 003             |

---

## 8. Variáveis de ambiente necessárias

| Variável                        | Onde usar                                                 |
| ------------------------------- | --------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Todos os clientes Supabase (browser + server)             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client browser (leitura pública com RLS)                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | APIs server-side (bypassa RLS — nunca exponha no browser) |

Configure em `.env.local` (dev) e no painel do Vercel (produção).

---

## 9. Notas de manutenção

- **FONTE DA VERDADE para tiers e bônus**: `lib/affiliate-tiers.ts` — não altere valores de comissão em migrations sem atualizar esse arquivo primeiro.
- **002a e 002b têm o mesmo número**: isso não é um erro — ambas são independentes e podem ser aplicadas em qualquer ordem relativa entre si.
- **022 é idempotente**: pode ser rodada várias vezes sem efeito colateral. Útil se 017 tiver sido aplicada parcialmente.
- **`supabase/config.toml` ausente**: o projeto usa Supabase Cloud sem CLI local configurado. Para usar o CLI, rode `supabase init` e `supabase link` primeiro.

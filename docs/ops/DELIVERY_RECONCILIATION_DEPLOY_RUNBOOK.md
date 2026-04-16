# Runbook Executavel - Deploy da Reconciliação de Pagamentos Delivery

Uso: aplicar este procedimento ao liberar o bloco de reconciliação delivery introduzido por:

- [079_delivery_payment_lock_authorization_hardening.sql](supabase/migrations/079_delivery_payment_lock_authorization_hardening.sql)
- [080_delivery_payment_lock_function_owner_hardening.sql](supabase/migrations/080_delivery_payment_lock_function_owner_hardening.sql)
- [081_financial_anomalies_view_access_hardening.sql](supabase/migrations/081_financial_anomalies_view_access_hardening.sql)
- [082_delivery_payment_reconciliation_state.sql](supabase/migrations/082_delivery_payment_reconciliation_state.sql)
- [finalize-delivery-payment.ts](lib/domains/payments/finalize-delivery-payment.ts)

Runbook complementar:

- [DELIVERY_RECONCILIATION_POST_DEPLOY_OBSERVATION_24H.md](docs/ops/DELIVERY_RECONCILIATION_POST_DEPLOY_OBSERVATION_24H.md)

Objetivo: validar deploy, rollback, reconciliação, idempotência e saúde operacional sem depender de memória.

## Modo de Execução

- Execute todos os passos em ordem.
- Não pule etapas nem substitua validações por checagens informais.
- Se qualquer validação crítica falhar, abortar o deploy.
- Registrar evidências dos checks críticos, incluindo comandos, queries e outputs relevantes.

## 0. Pré-condições

Executar a partir da raiz do repositório.

Comandos:

```powershell
git log --oneline -10
git status --short
```

Esperado:

- commits do bloco delivery presentes no topo do histórico
- nenhum stage contaminado com arquivos fora do escopo do deploy

## 1. Validação local obrigatória

### 1.1 Build e teste focado

```powershell
npm run build
node --import tsx --test tests/delivery-payment-reconciliation.test.ts
```

Esperado:

- build concluído sem erro
- 6/6 testes do domínio delivery passando

### 1.2 Compatibilidade reversa do schema

Confirmar manualmente que a migration [082_delivery_payment_reconciliation_state.sql](supabase/migrations/082_delivery_payment_reconciliation_state.sql) é backward-compatible:

- apenas ADD COLUMN
- apenas índices novos
- constraint nova sem remover contrato antigo
- código antigo continua funcionando com colunas novas nulas/default

Go/No-Go:

- se houver alteração destrutiva, parar o deploy

## 2. Pré-deploy de produção

### 2.1 Confirmar estratégia de deploy

Não usar Vercel CLI destrutivo.

Fluxo permitido:

```powershell
git push origin main
```

### 2.2 Confirmar rollback conhecido

Checklist:

- [ ] colunas novas da 082 aceitam nulidade/default
- [ ] código antigo não quebra se as colunas existirem
- [ ] reversão de app pode ocorrer sem precisar remover schema
- [ ] nenhuma migration deste bloco faz DROP/ALTER destrutivo

### 2.3 Confirmar que nenhum job automático já rodou antes da validação manual

Antes de validar a reconciliação, verificar se houve execução automática imediata após deploy.

Pontos de inspeção:

- painel de cron do provedor
- logs da rota [app/api/cron/reconcile-delivery-payments/route.ts](app/api/cron/reconcile-delivery-payments/route.ts)
- logs de domínio associados ao cron

Go/No-Go:

- se o cron já rodou e alterou estado antes da checagem manual, registrar isso antes de seguir

## 3. Validação de banco após deploy

Executar via SQL editor ou query tool do banco.

### 3.1 Confirmar colunas novas

```sql
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'delivery_payments'
  and column_name in (
    'reconciliation_status',
    'reconciliation_attempts',
    'last_reconciliation_at',
    'last_reconciliation_error',
    'last_external_status_snapshot',
    'anomaly_flag',
    'anomaly_code'
  )
order by column_name;
```

### 3.2 Confirmar distribuição inicial de estado

```sql
select
  reconciliation_status,
  count(*) as total
from public.delivery_payments
group by reconciliation_status
order by reconciliation_status;
```

### 3.3 Confirmar registros problemáticos imediatos

```sql
select
  id,
  order_id,
  status,
  reconciliation_status,
  reconciliation_attempts,
  anomaly_flag,
  anomaly_code,
  last_reconciliation_at,
  left(coalesce(last_reconciliation_error, ''), 160) as last_error
from public.delivery_payments
where reconciliation_status <> 'synced'
   or anomaly_flag = true
order by last_reconciliation_at desc nulls last
limit 50;
```

### 3.4 Confirmar saúde resumida do agregado

```sql
select
  count(*) filter (where reconciliation_status = 'synced') as synced_total,
  count(*) filter (where reconciliation_status = 'failed') as failed_total,
  count(*) filter (where reconciliation_status = 'pending') as pending_total,
  count(*) filter (where anomaly_flag = true) as anomaly_total
from public.delivery_payments;
```

## 4. Validação manual controlada da reconciliação

### 4.1 Executar uma reconciliação controlada com limite baixo

Usar token/segredo operacional correto.

Exemplo:

```powershell
curl -i -H "Authorization: Bearer $env:CRON_SECRET" "https://SEU-DOMINIO/api/cron/reconcile-delivery-payments?limit=3"
```

Esperado:

- HTTP 200
- `execution_id` presente
- `status` em `success` ou `partial`
- contadores coerentes

### 4.2 Confirmar que pending não está acumulando sem progresso

```sql
select
  id,
  order_id,
  status,
  reconciliation_status,
  reconciliation_attempts,
  anomaly_code,
  last_reconciliation_at
from public.delivery_payments
where status = 'pending'
order by created_at asc
limit 30;
```

Inspeção:

- registros antigos não podem ficar eternamente em `pending` sem tentativa
- tentativas precisam subir quando há retry

## 5. Idempotência real em produção

Selecionar um registro seguro e reexecutar a finalização para o mesmo pagamento já consolidado.

Critério de aceitação:

- nenhuma mutação duplicada em order
- nenhuma duplicidade de efeito financeiro
- `reconciliation_status` permanece `synced`
- `reconciliation_attempts` não explode sem motivo

Pontos de inspeção:

```sql
select
  id,
  order_id,
  status,
  reconciliation_status,
  reconciliation_attempts,
  anomaly_flag,
  anomaly_code,
  last_reconciliation_at
from public.delivery_payments
where id = 'UUID_DO_PAYMENT';
```

## 6. Verificação de estado preso

### 6.1 Locks operacionais

```sql
select
  id,
  order_id,
  metadata->>'finalizing' as finalizing,
  status,
  reconciliation_status,
  last_reconciliation_at
from public.delivery_payments
where metadata->>'finalizing' = 'true'
order by updated_at desc
limit 20;
```

Esperado:

- zero registros presos com `finalizing = true`

### 6.2 Falhas retryable versus terminais

```sql
select
  anomaly_code,
  reconciliation_status,
  count(*) as total
from public.delivery_payments
where anomaly_code is not null
group by anomaly_code, reconciliation_status
order by total desc, anomaly_code;
```

Inspeção:

- `amount_mismatch` não deve entrar em loop de retry
- falhas retryable devem aparecer com tentativas controladas

## 7. Observabilidade mínima obrigatória

### 7.1 Audit trail crítico

```sql
select
  action,
  created_at,
  resource_id,
  left(cast(metadata as text), 200) as metadata_preview
from public.audit_logs
where action in (
  'delivery_payment_finalize_approved',
  'delivery_payment_finalize_rejected',
  'delivery_payment_reconciliation_failed'
)
order by created_at desc
limit 50;
```

### 7.2 View de anomalias financeiras backend-only

Executar com contexto operacional seguro.

```sql
select anomaly_type, severity, reference_id, detected_at
from public.financial_anomalies
order by detected_at desc
limit 20;
```

Esperado:

- consulta disponível apenas para contexto backend/service_role
- nenhuma exposição indevida para uso autenticado comum

## 8. Regras de Go/No-Go

Liberar produção somente se todos os itens abaixo estiverem verdadeiros:

- build local aprovado
- teste focado do domínio delivery aprovado
- migration 082 aplicada sem regressão estrutural
- rollback por código antigo continua possível
- cron não disparou silenciosamente antes da validação manual, ou foi auditado
- reconciliação controlada responde 200 e contadores coerentes
- `finalizing = true` não fica preso
- `synced`, `failed` e `pending` possuem contagem compreensível
- idempotência real não gera mutação duplicada
- falhas críticas deixam estado persistido em `delivery_payments`, não só log

Bloquear deploy se qualquer um destes ocorrer:

- order confirmada com payment em estado divergente
- payment aprovado com `reconciliation_status = failed` sem trilha clara
- crescimento de `pending` sem avanço após cron manual
- erro de permissão nas RPCs de lock
- retry acontecendo sobre `amount_mismatch`

## 9. Registro final da validação

Preencher ao final:

- Data/hora da validação:
- Responsável:
- Commit validado:
- Resultado final: PASS ou FAIL
- Observações operacionais:

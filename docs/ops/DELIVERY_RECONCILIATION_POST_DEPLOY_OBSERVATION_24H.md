# Modo Observação - Primeiras 24h da Reconciliação Delivery

Uso: executar após o deploy do bloco de reconciliação delivery para validar convergência real do sistema em produção.

Escopo:

- [082_delivery_payment_reconciliation_state.sql](supabase/migrations/082_delivery_payment_reconciliation_state.sql)
- [finalize-delivery-payment.ts](lib/domains/payments/finalize-delivery-payment.ts)
- [DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md](docs/ops/DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md)

Objetivo: sair do modo "deploy concluído" para o modo "sistema observado sob carga real".

## Modo de Execução

- Execute os checks na ordem.
- Registre outputs e horários das consultas críticas.
- Se qualquer invariante quebrar, tratar como incidente real.
- Não improvisar comandos fora deste roteiro durante a janela crítica.

## Janela Operacional

- 0-1h após deploy: atenção alta
- 1-6h após deploy: monitoramento ativo
- 6-24h após deploy: verificação periódica

## Sequência de Observação

### 1. Distribuição geral de estado

```sql
select
  reconciliation_status,
  count(*) as total
from public.delivery_payments
group by reconciliation_status
order by reconciliation_status;
```

Leitura esperada:

- maioria em `synced`
- `pending` baixo e em queda
- `failed` controlado e explicável

### 2. Anomalias ativas

```sql
select
  anomaly_code,
  count(*) as total
from public.delivery_payments
where anomaly_flag = true
group by anomaly_code
order by total desc, anomaly_code;
```

Leitura esperada:

- nenhuma concentração abrupta em um único `anomaly_code`
- crescimento repentino indica falha sistêmica, não caso isolado

### 3. Casos presos em pending

```sql
select
  id,
  order_id,
  status,
  reconciliation_status,
  reconciliation_attempts,
  updated_at,
  last_reconciliation_at,
  anomaly_code
from public.delivery_payments
where reconciliation_status = 'pending'
  and updated_at < now() - interval '15 minutes'
order by updated_at asc;
```

Interpretação:

- se isso crescer, o cron não está consumindo direito ou a elegibilidade ficou errada
- `pending` velho é sintoma operacional, não ruído

### 4. Falhas recentes

```sql
select
  id,
  order_id,
  anomaly_code,
  reconciliation_attempts,
  last_reconciliation_at,
  left(coalesce(last_reconciliation_error, ''), 240) as last_error
from public.delivery_payments
where reconciliation_status = 'failed'
order by updated_at desc
limit 20;
```

Leitura esperada:

- falhas agrupadas por causa conhecida
- ausência de erro genérico recorrente sem explicação

### 5. Verificação de convergência entre pagamento e pedido

```sql
select
  dp.id as delivery_payment_id,
  dp.order_id,
  dp.status as delivery_payment_status,
  dp.reconciliation_status,
  o.status as order_status,
  dp.updated_at as payment_updated_at,
  o.updated_at as order_updated_at
from public.delivery_payments dp
join public.orders o on o.id = dp.order_id
where
  (dp.status = 'approved' and o.status <> 'confirmed')
  or
  (dp.status = 'rejected' and o.status not in ('cancelled', 'confirmed'));
```

Critério:

- esta query deve retornar zero linhas
- qualquer linha aqui é divergência real entre agregado financeiro-operacional e pedido

## Thresholds Operacionais

Usar como critério simples nas primeiras 24h:

- `failed > 5%` do total observado: investigar imediatamente
- `pending > 10%` do total observado: investigar cron, lock e gateway
- qualquer divergência entre `delivery_payments` e `orders`: parar e avaliar rollback

Query de apoio:

```sql
select
  count(*) as total,
  count(*) filter (where reconciliation_status = 'synced') as synced_total,
  count(*) filter (where reconciliation_status = 'failed') as failed_total,
  count(*) filter (where reconciliation_status = 'pending') as pending_total,
  round(100.0 * count(*) filter (where reconciliation_status = 'failed') / nullif(count(*), 0), 2) as failed_pct,
  round(100.0 * count(*) filter (where reconciliation_status = 'pending') / nullif(count(*), 0), 2) as pending_pct
from public.delivery_payments;
```

## Teste Manual Único de Idempotência

Executar uma vez após deploy, em um pagamento real e controlado.

Procedimento:

1. Rodar `finalizeDeliveryPayment` manualmente para um registro elegível ou já consolidado.
2. Rodar novamente para o mesmo registro.
3. Comparar estado antes e depois.

Critérios de aceitação:

- nenhuma mutação duplicada no pedido
- nenhuma duplicidade de efeito financeiro
- `reconciliation_status` continua coerente
- `reconciliation_attempts` não cresce sem necessidade

Query de inspeção:

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
  updated_at
from public.delivery_payments
where id = 'UUID_DO_PAYMENT';
```

## Critérios Objetivos de Rollback

Fazer rollback sem hesitar se ocorrer qualquer um destes cenários:

- divergência entre `delivery_payments` e `orders`
- crescimento contínuo de `failed` sem estabilização
- cron não reduz fila de `pending`
- erro de permissão nas RPCs de lock
- retry sobre falha terminal como `amount_mismatch`

## Leitura Comportamental do Sistema

Pergunta central:

- o sistema converge sozinho para `synced`?

Interpretação:

- sistema saudável: tendência clara de convergência para `synced`
- sistema degradado: acumula `pending`
- sistema quebrado: transforma `pending` em `failed` continuamente ou diverge pedido/pagamento

## Registro da Janela de Observação

Preencher ao final das primeiras 24h:

- horário inicial da observação:
- horário final da observação:
- responsável:
- commit em produção:
- total observado:
- pico de `pending`:
- pico de `failed`:
- divergências encontradas:
- decisão final: estável / investigar / rollback

## Decisão Final (24h)

- Status: GO | INVESTIGAR | ROLLBACK
- Motivo:
- Evidências (queries / outputs):
- Responsável:
- Timestamp:

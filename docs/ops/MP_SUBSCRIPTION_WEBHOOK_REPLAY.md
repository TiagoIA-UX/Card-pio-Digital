# Replay Controlado do Webhook de Assinatura MP

Objetivo: validar a Fase 3 com payload assinado no formato real do Mercado Pago, sem depender de mocks da suite interna.

## Pre-requisitos

1. A aplicacao deve estar rodando no alvo que voce quer validar.
2. O ambiente do alvo precisa ter `MP_WEBHOOK_SECRET` configurado.
3. Para eventos `subscription_preapproval` ou `preapproval`, use um `mp_preapproval_id` real existente no sandbox do MP.
4. Para consultas remotas no banco, use [scripts/query-remote-sql.ps1](scripts/query-remote-sql.ps1).

## Script de replay

Use [scripts/replay-mp-subscription-webhook.ts](scripts/replay-mp-subscription-webhook.ts). Ele:

- gera `x-signature` no mesmo formato validado pela rota
- envia payload com `event.id` e `data.id` no shape real do MP
- imprime o `curl.exe` equivalente antes do envio
- mostra as queries de verificacao no final

Exemplo base:

```powershell
npx tsx scripts/replay-mp-subscription-webhook.ts \
  --event-type subscription_preapproval \
  --resource-id 2c938084726fca480172750000000000
```

## Cenarios obrigatorios

### 1. Fluxo normal

Envie o evento enquanto a preapproval ainda estiver `pending` ou `trial`, e repita depois que o MP a tiver promovido para `authorized`.

```powershell
npx tsx scripts/replay-mp-subscription-webhook.ts \
  --event-type subscription_preapproval \
  --resource-id <mp_preapproval_id_real> \
  --event-id 701000001

npx tsx scripts/replay-mp-subscription-webhook.ts \
  --event-type subscription_preapproval \
  --resource-id <mp_preapproval_id_real> \
  --event-id 701000002
```

Resultado esperado no banco:

- `webhook_events`: duas linhas `processed`, `resource_type = preapproval`
- `subscriptions`: `last_event_id = '701000002'`
- `subscriptions.status`: primeiro `pending` ou `trial`, depois `active`

### 2. Fora de ordem

Este caso exige honestidade operacional: a rota deriva estado do snapshot atual de `/preapproval/{id}`. Reenviar um payload historico `pending` depois que a assinatura ja estiver `authorized` nao reproduz o estado antigo; o MP atual vai responder `authorized` de novo.

Por isso, ha duas formas validas de provar este caso:

1. Replay vivo em duas janelas reais do MP: capture um evento quando a preapproval ainda estiver `pending` e outro depois de `authorized`, depois reenvie em ordem invertida enquanto o snapshot ainda preserva os estados desejados.
2. Prova controlada da monotonicidade via SQL/RPC com ranks diferentes, se o objetivo for validar apenas a regra de regressao.

Se voce insistir em replay HTTP puro, o resultado esperado e este:

- `webhook_events`: o segundo envio entra como `processed` ou `duplicate`, conforme o `event.id`
- `subscriptions`: nunca pode regredir `last_event_status_rank`
- Se a RPC realmente receber rank menor, `ignored_reason` esperado: `out_of_order_state_regression`

### 3. Duplicado

Repete exatamente o mesmo `event.id` duas vezes.

```powershell
npx tsx scripts/replay-mp-subscription-webhook.ts \
  --event-type subscription_preapproval \
  --resource-id <mp_preapproval_id_real> \
  --event-id 701000003 \
  --repeat 2
```

Resultado esperado no banco:

- `webhook_events`: uma unica linha para `event_id = '701000003'`
- segunda resposta HTTP com `duplicate: true`
- `subscriptions.last_event_id` nao muda na segunda chamada

### 4. Pagamento isolado

Esse caso nao precisa de `preapproval_id` real porque o handler nao consulta `/preapproval/{payment_id}`.

```powershell
npx tsx scripts/replay-mp-subscription-webhook.ts \
  --event-type subscription_authorized_payment \
  --resource-id 99123456789 \
  --event-id 701000004
```

Resultado esperado no banco:

- `webhook_events`: `status = skipped`
- `webhook_events.ignored_reason = 'payment_event_not_authoritative'`
- `webhook_events.resource_type = 'payment'`
- `subscriptions`: nenhuma mudanca de estado

## Queries de verificacao

Eventos:

```sql
SELECT event_id, event_type, status, ignored_reason, resource_type
FROM webhook_events
ORDER BY created_at DESC;
```

Assinatura:

```sql
SELECT status, last_event_id, last_event_status, last_event_status_rank, last_value_validation_error
FROM subscriptions
WHERE mp_preapproval_id = '<mp_preapproval_id_real>';
```

Erro financeiro intencional:

```sql
SELECT mp_preapproval_id, contracted_monthly_amount, last_value_validation_error, last_value_validated_at
FROM subscriptions
WHERE mp_preapproval_id = '<mp_preapproval_id_real>';
```

## Forcando mismatch de valor

Para provar `amount_mismatch`, use uma preapproval sandbox cujo `transaction_amount` no MP esteja diferente de `subscriptions.contracted_monthly_amount`. Depois reenvie um evento `subscription_preapproval` para o mesmo `mp_preapproval_id`.

Resultado esperado:

- resposta HTTP de erro
- `subscriptions.last_value_validation_error = 'amount_mismatch'`
- `webhook_events.status = failed`

## Consulta remota pronta

Exemplo com [scripts/query-remote-sql.ps1](scripts/query-remote-sql.ps1):

```powershell
.\scripts\query-remote-sql.ps1 -Sql "SELECT event_id, event_type, status, ignored_reason, resource_type FROM webhook_events ORDER BY created_at DESC LIMIT 20;"
```

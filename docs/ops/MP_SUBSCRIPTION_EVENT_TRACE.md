# Trace Ponta a Ponta de Eventos Reais MP

Uso: analisar 3 a 5 eventos reais como se fossem incidente, seguindo payload recebido, trilha em `webhook_events` e reflexo final em `subscriptions`.

Escopo:

- [scripts/trace-mp-subscription-events.ps1](scripts/trace-mp-subscription-events.ps1)
- [scripts/query-remote-sql.ps1](scripts/query-remote-sql.ps1)
- [docs/ops/MP_SUBSCRIPTION_STAGING_OBSERVABILITY_24H.md](docs/ops/MP_SUBSCRIPTION_STAGING_OBSERVABILITY_24H.md)

## Objetivo

Responder objetivamente a pergunta mais importante da Fase 3:

> Existe algum evento que deveria ter atualizado estado e nao atualizou?

## Como escolher os eventos

Pegue 3 a 5 casos reais da janela de staging com perfis diferentes:

- um `subscription_preapproval` que levou a `active`
- um duplicado real ou replay controlado
- um `subscription_authorized_payment`
- um caso `skipped`
- um caso `failed`, se existir

Selecao recomendada para nao cair em leitura superficial:

- um fluxo feliz `pending/trial -> active`
- um `duplicate_event_id`
- um `out_of_order_state_regression`
- um `subscription_authorized_payment`
- um `failed`, se existir em fluxo real

## Comandos

Por `event_id`:

```powershell
.\scripts\trace-mp-subscription-events.ps1 -EventIds 701000001,701000002,701000003
```

Por `resource_id`:

```powershell
.\scripts\trace-mp-subscription-events.ps1 -ResourceId 2c938084726fca480172750000000000 -Limit 5
```

Para inspecionar a query antes:

```powershell
.\scripts\trace-mp-subscription-events.ps1 -ResourceId 2c938084726fca480172750000000000 -PrintOnly
```

## O que validar em cada linha

### 1. Payload recebido

- `event_type` coerente com `resource_type`
- `resource_id` coerente com o tipo do evento
- `provider_event_created_at` plausivel
- `event_id` consistente e rastreavel

### 2. Trilha em `webhook_events`

- `webhook_status` sempre final: `processed`, `skipped` ou `failed`
- `processed_at` sempre preenchido quando o status e final
- `ignored_reason` explica claramente os `skipped`
- `error_message` explica claramente os `failed`

Se qualquer um destes itens falhar, tratar como bug de observabilidade antes de discutir Fase 4.

### 3. Reflexo em `subscriptions`

- para `subscription_preapproval`, `last_event_id` deve refletir o evento autoritativo mais recente
- `last_event_status_rank` nao pode regredir
- `last_value_validation_error` deve estar nulo em fluxo normal
- `subscription_status` e `mp_subscription_status` devem ser coerentes entre si

Para eventos aplicados, validar explicitamente:

- `last_event_id == event_id`
- `last_event_status` atualizado
- `updated_at` coerente com `last_event_at`

Para eventos ignorados, validar explicitamente:

- nenhuma alteracao indevida em `subscription_status`
- `last_event_id` nao sobrescrito indevidamente

### 4. Decisao de processamento

Voce precisa conseguir responder sem inferencia:

> Por que esse evento foi aplicado, ignorado ou falhou?

As unicas fontes validas para responder isso sao:

- `ignored_reason`
- `error_message`
- `last_event_status_rank`
- `contract_hash`
- validacao financeira

Se a explicacao depender de "acho que", o trace nao esta suficiente para liberar Fase 4.

### 5. Coerencia temporal

Validar sempre:

- `provider_event_created_at` plausivel para o evento recebido
- `last_event_at` coerente com o evento aplicado
- a protecao de regressao e explicada por rank, nao por timestamp

Se houver regressao aceita por timestamp em vez de rank, tratar como bug estrutural.

### 4. Consistencia ponta a ponta

Bloqueia Fase 4 se qualquer um destes acontecer em fluxo real:

- evento recebido sem desfecho final
- `resource_type` inconsistente com `event_type`
- evento autoritativo recebido mas sem reflexo em `subscriptions`
- `subscription_authorized_payment` alterando estado da assinatura
- `subscription_not_found` ou `amount_mismatch`

## Leitura correta dos casos de teste

Nao contam contra o gate quando forem induzidos e devidamente identificados:

- `duplicate_event_id`
- `out_of_order_state_regression`
- `payment_event_not_authoritative`

Contam contra o gate quando surgem no fluxo natural sem causa explicada:

- `subscription_not_found`
- `amount_mismatch`
- qualquer evento sem status final

## Resultado esperado de um sistema verde

Para os 3 a 5 eventos inspecionados, voce deve conseguir explicar causalmente:

- o que o MP enviou
- o que foi gravado em `webhook_events`
- por que a RPC aplicou, ignorou ou falhou
- qual foi o estado final refletido em `subscriptions`

Se algum desses elos nao puder ser explicado so com banco e payload, o sistema ainda nao esta auditavel o suficiente para Fase 4.

Pergunta final obrigatoria do trace:

> Se eu apagasse os logs e ficasse so com banco + payload, eu entenderia exatamente o que aconteceu?

Se a resposta for nao, o gate da Fase 4 continua fechado.
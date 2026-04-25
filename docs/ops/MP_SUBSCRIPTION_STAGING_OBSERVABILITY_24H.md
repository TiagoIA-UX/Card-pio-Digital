# Observabilidade Staging - Primeiras 24h do Webhook de Assinatura MP

Uso: executar apos ativar o shadow de recorrencia em staging para validar comportamento vivo do pipeline da Fase 3.

Escopo:

- [app/api/webhook/subscriptions/route.ts](app/api/webhook/subscriptions/route.ts)
- [lib/domains/core/mercadopago-webhook-processing.ts](lib/domains/core/mercadopago-webhook-processing.ts)
- [docs/ops/MP_SUBSCRIPTION_WEBHOOK_REPLAY.md](docs/ops/MP_SUBSCRIPTION_WEBHOOK_REPLAY.md)
- [docs/ops/MP_SUBSCRIPTION_ALERT_QUERIES.sql](docs/ops/MP_SUBSCRIPTION_ALERT_QUERIES.sql)
- [scripts/run-mp-subscription-alert-checks.ps1](scripts/run-mp-subscription-alert-checks.ps1)

Objetivo: sair do modo "replay controlado passou" para o modo "o sistema converge sozinho com trafego real do provider".

## Condicao de Entrada

- staging com `ENABLE_PREAPPROVAL_SHADOW_WRITE=true`
- rota de webhook publicada e respondendo
- `MP_WEBHOOK_SECRET` configurado no ambiente
- pelo menos um `mp_preapproval_id` real existente na base para observacao

## Janela Operacional

- 0-1h: observacao continua
- 1-6h: checagem a cada 30 minutos
- 6-24h: checagem a cada 2 horas

## Invariantes Que Nao Podem Quebrar

- nenhum evento fica sem `status` em `webhook_events`
- nenhum evento com erro fica sem `error_message`
- `processed_at` sempre preenchido para `processed`, `skipped` e `failed`
- `subscriptions.last_event_status_rank` nunca diminui
- `subscription_authorized_payment` nunca altera `subscriptions.status`
- `last_value_validation_error` so aparece quando ha divergencia real

## Sequencia de Observacao

### 1. Saude geral do pipeline

Rode:

```powershell
.\scripts\run-mp-subscription-alert-checks.ps1 -Check summary
```

Leitura esperada:

- maioria dos eventos em `processed`
- `failed` explicavel e baixo
- `skipped` concentrado em `payment_event_not_authoritative` ou casos reais de protecao

### 2. Eventos falhos recentes

Rode:

```powershell
.\scripts\run-mp-subscription-alert-checks.ps1 -Check failed-events
```

Leitura esperada:

- `error_message` sempre preenchido
- ausencia de repeticao massiva de um mesmo erro
- nenhum `subscription_not_found` em volume crescente apos o sistema estabilizar

### 3. Pagamentos isolados tratados corretamente

Rode:

```powershell
.\scripts\run-mp-subscription-alert-checks.ps1 -Check isolated-payments
```

Leitura esperada:

- `resource_type = payment`
- `status = skipped`
- `ignored_reason = payment_event_not_authoritative`

### 4. Regressao de estado fora de ordem

Rode:

```powershell
.\scripts\run-mp-subscription-alert-checks.ps1 -Check regressions
```

Leitura esperada:

- zero linhas em `subscriptions` com regressao materializada
- se houver protecao acionada, motivo esperado em `webhook_events`: `out_of_order_state_regression`

### 5. Divergencia financeira

Rode:

```powershell
.\scripts\run-mp-subscription-alert-checks.ps1 -Check validation-errors
```

Leitura esperada:

- zero linhas em operacao normal
- se houver teste controlado de mismatch, valor esperado: `amount_mismatch`

### 6. Assinaturas sem vinculo local

Rode:

```powershell
.\scripts\run-mp-subscription-alert-checks.ps1 -Check missing-subscriptions
```

Leitura esperada:

- zero linhas apos estabilizacao inicial
- qualquer crescimento indica perda de ancora local ou webhook vindo para recurso nao persistido

## Thresholds de Alerta

Tratar como incidente se ocorrer qualquer um destes:

- mais de 5% dos eventos em `failed` nas ultimas 24h
- qualquer linha com `status` nulo em `webhook_events`
- qualquer linha com `status = 'failed'` e `error_message` nulo
- qualquer assinatura com `last_event_status_rank` menor que o rank do estado anterior conhecido
- mais de 3 ocorrencias de `subscription_not_found` em 1h
- qualquer `amount_mismatch` fora de teste controlado

## Criterios Objetivos Para Liberar Fase 4

Liberar provisionamento automatico so se todos os itens abaixo estiverem verdadeiros:

- 24h sem regressao materializada de estado
- 24h sem `amount_mismatch` inesperado
- duplicatas tratadas sem mutacao adicional em `subscriptions`
- pagamentos isolados sempre `skipped` com motivo correto
- zero `subscription_not_found` nas ultimas 12h
- nenhuma linha em `webhook_events` sem `processed_at` nas ultimas 24h
- pelo menos 1 ciclo real completo observado: `pending/trial -> active`

## Gate Final

PASS quando:

- todos os checks acima estao verdes
- nao ha erro silencioso
- a trilha no banco explica todos os eventos observados

FAIL quando:

- existe qualquer inconsistencia nao explicada entre `webhook_events` e `subscriptions`
- a equipe precisa olhar log para entender evento que o banco nao explica sozinho

## Registro da Janela

- horario inicial:
- horario final:
- ambiente:
- responsavel:
- total de eventos observados:
- total de falhas:
- total de skips:
- divergencias encontradas:
- decisao final: liberar fase 4 / manter em observacao / bloquear

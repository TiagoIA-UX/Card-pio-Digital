# Checklist de Execução - Dia do Deploy da Reconciliação Delivery

Uso: folha única de orquestração do dia do deploy.

Este documento não substitui os runbooks. Ele apenas encadeia a execução e força decisões objetivas.

Referências:

- [DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md](docs/ops/DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md)
- [DELIVERY_RECONCILIATION_POST_DEPLOY_OBSERVATION_24H.md](docs/ops/DELIVERY_RECONCILIATION_POST_DEPLOY_OBSERVATION_24H.md)

## Modo de Uso

- Executar em ordem.
- Marcar cada passo como PASS ou FAIL.
- Se qualquer passo crítico falhar, interromper a liberação.
- Não usar esta folha para improvisar; usar os runbooks vinculados.

## Identificação da Execução

- Data:
- Responsável:
- Commit em produção:
- Ambiente:

## Sequência do Dia do Deploy

### 1. Pré-validação local

- Rodar o bloco 1 do [DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md](docs/ops/DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md)
- Resultado: PASS | FAIL
- Evidência:

### 2. Pré-deploy e rollback

- Rodar o bloco 2 do [DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md](docs/ops/DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md)
- Resultado: PASS | FAIL
- Evidência:

### 3. Aplicação do deploy

- Executar o deploy pelo fluxo aprovado
- Resultado: PASS | FAIL
- Evidência:

### 4. Validação imediata de banco e cron

- Rodar os blocos 3 e 4 do [DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md](docs/ops/DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md)
- Resultado: PASS | FAIL
- Evidência:

### 5. Idempotência e estado preso

- Rodar os blocos 5 e 6 do [DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md](docs/ops/DELIVERY_RECONCILIATION_DEPLOY_RUNBOOK.md)
- Resultado: PASS | FAIL
- Evidência:

### 6. Decisão de liberação imediata

- Liberar sistema: SIM | NÃO
- Motivo:
- Responsável:
- Timestamp:

### 7. Início da observação 24h

- Iniciar [DELIVERY_RECONCILIATION_POST_DEPLOY_OBSERVATION_24H.md](docs/ops/DELIVERY_RECONCILIATION_POST_DEPLOY_OBSERVATION_24H.md)
- Resultado inicial: OK | INVESTIGAR
- Observação inicial:

## Gate Final do Dia do Deploy

Condição mínima para encerrar o deploy como bem-sucedido:

- validação local aprovada
- rollback compreendido
- cron validado
- idempotência validada
- nenhuma divergência entre `delivery_payments` e `orders`
- observação 24h iniciada formalmente

## Resultado Consolidado

- Status do dia: PASS | FAIL
- Próxima ação: OPERAR | INVESTIGAR | ROLLBACK
- Responsável:
- Timestamp:

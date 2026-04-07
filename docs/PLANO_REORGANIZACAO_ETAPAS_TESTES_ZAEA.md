# PLANO DE REORGANIZAÇÃO POR ETAPAS COM TESTES E DETECÇÃO ZAEA

> Objetivo: continuar a reorganização do código sem abrir frentes demais ao mesmo tempo, com gate explícito de testes em cada etapa e integração do ZAEA para detectar falhas críticas durante a transição.

---

## 1. Estado atual consolidado

### Etapa 1 já concluída

- checkout de onboarding extraído da rota HTTP para `lib/domains/core/onboarding-checkout-creation.ts`
- schema e contrato do fluxo centralizados no domínio core
- `app/api/pagamento/iniciar-onboarding/route.ts` reduzida a borda fina
- build validado após a extração

### Etapa 2 iniciada nesta rodada

- webhook Mercado Pago passou a ter integração explícita com detecção ZAEA para falhas críticas
- nova camada de monitoramento dedicada criada no domínio core
- teste unitário da montagem de incidente adicionado

---

## 2. Regra de execução para as próximas etapas

Cada etapa só é considerada concluída quando passa por quatro pontos:

1. redução objetiva de responsabilidade em um ponto crítico
2. teste novo cobrindo a etapa extraída
3. build ou suíte direcionada validada
4. detecção operacional integrada ao ZAEA ou ao trilho de alertas existente

---

## 3. Sequência recomendada

### Etapa 2 — Monitoramento e borda do webhook

Foco:

- capturar falhas críticas do webhook
- abrir trilha em `system_alerts`
- despachar tarefa para o agente `sentinel`

Gate de teste:

- `tests/mercadopago-webhook-monitoring.test.ts`

### Etapa 3 — Extrair pipeline de provisionamento do webhook

Foco:

- separar recebimento do evento
- separar sincronização de checkout session
- separar provisionamento do delivery
- separar pós-efeitos: notificação, fiscal e ativação

Gate de teste:

- expandir testes de `mercadopago-webhook-processing`
- criar testes focados no pipeline de onboarding aprovado

### Etapa 4 — Encerrar duplicidade entre `services/` e `lib/domains/`

Foco:

- migrar regras relevantes de `services/*.service.ts` para contratos do domínio
- manter `services/` apenas se virar adapter fino

Gate de teste:

- testes dos contratos migrados
- regressão dos fluxos de painel e assinatura

### Etapa 5 — Afinar páginas com regra comercial demais

Foco:

- remover cálculo e decisão de negócio de páginas como `/painel/planos`
- deixar a página como composição de UI + chamadas de domínio

Gate de teste:

- testes de planos, pricing e navegação de painel

---

## 4. Integração ZAEA nesta estratégia

O ZAEA entra como trilha de detecção e triagem, não como auto-fix em produção.

Uso recomendado por etapa:

- `sentinel`: detectar falhas críticas e abrir tarefa de investigação
- `scanner`: analisar recorrência e padrões semelhantes após incidentes repetidos
- `validator`: validar patch e regressão antes de considerar a etapa encerrada

Princípio operacional:

- borda crítica falhou → registrar alerta → despachar tarefa ZAEA → corrigir com teste antes de seguir para a próxima etapa

---

## 5. Varredura atual de docs

### Mantidos como canônicos

- `docs/EBOOK_TESTES_MANUAIS_MOBILE.md` para execução humana dos testes
- `docs/REVISAO_ARQUITETURAL_PADRAO_ZAEA.md` para diagnóstico arquitetural
- `docs/PLANO_ISOLAMENTO_DOMINIOS.md` como visão estrutural alvo

### Limpeza já aplicada

- remoção do guia redundante de testes manuais
- remoção do PDF duplicado dentro de `docs/`
- remoção do arquivo antigo de personas/testes que competia com o ebook novo
- ainda havia duplicidade visível no índice do README, corrigível sem impacto funcional

### Critério para novas limpezas

Só remover documentação quando houver sobreposição direta de função. Documentos de escopo diferente, mesmo com tema parecido, devem permanecer.

# Diretrizes de Operação para 300 Canais

Este documento consolida a direção operacional que o ecossistema ZAEA precisa seguir para suportar crescimento com baixo ruído, baixa dependência manual e automação segura.

## Princípios

- Monitorar sintomas de impacto real no usuário antes de monitorar causas especulativas.
- Tratar alertas críticos com poucas regras, simples e confiáveis.
- Separar page, ticket e relatório. Nem todo problema deve interromper humano.
- Automatizar apenas respostas roteirizáveis, reversíveis e auditáveis.
- Operar pipelines e observabilidade como código, com regras padronizadas.

## Buckets operacionais

- `CRITICAL`: login, checkout, pagamento, provisionamento, ativação.
- `HIGH_FAST`: APIs interativas do painel e do site público com baixa tolerância a latência.
- `HIGH_SLOW`: geração de relatórios, auditorias, jobs de imagem e validações longas.
- `LOW`: rotinas internas, sincronizações não visíveis ao cliente.
- `NO_SLO`: sandboxes e fluxos experimentais isolados.

## Camadas que precisam de alerta próprio

- `edge`: domínio, DNS, TLS, CDN, uptime externo, páginas essenciais.
- `app`: erro HTTP, latência, filas de tarefas, build quebrado, deploy com regressão.
- `data`: banco, conexões, crescimento, queries lentas, RLS, políticas permissivas.
- `agents`: scanner, surgeon, validator, sentinel, pipeline de imagens, tarefas presas.
- `channels`: Telegram, WhatsApp, webhooks, integrações externas, provedores de IA.
- `housekeeping`: cache, artefatos transitórios, relatórios antigos, limpeza segura.

## Alertas recomendados

- `page`: burn rate alto em janela curta ou falha total de canal crítico.
- `page`: falha em login, checkout, webhook de pagamento, provisionamento ou API health.
- `ticket`: degradação sustentada em janelas longas sem impacto imediato.
- `ticket`: crescimento de banco, backlog de alertas, falhas repetidas de agentes.
- `relatório`: tendências, uso de capacidade, conhecimento novo, housekeeping.

## Automação segura

- Auto-correção só para tarefas com rollback simples e impacto contido.
- Toda correção automática precisa registrar causa, ação, resultado e confiança.
- Bloquear automação destrutiva em pagamentos, migrations e dados de clientes.
- Housekeeping automático deve atuar apenas em cache e artefatos descartáveis.
- Mudanças mais arriscadas devem abrir PR, não alterar produção diretamente.

## Requisitos para escalar

- Padronizar SLOs por bucket, não por rota isolada, para evitar explosão de regras.
- Usar visão combinada de black-box e white-box.
- Adotar janelas múltiplas para alertas, reduzindo ruído e reset lento.
- Usar rollout em ondas e bake time para mudanças de maior risco.
- Manter dashboards executivos e operacionais distintos.
- Criar suppressions claras para evitar tempestade de alertas em cadeia.

## O que já existe

- Sentinel com scan contínuo e envio Telegram.
- Workflow ZAEA com scanner, surgeon, notifier e validator.
- Base de conhecimento com registro de padrões e ocorrências.
- Housekeeping seguro no backend Python para cache e artefatos transitórios.
- Menu operacional enriquecido no bot para visão, alertas, agentes e limpeza.

## O que ainda falta

- Alertas realmente modelados por camada com SLO e burn rate.
- Auto-remediação por playbooks específicos de cada camada.
- Bloqueadores temporais e de janela operacional para mudanças sensíveis.
- Segmentação explícita para centenas de canais com waves e prioridades.
- Painel consolidado de capacidade por bucket, canal e domínio de falha.

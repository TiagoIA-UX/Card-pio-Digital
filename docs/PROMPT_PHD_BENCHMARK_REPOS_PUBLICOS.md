# PROMPT PHD - Benchmark de Repos Publicos Validados para Cardapio Digital

Voce e um arquiteto principal de software, produto e operacoes com nivel PhD, especializado em SaaS multi-tenant, e-commerce, sistemas de restaurante, cardapio digital, pagamentos, compliance, engenharia reversa de produto, benchmarking tecnico e migracao segura de arquitetura.

Sua tarefa e conduzir uma analise profunda, pragmatica e executiva para o projeto Cardapio Digital, usando apenas repositorios publicos com sinais reais de maturidade. O objetivo nao e copiar cegamente codigo. O objetivo e identificar o que ja foi validado pelo mercado e pela comunidade, extrair os padroes corretos, evitar reinvencao desnecessaria e propor uma estrategia de reaproveitamento seguro.

## Contexto do nosso produto

Temos um SaaS de cardapio digital com foco em restaurantes, pizzarias e operacao via WhatsApp. O sistema atual possui ou pretende consolidar as seguintes capacidades:

- landing page comercial e fluxo de compra
- checkout e liberacao de acesso por pagamento aprovado
- painel autenticado do cliente
- criacao e configuracao de restaurante
- cardapio publico por slug/link
- gestao de produtos, categorias e customizacao
- fluxo de templates
- vinculo correto entre compra, pedido, restaurante provisionado e painel
- operacao multi-tenant
- pedidos via WhatsApp
- trilha de onboarding e ativacao
- controle de acesso comercial, nao apenas autenticacao

## Premissas obrigatorias

1. Use apenas repositorios publicos com sinais concretos de validacao minima, como combinacao de:

- licenca explicita
- historico recente de manutencao
- stars ou adocao relevante para o nicho
- documentacao utilizavel
- estrutura de testes, CI, seguranca ou praticas maduras de engenharia

2. Nao considere como referencia principal repositorios claramente academicos, tutoriais, UI kits, landing pages ou projetos marcados como work in progress, exceto se forem usados apenas como referencia secundaria de UX.

3. Nao recomende copia literal de sistema como forma de eliminar auditoria, QA ou testes.

4. Explique explicitamente riscos legais, tecnicos e operacionais de copiar codigo de terceiros.

5. Diferencie claramente:

- copiar codigo
- reutilizar padroes de arquitetura
- adaptar fluxos validados
- reimplementar modulos com base em benchmarking

6. Se houver licencas copyleft como GPL ou AGPL, explique o impacto para uso comercial e distribuicao do nosso SaaS.

7. Priorize repositorios com aderencia funcional ao nosso problema. Se nao houver iguais, aceite equivalentes por capacidades:

- online ordering
- digital menu
- QR menu
- public menu publishing
- restaurant admin
- order management
- table management
- subscription/billing
- multi-tenant routing
- onboarding de negocio

## Repositorios a investigar primeiro

Comece obrigatoriamente por estes candidatos, validando se realmente servem como benchmark:

1. tastyigniter/TastyIgniter
2. alphabit-technology/erpnext-restaurant
3. olasunkanmi-SE/restaurant

Se algum deles nao servir como benchmark principal, explique tecnicamente por que.

## Perguntas que voce deve responder

1. Existem sistemas publicos com funcionalidades semelhantes ou equivalentes ao nosso?
2. Quais deles sao realmente maduros o suficiente para servir como benchmark serio?
3. Quais modulos do nosso produto ja aparecem validados nesses sistemas?
4. Quais capacidades criticas ainda continuam sendo responsabilidade nossa e nao podem ser terceirizadas mentalmente para o benchmark?
5. O que pode ser reaproveitado como arquitetura, fluxo, modelo de dados, UX operacional, onboarding, billing, permissao e governanca?
6. O que nao deve ser copiado de jeito nenhum?
7. Qual seria a estrategia correta para reduzir o custo de auditoria e testes sem assumir risco juridico ou de regressao?

## Entregaveis obrigatorios

Produza a resposta nas secoes abaixo, exatamente nesta ordem:

### 1. Resposta executiva

Diga de forma objetiva se existem sistemas comparaveis e se faz sentido usa-los como benchmark.

### 2. Matriz de benchmark

Monte uma tabela com colunas:

- repositorio
- nicho principal
- stack
- licenca
- sinais de maturidade
- aderencia ao Cardapio Digital
- pode servir como referencia principal, secundaria ou nao recomendada

### 3. Analise por sistema

Para cada sistema selecionado, descreva:

- o que ele resolve bem
- o que ele resolve parcialmente
- o que nao cobre do nosso contexto
- quais modulos podem inspirar nosso produto
- quais riscos existem ao tentar copiar ou portar partes dele

### 4. Mapa de funcionalidades

Crie um quadro comparando nosso produto com os benchmarks nas capacidades:

- autenticacao
- autorizacao comercial
- onboarding
- multi-tenant
- templates
- cardapio publico
- QR/publicacao
- catalogo e categorias
- pedidos
- pagamentos
- operacao de restaurante
- mesa/sala/POS
- analytics
- testes e observabilidade

### 5. Recomendacao arquitetural

Defina o que devemos:

- manter como core proprio
- reimplementar inspirados em benchmarks
- evitar por complexidade desnecessaria
- adiar para fase posterior

### 6. Recomendacao legal e de compliance

Explique com objetividade:

- porque copiar codigo nao elimina auditoria
- porque repositorio publico nao significa codigo auditado
- quais licencas permitem maior liberdade de inspiracao ou reutilizacao
- o que exigiria revisao juridica antes de incorporar

### 7. Plano de execucao pragmatico

Monte um plano em fases:

- fase 1: ganhos rapidos de arquitetura e UX operacional
- fase 2: consolidacao de billing, permissao e onboarding
- fase 3: hardening de observabilidade, testes, seguranca e governanca

### 8. Backlog priorizado

Liste os 15 itens de maior retorno para aproximar o nosso sistema do estado da arte, ordenados por impacto x risco x esforco.

## Restricoes de resposta

- Nao invente validacao que nao exista.
- Nao use linguagem de marketing vazia.
- Nao diga que um repositorio e enterprise-ready sem evidencia.
- Nao recomende copiar blocos de codigo sem avaliar licenca.
- Nao trate benchmark como substituto de testes.
- Quando faltar evidencia, diga claramente "nao comprovado".

## Criterio de excelencia

Sua resposta precisa ser dura, tecnica e util para decisao executiva. Pense como um CTO que quer reduzir risco, acelerar entrega e evitar retrabalho. O foco e descobrir o que o mercado open source ja validou e como transformar isso em vantagem pratica para o Cardapio Digital sem assumir divida legal, arquitetural ou operacional.

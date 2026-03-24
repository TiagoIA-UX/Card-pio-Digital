# PROMPT PHD PRO - Reimplementacao Imediata do Painel Editor de Templates

Voce e um arquiteto principal de software, produto e plataforma com nivel PhD, especializado em SaaS multi-tenant, backoffice modular, editores visuais, CMS enterprise, state machines comerciais, Next.js App Router, Supabase e workflows de ativacao comercial.

Sua missao e redesenhar a arquitetura do painel editor de templates do projeto Cardapio Digital para execucao imediata, usando apenas padroes que ja foram validados por software maduro na web e por projetos open source confiaveis.

O objetivo nao e copiar ferramentas famosas. O objetivo e identificar o minimo conjunto de padroes comprovados que precisa entrar na nossa plataforma para reduzir retrabalho, reduzir acoplamento e diminuir testes cegos.

## Contexto do produto

O Cardapio Digital e um SaaS de cardapio digital e operacao comercial para deliverys, pizzarias e restaurantes, com:

- Next.js App Router
- TypeScript
- Supabase
- painel autenticado
- templates compraveis
- liberacao por pagamento aprovado
- provisao de delivery apos compra
- editor visual de template
- gestao de produtos, categorias, QR code, pedidos e configuracoes

## Contexto tecnico atual

Analise e use como ponto de partida os arquivos abaixo:

- app/painel/editor/page.tsx
- app/painel/layout.tsx

Assuma que hoje existem os seguintes problemas arquiteturais:

1. O editor atual concentra estado demais em uma unica pagina.
2. O menu do painel e hardcoded no layout.
3. O contexto do tenant/delivery existe, mas ainda nao esta abstraido como contrato forte de plataforma.
4. O fluxo compra -> provisao -> ativacao -> acesso ao editor precisa ser formalizado melhor.
5. O sistema ainda precisa crescer sem virar um painel monolitico fragil.

## Benchmarks obrigatorios a considerar

### SaaS/web validados

- Webflow
- Builder.io

### Open source / derivados confiaveis

- directus/directus
- strapi/strapi
- payloadcms/payload
- WordPress/gutenberg
- medusajs/admin

## O que cada benchmark deve inspirar

### Directus

- registry de modulos
- surfaces extensivas: modules, panels, interfaces
- permissao antes do modulo ser registrado
- separacao forte entre app e API

### Strapi

- admin plugin-based
- rotas admin por dominio
- RBAC por acao e por campo
- content manager desacoplado do model builder

### Payload

- admin em Next.js
- schema-first para editor
- live preview como contrato oficial
- tabs, sidebar e blocos composicionais
- forte cobertura E2E do admin

### Gutenberg

- editor com canvas, list view e inspector desacoplados
- navegacao lateral complexa suportada por arvore
- areas de rota e surfaces especificas
- manipulacao de blocos como estrutura declarativa

### Medusa Admin

- backoffice comercial com rotas aninhadas por dominio
- sidebar operacional escalavel
- ciclos de pedido/rascunho/estado comercial claros
- relacionamento consistente entre tela, fluxo e endpoint admin

### Webflow e Builder.io

- guardrails para edicao visual
- workspace com preview e publicacao
- papeis, aprovacao e integracao forte entre editor e runtime

## Restricoes obrigatorias

1. Nao copie UX integral de nenhuma ferramenta.
2. Nao proponha complexidade de CMS generico sem aderencia ao nosso caso.
3. Nao trate benchmark como substituto de testes.
4. Nao proponha reescrita total sem fases incrementais.
5. Nao mova o projeto para outra stack.
6. Preserve compatibilidade com Next.js + Supabase + App Router.
7. Preserve o principio de acesso por delivery provisionado, nao apenas por usuario autenticado.

## O que voce deve produzir

Entregue exatamente nas secoes abaixo e nesta ordem.

### 1. Diagnostico do painel atual

Explique com dureza tecnica:

- o que esta funcionando
- onde esta o acoplamento excessivo
- onde a complexidade vai explodir se mantivermos o desenho atual
- quais responsabilidades estao misturadas indevidamente

### 2. Mapa de benchmark aplicado

Monte uma tabela com colunas:

- benchmark
- padrao validado
- como isso aparece no mercado
- como isso deve ser adaptado ao Cardapio Digital
- risco de copiar errado

### 3. Nova arquitetura alvo

Defina uma arquitetura modular para o painel com pelo menos estas camadas:

- painel shell
- tenant context
- capability resolver
- route registry
- editor workspace
- preview adapter
- template lifecycle domain
- catalog domain
- onboarding/activation domain
- audit/observability

Para cada camada, explique:

- responsabilidade
- entradas
- saidas
- o que ela nao pode fazer

### 4. Reprojeto do menu extenso

Projete um menu enterprise-ready com:

- registry de modulos
- visibilidade por capability
- match de rota desacoplado do layout
- suporte a grupos e subgrupos
- suporte a badges de estado comercial ou operacional
- suporte a tenant context sem gambiarra por tela

Explique tambem:

- o que fica no shell
- o que fica no modulo
- o que fica no dominio

### 5. Reprojeto do editor visual

Projete um editor dividido em superficies explicitas:

- canvas
- inspector
- outline/lista de blocos
- editor de produto
- editor de assets
- status de persistencia
- preview state

Defina tambem:

- schema do bloco
- schema do campo
- adapter draft -> preview
- adapter preview -> persistencia
- estrategia para inline text, inline image e product drafts

### 6. Lifecycle compra -> provisao -> ativacao -> acesso

Projete uma state machine textual para:

- compra iniciada
- pagamento aprovado
- provisao pendente
- provisao concluida
- template ativado
- acesso liberado
- suspensao ou expiracao

Explique onde entram:

- template_orders
- activation_events
- delivery provisionado
- contexto do painel
- bloqueio seguro quando houver inconsistencias

### 7. API e rotas admin por dominio

Defina a organizacao recomendada para rotas internas/admin, separando:

- tenant-context
- editor
- template-lifecycle
- catalog
- onboarding
- observability

Explique quais rotas devem ser:

- leitura
- mutacao
- auditoria
- verificacao de permissao

### 8. Plano de implementacao em fases

Monte fases pragmáticas:

- fase 1: fundacao arquitetural
- fase 2: menu modular e capabilities
- fase 3: editor schema-based
- fase 4: lifecycle de ativacao endurecido
- fase 5: testes E2E e observabilidade

Cada fase deve ter:

- objetivo
- entregaveis
- risco principal
- criterio de pronto

### 9. Backlog priorizado

Liste os 20 itens mais importantes em ordem de impacto x risco x esforco.

### 10. Testes minimos obrigatorios

Liste apenas os testes realmente necessarios para validar a nova arquitetura sem inflar custo:

- contratos
- integracao
- E2E
- regressao critica

### 11. Anti-padroes proibidos

Liste explicitamente o que nao deve ser feito.

Inclua obrigatoriamente proibicoes como:

- pagina gigante controlando todo o editor
- menu hardcoded no layout principal
- permissao decidida apenas no render
- preview acoplado ao estado persistido sem camada de draft
- regra comercial espalhada em telas
- fluxo compra/ativacao sem state machine

## Criterio de excelencia

Sua resposta precisa parecer a orientacao de um principal engineer contratado para corrigir um produto promissor antes que ele escale sobre uma arquitetura fraca.

Nao use linguagem motivacional.
Nao use generalidades.
Nao use recomendacao abstrata.
Seja prescritivo.
Seja tecnico.
Seja pragmatico.
Seja imediatamente executavel.

## Resultado esperado

Ao final da sua resposta, deve ficar claro:

1. o que manter do painel atual
2. o que reimplementar imediatamente
3. qual benchmark inspira cada parte
4. como reduzir retrabalho sem cair na fantasia de eliminar testes
5. como transformar o painel editor numa base modular, escalavel e comercialmente segura

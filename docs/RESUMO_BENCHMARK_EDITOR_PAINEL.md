# Resumo Executivo - Benchmark de Editor e Painel

## Objetivo

Definir uma direcao de reimplementacao para o painel editor de templates do Cardapio Digital usando padroes ja validados por software maduro na web e por projetos open source com sinais concretos de adocao, extensibilidade e testes.

O objetivo nao e copiar interface ou codigo. O objetivo e reduzir tentativa cega, diminuir retrabalho arquitetural e concentrar os testes onde o risco realmente continua sendo nosso.

## O que foi comparado

### SaaS/web validados

- Webflow: editor visual, workspace compartilhado, comentarios, aprovacoes, versionamento, bibliotecas compartilhadas, page building com guardrails.
- Builder.io: editor/preview acoplado ao codigo real, papeis e workflows, integracao com repositorio e publicacao por API.

### Open source / codigo auditavel por comunidade

- Directus: modularidade forte, modules/panels/interfaces, registry de extensoes, checagem de permissao antes de registrar modulo, separacao limpa entre app e API.
- Strapi: admin plugin-based, rotas admin separadas, RBAC por acao e por campo, content manager e content type builder desacoplados.
- Payload CMS: admin em Next.js, live preview first-class, colecoes com schema declarativo, tabs/blocos/sidebar, grande cobertura E2E do painel.
- WordPress Gutenberg: editor complexo com arvore de navegacao, list view, inspector/sidebar, rotas por area e forte desacoplamento entre canvas, arvore e configuracao.
- Medusa Admin: backoffice comercial com rotas aninhadas, sidebar operacional, modais/flows de pedido e draft order, acoplamento consistente entre tela e endpoint admin.

## Leitura do painel atual

### Ponto forte atual

- O produto ja tem contexto real de negocio e ativacao.
- O editor ja conversa com restaurante, produtos, categorias, branding e preview.
- O painel ja preserva contexto por delivery/restaurant via URL.

### Fragilidades atuais

- app/painel/editor/page.tsx concentra estado demais em uma pagina unica.
- app/painel/layout.tsx concentra gate, switcher, menu e contexto no mesmo shell.
- O menu ainda e um array hardcoded; nao ha registry por dominio.
- O editor mistura orquestracao, selecao, draft, preview e persistencia na mesma superficie.
- A plataforma ainda depende demais de contexto implicito entre pagina, querystring e fetches.

## O que o mercado ja validou

### 1. Shell do painel separado dos modulos

Padrao validado por Directus, Strapi e Medusa.

Aplicacao recomendada:

- O layout do painel deve apenas resolver sessao, tenant ativo, permissoes e renderizar navegação.
- Cada dominio vira modulo proprio: editor, catalogo, pedidos, QR, templates, afiliados, configuracoes.
- O menu deixa de ser declaracao local e passa a ser um registro de modulos.

### 2. Navegacao extensa orientada a rotas, nao a condicao espalhada

Padrao validado por Gutenberg e Strapi.

Aplicacao recomendada:

- Definir uma camada unica de route config por modulo.
- Cada item deve declarar: id, label, icon, href, matchers, capacidade minima, visibilidade por contexto.
- O shell do painel so renderiza o que o modulo registra.

### 3. RBAC/capability gates antes da tela nascer

Padrao validado por Directus e Strapi.

Aplicacao recomendada:

- Nao decidir acesso apenas dentro do componente renderizado.
- Resolver capabilities antes da navegacao e antes de montar interacoes sensiveis.
- Separar autenticacao, acesso comercial, acesso operacional e permissao funcional.

### 4. Editor orientado a schema e paineis, nao a dezenas de estados soltos

Padrao validado por Payload e Gutenberg.

Aplicacao recomendada:

- Transformar o editor em contratos: bloco, campo, inspector section, save adapter, preview adapter.
- O estado local deve ser reduzido para selecao atual, draft atual e status de persistencia.
- Cada tipo de bloco precisa ter schema declarativo e renderer previsivel.

### 5. Live preview como contrato de plataforma

Padrao validado por Payload, Builder.io e Webflow.

Aplicacao recomendada:

- Preview nao deve ser efeito colateral do form principal.
- Definir preview state separado do persisted state.
- Criar um adapter unico que converte draft do editor em preview model para o template.

### 6. Lifecycle de compra, provisionamento e ativacao como state machine

Padrao validado por Medusa e sistemas CMS com publish/release workflow.

Aplicacao recomendada:

- Modelar explicitamente estados: purchased, approved, provision_pending, provisioned, activated, suspended, expired.
- Vincular template order, activation event, delivery provisionado e acesso ao painel por transicao explicita.
- Evitar regra implícita distribuida por telas.

### 7. API admin por dominio funcional

Padrao validado por Strapi, Directus e Medusa.

Aplicacao recomendada:

- Organizar APIs por dominio: editor, template-lifecycle, catalog, tenant-context, onboarding.
- Cada dominio expoe leitura, mutacao, auditoria e validacao de permissão.
- Rotas devem refletir dominio, nao pagina especifica.

### 8. Cobertura de testes concentrada em fluxos de alto risco

Padrao validado por Payload, Gutenberg e Strapi.

Aplicacao recomendada:

- Nao tentar testar tudo visualmente no inicio.
- Priorizar E2E para: ativacao, troca de tenant, editor-save-preview, acesso bloqueado, menu por capability.
- Priorizar testes de contrato para adapters de preview e state machine de ativacao.

## Comparacao objetiva com o nosso painel atual

### Onde estamos alinhados

- Ja existe contexto por tenant na URL.
- Ja existe preview integrado ao editor.
- Ja existe separacao parcial entre painel e paginas publicas.

### Onde estamos abaixo do padrao validado

- O editor ainda e uma pagina-orquestradora em vez de uma plataforma de blocos.
- O menu ainda e local ao layout em vez de registry extensivel.
- A capacidade do usuario ainda nao dirige toda a navegacao.
- O ciclo compra -> provisao -> ativacao ainda merece formalizacao por maquina de estados.
- APIs e telas ainda tendem a nascer por necessidade imediata, nao por dominio estabilizado.

## Recomendacao de nova implementacao

### Manter

- Contexto de tenant por querystring e storage como fallback, mas encapsulado em service unico.
- Preview do template como experiencia central do produto.
- Vinculo de painel ao delivery provisionado e nao apenas ao usuario.

### Reimplementar agora

- Registry de modulos do painel.
- Registry de menu por capability.
- Editor com schema de blocos e inspector sections.
- Adapter unico draft -> preview model.
- State machine de lifecycle para compra/ativacao/template.
- API admin por dominio.

### Adiar

- Marketplace amplo de plugins.
- Colaboracao em tempo real.
- Versionamento visual completo tipo Webflow.
- Workflow editorial complexo se ainda nao houver demanda operacional real.

### Nao copiar

- Complexidade de CMS generico que nao serve ao fluxo de delivery.
- Construtores de pagina totalmente abertos sem guardrails.
- RBAC hiper-generico que atrasa entrega sem ganho imediato.

## Blueprint recomendado

### Camada 1 - Painel shell

- session resolver
- active tenant resolver
- capability resolver
- registry de modulos
- renderizacao do menu

### Camada 2 - Dominios

- editor-domain
- catalog-domain
- orders-domain
- template-lifecycle-domain
- onboarding-domain
- affiliate-domain

### Camada 3 - Contratos

- editor block schema
- inspector schema
- preview contract
- route capability contract
- audit event contract

### Camada 4 - Persistencia/API

- routes admin por dominio
- servicos de validacao
- adapters Supabase
- trilha de auditoria

## Fases praticas

### Fase 1 - Fundacao de arquitetura

- Extrair registry de menu do layout.
- Criar capability map do painel.
- Centralizar active tenant resolver.
- Definir state machine de ativacao/template.

### Fase 2 - Replatform do editor

- Quebrar editor em workspace, canvas, inspector, product editor, asset manager.
- Introduzir schema de blocos e campos.
- Introduzir preview adapter unificado.
- Cobrir save/preview com testes de contrato.

### Fase 3 - Hardening operacional

- APIs por dominio com auditoria.
- E2E de capabilities e fluxo compra -> ativacao -> editor.
- Observabilidade de falha de provisao e falha de vinculacao.

## Testes que continuam obrigatorios

Benchmark reduz incerteza de desenho. Nao elimina QA.

Ainda precisamos testar:

- troca de tenant em todas as rotas do painel
- acesso indevido por URL direta
- consistencia entre editor e preview
- ativacao apos pagamento aprovado
- fallback seguro quando vinculacao de compra falhar
- estado de menu por capability e status comercial

## Decisao executiva

Faz sentido reimplementar o painel editor com forte inspiracao em Payload, Directus, Strapi, Gutenberg e Medusa.

Nao faz sentido copiar Webflow ou Builder em escopo ou UX integral.

O melhor caminho e:

1. tratar o painel como plataforma modular
2. tratar o editor como schema + inspector + preview
3. tratar compra/ativacao como state machine
4. testar fluxos criticos, nao cada detalhe cosmetico

Isso reduz retrabalho real e aproxima o Cardapio Digital de um padrao validado sem inflar a complexidade alem do necessario.

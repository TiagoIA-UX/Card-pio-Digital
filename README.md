# Cardapio Digital

Plataforma SaaS de cardapio digital para restaurantes, pizzarias, lanchonetes, bares, cafeterias, acaiterias e operacoes de delivery que precisam vender online com mais autonomia.

O software combina site publico do cardapio, painel administrativo, pedidos por WhatsApp, QR Code por mesa, configuracao visual por nicho e integracao com Mercado Pago em modo teste e producao.

## O que este software entrega

- cardapio digital publico com link por restaurante
- painel para cadastrar produtos, configurar identidade visual e acompanhar a operacao
- pedidos online com envio estruturado para WhatsApp
- QR Code por mesa para atendimento local
- configuracao por nicho para diferentes tipos de operacao
- integracao com Mercado Pago com separacao clara entre sandbox e producao

## Nichos atendidos

- restaurante
- pizzaria
- lanchonete
- bar
- cafeteria
- acai
- sushi

## Fluxo principal

1. o operador faz login
2. cria o restaurante
3. ajusta nome, contatos, banner, cores e configuracoes
4. cadastra produtos e categorias
5. publica o link do cardapio
6. gera QR Code para mesas, se usar atendimento local
7. recebe pedidos online ou por mesa

## Comecar rapido

1. Leia o guia em INSTALL.md.
2. Copie .env.example para .env.local.
3. Rode npm install.
4. Rode npm run doctor.
5. Rode npm run dev.
6. Abra <http://localhost:3000>.

No Windows, voce tambem pode usar o script start-local.ps1.

## Scripts principais

- npm run dev: sobe o ambiente local
- npm run dev:checked: valida o ambiente antes de iniciar
- npm run doctor: confere variaveis essenciais
- npm run setup:local: cria .env.local a partir do exemplo quando ele nao existir

## Pagamentos

O projeto suporta dois modos de operacao:

- sandbox: usa credenciais de teste e exibe aviso visual no painel
- production: usa credenciais reais

As variaveis principais para esse controle sao:

- MERCADO_PAGO_ENV
- NEXT_PUBLIC_MERCADO_PAGO_ENV

Durante configuracao, homologacao e demonstracoes, mantenha os dois valores em sandbox.

## Stack

- Next.js
- React
- TypeScript
- Supabase
- Tailwind CSS
- Mercado Pago

## Estrutura funcional do produto

- app: rotas publicas, painel e APIs
- components: interface reutilizavel do sistema
- lib: utilitarios, integracoes e configuracoes centrais
- services: camada de acesso e regras de negocio
- modules: recursos como QR Code e WhatsApp
- supabase: schema e migrations

## Documentacao util

- INSTALL.md: instalacao local e publicacao
- SETUP_SAAS.md: referencia operacional
- SAAS_ROADMAP.md: planejamento e expansao
- AUDITORIA_TAREFAS.md: historico de ajustes
- SETUP_SENTRY.md: configuracao de monitoramento

## Publicacao

O fluxo recomendado de publicacao e:

1. validar o ambiente com npm run doctor
2. configurar as variaveis na hospedagem
3. revisar o modo de pagamento antes do go-live
4. testar pedido, webhook e retorno no painel

## Licenca

Consulte o arquivo LICENSE do repositorio para as regras vigentes de uso e distribuicao.

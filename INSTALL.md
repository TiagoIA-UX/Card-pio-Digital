# Instalacao

Este guia foi escrito para deixar a implantacao simples para uso local, homologacao e publicacao do Cardapio Digital.

## Requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- conta no Supabase
- conta no Mercado Pago Developers

## Instalacao local

1. Clone o projeto.
2. Rode npm install.
3. Copie .env.example para .env.local.
4. Preencha as chaves do Supabase.
5. Mantenha MERCADO_PAGO_ENV e NEXT_PUBLIC_MERCADO_PAGO_ENV como sandbox.
6. Rode npm run doctor.
7. Rode npm run dev.
8. Abra <http://localhost:3000>.

No Windows, voce tambem pode usar o script start-local.ps1.

## Scripts uteis

- npm run dev: sobe o ambiente local
- npm run dev:checked: valida o ambiente antes de iniciar
- npm run doctor: valida variaveis importantes
- npm run setup:local: cria .env.local a partir do exemplo quando ele nao existir

## Setup do banco

1. Crie um projeto no Supabase.
2. Execute o schema principal do projeto.
3. Execute as migrations adicionais da pasta supabase/migrations.
4. Confirme que as tabelas principais da operacao existem, como restaurants, products, orders e order_items.

## Setup do pagamento em teste

Use estes usuarios de teste do Mercado Pago no modo sandbox:

- vendedor: TESTUSER796097820704191816
- comprador: TESTUSER5736431075969203028

Preencha no .env.local:

- MERCADO_PAGO_ENV=sandbox
- NEXT_PUBLIC_MERCADO_PAGO_ENV=sandbox
- MERCADO_PAGO_TEST_ACCESS_TOKEN
- MERCADO_PAGO_TEST_PUBLIC_KEY
- NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY

Enquanto esse modo estiver ativo, o painel exibira o aviso MODO TESTE - MERCADO PAGO SANDBOX.

## Virando para producao

Quando quiser cobrar de verdade:

1. Troque MERCADO_PAGO_ENV para production.
2. Troque NEXT_PUBLIC_MERCADO_PAGO_ENV para production.
3. Preencha as chaves reais do Mercado Pago.
4. Configure os webhooks apontando para:
   - /api/webhooks/mercadopago
   - /api/webhook/subscriptions
5. Rode npm run doctor novamente.

## Publicacao

1. Suba o projeto na Vercel.
2. Cadastre as mesmas variaveis de ambiente da sua instalacao local.
3. Defina NEXT_PUBLIC_SITE_URL com a URL publica.
4. Refaça o teste de pedido, checkout e webhook antes de divulgar.

## Primeira operacao apos instalar

1. Faça login.
2. Crie o restaurante.
3. Entre em Configuracoes e ajuste nome, logo, banner e WhatsApp.
4. Cadastre pelo menos 5 produtos.
5. Gere o QR Code das mesas, se usar salao.
6. Faça um pedido teste.

## Diagnostico rapido

- npm run doctor: valida variaveis importantes
- painel sem restaurante: criar em /painel/criar-restaurante
- pagamentos em teste: confirme o banner de sandbox no painel
- erro no Supabase: revise URL, anon key e service role key

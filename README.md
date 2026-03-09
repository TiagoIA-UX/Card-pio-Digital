# Cardapio Digital

Sistema SaaS de cardapio digital com painel administrativo, pedidos por WhatsApp, QR Code por mesa, configuracao visual por nicho e integracao com Mercado Pago.

## Visao geral

O projeto foi estruturado para ser instalado e operado por pequenas empresas com o minimo de atrito:

- painel com primeiros passos para configuracao
- link publico do cardapio por restaurante
- QR Code de mesa para atendimento local
- modo sandbox explicito para testar Mercado Pago sem cobranca real
- documentacao de instalacao separada e ambiente exemplo pronto

## Comecar rapido

1. Leia o guia em INSTALL.md.
2. Copie .env.example para .env.local.
3. Rode npm install.
4. Rode npm run doctor.
5. Rode npm run dev.

Para Windows, tambem existe o script start-local.ps1.

## Scripts principais

- npm run dev: sobe o ambiente local
- npm run dev:checked: valida ambiente antes de subir
- npm run doctor: confere variaveis essenciais
- npm run setup:local: cria .env.local a partir do exemplo quando ele nao existir

## Ambientes de pagamento

- sandbox: usa credenciais de teste e mostra aviso visual no painel
- production: usa credenciais reais

O controle e feito por estas variaveis:

- MERCADO_PAGO_ENV
- NEXT_PUBLIC_MERCADO_PAGO_ENV

Enquanto estiver configurando ou demonstrando o sistema, mantenha ambas como sandbox.

## Fluxo principal do produto

- cadastro e login do operador
- criacao do restaurante
- configuracao de identidade visual e contatos
- cadastro de produtos
- geracao do link publico e QR Code
- recebimento de pedidos online ou por mesa

## Documentacao util

- INSTALL.md: instalacao completa para uso local e publicacao
- SETUP_SAAS.md: guia antigo de referencia operacional
- SAAS_ROADMAP.md: planejamento e expansao
- AUDITORIA_TAREFAS.md: historico de ajustes

## Licenca

MIT

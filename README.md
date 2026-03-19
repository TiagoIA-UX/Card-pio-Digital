# Cardápio Digital

Plataforma SaaS de cardápio digital para restaurantes, pizzarias, lanchonetes, bares, cafeterias, açaíterias e operações de delivery que precisam vender online com mais autonomia.

O software combina site público do cardápio, painel administrativo, pedidos por WhatsApp, QR Code por mesa, configuração visual por nicho e integração com Mercado Pago em modo teste e produção.

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

- `npm run dev` – sobe o ambiente local
- `npm run dev:https` – dev com HTTPS (necessário para checkout Mercado Pago em localhost)
- `npm run dev:checked` – valida o ambiente antes de iniciar
- `npm run doctor` – confere variáveis essenciais
- `npm run setup:local` – cria .env.local a partir do exemplo quando não existir
- `npm run audit:full` – build + lint + testes (validação antes de commit/deploy)

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

## Estrutura do repositório

- **Raiz do repo (esta pasta)**: projeto ativo do Cardápio Digital. Aqui ficam `app/`, `components/`, `lib/`, `package.json`, `.env.local` etc. É aqui que se deve rodar `npm run dev` e fazer alterações.
- **Pasta "Cardápio Digital"**: contém documentação (Obsidian), notas de produto e uma cópia antiga do código em `Cardapio_Digital/`. Essa cópia não é o projeto em uso; serve apenas como referência ou histórico. Não confundir com o projeto principal na raiz.

## Estrutura funcional do produto

- app: rotas publicas, painel e APIs
- components: interface reutilizavel do sistema
- lib: utilitarios, integracoes e configuracoes centrais
- services: camada de acesso e regras de negocio
- modules: recursos como QR Code e WhatsApp
- supabase: schema e migrations

## Documentação útil

- **INSTALL.md** – instalação local e publicação
- **AUDITORIA_RESULTADO.md** – resultado da auditoria e checklist de validação
- **SETUP_SAAS.md** – referência operacional
- **SAAS_ROADMAP.md** – planejamento e expansão
- **AUDITORIA_TAREFAS.md** – histórico de ajustes
- **SETUP_SENTRY.md** – configuração de monitoramento

## Publicação

O fluxo recomendado de publicação:

1. Rodar `npm run audit:full` (build + lint + testes)
2. Validar o ambiente com `npm run doctor`
3. Configurar as variáveis na hospedagem
4. Revisar o modo de pagamento antes do go-live
5. Testar pedido, webhook e retorno no painel

## Templates e teste

- **15 templates** disponíveis: Restaurante, Pizzaria, Lanchonete, Bar, Cafeteria, Açaí, Sushi, Adega, Mercadinho, Padaria, Sorveteria, Açougue, Hortifruti, Pet Shop e Doceria
- Cada template tem prévia em `/templates/[slug]` e fluxo de compra em `/comprar/[slug]`
- Em desenvolvimento: `/dev/unlock` libera todos os templates para teste no editor (requer tabela `templates` populada – execute `supabase/migrations/009_templates_seed.sql`)

## Licença

Consulte o arquivo LICENSE do repositório para as regras vigentes de uso e distribuição.

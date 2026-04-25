# Mercado Pago Test Credentials Context (Interno)

## Objetivo

Evitar impasses de integracao em sandbox causados por mistura de contexto entre token, seller e buyer.

## Regra de ouro

Use sempre um unico universo coerente por execucao:

- API-only: seller + buyer criados no mesmo fluxo por API
- Painel/manual: contas visiveis no painel apenas para inspecao/login

Nunca misturar seller de um contexto com buyer de outro.

## Erro classico

Quando houver divergencia de contexto, o provider retorna:

`Both payer and collector must be real or test users`

## Fonte de verdade no ambiente

Arquivo: `.env.local`

Bloco API-only (execucao de scripts):

- `MERCADO_PAGO_TEST_SELLER_ID`
- `MERCADO_PAGO_TEST_SELLER_EMAIL`
- `MERCADO_PAGO_TEST_SELLER_PASSWORD`
- `MERCADO_PAGO_TEST_BUYER_ID`
- `MERCADO_PAGO_TEST_BUYER_EMAIL`
- `MERCADO_PAGO_TEST_BUYER_PASSWORD`

Token de execucao em sandbox:

- `MERCADO_PAGO_TEST_ACCESS_TOKEN`

Observacao:

- O token da seller pode precisar ser obtido no painel da propria test user e entao aplicado em `MERCADO_PAGO_TEST_ACCESS_TOKEN`.

## Preflight obrigatorio antes de preapproval

1. Validar estrutura:

```bash
npx tsx scripts/validate-mp-credentials.ts
```

1. Validar owner do token vs seller configurado:

```bash
npx tsx -e "import { config } from 'dotenv'; import path from 'path'; config({ path: path.resolve(process.cwd(), '.env.local') }); (async () => { const token = process.env.MERCADO_PAGO_TEST_ACCESS_TOKEN || ''; const sellerId = process.env.MERCADO_PAGO_TEST_SELLER_ID || ''; const meRes = await fetch('https://api.mercadopago.com/users/me', { headers: { Authorization: 'Bearer ' + token } }); const me = await meRes.json(); console.log(JSON.stringify({ tokenOwnerId: me?.id ?? null, configuredSellerId: sellerId, match: String(me?.id ?? '') === String(sellerId) }, null, 2)); })().catch((e)=>{ console.error(String(e)); process.exit(1); });"
```

So prosseguir se `match` for `true`.

## Fluxo recomendado para renovar par API-only

1. Gerar novo par:

```bash
npx tsx scripts/mp-create-test-pair.ts --execute
```

1. Atualizar apenas bloco API-only no `.env.local`.
1. Atualizar token sandbox para a seller do mesmo par.
1. Rodar preflight.
1. Executar preapproval + replay + trace.

## Backup

Antes de editar `.env.local`, sempre gerar backup em `.secrets-backup/`.

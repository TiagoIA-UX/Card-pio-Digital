# Guia Rápido: gerar auth.json do cliente em 2 minutos

Use este fluxo para criar uma sessão autenticada do cliente e rodar os testes do painel que dependem de login Google.

## Onde salvar

Salve o arquivo em:

```text
private/playwright-auth/client.json
```

Esse caminho já fica protegido pelo `.gitignore` porque tudo dentro de `private/` é local.

## Passo a passo

1. Inicie a aplicação local:

```powershell
npm run dev
```

2. Em outro terminal, abra o Playwright Codegen já salvando a sessão:

```powershell
npm run auth:cliente
```

3. No navegador aberto pelo Playwright:

- faça login com Google
- espere carregar `Meus Cardápios` ou o `Painel`
- confirme que a sessão está válida

4. Feche a janela do Codegen.

Ao fechar a janela, o arquivo `private/playwright-auth/client.json` terá sido gravado.

## Rodar o teste de regressão do painel

No PowerShell:

```powershell
npm run test:e2e:painel-context-auth
```

Se quiser usar outro arquivo de sessão:

```powershell
$env:PLAYWRIGHT_CLIENT_STORAGE_STATE="private/playwright-auth/client-outro.json"
npm run test:e2e:painel-context-auth
```

## Quando regenerar

Regere o arquivo se:

- a sessão expirar
- você trocar de conta Google
- o teste começar a redirecionar para `/login`

## O que o teste valida

- entrada por `Meus Cardápios`
- link `Acessar Painel` com `?restaurant=`
- navegação interna preservando o mesmo delivery
- troca entre dois deliverys diferentes pelo seletor do painel
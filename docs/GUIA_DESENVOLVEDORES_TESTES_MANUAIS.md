# Guia de Testes Manuais para Desenvolvedores

Este arquivo pode ir para o Git.

Objetivo:

- orientar qualquer desenvolvedor sobre como executar os testes manuais mobile
- explicar onde localizar os dados locais sem versionar segredos
- padronizar o fluxo de validação antes de deploy e go-live

## Regras de Segurança

1. Nunca commitar .env.local, tokens, senhas, cartões ou chaves privadas.
2. Nunca copiar credenciais reais para arquivos em docs.
3. Nunca enviar dados de teste por chat, ticket, pull request ou comentário.
4. Sempre usar sandbox para testes de pagamento.
5. Se precisar consultar valores locais, verificar apenas o ambiente da própria máquina.

## Onde Encontrar os Dados Locais

- Variáveis de ambiente: .env.local
- Credenciais de teste do Mercado Pago: seção comentada do .env.local
- Chaves de webhook: .env.local
- URLs do ambiente: .env.local

Importante:

- Este repositório não deve armazenar números de cartão, CVV, senhas ou tokens operacionais em arquivos versionados.
- Qualquer anexo privado deve ficar fora do Git.

## Fluxo Recomendado de Teste no Celular

1. Confirmar que o ambiente está em sandbox.
2. Subir o projeto localmente ou usar preview da Vercel.
3. Abrir o ebook principal de testes manuais.
4. Executar os cenários na ordem:
   - PIX aprovado
   - cartão aprovado
   - cartão recusado
   - PIX pendente
   - cupom
   - validações de formulário
   - painel pós-compra
   - afiliados
   - onboarding
   - segurança
   - navegação mobile
5. Conferir os registros no Supabase.
6. Registrar evidências e falhas encontradas.

## Arquivos de Apoio

- Ebook operacional: docs/EBOOK_TESTES_MANUAIS_MOBILE.md
- Anexo privado local: private/ANEXO_PRIVADO_TESTES_MOBILE.md

## Checklist Para Pull Request

- Ambiente em sandbox confirmado
- Fluxos críticos de compra testados
- Webhook validado
- Painel carregando após compra
- Rotas protegidas funcionando
- Sem regressões visuais graves no mobile

## Entrega Para Outro Desenvolvedor

Se outra pessoa precisar executar o processo:

1. compartilhar este guia versionado
2. compartilhar o ebook versionado
3. orientar a pessoa a preencher o anexo privado local na própria máquina
4. nunca enviar o conteúdo do anexo privado pelo Git

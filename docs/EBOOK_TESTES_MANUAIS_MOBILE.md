# Ebook de Testes E2E Mobile em Linguagem Natural

> Este é o documento canônico da rodada atual de testes manuais.
> Ele foi escrito para conduzir uma pessoa real testando no celular, assumindo personas e observando a experiência como cliente, e não apenas marcando itens técnicos.

## Como usar este ebook

Este material deve ser seguido como se cada teste fosse uma pequena cena. A pessoa que estiver testando não precisa pensar como desenvolvedora o tempo inteiro. O ideal é agir como cliente de verdade, navegar com calma, prestar atenção no que a tela comunica e anotar tudo o que parecer confuso, quebrado, lento ou inseguro.

Ao longo do roteiro, cada cenário traz quatro coisas:

1. a intenção da persona
2. o caminho que ela deve seguir
3. o que precisa parecer natural durante a jornada
4. o que a equipe técnica deve confirmar depois

## Regras operacionais

1. Nunca commitar .env.local, tokens, senhas, cartões, CVV ou chaves privadas.
2. Sempre executar estes testes com Mercado Pago em sandbox.
3. Consultar credenciais e chaves somente no ambiente local da própria máquina.
4. Registrar evidências e falhas encontradas ao fim de cada cenário.
5. Se outra pessoa assumir os testes depois, compartilhar apenas este documento e orientar a configuração local do ambiente.

**Plataforma:** Zairyx ([www.zairyx.com.br](https://www.zairyx.com.br))
**Dispositivo:** celular iPhone ou Android
**Ambiente:** sandbox Mercado Pago
**Tempo estimado:** 30 a 40 minutos para a rodada principal
**Pré-requisito:** acesso a uma conta Google para login

> **Segurança:** este documento não contém credenciais reais.
> As credenciais de teste do Mercado Pago continuam no .env.local do projeto.
> Nunca compartilhe esse arquivo fora do fluxo interno de testes.

---

## Sumário

1. [Preparação do ambiente](#1-preparação-do-ambiente)
2. [Antes de começar: tom dos testes](#2-antes-de-começar-tom-dos-testes)
3. [Cenário 1: compra com PIX no Self-Service](#3-cenário-1-compra-com-pix-no-self-service)
4. [Cenário 2: compra com cartão no Feito Pra Você](#4-cenário-2-compra-com-cartão-no-feito-pra-você)
5. [Cenário 3: pagamento recusado](#5-cenário-3-pagamento-recusado)
6. [Cenário 4: PIX pendente](#6-cenário-4-pix-pendente)
7. [Cenário 5: cupom de desconto](#7-cenário-5-cupom-de-desconto)
8. [Cenário 6: validações do formulário](#8-cenário-6-validações-do-formulário)
9. [Cenário 7: painel após a compra](#9-cenário-7-painel-após-a-compra)
10. [Cenário 8: afiliados](#10-cenário-8-afiliados)
11. [Cenário 9: onboarding do Feito Pra Você](#11-cenário-9-onboarding-do-feito-pra-você)
12. [Cenário 10: segurança e abuso](#12-cenário-10-segurança-e-abuso)
13. [Cenário 11: navegação geral mobile](#13-cenário-11-navegação-geral-mobile)
14. [Checklist final da rodada](#14-checklist-final-da-rodada)
15. [Problemas comuns e como interpretar](#15-problemas-comuns-e-como-interpretar)

---

## 1. Preparação do ambiente

Antes de qualquer teste, confirme que o ambiente está mesmo em sandbox. No .env.local, as variáveis abaixo devem estar ativas:

```text
MERCADO_PAGO_ENV=sandbox
NEXT_PUBLIC_MERCADO_PAGO_ENV=sandbox
```

Se alguma delas estiver em production, troque para sandbox e reinicie a aplicação com npm run dev.

Se os testes forem rodar em preview da Vercel, as mesmas variáveis precisam estar configuradas lá também.

### O que a pessoa que está testando vai precisar

Ela não precisa decorar segredos. Só precisa saber onde encontrar:

- a conta de comprador no .env.local para login no checkout do Mercado Pago
- o cartão de teste correspondente à bandeira usada em cada cenário
- o CPF de teste 12345678909
- os nomes mágicos do titular, que controlam o comportamento do pagamento

### Nomes mágicos do titular

| Nome usado no titular | Efeito esperado    |
| --------------------- | ------------------ |
| APRO                  | pagamento aprovado |
| CONT                  | pagamento pendente |
| FUND                  | saldo insuficiente |
| SECU                  | CVV inválido       |
| EXPI                  | cartão vencido     |
| OTHE                  | erro genérico      |
| FORM                  | erro de formulário |

### Como abrir o site no celular

Você pode usar qualquer uma destas opções:

1. servidor local com npm run dev e acesso pelo IP da máquina
2. preview da Vercel com sandbox ativo
3. produção apenas se o ambiente remoto estiver em sandbox

Se estiver usando o servidor local, descubra o IP com ipconfig e abra no celular algo como `http://192.168.1.10:3000`.

---

## 2. Antes de começar: tom dos testes

Este não é um roteiro para clicar rápido. É um roteiro para sentir a jornada.

Durante os testes, a pessoa deve observar principalmente:

- se a navegação faz sentido sem explicação técnica
- se os textos passam confiança
- se os botões aparecem na hora certa
- se o fluxo parece coerente para quem quer comprar
- se existe algum momento em que bate dúvida, medo ou sensação de erro

Se algo parecer estranho, vale registrar com palavras simples, por exemplo:

- parece que travou
- não entendi se o pagamento foi mesmo
- essa etapa ficou confusa
- o botão parece escondido
- eu não confiaria em seguir daqui

Essas observações são tão importantes quanto um erro técnico.

---

## 3. Cenário 1: compra com PIX no Self-Service

Persona sugerida:

Uma dona de delivery pequeno que quer resolver tudo sozinha, rápido, pelo celular, e prefere pagar no PIX.

O que ela quer fazer:

Ela quer escolher um template, entender que está comprando algo seguro, pagar e cair no painel sem sentir que entrou num processo complicado.

Caminho sugerido:

Abra /templates, toque no template Pizzaria e depois entre em /comprar/pizzaria. Na tela de checkout, escolha o plano Self-Service com PIX, preencha:

- Nome do negócio: Pizzaria Teste Manual
- Seu nome: APRO
- WhatsApp: 12999887766

Confirme que a conta logada exibida na tela é a conta certa para receber o template. Depois selecione PIX, marque o aceite do resumo contratual e toque em Ir para o Mercado Pago.

No Mercado Pago, se houver pedido de login, use a conta de comprador do .env.local. Gere o PIX, copie ou escaneie o código e conclua o pagamento no sandbox.

O que deve acontecer de forma natural:

- a ida para o Mercado Pago não pode parecer quebrada
- o checkout externo deve abrir de forma estável
- depois do pagamento, o retorno precisa levar para /pagamento/sucesso
- a tela final deve passar sensação clara de conclusão

O que observar na tela de sucesso:

- confete por alguns segundos
- resumo do pedido visível
- botão para ir ao painel
- link de suporte por WhatsApp

O que a equipe deve confirmar depois:

No Supabase, verificar que foram criados:

- checkout_sessions com status approved
- novo delivery com o nome Pizzaria Teste Manual
- assinatura ativa em subscriptions

---

## 4. Cenário 2: compra com cartão no Feito Pra Você

Persona sugerida:

Uma dona de delivery que quer contratar a opção mais completa, aceita parcelar e espera um atendimento mais guiado.

O que ela quer fazer:

Ela quer comprar com cartão sem medo, perceber o parcelamento e entender que depois da compra ainda existe uma próxima etapa de onboarding.

Caminho sugerido:

Abra /comprar/restaurante e escolha o plano Feito Pra Você. Preencha:

- Nome do negócio: Restaurante Teste Cartão
- Seu nome: APRO
- WhatsApp: 12999887766

Confirme novamente que a conta exibida no checkout é a conta certa. Selecione Cartão de Crédito, marque o aceite contratual e siga para o Mercado Pago.

No Mercado Pago, use o Mastercard de teste, com titular APRO, CVV 123, validade 11/30, CPF 12345678909 e parcelamento em 3x.

O que deve parecer claro:

- o parcelamento precisa aparecer de forma compreensível
- o pagamento com cartão não pode assustar nem parecer improvisado
- após aprovar, a plataforma precisa deixar claro que a compra foi concluída e que o onboarding será a próxima etapa

Resultado esperado:

O retorno deve ir para /pagamento/sucesso. Dependendo do fluxo, a pessoa pode ser redirecionada automaticamente para /onboarding?checkout=... ou ver primeiro uma etapa intermediária de preparação.

---

## 5. Cenário 3: pagamento recusado

Persona sugerida:

Uma cliente que tentou pagar, deu problema no cartão e agora quer entender se o erro foi dela, do banco ou do site.

O que ela precisa sentir:

Mesmo com falha, a experiência tem de continuar confiável. A plataforma não pode parecer quebrada nem culpá-la de forma agressiva.

Caminho sugerido:

Abra /comprar/lanchonete, preencha normalmente, selecione Cartão de Crédito e, no Mercado Pago, use um cartão de teste com o titular FUND para simular saldo insuficiente.

Também vale repetir com pelo menos mais uma destas variações:

- SECU para CVV inválido
- EXPI para cartão vencido
- OTHE para erro genérico

Resultado esperado:

O retorno deve ir para /pagamento/erro. A tela precisa mostrar com clareza que a compra não foi concluída, apresentar possíveis motivos e oferecer saída útil, como tentar novamente ou falar com suporte.

---

## 6. Cenário 4: PIX pendente

Persona sugerida:

Uma cliente que gerou o PIX, saiu da tela para pagar depois e voltou sem saber se o sistema reconheceu a cobrança.

Caminho sugerido:

Abra /comprar/cafeteria?plano=self-service, preencha o formulário, selecione PIX e inicie o processo no Mercado Pago sem concluir o pagamento.

Volte ao site ou aguarde o redirecionamento.

O que a página precisa comunicar:

Em /pagamento/pendente, a pessoa precisa entender imediatamente que:

- o pedido ainda existe
- o PIX ainda pode ser pago
- existe um tempo de expiração
- o sistema vai tentar atualizar sozinho

Sinais esperados:

- relógio ou destaque visual de pendência
- informação de prazo, como 30 minutos
- instruções visíveis de como concluir o PIX
- polling automático
- botão Já paguei, verificar agora

Se esse botão for tocado sem o pagamento ter sido concluído, a tela deve continuar pendente sem comportamento estranho.

---

## 7. Cenário 5: cupom de desconto

Persona sugerida:

Uma cliente que recebeu um cupom e quer validar se ele realmente funciona antes de decidir a compra.

Caminho sugerido:

Abra /comprar/bar e teste o campo de cupom com quatro tipos de entrada:

1. um código inexistente, como CODIGOFALSO
2. campo vazio com clique em Aplicar
3. caracteres estranhos, como '; DROP TABLE coupons; --
4. um cupom real, se existir

O que observar:

- erro amigável quando o cupom não existe
- nenhuma pane quando o campo estiver vazio
- nenhuma falha de servidor ao inserir caracteres maliciosos
- recálculo correto dos valores quando o cupom for válido

Se precisar de um cupom válido, crie antes um registro mínimo na tabela coupons com code, discount_percent, active e expires_at.

---

## 8. Cenário 6: validações do formulário

Persona sugerida:

Uma pessoa distraída, apressada ou insegura, que preenche campos errados e espera que a interface a ajude.

O que este teste quer responder:

A pergunta aqui é simples: a tela ajuda a pessoa a acertar ou apenas a impede de avançar?

Caminho sugerido:

Em /comprar/pizzaria, teste calmamente entradas erradas, como:

- nome do negócio vazio
- nome do negócio com só 2 letras
- nome do negócio longo demais
- nome da pessoa vazio ou curto demais
- WhatsApp com letras
- WhatsApp curto demais
- WhatsApp longo demais
- CPF/CNPJ inválido
- aceite contratual desmarcado

Resultado esperado:

O formulário deve bloquear o avanço com mensagens coerentes. O ideal é que a pessoa entenda rapidamente o que corrigir e não sinta que a tela simplesmente não vai.

Variação importante: sem login

Abra /comprar/pizzaria em aba anônima, preencha tudo corretamente e toque em Entrar para continuar a compra. O esperado é salvar o rascunho, redirecionar para /login e depois voltar ao checkout com os dados preenchidos.

---

## 9. Cenário 7: painel após a compra

Persona sugerida:

Uma cliente que acabou de comprar e quer ter a sensação concreta de que agora possui acesso ao seu delivery.

Pré-requisito:

Ter concluído com sucesso o cenário 1 ou o cenário 2.

Caminho sugerido:

Entre em /painel com o mesmo e-mail da compra.

O que precisa estar visível:

O painel deve passar impressão de produto ativo, não de área vazia. Idealmente a pessoa vê logo de início:

- total de produtos
- pedidos hoje
- pendentes
- faturamento

Também deve haver sinais de setup em andamento, como criação do delivery já concluída e produtos de amostra disponíveis.

Navegação que vale testar:

- /painel/produtos
- /painel/categorias
- /painel/editor
- /painel/qrcode
- /painel/configuracoes

Sensação esperada:

A cliente deve perceber que o painel é utilizável no celular e que já existe algo vivo ali, não apenas uma estrutura vazia.

Testes importantes:

- alterar nome do delivery no editor
- mudar tema ou cor
- salvar e confirmar persistência
- tocar em Ver cardápio e abrir /r/[slug]
- verificar se o cardápio público já carrega com produtos de amostra

---

## 10. Cenário 8: afiliados

Persona sugerida:

Uma pessoa interessada em indicar a plataforma e ganhar comissão, usando o celular como canal principal.

Caminho sugerido:

Abra /afiliados, leia a landing page e veja se os benefícios ficam claros. Depois toque em Quero ser Afiliado ou Começar.

Se houver login, conclua via Google. Depois preencha o cadastro de afiliado com nome completo e uma chave PIX.

O que precisa acontecer:

Ao acessar /painel/afiliados, a pessoa deve enxergar:

- link de indicação gerado
- comissões zeradas inicialmente
- contador de indicados

Depois copie o link, abra em aba anônima e confirme se o cookie aff_ref foi gravado. Também vale testar self-referral, usando o próprio link para comprar e verificando que a plataforma não gera comissão para si mesma.

---

## 11. Cenário 9: onboarding do Feito Pra Você

Persona sugerida:

Uma cliente que já pagou e agora quer enviar as informações do negócio para a equipe preparar o delivery.

Pré-requisito:

Ter concluído com sucesso o cenário 2.

Caminho sugerido:

Após o pagamento aprovado, acesse /onboarding ou aguarde o redirecionamento automático a partir da página de sucesso.

Preencha o formulário como se estivesse entregando material real do negócio. Use, por exemplo:

- tipo: Pizzaria
- WhatsApp: 12999887766
- categoria 1: Pizzas
- produtos: Margherita 39,90; Calabresa 35,90; Quatro Queijos 42,90
- categoria 2: Bebidas
- produtos: Coca-Cola 2L 12,00; Guaraná 10,00

O que deve parecer claro:

- o formulário precisa ser fácil de entender no celular
- a pessoa deve sentir que está de fato enviando briefing para produção
- o próximo passo precisa ficar evidente

Resultado esperado:

Depois de enviar, o status deve mudar para pedido_recebido e o fluxo deve seguir para /status?checkout=CHK-xxx, exibindo uma régua com etapas como Recebido, Aguardando, Produção, Revisão e Publicado.

---

## 12. Cenário 10: segurança e abuso

Persona sugerida:

Aqui a pessoa deixa de agir como cliente comum e passa a agir como alguém tentando quebrar ou forçar a aplicação.

Parte 1: entradas maliciosas

Em /comprar/pizzaria, tente:

- Nome do negócio: `<'script'>alert('xss')</'script'>`
- Nome do negócio: '; DROP TABLE restaurants; --
- CPF/CNPJ: 12345678909' OR '1'='1

O esperado é que nada seja executado. O sistema pode rejeitar, sanitizar ou apenas tratar aquilo como texto, mas nunca deve disparar script, consulta indevida ou comportamento perigoso.

Parte 2: acesso indevido

Sem login, tente abrir diretamente:

- /painel
- /admin
- /meus-templates
- /onboarding

O esperado é redirecionamento para /login.

Depois, com usuário comum, tente abrir /admin. O esperado é erro 401 ou bloqueio equivalente.

Parte 3: URLs forçadas

Teste URLs como:

- /pagamento/sucesso?checkout=FAKE-123
- /pagamento/sucesso?checkout=../../etc/passwd

O sistema não deve revelar dado sensível e deve reagir com erro controlado.

Parte 4: insistência exagerada

No celular, toque repetidamente no botão de submit. A expectativa é que não sejam criados vários checkouts para o mesmo envio.

---

## 13. Cenário 11: navegação geral mobile

Persona sugerida:

Uma visitante que ainda está conhecendo a plataforma, comparando páginas e tentando entender se a experiência parece profissional no celular.

Páginas que vale percorrer:

| Página      | URL                 | O que observar                               |
| ----------- | ------------------- | -------------------------------------------- |
| Home        | /                   | hero legível, CTA claro, sem cortes          |
| Templates   | /templates          | cards navegáveis e scroll fluido             |
| Preview     | /templates/pizzaria | imagens carregando e botão de compra visível |
| Preços      | /precos             | leitura fácil no celular                     |
| Afiliados   | /afiliados          | landing completa                             |
| Ranking     | /afiliados/ranking  | lista carregando                             |
| Login       | /login              | botão Google funcionando                     |
| Termos      | /termos             | leitura possível no mobile                   |
| Privacidade | /privacidade        | leitura possível no mobile                   |

O que a pessoa deve sentir:

A navegação precisa parecer profissional, leve e confiável. Não pode haver:

- texto cortado
- botão escondido
- rolagem horizontal indesejada
- formulário escondido atrás do teclado
- imagem quebrada
- sensação de travamento

Também vale girar o celular na horizontal e passar por /templates e /comprar/pizzaria para ver se o layout continua utilizável.

---

## 14. Checklist final da rodada

Ao terminar, marque o que realmente foi confirmado na prática.

### Fluxo de compra

```text
[ ] PIX aprovado com retorno correto
[ ] Cartão aprovado com retorno correto
[ ] Cartão recusado com tela de erro coerente
[ ] PIX pendente com polling funcionando
[ ] Cupom válido recalculando preço
[ ] Cupom inválido tratado sem quebra
```

### Formulário e login

```text
[ ] Campos obrigatórios e limites funcionando
[ ] Bloqueio quando o aceite contratual fica desmarcado
[ ] Fluxo sem login salvando rascunho e retornando ao checkout
[ ] Dados persistidos corretamente no banco
```

### Pós-compra

```text
[ ] Painel carregando com dados iniciais
[ ] Produtos de amostra presentes
[ ] Editor funcionando no celular
[ ] QR code gerado
[ ] Cardápio público abrindo normalmente
```

### Afiliados

```text
[ ] Cadastro concluído
[ ] Link de indicação gerado
[ ] Cookie aff_ref gravado
[ ] Self-referral sem comissão indevida
```

### Onboarding

```text
[ ] Formulário enviado com sucesso
[ ] Tela de status acompanhando o processo
```

### Segurança

```text
[ ] Entradas maliciosas sem execução indevida
[ ] Rotas protegidas bloqueando acesso indevido
[ ] Usuário comum sem acesso ao admin
[ ] Repetição de submit sem criação duplicada de checkout
```

### Qualidade mobile

```text
[ ] Páginas públicas legíveis no celular
[ ] Navegação sem cortes ou sobreposição
[ ] Imagens carregando corretamente
[ ] Layout funcional em landscape
```

---

## 15. Problemas comuns e como interpretar

### Quando a página fica em branco depois do pagamento

Normalmente isso aponta para callback URL incorreta. Nesse caso, verificar NEXT_PUBLIC_SITE_URL no .env.local e confirmar que a URL usada é a correta, com https quando necessário.

### Quando o webhook não processa o pagamento

O mais provável é divergência entre MP_WEBHOOK_SECRET e o valor configurado no painel do Mercado Pago. Conferir também se os eventos payment.created e payment.updated estão ativos.

### Quando o login fica em looping

Isso costuma indicar problema de cookies de sessão do Supabase. Verificar NEXT_PUBLIC_SUPABASE_URL, ANON_KEY e também o host usado localmente.

### Quando aparece erro 429

Isso sinaliza excesso de requisições em pouco tempo. Esperar cerca de 60 segundos e repetir com calma.

### Quando o cartão de teste não funciona

Quase sempre é ambiente errado. Cartões de teste só funcionam em sandbox.

### Quando o QR PIX não aparece

No sandbox, isso pode acontecer. Nesse caso, usar o código copia e cola do PIX ou seguir o teste com cartão.

---

## Encerramento da rodada

Depois de concluir os testes, fazer três coisas:

1. registrar evidências e falhas encontradas
2. remover dados de teste que não devam permanecer, como deliverys criados só para validação
3. se o ambiente tiver sido alterado para sandbox apenas por causa dos testes, preparar a volta controlada para production

Se a rodada de sandbox estiver aprovada, o próximo passo é fazer uma validação mínima em produção, com extremo cuidado, apenas para confirmar integração real, webhook e eventual refund.

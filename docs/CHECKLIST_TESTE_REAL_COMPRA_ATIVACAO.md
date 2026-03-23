# Checklist Brutal de Teste Real: Compra, Ativacao e Primeiro Uso

Objetivo: validar se uma pessoa consegue entender, comprar, ativar e usar o produto sem ajuda humana.

Regra do teste: execute como se voce fosse um cliente desconfiado e impaciente.

Nao avalie apenas se funciona tecnicamente. Avalie se transmite seguranca, clareza e valor.

## Preparacao

- Ambiente: producao ou sandbox controlado
- Dispositivo 1: desktop
- Dispositivo 2: celular real
- Navegador 1: sessao limpa/anonima
- Navegador 2: usuario logado
- Pagamento: PIX e cartao, quando possivel
- Registro: grave tela ou anote tempo, erro, hesitacao e abandono

## Escala de avaliacao

- Verde: claro, rapido e confiavel
- Amarelo: funciona, mas gera duvida ou friccao
- Vermelho: quebra, confunde ou reduz confianca

## Evidencias minimas por teste

- Rota acessada
- Tempo ate entender o proximo passo
- Tempo ate concluir a etapa
- Erro visivel
- Erro silencioso
- Ponto de hesitacao
- Nota de confianca de 0 a 10

## Bloco 1: Landing e descoberta

Rota principal:
- /

Perguntas obrigatorias:
- Em 5 segundos, fica claro o que o produto faz?
- Fica claro para quem ele serve?
- Fica claro que a proposta principal e nao pagar comissao por pedido?
- Existe CTA principal obvio?
- Existe algum texto que pareca exagerado, vago ou arriscado juridicamente?

Marque:
- [ ] Entendi o produto em ate 5 segundos
- [ ] Entendi a diferenca para marketplace
- [ ] Vi um CTA claro para avancar
- [ ] Nao encontrei promessa vaga ou absoluta
- [ ] Senti confianca suficiente para continuar

Falhas a registrar:
- Hero bonito, mas confuso
- Beneficios demais e proposta central fraca
- CTA disperso ou concorrente
- Texto que parece promessa dificil de sustentar

## Bloco 2: Catalogo e escolha de template

Rotas:
- /templates
- /comprar/[template]

Perguntas obrigatorias:
- Da para comparar templates com rapidez?
- O cliente entende o que esta comprando antes de pagar?
- Fica claro o que esta incluso no self-service vs feito-pra-voce?
- O cliente consegue prever o que acontece depois da compra?

Marque:
- [ ] Consegui escolher um template sem abrir varias abas
- [ ] Vi preview suficiente para decidir
- [ ] Entendi o que esta incluso
- [ ] Entendi a diferenca entre os planos
- [ ] O preco parece coerente com a entrega prometida

Falhas a registrar:
- Template bonito, mas sem contexto de uso
- Diferenca de plano pouco nitida
- Oferta boa tecnicamente, mas fraca comercialmente

## Bloco 3: Compra sem login previo

Rota:
- /comprar/[template]

Objetivo: medir atrito antes do pagamento.

Passos:
1. Acesse a pagina deslogado
2. Preencha os dados necessarios
3. Tente concluir
4. Observe o redirecionamento para login
5. Volte ao fluxo apos autenticar

Marque:
- [ ] Entendi por que fui mandado para login
- [ ] Nao perdi o contexto da compra
- [ ] Os dados preenchidos foram preservados
- [ ] O retorno ao fluxo foi natural
- [ ] O login nao matou minha vontade de comprar

Falha critica:
- Usuario e forçado a logar e volta perdido, com sensação de reinicio

## Bloco 4: Checkout e formulario

Rota:
- /comprar/[template]

Campos que devem ser auditados:
- nome do negocio
- nome do responsavel
- email
- telefone
- cupom
- metodo de pagamento
- tipo de plano

Perguntas obrigatorias:
- O resumo do pedido esta claro?
- O total muda corretamente quando troco plano e forma de pagamento?
- O cupom gera confianca ou gera suspeita?
- Existe algum momento em que eu penso "nao sei se isso vai dar certo"?

Marque:
- [ ] O preco final ficou claro
- [ ] Nao houve surpresa no total
- [ ] O formulario parece profissional
- [ ] Eu teria coragem real de pagar
- [ ] O botao principal da compra inspira confianca

Falhas a registrar:
- Resumo de pedido fraco
- Desconto/cupom pouco transparente
- Microcopy insegura
- Campos demais para o momento da compra

## Bloco 5: Pagamento no Mercado Pago

Objetivo: validar a transicao de confianca entre seu site e o gateway.

Passos:
1. Inicie compra via PIX
2. Inicie compra via cartao
3. Observe ida e volta do gateway
4. Repita em desktop e celular

Marque:
- [ ] A ida para o Mercado Pago parece esperada e segura
- [ ] O usuario entende que ainda esta no fluxo certo
- [ ] O retorno ao produto acontece sem friccao
- [ ] Nao existe sensacao de abandono no gateway

Falhas a registrar:
- Usuario parece ter saído do funil
- Retorno confuso ou lento
- Falta de orientacao enquanto o pagamento processa

## Bloco 6: Pos-pagamento

Rotas:
- /pagamento/sucesso
- /pagamento/pendente
- /pagamento/erro

Este e o bloco mais importante.

Perguntas obrigatorias:
- A tela confirma o pagamento com autoridade?
- Fica claro o que acontece nos proximos 30 segundos?
- Fica claro o que acontece nas proximas 24 a 48 horas?
- Existe um unico proximo passo obvio?
- O usuario sente posse do que comprou?

Marque:
- [ ] Recebi confirmacao clara de aprovacao
- [ ] Entendi se o ambiente ja esta pronto ou sendo preparado
- [ ] Entendi qual botao apertar agora
- [ ] Nao senti ansiedade ou desorientacao
- [ ] Eu confiaria em indicar esse fluxo para um cliente real

Falhas criticas:
- Pagamento aprovado, mas sem clareza sobre entrega
- Polling invisivel para o usuario
- Link para painel sem preparar expectativa correta
- Cliente pensa "paguei e agora?"

## Bloco 7: Provisionamento e ativacao

Objetivo: validar se o valor aparece rapido o suficiente apos a compra.

Verifique:
- restaurante criado
- sessao de checkout atualizada
- redirecionamento coerente
- primeiro acesso sem erro

Marque:
- [ ] O sistema reconheceu meu checkout corretamente
- [ ] O ambiente foi provisionado sem intervenção manual inesperada
- [ ] Nao precisei adivinhar meu proximo passo
- [ ] Nao houve estado ambíguo entre sucesso e onboarding

Falhas criticas:
- webhook falha e o cliente fica sem entrega perceptivel
- onboarding manual aparece como remendo
- painel abre sem contexto ou vazio

## Bloco 8: Onboarding

Rota:
- /onboarding

Perguntas obrigatorias:
- O onboarding parece parte da entrega ou parece trabalho extra?
- Os campos pedidos aqui fazem sentido apos o pagamento?
- O cliente sente progresso?
- O cliente entende quanto falta para publicar?

Marque:
- [ ] O onboarding parece simples
- [ ] O cliente entende por que cada informacao foi pedida
- [ ] O fluxo nao parece burocratico
- [ ] O final do onboarding aponta claramente para o painel

Falhas a registrar:
- Formulario longo demais
- Campos sem explicacao
- Ausencia de barra mental de progresso
- Sensacao de que comprou e ainda precisa "montar tudo sozinho"

## Bloco 9: Primeiro uso no painel

Rotas:
- /painel
- /meus-templates

Perguntas obrigatorias:
- Em 1 minuto, eu entendo o que fazer primeiro?
- O painel parece pronto para uso ou parece vazio?
- Existe um caminho obvio para editar cardapio, personalizar e publicar?

Marque:
- [ ] Entendi o primeiro passo ao abrir o painel
- [ ] Consegui encontrar produtos/categorias/editor
- [ ] O painel transmite controle, nao caos
- [ ] A experiencia parece melhor que improvisar no WhatsApp

Falhas a registrar:
- Vazio inicial sem orientacao
- Muitas opcoes e pouca ordem
- Cliente sem sensacao de progresso

## Bloco 10: Edicao e publicacao

Objetivo: validar o primeiro momento de valor pratico.

Teste:
1. editar um item
2. adicionar uma categoria
3. ajustar algo visual
4. validar preview
5. validar publicacao/acesso ao cardapio

Marque:
- [ ] Consegui editar sem ajuda
- [ ] O preview corresponde ao que eu esperava
- [ ] O estado salvo fica claro
- [ ] Eu conseguiria mostrar isso para meu cliente hoje

Falhas criticas:
- salva sem feedback
- preview inconsistente
- publicacao pouco clara

## Bloco 11: Teste como revendedor

Objetivo: descobrir se o produto e vendavel, nao apenas funcional.

Responda sem floreio:
- Eu conseguiria explicar o produto em 30 segundos?
- Eu conseguiria justificar o preco sem pedir desculpas?
- Eu sei responder por que isso e melhor que marketplace?
- Eu sei responder o que o cliente recebe imediatamente depois de pagar?
- Eu venderia isso hoje para um amigo sem medo de passar vergonha?

Marque:
- [ ] Consigo explicar o produto com clareza
- [ ] Consigo defender o preco
- [ ] Consigo responder as 3 objecoes principais
- [ ] O fluxo de entrega sustenta a venda

Objecoes obrigatorias para simular:
- Isso e golpe?
- Por que nao usar iFood?
- Paguei e depois acontece o que?
- Se eu travar, quem me ajuda?
- Quanto tempo ate ficar pronto?

## Bloco 12: Matriz de severidade

Classifique cada problema encontrado:

- Critico: bloqueia compra, entrega ou confianca imediatamente
- Alto: nao bloqueia, mas reduz conversao ou aumenta suporte
- Medio: gera duvida, lentidao ou cansaco
- Baixo: detalhe de acabamento que nao muda decisao sozinho

## Top 10 problemas

Preencha apos o teste:

1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
9. 
10. 

## Decisao final

Escolha apenas uma opcao:

- [ ] Pronto para vender com trafego e escala moderada
- [ ] Pode vender, mas com correcoes urgentes no pos-pagamento
- [ ] Nao pronto para escalar; risco alto de perder venda e confianca

## Regra final

Se em qualquer etapa voce pensar "acho que o cliente entenderia", marque como amarelo ou vermelho.

Nao use suposicao otimista como criterio de aprovacao.
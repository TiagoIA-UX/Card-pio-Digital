# Registro de Teste Real de Go-Live

Use este documento para validar compra real, persistencia, consistencia entre dispositivos e rastreabilidade ponta a ponta.

## Objetivo do Teste

Validar que o sistema permite compra, liberacao e acesso sem intervencao humana, com consistencia entre sessoes e dispositivos.

## Regra de Nao Negociacao

Nao escalar se acontecer qualquer um destes pontos:

1. Pagamento aprovado sem liberacao automatica.
2. Necessidade de refresh manual para exibir compra ou acesso.
3. Compra nao aparecer na mesma sessao autenticada.
4. Inconsistencia entre desktop e mobile.
5. Segunda compra sobrescrever a primeira.
6. Logout/login alterar o resultado esperado.
7. Estado mudar sozinho apos 10 minutos.
8. Necessidade de suporte manual para a compra aparecer.
9. Nao conseguir rastrear a compra ponta a ponta em menos de 2 minutos.

## Identificadores Obrigatorios

Cada teste precisa registrar e permitir localizar rapidamente:

- order_number
- user_id
- checkout_session_id
- payment_id do Mercado Pago

Esses dados devem ser checados em logs e banco durante o teste.

## Localizacao Rapida em 2 Minutos

Use esta ordem para rastrear qualquer compra sem improviso:

1. Comece pelo order_number exibido no fluxo de compra ou retorno.
2. Consulte template_orders pelo order_number.
3. A partir do resultado, confirme user_id, payment_id e metadata.
4. Consulte checkout_sessions pelo order_id ou order_number gravado em metadata.
5. Consulte user_purchases pelo user_id e template_id.
6. Se houver divergencia, verifique o webhook do Mercado Pago e o external_reference.

### Origem de Verdade por Identificador

- order_number: template_orders.order_number
- user_id: template_orders.user_id e checkout_sessions.user_id
- checkout_session_id: checkout_sessions.id
- payment_id: template_orders.payment_id e checkout_sessions.mp_payment_id

### Pontos do Sistema Onde Procurar

- Criacao do checkout: app/api/pagamento/iniciar-onboarding/route.ts
- Polling de status e liberacao: app/pagamento/sucesso/page.tsx
- Webhook e atualizacao do pagamento: app/api/webhook/mercadopago/route.ts
- Exibicao em Meus Cardapios: app/meus-templates/page.tsx

### Consultas Base

Use no editor SQL do Supabase ou ferramenta equivalente.

```sql
-- 1. Localizar a compra principal
select
   id,
   order_number,
   user_id,
   status,
   payment_status,
   payment_id,
   metadata,
   created_at,
   updated_at
from template_orders
where order_number = 'SUBSTITUIR_ORDER_NUMBER';

-- 2. Localizar a sessao de checkout relacionada
select
   id,
   order_id,
   user_id,
   status,
   mp_payment_id,
   mp_preference_id,
   metadata,
   created_at,
   updated_at
from checkout_sessions
where order_id = 'SUBSTITUIR_ORDER_ID';

-- 3. Confirmar se a compra apareceu para o usuario
select
   id,
   user_id,
   template_id,
   status,
   purchased_at,
   license_key
from user_purchases
where user_id = 'SUBSTITUIR_USER_ID'
order by purchased_at desc;

-- 4. Localizar pelo payment_id quando o problema comecar no Mercado Pago
select
   id,
   order_number,
   user_id,
   payment_status,
   payment_id,
   updated_at
from template_orders
where payment_id = 'SUBSTITUIR_PAYMENT_ID';
```

### Regra de Triagem

- Se template_orders estiver correto e user_purchases ausente, a falha esta na persistencia ou provisioning.
- Se user_purchases estiver correto e Meus Cardapios nao mostrar, a falha esta na leitura de frontend ou sessao.
- Se payment_id nao estiver gravado apos aprovacao, a falha esta no webhook ou no acoplamento entre pagamento e order.
- Se checkout_sessions divergir de template_orders, trate como inconsistência operacional e bloqueie escala.

## Cronometria Obrigatoria

Marque os seguintes tempos:

1. Tempo entre clique em pagar e aprovacao do Mercado Pago.
2. Tempo entre aprovacao e liberacao no sistema.
3. Tempo entre liberacao e exibicao em Meus Cardapios.

Referencia operacional:

- Ate 3 segundos apos aprovacao: aceitavel.
- Acima disso com recorrencia: atencao.
- Precisou refresh, relogin ou espera indefinida: bloqueador.

## Sequencia do Teste Real

1. Comprar template A.
2. Confirmar liberacao imediata.
3. Abrir Meus Cardapios.
4. Comprar template B na mesma conta.
5. Confirmar coexistencia entre A e B.
6. Atualizar a pagina.
7. Abrir aba anonima e logar na mesma conta.
8. Abrir no celular e logar na mesma conta.
9. Fazer logout/login novamente no desktop.
10. Esperar 10 minutos e reabrir Meus Cardapios.

Esperado: mesmo conjunto de itens, mesma sessao logica e mesma persistencia em todos os pontos.

## Registro de Teste

Preencha sem resumir ou reinterpretar.

```text
Data:
Horario:

Conta utilizada (email):
Dispositivo inicial: (desktop/mobile)

Template A:
Template B:

--- COMPRA 1 ---
Horario clique pagar:
Horario aprovacao MP:
Horario liberacao no sistema:

Tempo aprovacao:
Tempo liberacao:

Apareceu sem refresh? (sim/nao):
Apareceu na mesma sessao? (sim/nao):

Order_number:
Checkout_session_id:
Payment_id:
User_id:

--- COMPRA 2 ---
Horario clique pagar:
Horario aprovacao MP:
Horario liberacao:

Tempo aprovacao:
Tempo liberacao:

Acumulou corretamente? (sim/nao):

Order_number:
Checkout_session_id:
Payment_id:
User_id:

--- TESTES DE CONSISTENCIA ---

Refresh:
Resultado:

Logout/Login:
Resultado:

Aba anonima:
Resultado:

Mobile:
Resultado:

Apos 10 minutos:
Resultado:

--- BACKEND ---

Webhook recebido? (sim/nao):
Erro no webhook? (sim/nao):
user_purchases correto? (sim/nao):
template_orders correto? (sim/nao):
checkout_sessions correto? (sim/nao):

--- RASTREABILIDADE ---

Conseguiu localizar a compra ponta a ponta em menos de 2 minutos? (sim/nao):
Onde encontrou order_number:
Onde encontrou checkout_session_id:
Onde encontrou payment_id:
Onde encontrou user_id:

--- STATUS FINAL ---

( ) APROVADO PARA LANCAMENTO CONTROLADO
( ) BLOQUEADO

Motivo (se bloqueado):
```

## Checklist de Observacao Tecnica

Verificar durante o teste:

### Frontend

- A compra aparece sem refresh.
- A compra aparece na mesma sessao.
- O estado em Meus Cardapios permanece identico apos refresh, logout/login e mobile.
- Nao existe loading infinito nem oscilacao de estado.

### Backend

- Checkout criado com sucesso.
- Webhook recebido e processado sem erro.
- Nao houve falha de assinatura.
- Nao houve dependencia manual para concluir provisionamento.

### Banco

- template_orders com payment_status aprovado.
- checkout_sessions com status coerente.
- user_purchases com uma linha por template comprado.
- user_id e template_id coerentes em todas as tabelas.

## Regra Final

Se houver duvida, conte como falha.

Este documento nao serve para provar que quase funcionou. Serve para decidir se o produto pode cobrar sem explicacao manual ao cliente.

## Protocolo de Falha

Quando o status final for BLOQUEADO:

1. Parar imediatamente qualquer tentativa de venda.
2. Registrar horario exato, conta usada, template e ponto exato da falha.
3. Classificar o tipo de falha:
   - pagamento para liberacao
   - persistencia
   - sessao ou login
   - mobile
   - inconsistência de dados
4. Identificar a origem predominante:
   - frontend
   - backend
   - webhook
   - banco
5. Corrigir a causa raiz, sem paliativo.
6. Rodar o teste completo novamente, nao apenas o trecho que falhou.

So liberar go-live novamente apos passar 100% da sequencia completa.

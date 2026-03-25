# Checklist Executivo de Testes por Persona

Objetivo: consolidar em um unico documento operacional os testes essenciais de todas as personas do Cardapio Digital, em formato de checklist executivo, para uso em validacao real, QA manual, go-live e auditoria de produto.

Base de referencia:

- [docs/PERSONAS_E_TESTES_VALIDACAO.md](docs/PERSONAS_E_TESTES_VALIDACAO.md)
- [docs/CHECKLIST_TESTE_REAL_COMPRA_ATIVACAO.md](docs/CHECKLIST_TESTE_REAL_COMPRA_ATIVACAO.md)
- [docs/SCORECARD_EXECUTIVO_GO_NO_GO.md](docs/SCORECARD_EXECUTIVO_GO_NO_GO.md)

## Pedido melhorado

Use este texto quando quiser pedir este entregavel de forma mais precisa:

Crie um checklist executivo, detalhado e conciso, cobrindo todas as personas do sistema. O documento deve organizar os testes por persona, em linguagem operacional, com foco em validacao real, evidencias obrigatorias, criterio de aprovacao e decisao go ou no-go.

## Como usar este documento

- Marque cada item como:
  - [ ] Nao executado
  - [x] Aprovado
  - [!] Aprovado com ressalva
  - [/] Reprovado
- Sempre registrar evidencia minima.
- Se um item critico reprovar em compra, ativacao, pedido, painel ou permissao, o status final da rodada deve ser no-go.

## Evidencia minima obrigatoria

Preencher em cada rodada:

- Data:
- Ambiente:
- Responsavel:
- Build ou commit:
- Dispositivo:
- Sessao usada: limpa, anonima, logada, mobile, desktop
- Evidencia: video, print, logs, pedido, payment_id, tenant_id

## Regra de prioridade

### P0 - Bloqueador

- Quebra compra
- Quebra ativacao
- Quebra pedido
- Quebra painel principal
- Quebra permissao ou isolamento de dados

### P1 - Critico

- Funciona, mas com friccao que gera abandono, suporte manual ou perda de confianca

### P2 - Importante

- Funciona, mas com UX fraca, ambiguidade ou baixa clareza

## Resumo executivo por persona

| Persona | Objetivo principal | Area critica | Prioridade |
|---------|--------------------|--------------|------------|
| 1. Visitante anonimo | Entender valor e avancar | Landing, templates, precos | P1 |
| 2. Cliente final | Ver cardapio, montar pedido e acompanhar | Cardapio, carrinho, status | P0 |
| 3. Dono do delivery | Cadastrar, ativar e operar | Painel, onboarding, pedidos | P0 |
| 4. Staff | Operar pedidos sem excesso de acesso | Pedido e permissao | P0 |
| 5. Manager | Gerenciar operacao sem tocar billing | Painel e RBAC | P1 |
| 6. Afiliado | Indicar, acompanhar e sacar | Referral, saldo, payout | P0 |
| 7. Revendedor | Comprar pacote e ativar entrega | Pacotes, ativacao, webhook | P0 |
| 8. Suporte | Atender com SLA e escalar | Tickets, SLA, acesso | P1 |
| 9. Admin | Operar negocio e equipe | Admin, financeiro, logs | P0 |
| 10. Owner | Controlar tudo com seguranca | Full access, auditoria | P1 |

---

## Persona 1 - Visitante anonimo

### Objetivo

Confirmar se a proposta do produto esta clara e se o visitante consegue avancar para cadastro ou compra sem confusao.

### Checklist

- [ ] Homepage comunica o produto em ate 5 segundos.
- [ ] CTA principal fica claro sem precisar rolar demais.
- [ ] Pagina de templates ajuda a comparar e decidir.
- [ ] Pagina de precos deixa claro o que esta sendo vendido.
- [ ] Paginas legais abrem sem erro.
- [ ] Demo publica abre sem login.
- [ ] Footer e navegacao nao geram 404.
- [ ] robots.txt e sitemap.xml respondem corretamente.
- [ ] Mobile, tablet e desktop nao quebram layout.
- [ ] Rotas protegidas redirecionam corretamente sem expor area interna.

### Evidencia

- [ ] Video da navegacao inicial
- [ ] Prints da landing, templates e precos
- [ ] Resultado Lighthouse ou observacao manual de performance

### Criterio de aprovacao

- Aprovado se a pessoa entende o produto, encontra o proximo passo e nao enfrenta erro estrutural.

---

## Persona 2 - Cliente final

### Objetivo

Validar se o consumidor consegue abrir o cardapio, montar o pedido, enviar e acompanhar sem ajuda.

### Checklist

- [ ] Cardapio do delivery correto abre por link ou QR.
- [ ] Categorias carregam corretamente.
- [ ] Produto mostra nome, descricao, preco e imagem.
- [ ] Pizza builder calcula tamanho, borda, sabores e adicionais sem erro.
- [ ] Carrinho atualiza quantidade, remocao e total corretamente.
- [ ] Formulario do pedido valida campos obrigatorios.
- [ ] Pedido cria numero e status inicial correto.
- [ ] Preco final e recalculo server-side impedem manipulacao no frontend.
- [ ] Status do pedido avanca corretamente.
- [ ] Cliente consegue enviar feedback ao final.
- [ ] Double click nao duplica pedido.
- [ ] Inputs invalidos, XSS e tentativa de preco adulterado sao bloqueados.

### Evidencia

- [ ] Numero do pedido
- [ ] Video do fluxo QR ate status
- [ ] Print do carrinho e do status

### Criterio de aprovacao

- Aprovado se o pedido ponta a ponta funciona sem suporte humano.

---

## Persona 3 - Dono do delivery

### Objetivo

Validar se o cliente principal consegue entrar, ativar, configurar e operar o delivery sem dependencia do time.

### Checklist

- [ ] Cadastro e login funcionam.
- [ ] Onboarding cria o delivery corretamente.
- [ ] Painel abre sem erro apos primeiro acesso.
- [ ] Categorias podem ser criadas, editadas e removidas conforme regra.
- [ ] Produtos podem ser criados com imagem, preco e categoria.
- [ ] Variacoes, bordas, sabores e adicionais funcionam.
- [ ] Produto desativado some do cardapio publico.
- [ ] Pedidos entram no painel e atualizam em tempo real.
- [ ] Fluxo de status segue a ordem correta.
- [ ] Editor e template salvam alteracoes sem quebrar o cardapio publico.
- [ ] Configuracoes gerais e QR Code funcionam.
- [ ] Plano atual aparece e fluxo de upgrade redireciona corretamente.
- [ ] Compra de template, cupom e webhook de liberacao funcionam.
- [ ] Isolamento multi-tenant impede acesso cruzado.

### Evidencia

- [ ] tenant_id ou delivery criado
- [ ] Video onboarding ate painel
- [ ] Produto publicado no cardapio publico
- [ ] Pedido recebido e movimentado no painel

### Criterio de aprovacao

- Aprovado se o dono do delivery consegue operar o negocio sem intervencao manual.

---

## Persona 4 - Staff

### Objetivo

Garantir operacao rapida de pedidos com permissao limitada.

### Checklist

- [ ] Staff faz login e entra somente no que pode acessar.
- [ ] Ve apenas pedidos do proprio delivery.
- [ ] Atualiza status de pedido corretamente.
- [ ] Nao acessa configuracoes sensiveis se nao tiver permissao.
- [ ] Nao acessa financeiro ou planos.
- [ ] Consegue operar em mobile sem quebra.

### Evidencia

- [ ] Video login staff
- [ ] Print de tentativa negada em area restrita

### Criterio de aprovacao

- Aprovado se opera pedidos com velocidade e sem excesso de permissao.

---

## Persona 5 - Manager

### Objetivo

Validar gestao operacional ampliada sem acesso a billing ou funcoes de owner.

### Checklist

- [ ] Manager entra no painel com escopo correto.
- [ ] Consegue gerenciar produtos, categorias e pedidos.
- [ ] Consegue ver feedbacks.
- [ ] Nao acessa billing ou plano se isso for restrito ao owner.
- [ ] Funcoes de equipe, quando existentes, respeitam permissao.
- [ ] Configuracoes permitidas funcionam sem extrapolar role.

### Evidencia

- [ ] Video com acessos permitidos e bloqueados

### Criterio de aprovacao

- Aprovado se a role manager for util sem vazar privilegios indevidos.

---

## Persona 6 - Afiliado

### Objetivo

Validar o canal de aquisicao por afiliacao, da indicacao ao saque.

### Checklist

- [ ] Cadastro de afiliado funciona e entra como pending.
- [ ] Aprovacao pelo admin muda status corretamente.
- [ ] Dashboard do afiliado mostra metricas consistentes.
- [ ] Link de referral e gerado com codigo unico.
- [ ] Link registra atribuicao corretamente.
- [ ] Indicacao valida gera comissao quando a compra acontece.
- [ ] Ranking e saldo exibem numeros coerentes.
- [ ] Solicitacao de saque valida chave PIX e saldo.
- [ ] Admin consegue processar o payout corretamente.
- [ ] Penalidade, strike e suspensao automatica funcionam.
- [ ] Afiliado nao enxerga dados de outro afiliado.
- [ ] Tentativa de manipular comissao ou referral invalido falha corretamente.

### Evidencia

- [ ] affiliate_id
- [ ] codigo de referral
- [ ] saldo antes e depois
- [ ] comprovacao de payout ou lote gerado

### Criterio de aprovacao

- Aprovado se o programa de afiliacao funciona como canal real de aquisicao e pagamento.

---

## Persona 7 - Revendedor

### Objetivo

Validar compra de pacote e ativacao de entregas para terceiros.

### Checklist

- [ ] Pagina de revendedores comunica o modelo corretamente.
- [ ] Pacotes disponiveis aparecem com precos e quantidade clara.
- [ ] Checkout do pacote funciona.
- [ ] Pagamento aprovado provisiona o pacote.
- [ ] Historico de pacotes aparece corretamente.
- [ ] Quantidade restante decrementa apos ativacao.
- [ ] Limite impede ativacao acima do contratado.
- [ ] Webhook conclui liberacao automaticamente.

### Evidencia

- [ ] pacote comprado
- [ ] total de licencas antes e depois

### Criterio de aprovacao

- Aprovado se o revendedor compra e distribui sem precisar de operacao manual.

---

## Persona 8 - Suporte

### Objetivo

Garantir atendimento com SLA visivel e escalacao correta.

### Checklist

- [ ] Usuario de suporte entra com role weight 1.
- [ ] Lista de tickets aparece ordenada e utilizavel.
- [ ] Resposta em ticket salva corretamente.
- [ ] SLA fica visivel na interface.
- [ ] Violacao de SLA gera alerta.
- [ ] Escalacao para admin funciona.
- [ ] Encerramento do ticket grava status e timestamp.
- [ ] Suporte nao acessa areas financeiras ou gestao de usuarios.
- [ ] Logs do ticket estao visiveis.

### Evidencia

- [ ] ticket_id
- [ ] print da escalacao
- [ ] print do SLA ou alerta

### Criterio de aprovacao

- Aprovado se suporte consegue atender sem romper RBAC nem perder rastreabilidade.

---

## Persona 9 - Admin

### Objetivo

Garantir que a operacao central do negocio funcione de ponta a ponta.

### Checklist

- [ ] Login admin funciona.
- [ ] Dashboard mostra metricas, alertas e logs.
- [ ] Gestao de clientes funciona com detalhes e trials.
- [ ] Gestao de afiliados funciona com aprovacao, ranking e penalidade.
- [ ] Financeiro mostra ledger, payout e historico de webhooks.
- [ ] Venda direta funciona.
- [ ] Tickets podem ser vistos e reatribuídos.
- [ ] Feedbacks ficam visiveis para leitura operacional.
- [ ] Gestao de usuarios admin respeita hierarquia de roles.
- [ ] Admin nao consegue criar role acima do proprio nivel.

### Evidencia

- [ ] print do dashboard
- [ ] lote financeiro ou payout validado
- [ ] usuario admin criado ou restricao comprovada

### Criterio de aprovacao

- Aprovado se a operacao administrativa roda sem pontos cegos ou inconsistencias de permissao.

---

## Persona 10 - Owner

### Objetivo

Validar controle total, auditoria e seguranca da camada mais sensivel do sistema.

### Checklist

- [ ] Owner entra com acesso total.
- [ ] Consegue gerenciar administradores e roles.
- [ ] Acessa todas as areas do admin sem bloqueio indevido.
- [ ] Consegue visualizar operacao cross-tenant quando necessario.
- [ ] Acoes destrutivas exigem confirmacao forte.
- [ ] Logs de auditoria estao completos.
- [ ] Configuracoes sistemicas e auth por header funcionam conforme esperado.

### Evidencia

- [ ] print de area sensivel acessada
- [ ] log de acao critica

### Criterio de aprovacao

- Aprovado se a role owner tem controle total com rastreabilidade e sem bypass inseguro.

---

## Checklist transversal obrigatorio

Executar em paralelo ao checklist por persona.

### Compra e ativacao

- [ ] Usuario entende o que compra antes de pagar.
- [ ] Pagamento aprovado leva a proximo passo claro.
- [ ] Ativacao ou provisionamento ocorrem sem suporte manual.

### Seguranca

- [ ] XSS basico nao executa.
- [ ] Manipulacao de preco no frontend nao altera valor server-side.
- [ ] Rotas protegidas respondem com redirecionamento ou 401 ou 403 corretos.
- [ ] Isolamento entre deliverys e usuarios funciona.

### Performance e UX

- [ ] Homepage abre com velocidade aceitavel.
- [ ] Mobile nao quebra nas telas principais.
- [ ] Nao ha ponto visivel de hesitacao grave no fluxo principal.

### Observabilidade

- [ ] Pedido, pagamento, tenant e usuario podem ser rastreados.
- [ ] Logs permitem identificar falha em menos de 2 minutos.

---

## Score executivo da rodada

Preencher ao fim da execucao.

| Bloco | Status | Observacao |
|------|--------|------------|
| Visitante anonimo | | |
| Cliente final | | |
| Dono do delivery | | |
| Staff | | |
| Manager | | |
| Afiliado | | |
| Revendedor | | |
| Suporte | | |
| Admin | | |
| Owner | | |
| Transversal de seguranca | | |
| Transversal de compra e ativacao | | |

## Regra final de decisao

- GO: nenhuma persona critica com falha P0.
- GO COM RISCO CONTROLADO: sem falha P0, mas com friccao P1 conhecida e mitigada.
- NO-GO: qualquer falha P0 em compra, pedido, painel, permissao, isolamento ou ativacao.

## Veredito final

- Data:
- Responsavel:
- Decisao: GO / GO COM RISCO CONTROLADO / NO-GO
- Motivo principal:
- Correcoes obrigatorias antes da proxima rodada:
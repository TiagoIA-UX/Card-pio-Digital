# Rotina Unica de Pre-Release PhD

Objetivo: transformar os artefatos de auditoria, benchmark e teste real em um processo simples, repetivel e binario de decisao.

Esta rotina existe para responder uma unica pergunta:

Podemos vender sem suporte humano e sem autoengano?

Se a resposta nao for claramente sim, o release nao sobe para trafego real.

## Regra-mestra

Nao use esta rotina como checklist cosmetico.

Ela deve ser usada para:

- encontrar bloqueadores reais
- cruzar evidencia de negocio, UX e backend
- tomar decisao go ou no-go
- impedir que um fluxo aparentemente funcional seja vendido antes da hora

## Artefatos obrigatorios

Execute a rotina usando estes documentos:

1. [docs/CHECKLIST_TESTE_REAL_COMPRA_ATIVACAO.md](docs/CHECKLIST_TESTE_REAL_COMPRA_ATIVACAO.md)
2. [docs/REGISTRO_TESTE_GO_LIVE_REAL.md](docs/REGISTRO_TESTE_GO_LIVE_REAL.md)
3. [docs/PROMPT_PHD_CLIENTE_BURRO_REAL_APRESSADO.md](docs/PROMPT_PHD_CLIENTE_BURRO_REAL_APRESSADO.md)
4. [docs/PROMPT_PHD_BENCHMARK_REPOS_PUBLICOS.md](docs/PROMPT_PHD_BENCHMARK_REPOS_PUBLICOS.md)
5. [docs/SCORECARD_EXECUTIVO_GO_NO_GO.md](docs/SCORECARD_EXECUTIVO_GO_NO_GO.md)

## Ordem obrigatoria de execucao

### Etapa 1 - Validacao tecnica minima

Antes de qualquer teste manual ou auditoria:

- rodar validacao tecnica do projeto
- confirmar que o fluxo atual nao esta quebrado por erro obvio de build, typecheck, lint ou configuracao
- bloquear o restante da rotina se houver falha basica

Saida esperada:

- ambiente minimamente confiavel para teste real

### Etapa 2 - Teste real com cronometro

Executar o fluxo de compra e ativacao usando:

- [docs/CHECKLIST_TESTE_REAL_COMPRA_ATIVACAO.md](docs/CHECKLIST_TESTE_REAL_COMPRA_ATIVACAO.md)
- [docs/REGISTRO_TESTE_GO_LIVE_REAL.md](docs/REGISTRO_TESTE_GO_LIVE_REAL.md)

Objetivo:

- verificar compra real ponta a ponta
- medir tempo de aprovacao e liberacao
- confirmar persistencia, consistencia entre sessoes e visibilidade em Meus Templates ou Meus Cardapios

Saida obrigatoria:

- evidencias preenchidas
- tempos registrados
- identificadores rastreaveis
- resultado binario por etapa

### Etapa 3 - Auditoria de vendabilidade

Executar o prompt:

- [docs/PROMPT_PHD_CLIENTE_BURRO_REAL_APRESSADO.md](docs/PROMPT_PHD_CLIENTE_BURRO_REAL_APRESSADO.md)

Objetivo:

- descobrir se o fluxo parece vendavel para quem compra de verdade
- revelar pontos de hesitacao, abandono e perda de confianca
- classificar o sistema como:
  - NAO VENDAVEL
  - VENDAVEL COM RISCO
  - PRONTO PARA ESCALA

Saida obrigatoria:

- veredito executivo
- bloqueadores de venda
- ranking por impacto em receita
- proxima acao certa

### Etapa 4 - Benchmark externo

Executar o prompt:

- [docs/PROMPT_PHD_BENCHMARK_REPOS_PUBLICOS.md](docs/PROMPT_PHD_BENCHMARK_REPOS_PUBLICOS.md)

Objetivo:

- comparar o Cardapio Digital com referencias publicas maduras
- separar problema estrutural de detalhe local
- descobrir o que precisa ser mantido como core proprio e o que pode ser reimplementado inspirado em padrao validado

Saida obrigatoria:

- matriz de benchmark
- mapa de funcionalidades
- recomendacao arquitetural
- backlog priorizado

### Etapa 5 - Cruzamento frio das evidencias

Cruzar os resultados destas tres fontes:

1. teste real
2. auditoria de vendabilidade
3. benchmark externo

Regra de interpretacao:

- se as 3 fontes convergirem no mesmo problema, trate como falha estrutural
- se 2 fontes convergirem, trate como risco serio e priorize antes do release
- se so 1 fonte apontar, reavalie com evidencia adicional antes de descartar

### Etapa 6 - Scorecard executivo

Preencher:

- [docs/SCORECARD_EXECUTIVO_GO_NO_GO.md](docs/SCORECARD_EXECUTIVO_GO_NO_GO.md)

Objetivo:

- transformar os achados em decisao executiva simples
- impedir que o time se esconda atras de narrativa ou ambiguidade

## Regra de decisao

### GO

So existe GO se:

- o teste real passou sem suporte manual
- o cliente nao fica perdido apos pagar
- a liberacao acontece com clareza e consistencia
- Meus Templates ou Meus Cardapios refletem a compra corretamente
- nao existe estado ambiguo entre pagar, liberar e usar
- o scorecard final nao contém bloqueador critico aberto

### NO-GO

Existe NO-GO se qualquer item abaixo acontecer:

- pagamento aprovado sem liberacao clara
- necessidade de refresh, relogin ou espera opaca para a compra aparecer
- inconsistencias entre desktop, mobile ou sessoes
- perda de contexto no login ou checkout
- vinculacao errada entre compra, template e restaurante
- alto risco de chargeback, abandono ou suporte manual

## Cadencia recomendada

Use esta rotina:

- antes de release comercial
- antes de abrir trafego pago
- depois de qualquer mudanca em compra, pagamento, webhook, liberacao, painel ou onboarding
- depois de qualquer incidente real envolvendo venda, ativacao ou acesso

## Resultado final esperado

Ao final da rotina, a equipe precisa sair com apenas uma resposta:

- subir
- nao subir

Sem meio-termo. Sem narrativa. Sem "quase pronto".

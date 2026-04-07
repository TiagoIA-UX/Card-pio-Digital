# REVISÃO ARQUITETURAL — PADRÃO ZAEA

> Data: 06/04/2026
> Escopo: estado atual do Cardápio Digital em relação ao padrão ZAEA de blocos, camadas e contratos explícitos entre domínios.

---

## 1. Diagnóstico executivo

O projeto já passou do estágio de aplicação totalmente acoplada. Hoje existe uma base real de separação por domínio em `lib/domains`, com barrel exports, contratos TypeScript e alguns módulos já bastante isolados. Isso significa que a arquitetura já está parcialmente aderente ao padrão ZAEA.

O problema principal não está na ausência de domínios, e sim na homogeneidade da aplicação. A separação está forte em alguns blocos e fraca nas bordas operacionais mais críticas, principalmente nas rotas de checkout, webhook e provisionamento. Nessas fronteiras, a aplicação ainda concentra validação, autenticação, integração externa, persistência, decisão de negócio e efeitos colaterais no mesmo arquivo.

Conclusão direta: o projeto já está organizado em blocos, mas ainda não opera de forma consistente em camadas.

---

## 2. Onde o projeto já está bem separado

### 2.1 Domínios com API pública explícita

Os arquivos `index.ts` em `lib/domains` já funcionam como contratos públicos entre blocos.

Casos mais consistentes observados:

- `lib/domains/core/index.ts`
- `lib/domains/auth/index.ts`
- `lib/domains/marketing/index.ts`
- `lib/domains/zaea/index.ts`

Isso é aderente ao padrão ZAEA porque reduz imports arbitrários entre arquivos internos e cria um ponto visível de entrada por domínio.

### 2.2 ZAEA é o domínio mais próximo do padrão-alvo

O domínio ZAEA está enxuto e legível. Em especial:

- `lib/domains/zaea/index.ts` expõe apenas orchestrator, ai-learning, maestro e o contrato `IZaeaService`
- `app/api/agents/dispatch/route.ts` usa schema Zod na borda e delega o trabalho para o domínio via `dispatchTask`, `listTasks` e `getKnowledge`

Esse é o melhor exemplo atual de fronteira saudável: a rota valida, autentica e orquestra pouco; a lógica útil está no domínio.

### 2.3 Marketing já está relativamente modularizado

O bloco de marketing já possui separação temática melhor que o core:

- templates
- pricing
- analytics
- seo
- integrações de aquisição

Mesmo quando o domínio ainda é amplo, a superfície pública em `lib/domains/marketing/index.ts` já sugere um contexto mais estável do que o restante do sistema comercial.

### 2.4 Shared infra está razoavelmente centralizada

Itens como Supabase, rate limit, brand e site-url estão em `lib/shared`, o que é coerente com a ideia de infraestrutura compartilhada e evita duplicação espalhada em múltiplos módulos.

---

## 3. Onde ainda há mistura de responsabilidades

### 3.1 Checkout onboarding ainda é uma rota monolítica de aplicação

O arquivo `app/api/pagamento/iniciar-onboarding/route.ts` concentra responsabilidades demais:

- rate limit
- validação Zod
- autenticação do usuário
- leitura de cupom
- cálculo de preço
- validação fiscal
- montagem de resumo contratual
- persistência em `template_orders`
- persistência em `checkout_sessions`
- criação de preferência no Mercado Pago
- montagem de URLs de retorno
- tratamento de falha de integração externa

Esse arquivo já consome helpers de domínio, mas a orquestração ainda está densa demais para uma única borda HTTP. No padrão ZAEA, essa rota deveria apenas validar entrada, invocar um caso de uso do domínio e traduzir o resultado para HTTP.

### 3.2 Webhook Mercado Pago é o maior ponto de acoplamento crítico

O arquivo `app/api/webhook/mercadopago/route.ts` é hoje o exemplo mais forte de mistura de camadas. Ele mistura, no mesmo fluxo:

- validação de assinatura
- idempotência de evento
- leitura e atualização de status de pagamento
- sincronização de checkout session
- criação ou resolução de usuário
- criação de delivery
- ativação de assinatura
- envio de notificação
- preparação fiscal
- despacho fiscal
- geração de magic link
- controle de staleness e decisão de provisionamento

Esse tipo de concentração torna o sistema mais difícil de testar, mais frágil a regressões e mais caro para evoluir. No padrão ZAEA, webhook é borda de entrada, não centro de regra de negócio.

### 3.3 Core ainda é um macrodomínio grande demais

O barrel `lib/domains/core/index.ts` mostra organização melhor do que antes, mas ainda revela um problema estrutural: checkout, pagamento, onboarding, fiscal, rede/multiunidade, cardápio e catálogo especial convivem no mesmo macrobloco.

Isso indica que o “core” atual ainda é mais um agrupamento operacional do que um bounded context realmente estável.

Na prática, o core hoje contém pelo menos estes subdomínios distintos:

- catálogo/cardápio
- checkout comercial
- pagamento
- onboarding/provisionamento
- fiscal
- expansão de rede

Enquanto tudo continuar sendo “core”, as fronteiras internas continuarão implícitas e fáceis de violar.

### 3.4 Serviços paralelos fora de `lib/domains` preservam um segundo modelo arquitetural

O diretório `services/` ainda mantém lógica de negócio relevante, como `services/subscription.service.ts`.

Esse padrão cria coexistência de dois estilos:

- arquitetura por domínio em `lib/domains`
- arquitetura por service solto em `services`

Enquanto os dois coexistirem sem regra clara, o projeto continua com ambiguidade arquitetural. Isso dificulta onboarding de engenharia e encoraja novas features a nascerem no lugar errado.

### 3.5 Páginas cliente ainda carregam regra demais em alguns fluxos comerciais

Exemplo observado: `app/painel/planos/page.tsx` mistura UI, carregamento de estado de delivery ativo, cálculo comercial de upgrade, validações do checkout de rede e disparo de pagamento.

Isso não é o principal gargalo do sistema hoje, mas mostra que a separação entre camada de apresentação e caso de uso ainda não está uniforme.

---

## 4. Avaliação por aderência ao padrão ZAEA

| Área | Estado atual | Leitura objetiva |
| --- | --- | --- |
| Domínios em `lib/domains` | Bom | A base estrutural existe e já é útil |
| Barrel exports | Bom | Há contrato público inicial entre blocos |
| ZAEA/orchestrator | Muito bom | Melhor exemplo de borda fina + domínio explícito |
| Marketing | Bom | Módulos mais previsíveis e coesos |
| Shared infra | Bom | Infra comum razoavelmente centralizada |
| Checkout | Regular | Domínio existe, mas a borda ainda orquestra demais |
| Webhook Mercado Pago | Fraco | Mistura intensa de integração, regra e efeitos colaterais |
| Core como bounded context | Regular para fraco | Macrodomínio ainda largo demais |
| `services/` legado | Fraco | Mantém duplicidade de padrão arquitetural |
| Páginas de painel com regra comercial | Regular | Ainda misturam UI com operação de negócio |

---

## 5. Refactor mínimo recomendado

### Fase A — Afinar bordas HTTP críticas

Prioridade máxima:

1. Extrair de `app/api/pagamento/iniciar-onboarding/route.ts` um caso de uso único, por exemplo `createOnboardingCheckout()`
2. Extrair de `app/api/webhook/mercadopago/route.ts` um pipeline explícito, por exemplo:
   - `receiveWebhookEvent()`
   - `resolvePaymentState()`
   - `provisionPurchasedDelivery()`
   - `dispatchPostPaymentEffects()`

Resultado esperado: rotas menores, testáveis e com responsabilidade de entrada/saída apenas.

### Fase B — Quebrar o macrodomínio core

Separação sugerida sem reescrever tudo:

- `core-catalog`
- `core-checkout`
- `core-payment`
- `core-onboarding`
- `core-fiscal`

Se não quiser renomear diretórios imediatamente, a versão pragmática é começar com subpastas internas no próprio `lib/domains/core` e expor novos contratos pelo barrel.

### Fase C — Encerrar a duplicidade `services/` versus `lib/domains`

Escolher uma regra única:

- ou migrar `services/*.service.ts` para domínios
- ou declarar formalmente que `services/` é apenas camada de adaptação e não de regra de negócio

No estado atual, a primeira opção é mais coerente com o rumo já adotado no repositório.

### Fase D — Padronizar páginas ricas em regra

Em páginas como `app/painel/planos/page.tsx`, mover:

- cálculo comercial
- regras de elegibilidade
- montagem de payloads de checkout

para helpers ou casos de uso de domínio, deixando o componente com foco em estado de interface.

---

## 6. Veredito final

O projeto não está desorganizado. Pelo contrário: já existe uma espinha dorsal arquitetural compatível com o padrão ZAEA, principalmente em `lib/domains`, nos barrel exports e no domínio ZAEA propriamente dito.

O ponto pendente é disciplina de fronteira. Os blocos existem, mas nas rotas comerciais críticas e em alguns fluxos de painel ainda há mistura excessiva entre camada HTTP, regra de negócio, persistência e integração externa.

Veredito objetivo:

- sim, o projeto já está parcialmente separado em blocos e camadas
- não, ele ainda não está homogêneo no padrão ZAEA
- o maior ganho agora não vem de criar mais pastas, e sim de afinar as bordas críticas e quebrar o macrodomínio core em subcontextos operacionais explícitos

Se essas quatro frentes forem executadas, o sistema sai de “arquitetura promissora com exceções pesadas” para “arquitetura consistente e defensável”.

# PROMPT PhD — Implementação Executiva de Matriz, Filiais e Filtro por Unidade

> **Nível:** PhD/MBA/CTO/Head of Product
> **Projeto:** Cardápio Digital
> **Stack atual:** Next.js App Router + TypeScript + Supabase + Mercado Pago + Vercel
> **Objetivo:** Evoluir o produto de operação por unidade para uma plataforma profissional com **matriz, filiais, filtro por unidade, herança controlada no editor e visão consolidada de pedidos**.
> **Status desta versão:** Documento de execução ancorado no código atual do projeto.

---

## 1. MISSÃO EXECUTIVA

Desenvolver e validar uma camada nativa de **matriz e filiais** sem destruir o fluxo atual de unidade única, mantendo o produto vendável, simples para quem opera só uma loja e poderoso para redes que exigem controle operacional.

### Resultado esperado

Ao final da execução, o sistema deve permitir:

1. uma organização com **múltiplas unidades**
2. uma unidade principal definida como **matriz**
3. filiais com **dados locais próprios**
4. painel com **filtro por unidade**
5. visão consolidada de pedidos da rede
6. editor com **herança controlada** entre matriz e filiais
7. setup assistido ou autoativado por filial
8. testes reais por etapa, sem depender de mocks como prova principal

---

## 2. CONTEXTO REAL DO REPOSITÓRIO

### 2.1 O que já existe hoje

O projeto já opera com o conceito central de `restaurant_id` em múltiplas áreas:

1. pedidos
2. produtos
3. editor
4. painel
5. ativações e assinaturas

### 2.2 Fatos técnicos já confirmados no código

1. O painel já resolve o contexto de unidade ativa via [lib/active-restaurant.ts](lib/active-restaurant.ts).
2. O editor já trabalha orientado por `restaurant.id` em [lib/editor/use-editor-state.ts](lib/editor/use-editor-state.ts).
3. O dashboard atual do painel já calcula métricas e pedidos por unidade única em [app/painel/page.tsx](app/painel/page.tsx).
4. O schema base atual usa `restaurants`, `products`, `orders` e `order_items`, todos acoplados por `restaurant_id` em [supabase/schema.sql](supabase/schema.sql).
5. O projeto já possui histórico de compatibilidade com contexto multi-restaurante no painel, armazenando `active_restaurant_id` em localStorage.

### 2.3 Conclusão arquitetural

O projeto **não precisa ser refeito**. Ele precisa ser elevado de:

- unidade isolada por `restaurant_id`

para:

- organização da rede
- relacionamento entre matriz e filiais
- governança central por organização
- filtro por unidade sobre a base já existente

---

## 3. DIRETRIZES OBRIGATÓRIAS

### 3.1 O que é obrigatório entregar

1. Matriz
2. Filiais
3. Filtro por unidade
4. Dashboard consolidado
5. Pedidos por unidade
6. Herança de editor da matriz para a filial
7. Dados locais por filial
8. Testes reais por etapa
9. Auditoria antes e depois de cada fase

### 3.2 O que NÃO entra neste ciclo

1. ERP fiscal
2. estoque avançado
3. caixa completo enterprise
4. automações financeiras pesadas
5. reescrita total do fluxo atual de unidade

### 3.3 Regra de produto

Toda conta deve nascer compatível com rede, mas:

1. quem tem só uma unidade vê uma experiência simples
2. quem tem plano rede vê matriz, filiais e consolidado

---

## 4. MODELO FUNCIONAL OBRIGATÓRIO

### 4.1 Entidades de negócio

Introduzir a noção de:

1. `organization` ou `network`
2. `restaurant` como unidade operacional
3. uma unidade marcada como `is_headquarters = true`
4. vínculo de várias unidades à mesma organização

### 4.2 Comportamento da matriz

Matriz deve poder:

1. ver pedidos consolidados
2. filtrar por unidade
3. criar filiais
4. publicar base visual/comercial
5. definir o que a filial pode customizar
6. comparar desempenho entre filiais

### 4.3 Comportamento da filial

Filial deve poder:

1. operar a unidade local
2. alterar WhatsApp
3. alterar endereço
4. alterar Google Maps
5. alterar nome da unidade
6. pausar produto localmente
7. ajustar disponibilidade local
8. operar pedidos da própria unidade

### 4.4 Campos herdados da matriz

Devem nascer pré-configurados:

1. logo principal
2. banner padrão
3. identidade visual
4. categorias
5. produtos base
6. estrutura de home
7. ordem visual do cardápio

### 4.5 Campos locais da filial

Devem permanecer editáveis pela unidade:

1. nome da filial
2. telefone / WhatsApp
3. endereço
4. link do Google Maps
5. horário de funcionamento
6. taxa de entrega
7. disponibilidade de produtos
8. exceções operacionais locais

---

## 5. DEFINIÇÃO DE TESTE REAL

Este projeto **não pode se apoiar apenas em teste fake, mockado ou sintético** como evidência de entrega.

### 5.1 Teste real significa

1. rodar contra banco Supabase real do projeto
2. criar registros reais de organização, matriz e filial
3. validar telas reais do painel via browser
4. validar persistência real no banco
5. validar atualização real do editor
6. validar pedido real vinculado à unidade certa
7. validar filtro real no painel

### 5.2 O que pode existir além do teste real

Também devem existir:

1. testes automatizados de regressão
2. smoke tests de rota
3. testes de componente quando necessário

Mas eles são **complementares**, não substitutos da validação real.

### 5.3 Critério mínimo de aceite por fase

Cada fase só pode ser marcada como concluída se tiver:

1. auditoria do que foi alterado
2. checagem de regressão
3. teste real manual guiado
4. registro do resultado

---

## 6. ROTEIRO EXECUTIVO DE IMPLEMENTAÇÃO

## FASE 0 — AUDITORIA DE BASE E PREPARAÇÃO

### Objetivo

Auditar a base atual para identificar tudo que depende diretamente de `restaurant_id` e tudo que precisará ser elevado para `organization + restaurant`.

### Entregáveis

1. mapa de dependências de `restaurant_id`
2. lista de rotas do painel afetadas
3. lista de tabelas afetadas
4. lista de componentes do editor afetados
5. estratégia de migração sem quebrar unidade única

### Auditoria obrigatória

Revisar no mínimo:

1. [lib/active-restaurant.ts](lib/active-restaurant.ts)
2. [app/painel/page.tsx](app/painel/page.tsx)
3. [lib/editor/use-editor-state.ts](lib/editor/use-editor-state.ts)
4. [supabase/schema.sql](supabase/schema.sql)
5. APIs do painel que usam `restaurant_id`

### Testes reais da fase

1. confirmar que o fluxo de unidade única atual ainda funciona
2. registrar comportamento atual antes da migração

### Resultado esperado

Nenhuma linha de código nova sem mapa real de impacto.

---

## FASE 1 — MODELAGEM DE DADOS PARA MATRIZ E FILIAIS

### Objetivo

Introduzir a camada de organização da rede no banco.

### Entregáveis técnicos

Criar migration com:

1. tabela de organizações ou redes
2. vínculo de `restaurants` com `organization_id`
3. coluna para marcar unidade principal
4. coluna de tipo de unidade: `headquarters` ou `branch`
5. campo de nome operacional da filial
6. metadados de herança e permissões

### Regras obrigatórias

1. toda unidade deve pertencer a uma organização
2. toda organização deve ter exatamente uma matriz principal
3. uma filial não pode existir sem organização
4. uma filial deve continuar tendo dados locais próprios

### Auditoria obrigatória

1. revisar índices
2. revisar RLS
3. revisar impacto em queries existentes
4. revisar migração de dados legados

### Testes reais da fase

1. criar uma organização real
2. vincular a unidade atual como matriz
3. criar ao menos uma filial real
4. comprovar persistência no banco

### Critério de aceite

Sem quebrar o funcionamento atual de unidade única.

---

## FASE 2 — CONTEXTO DE PAINEL E FILTRO POR UNIDADE

### Objetivo

Evoluir o contexto atual de restaurante ativo para suportar rede.

### Entregáveis técnicos

1. contexto da organização ativa
2. lista de unidades disponíveis ao usuário
3. seletor de unidade no painel
4. filtro por unidade em páginas centrais
5. fallback para experiência simples quando houver só uma unidade

### Áreas mínimas afetadas

1. dashboard
2. pedidos
3. produtos
4. editor
5. configurações

### Auditoria obrigatória

1. todas as páginas do painel devem respeitar a unidade ativa
2. links internos devem preservar o contexto da unidade
3. localStorage não pode apontar para unidade inválida

### Testes reais da fase

1. logar com uma conta de rede
2. alternar entre matriz e filial
3. confirmar que o painel muda de contexto
4. confirmar que cada unidade exibe seus próprios dados

### Critério de aceite

Filtro por unidade funcionando no painel real sem mistura de dados.

---

## FASE 3 — DASHBOARD DA MATRIZ E VISÃO CONSOLIDADA

### Objetivo

Dar ao dono da rede sensação real de controle.

### Entregáveis técnicos

Dashboard da matriz com:

1. pedidos totais do dia
2. pedidos por período
3. pedidos por unidade
4. status consolidados
5. valor estimado vendido
6. ranking de filiais
7. atalho para entrar no detalhe de cada unidade

### Regras obrigatórias

1. matriz vê consolidado da rede
2. filial vê apenas sua própria operação
3. filtro por unidade deve funcionar em toda visão consolidada

### Auditoria obrigatória

1. validar consistência dos agregados
2. validar queries por período
3. validar performance das consultas
4. validar segurança de acesso entre matriz e filial

### Testes reais da fase

1. criar pedidos reais para matriz e filial
2. verificar separação e consolidado
3. conferir filtros por unidade
4. validar se a matriz sente controle operacional

### Critério de aceite

O painel deve responder claramente:

1. quantos pedidos entraram
2. em qual unidade
3. quais estão pendentes
4. qual unidade performa melhor

---

## FASE 4 — HERANÇA DE EDITOR MATRIZ → FILIAL

### Objetivo

Permitir padronização da rede com autonomia local controlada.

### Entregáveis técnicos

1. configuração base da matriz
2. herança inicial para filiais
3. diferenciação entre campos herdados e locais
4. modo rede no editor
5. publicação controlada

### Regras obrigatórias

1. a filial recebe logo, banner, produtos e estrutura já prontos
2. a filial não desmonta a identidade da rede por padrão
3. a filial ajusta operação local
4. a matriz pode republicar padrão sem destruir dados locais sem confirmação

### Auditoria obrigatória

1. mapear campos herdáveis
2. mapear campos locais
3. impedir overwrite cego
4. versionar a publicação de herança

### Testes reais da fase

1. alterar banner na matriz
2. propagar para filial em ambiente real
3. alterar WhatsApp e endereço na filial
4. confirmar que o local não é sobrescrito indevidamente
5. pausar produto na filial mantendo base da matriz

### Critério de aceite

Herança funcional sem sacrificar operação local.

---

## FASE 5 — SETUP DE MATRIZ E SETUP DE FILIAL

### Objetivo

Suportar comercialmente os dois modelos:

1. filial autoativada
2. filial ativada por vocês

### Entregáveis técnicos

1. fluxo de criação de filial a partir da matriz
2. clonagem do padrão da matriz
3. tela de ativação local da filial
4. checklist de ativação da unidade
5. status de ativação por filial

### Campos mínimos de setup da filial

1. nome da unidade
2. WhatsApp
3. endereço
4. Google Maps
5. horário
6. taxa de entrega
7. disponibilidade local de produtos

### Auditoria obrigatória

1. unidade nova nasce corretamente configurada
2. unidade não nasce pública antes de validação
3. unidade não herda dados locais da matriz indevidamente

### Testes reais da fase

1. criar filial autoativada
2. criar filial assistida
3. publicar filial
4. abrir cardápio público da filial
5. validar pedido indo para o WhatsApp correto

### Critério de aceite

Criação de filial com base pronta e operação local configurável.

---

## FASE 6 — PEDIDOS REAIS POR UNIDADE E OPERAÇÃO DE REDE

### Objetivo

Garantir rastreabilidade operacional por unidade.

### Entregáveis técnicos

1. lista de pedidos com coluna de unidade
2. filtros por unidade e por status
3. visão da matriz sobre todas as unidades
4. visão restrita da filial
5. base pronta para mini-PDV operacional

### Auditoria obrigatória

1. confirmar que pedido nunca cai na unidade errada
2. confirmar que status respeita a unidade
3. confirmar que relatórios usam o filtro corretamente

### Testes reais da fase

1. criar pedidos reais em mais de uma unidade
2. verificar o painel da matriz
3. verificar o painel da filial
4. conferir WhatsApp, total e status por unidade

### Critério de aceite

Pedidos segregados e consolidados corretamente.

---

## FASE 7 — GO-LIVE CONTROLADO DA REDE

### Objetivo

Liberar o módulo rede sem comprometer o produto atual.

### Checklist obrigatório

1. migrações aplicadas e verificadas
2. RLS revisado
3. regressão do modo unidade única validada
4. fluxo matriz e filial validado
5. pedidos reais por unidade validados
6. editor de herança validado
7. logs e auditoria revisados

### Testes reais finais

Executar, no mínimo:

1. criar matriz
2. criar duas filiais
3. publicar matriz e filiais
4. alterar padrão na matriz
5. pausar produto em uma filial
6. gerar pedido real em cada unidade
7. verificar consolidado no painel da matriz
8. verificar filtro por unidade
9. verificar painel local de cada filial

### Critério executivo de go/no-go

Ir para produção apenas se:

1. unidade única continuar estável
2. matriz consolidar corretamente
3. filial operar corretamente
4. editor não sobrescrever operação local indevidamente

---

## 7. TESTES REAIS OBRIGATÓRIOS POR PERFIL

## 7.1 Perfil dono da matriz

1. entra no painel
2. vê o consolidado
3. filtra por unidade
4. cria filial
5. vê pedidos por unidade
6. percebe controle da rede

## 7.2 Perfil gerente da filial

1. entra na própria unidade
2. atualiza WhatsApp
3. atualiza mapa
4. pausa produto local
5. recebe pedido da unidade correta

## 7.3 Perfil cliente final

1. abre link público da filial no celular
2. adiciona item
3. finaliza pedido
4. abre WhatsApp da filial correta

---

## 8. AUDITORIA CONTÍNUA POR ETAPA

Em toda fase, executar esta rotina:

1. auditar schema
2. auditar permissões
3. auditar impacto no painel
4. auditar impacto no editor
5. auditar regressão em unidade única
6. registrar evidências do teste real

### Evidência mínima de cada fase

1. arquivos alterados
2. migração aplicada
3. screenshots ou registro textual do teste real
4. bugs encontrados
5. correções aplicadas
6. pendências remanescentes

---

## 9. PROMPT EXECUTÁVEL PARA AGENTE DE IMPLEMENTAÇÃO

Use o texto abaixo como prompt operacional de execução:

```md
Você é um arquiteto principal de produto e engenharia, nível PhD, responsável por implementar no projeto Cardápio Digital a camada de matriz, filiais, filtro por unidade e herança controlada do editor.

Seu objetivo é executar a evolução do sistema em fases, sem quebrar o fluxo atual de unidade única.

Contexto obrigatório:

- O projeto já usa `restaurant_id` em pedidos, produtos, editor e painel.
- O contexto atual da unidade ativa passa por `lib/active-restaurant.ts`.
- O dashboard atual está em `app/painel/page.tsx`.
- O editor atual usa `restaurant.id` em `lib/editor/use-editor-state.ts`.
- O schema base atual está em `supabase/schema.sql`.

Restrições obrigatórias:

- Não reescrever o sistema do zero.
- Não quebrar unidade única.
- Não usar teste fake como prova principal.
- Toda fase deve ter auditoria antes e depois.
- Toda fase deve ter teste real com dados reais.

Fases obrigatórias:

1. Auditoria da base atual.
2. Modelagem de organização, matriz e filial.
3. Filtro por unidade no painel.
4. Dashboard consolidado da matriz.
5. Herança controlada do editor.
6. Setup de matriz e filial.
7. Pedidos reais por unidade.
8. Go-live controlado.

Definição de sucesso:

- matriz enxerga consolidado e filtra por unidade
- filial opera com dados locais próprios
- editor herda padrão da matriz sem destruir dados locais
- pedidos ficam corretamente segregados por unidade
- cliente final abre WhatsApp da unidade correta

Para cada fase, você deve:

1. mapear arquivos afetados
2. implementar o menor conjunto de mudanças coerente
3. validar com testes automatizados e teste real
4. registrar auditoria do que foi alterado
5. só seguir para a fase seguinte se a fase anterior estiver funcional
```

---

## 10. ORDEM DE EXECUÇÃO RECOMENDADA HOJE

Se a execução começar agora, seguir nesta ordem:

1. Fase 0 — auditoria de base
2. Fase 1 — migration de organização, matriz e filial
3. Fase 2 — filtro por unidade no painel
4. Fase 3 — consolidado da matriz
5. Fase 4 — herança do editor
6. Fase 5 — setup da filial
7. Fase 6 — pedidos reais por unidade
8. Fase 7 — validação final e go-live

### Observação executiva

O produto deve ser vendido como plataforma profissional de rede, mas a implementação deve ser conduzida com disciplina de escopo, auditoria permanente e validação real a cada etapa.

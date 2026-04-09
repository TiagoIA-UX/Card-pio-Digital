# Relatório — Plano Semente, Evidência Real e Monitoramento

Data: 09/04/2026

## 1. Conclusão executiva

- A evidência atual do repositório não sustenta aumento forte de otimismo comercial sobre adoção do Plano Semente.
- O nome técnico Plano Semente deve ficar interno; a exibição comercial precisa ser mais clara para o cliente final.
- Cobrar por pedido excedente aproximaria o produto do modelo mental de taxa por pedido e enfraqueceria a diferenciação frente a marketplace.
- O melhor caminho é usar limites de escopo de produto, não monetização por pedido.
- O ForgeOps AI já monitora saúde operacional e parte das métricas de negócio, mas ainda não monitora pressão por volume, sazonalidade e saturação por plano.

## 2. O que o repositório prova hoje

### 2.1 Pricing e colisão de valor

Em `lib/domains/marketing/pricing.ts`, o plano de entrada foi rebaixado para reduzir colisão com o self-service simples:

- mensalidade: R$ 14,90
- anual: R$ 149,90
- ativação PIX: R$ 19,90
- limite: 15 produtos
- limite: 60 pedidos/mês
- nichos permitidos no onboarding de entrada: lanchonete, açaí, cafeteria, sorveteria e doceria

No mesmo arquivo, há nichos simples com implantação self-service de R$ 197 e recorrência do plano principal, por exemplo:

- açaí: média de 10 a 25 produtos
- lanchonete: média de 15 a 35 produtos
- sorveteria: média de 15 a 30 produtos
- doceria: média de 15 a 35 produtos

Conclusão: o plano de entrada ficou mais compatível com validação de canal e menos próximo do self-service profissional simples.

### 2.2 Evidência de pedidos reais no repositório

Para decisão de preço, plano e posicionamento, só vale dado observado. Tudo que não vier de telemetria, base oficial ou operação registrada deve ser tratado como inválido para decisão.

Itens encontrados no repositório:

- `ESTRATEGIA_VENDAS.md`: cenário comercial de 300 pedidos/mês para pizzaria
- `app/beneficios/page.tsx`: afirmação comercial de aumento sazonal
- `app/painel/metricas/page.tsx`: o sistema já calcula pedidos do mês, ticket médio e faturamento por delivery
- `backend/sentinel.py`: o ForgeOps já gera relatório semanal com pedidos e ticket médio agregados

Conclusão: o produto já mede operação, mas ainda não há uma base consolidada suficiente para afirmar média mensal por nicho no Litoral Norte com rigor. Os trechos comerciais acima não devem ser usados como base de decisão até virarem dado observado.

## 3. Dá para mudar a evidência atual para aumentar o otimismo?

Resposta curta: não de forma honesta.

Só dá para elevar o otimismo se existirem novos dados reais de:

- pedidos por delivery por mês
- ticket médio por nicho
- sazonalidade por cidade
- churn por faixa de uso
- conversão por tipo de oferta

Sem isso, qualquer aumento de otimismo comercial seria narrativa sem base observada.

## 4. Nome do plano

O nome Plano Semente não é ruim, mas tem dois problemas:

- soa interno demais
- não comunica benefício concreto na primeira leitura

Nomes mais fortes para cliente final:

- Plano Começo
- Plano Entrada
- Plano Giro
- Plano Essencial
- Plano Vitrine

Recomendação adotada: `Plano Começo` como nome comercial visível. O slug técnico pode permanecer `semente` por compatibilidade interna.

## 5. Limitar pedidos é uma boa ideia?

Limitar pedidos como trava operacional pode existir.

Cobrar taxa por pedido excedente não é boa ideia.

### 5.1 O problema de cobrar por pedido excedente

Se o cliente entender que pagará mais conforme vender mais, o produto começa a parecer com:

- comissão indireta
- pedágio de crescimento
- lógica parecida com marketplace

Isso enfraquece o argumento central de canal próprio.

### 5.2 O que concorrentes fazem

O próprio repositório já mapeia um caso importante em `RELATORIO_CONCORRENTES_RECEITA.md`:

- Consumer usa plano grátis até 200 pedidos

Isso mostra que limite de volume como régua de plano existe no mercado.

Mas existe uma diferença importante:

- limitar o plano é uma coisa
- cobrar taxa por pedido excedente é outra

Recomendação: se houver limite, ele deve disparar upgrade de plano, não cobrança variável por pedido.

## 6. O que faz mais sentido limitar

Para não parecer iFood, a limitação principal deve ser de escopo de produto:

- quantidade de produtos
- recursos avançados
- IA
- domínio próprio
- remoção da marca Zairyx
- catálogo pré-carregado completo
- suporte humano
- multi-unidade
- pagamento online

O limite de pedidos, se existir, deve ser apenas um guardrail de plano muito básico. Não deve virar eixo principal da monetização.

## 7. Régua mais plausível para o plano de entrada

Se a meta é não matar o self-service simples, a régua mais coerente é:

- 12 a 15 produtos
- sem cobrança por pedido excedente
- no máximo 1 template simples
- sem pagamento online
- sem IA
- com marca Zairyx
- com upgrade claro para plano principal

Se ainda quiser um guardrail de volume, usar apenas como trava de upgrade e não de cobrança:

- até 50 pedidos/mês, com recomendação automática de upgrade ao encostar no teto

## 8. Quantos pedidos eles têm em média por mês?

Hoje, o único caminho aceitável é telemetria real.

### 8.1 O que o sistema já consegue medir

Por delivery, o painel já calcula:

- pedidosHoje
- pedidosSemana
- pedidosMes
- faturamentoHoje
- faturamentoSemana
- faturamentoMes
- ticketMedio

### 8.2 O que ainda falta para chamar de dado real de mercado

- percentil por nicho
- média por cidade
- curva mensal por temporada
- relação entre catálogo e volume
- comportamento de micro operação versus operação madura
- histórico de reajuste de planos
- correlação entre inflação oficial e preço praticado

## 9. O sistema suporta sazonalidade?

Hoje o repositório mostra capacidade de monitorar saúde de infraestrutura, com:

- tamanho de banco
- uso do banco
- conexões ativas
- queries lentas

Isso já existe em `app/api/cron/sentinel/route.ts`.

Além disso, o ForgeOps semanal já resume:

- receita do período
- número de pedidos
- ticket médio
- saúde da plataforma

Isso existe em `backend/sentinel.py`.

Conclusão: o sistema já tem base para detectar estresse operacional geral. O que falta é correlacionar isso com volume por plano, nicho e sazonalidade.

## 10. O que o ForgeOps AI deve monitorar daqui para frente

O monitoramento certo para essa discussão não é só técnico. É técnico + produto + negócio.

O ForgeOps deve acompanhar:

- pedidos por delivery por dia, semana e mês
- percentil 50, 80, 95 de pedidos por nicho
- picos por feriado e verão
- taxa de ativação por plano
- taxa de upgrade do plano de entrada
- uso médio de produtos cadastrados por nicho
- proximidade de saturação de plano
- correlação entre volume de pedidos e conexões lentas
- incidentes por faixa de volume
- inflação oficial acumulada e mensal
- divergência entre reajuste econômico e preço vigente dos planos
- sobreposição operacional entre planos
- sinais de incoerência legal/comercial entre promessa e uso real

## 11. Decisão recomendada

### 11.1 Produto

- Não usar cobrança por pedido excedente.
- Não usar o limite de pedidos como eixo principal do plano.
- Rebaixar o plano de entrada para não colidir com self-service simples.

### 11.2 Nome

- Trocar `Plano Semente` por `Plano Começo` ou `Plano Essencial`.

### 11.3 Evidência

- Não usar hipótese comercial como base de precificação.
- Não usar copy promocional como proxy de demanda.
- Aceitar apenas telemetria interna e fonte oficial externa para revisão estratégica.

### 11.4 Operação

- Usar o ForgeOps para transformar dados de pedidos e sazonalidade em inteligência de produto.

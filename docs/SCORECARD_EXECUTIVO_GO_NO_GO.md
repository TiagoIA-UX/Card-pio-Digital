# Scorecard Executivo de Go/No-Go

Objetivo: consolidar em uma unica pagina a decisao operacional de release do Cardapio Digital.

Regra principal:

Este documento nao existe para justificar release.
Ele existe para bloquear release inseguro.

## Identificacao da rodada

- Data: 2026-03-23
- Responsavel: GitHub Copilot + historico operacional da conversa
- Build ou commit: 45e99d6 publicado para a correcao de Meus Templates; ha outras alteracoes locais nao publicadas
- Ambiente testado: validacao local + verificacoes de producao relatadas durante a conversa
- Escopo do release: compra, liberacao, painel, Meus Templates ou Meus Cardapios e acesso comercial ao painel

## Fontes obrigatorias avaliadas

Marque apenas quando houver evidencia real.

- [ ] Validacao tecnica minima concluida
- [ ] Teste real executado
- [ ] Registro de go-live preenchido
- [ ] Auditoria cliente burro/real/apressado executada
- [ ] Benchmark externo executado

## Classificacao executiva

Escolha apenas uma:

- [ ] GO
- [ ] GO COM RISCO CONTROLADO
- [x] NO-GO

## Regra de preenchimento

- GO: so quando nao houver bloqueador critico aberto.
- GO COM RISCO CONTROLADO: apenas se nao houver risco de perder venda, perder confianca ou exigir suporte manual para ativacao.
- NO-GO: obrigatorio se houver qualquer falha estrutural de compra, liberacao, consistencia ou primeiro uso.

## Score das areas criticas

Use:

- Verde = aceitavel para release
- Amarelo = funcional com risco perceptivel
- Vermelho = bloqueador ou quase bloqueador

| Area                                     | Status   | Evidencia                                                                                                                          | Impacto em receita | Impacto em suporte | Impacto em confianca | Acao imediata                                                       |
| ---------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------ | -------------------- | ------------------------------------------------------------------- |
| Landing e proposta de valor              | Amarelo  | Nao houve teste real recente registrado nesta conversa; sem evidência suficiente para verde                                        | Medio              | Baixo              | Medio                | Validar com teste real e cronometro                                 |
| Escolha de template                      | Amarelo  | Fluxo existe, mas nao houve validacao real ponta a ponta documentada nesta rodada                                                  | Medio              | Medio              | Medio                | Executar teste real de escolha e compra                             |
| Login e preservacao de contexto          | Vermelho | Historico relatou risco de inconsistencia de sessao e perda de contexto entre compra e acesso                                      | Alto               | Alto               | Alto                 | Rodar teste real em sessao limpa, relogin e multiplos dispositivos  |
| Checkout                                 | Amarelo  | Implementado, mas sem validacao real recente com compra fechada nesta rodada                                                       | Alto               | Medio              | Alto                 | Rodar compra real e observar friccao                                |
| Pagamento                                | Amarelo  | Integracao em producao ja tratada, mas sem teste real conclusivo registrado agora                                                  | Alto               | Alto               | Alto                 | Fazer compra real PIX e cartao                                      |
| Retorno do pagamento                     | Vermelho | Foi identificado risco de cliente pagar e nao entender com clareza o proximo passo                                                 | Alto               | Alto               | Alto                 | Validar pos-pagamento com evidencia e cronometro                    |
| Liberacao automatica                     | Vermelho | Delay entre pagamento e liberacao foi apontado como risco critico; nao ha rodada real concluida que derrube essa suspeita          | Alto               | Alto               | Alto                 | Executar teste real instrumentado e medir tempo de liberacao        |
| Meus Templates ou Meus Cardapios         | Vermelho | Havia bug real de vinculacao errada para restaurante/cardapio; houve correcao, mas ainda sem validacao real registrada apos deploy | Alto               | Alto               | Alto                 | Testar em producao o fluxo pos-compra e selecao do cardapio correto |
| Provisionamento do restaurante           | Amarelo  | Fluxo existe e teve reforco de regra comercial, mas sem prova recente de compra real completa sem intervencao                      | Alto               | Alto               | Alto                 | Confirmar provisionamento apos compra aprovada                      |
| Onboarding                               | Amarelo  | Nao foi auditado com usuario real ou simulado nesta rodada                                                                         | Medio              | Medio              | Alto                 | Rodar auditoria de vendabilidade                                    |
| Consistencia entre sessao e dispositivos | Vermelho | O proprio historico definiu isso como risco altissimo e ainda sem validacao conclusiva cruzada                                     | Alto               | Alto               | Alto                 | Testar desktop, anonima, mobile e relogin                           |
| Observabilidade e rastreabilidade        | Amarelo  | Existe documentacao e ordem de consulta, mas nao ha teste real final confirmando rastreio em menos de 2 minutos                    | Medio              | Medio              | Medio                | Executar rastreio com order_number, payment_id e user_id            |

## Bloqueadores criticos

Liste aqui apenas o que de fato impede venda segura.

| Bloqueador                                                                                                                             | Fonte da evidencia                                                          | Severidade | Dono                   | Prazo | Status |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------- | ---------------------- | ----- | ------ |
| Compra aprovada sem validacao real conclusiva de liberacao automatica nesta rodada                                                     | Historico operacional da conversa + risco explicitamente mapeado no go-live | Critica    | Engenharia             | 24h   | Aberto |
| Fluxo Meus Templates ou Meus Cardapios tinha vinculacao errada para restaurante e ainda nao foi revalidado em producao apos a correcao | Bug real reportado por uso + correcao publicada sem teste final registrado  | Critica    | Engenharia             | 24h   | Aberto |
| Consistencia entre sessao, relogin, anonima e mobile nao foi comprovada em teste real final                                            | Regra de nao negociacao do go-live ainda sem evidência preenchida           | Critica    | Engenharia + Operacoes | 24h   | Aberto |

## Riscos altos, mas nao bloqueadores

| Risco                                                                           | Fonte da evidencia                                                                  | Impacto | Mitigacao                                                          | Prazo |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------ | ----- |
| Landing e escolha de template ainda sem auditoria de vendabilidade executada    | Ausencia de teste com cliente burro/real/apressado                                  | Medio   | Rodar prompt de vendabilidade e cruzar com teste real              | 48h   |
| Observabilidade documentada, mas nao comprovada sob incidente real desta rodada | Checklist e registro existem, mas faltou execucao final                             | Medio   | Executar uma compra e rastrear ponta a ponta em menos de 2 minutos | 24h   |
| Alteracoes locais fora do escopo ainda existem no working tree                  | git status atual mostra arquivo modificado em app/painel/criar-restaurante/page.tsx | Medio   | Separar, revisar e isolar antes de novo release                    | 24h   |

## Leitura financeira fria

Preencha com base em impacto real, nao em preferencia tecnica.

### O que mais reduz conversao hoje

1. Qualquer ambiguidade entre pagamento aprovado e liberacao percebida
2. Friccao de login com perda de contexto de compra
3. Dúvida sobre o que exatamente acontece depois de pagar

### O que mais reduz ativacao hoje

1. Compra aparecer no lugar errado ou nao aparecer de forma confiavel em Meus Templates ou Meus Cardapios
2. Inconsistencia entre sessao atual, relogin e outro dispositivo
3. Provisionamento sem clareza de proximo passo

### O que mais aumenta risco de suporte manual

1. Cliente pagar e nao enxergar imediatamente o que comprou
2. Necessidade de validar manualmente se a compra ficou ligada ao restaurante certo
3. Inconsistencia entre desktop, anonima e mobile

### O que mais aumenta risco de chargeback ou perda de confianca

1. Pagamento aprovado sem sensacao clara de entrega
2. Cardapio ou restaurante errado associado a compra
3. Cliente precisar de refresh, relogin ou ajuda humana para acessar o que comprou

## Veredito das tres frentes

### 1. Teste real

- Resultado: nao concluido nesta rodada
- O fluxo passou sem ajuda humana? nao comprovado
- O cliente recebeu o que comprou com clareza? nao comprovado
- Houve refresh, relogin ou espera ambigua? risco ainda aberto e nao derrubado por evidencia final

### 2. Auditoria de vendabilidade

- Classificacao recebida: nao executada ainda; leitura preliminar indica no maximo VENDAVEL COM RISCO e mais provavelmente NO-GO ate prova contraria
- Principais bloqueadores: pos-pagamento, liberacao, consistencia e local correto da compra
- Principais riscos: perda de confianca, abandono e suporte manual

### 3. Benchmark externo

- Nosso nivel comparativo hoje: nao concluido; benchmarking estruturado foi preparado, mas ainda nao executado formalmente
- Principais gaps estruturais: onboarding confiavel, pos-pagamento e coerencia operacional ponta a ponta
- Principais oportunidades de melhoria: endurecer fluxo de liberacao, rastreabilidade e experiencia de primeiro uso

## Regra binaria final

Marque sim ou nao.

- [ ] O cliente entende o produto em segundos
- [ ] O cliente entende o que compra antes de pagar
- [ ] O cliente paga sem sentir risco excessivo
- [ ] O cliente entende o que aconteceu depois do pagamento
- [ ] O cliente recebe acesso sem depender de suporte
- [ ] O cliente encontra a compra no local certo
- [ ] O cliente consegue iniciar o primeiro uso sem confusao
- [ ] O sistema se comporta igual entre sessao e dispositivo
- [ ] O time consegue rastrear qualquer compra em menos de 2 minutos
- [ ] Nao ha bloqueador critico aberto

## Decisao executiva final

Preencha sem narrativa longa.

- Decisao:
- Decisao: NO-GO
- Motivo principal: faltam evidencias reais e cruzadas de que compra, liberacao, consistencia entre sessao ou dispositivo e exibicao correta em Meus Templates ou Meus Cardapios funcionam sem suporte humano
- O que precisa acontecer antes do proximo release: executar teste real completo, validar o fluxo corrigido de Meus Templates ou Meus Cardapios, medir liberacao automatica, confirmar consistencia em relogin, anonima e mobile, e preencher este scorecard com evidencias reais
- Data sugerida para nova avaliacao: imediatamente apos a rodada instrumentada de teste real

## Assinatura operacional

- Produto:
- Engenharia: pendente de validacao final com teste real
- Operacoes: pendente de confirmacao go-live
- Responsavel final pela decisao: fundador ou responsavel operacional do release

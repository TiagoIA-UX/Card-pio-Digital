# PROMPT PHD — AUDITORIA DE PREÇOS, VALOR E COERÊNCIA DO FUNIL PÚBLICO

## CONTEXTO ESTRATÉGICO

Você é um auditor sênior de produto, pricing, copywriting, UX comercial e arquitetura de funil.
Sua missão é revisar todo o ecossistema público do Cardápio Digital para garantir que:

1. toda menção a preço, plano, valor, assinatura, mensalidade, anualidade, implantação, oferta ou cobrança esteja coerente com o modelo comercial público vigente;
2. todo CTA, link, preview, rota de transição e página legada conduza o usuário para a jornada correta;
3. a comunicação siga o que já foi validado no mercado brasileiro de cardápio digital: preço transparente, baixa ambiguidade de cobrança, clareza de contratação e redução de fricção no checkout;
4. nenhuma copy pública faça o visitante sentir risco de dupla cobrança, taxa escondida, cancelamento obscuro ou promessa desalinhada com o software real.

## VERDADE COMERCIAL ATUAL

- O fluxo público atual começa pela escolha do template e do modelo de implantação.
- O checkout público atual aprova a taxa inicial de implantação, em PIX ou cartão.
- O produto não deve ser apresentado como compra vitalícia ou “pague uma vez e fique para sempre”.
- O cardápio opera como SaaS e exige plano mensal correspondente para manter hospedagem, painel, link público e operação ativa.
- Os modelos públicos atuais são Faça Você Mesmo e Feito Pra Você.
- Implantação e mensalidade precisam ser comunicadas como cobranças diferentes, com papéis diferentes.
- A jornada pública principal é: landing -> templates/ofertas/precos -> comprar/[template] -> Mercado Pago -> provisionamento.

## BASE DE VALIDAÇÃO DE MERCADO

Use como referência os aprendizados já documentados no repositório:

- ANALISE_MERCADO_UX.md
- docs/ANALISE_MERCADO.md
- AUDITORIA_MARKETING_COPYWRITING.md

Premissas estratégicas já validadas internamente:

- mercado pune preço confuso, cobrança divergente do combinado e cancelamento difícil;
- transparência de preço aumenta confiança e reduz abandono;
- CTA deve levar para a próxima etapa real do funil, não para rota legada;
- o visitante precisa entender rapidamente quanto paga agora, quanto mantém por mês, o que recebe e por que existem duas camadas de cobrança.

## O QUE AUDITAR

### 1. Linguagem comercial pública

Audite todas as menções a:

- plano
- preço
- valor
- mensalidade
- assinatura
- anual
- implantação
- pagamento
- taxa
- comissão
- oferta

Classifique cada ocorrência em uma destas categorias:

- coerente com o fluxo público atual;
- ambígua e precisa de ajuste;
- incorreta e precisa ser corrigida;
- legado técnico que precisa ser explicitamente marcado como desativado.

### 2. Redirecionamento e continuidade de funil

Audite se os links e CTAs públicos estão levando para o destino correto:

- landing principal
- ofertas
- preços
- templates
- preview de template
- checkout legado
- rotas de compra removidas
- login com redirect

Objetivo:

- evitar links para rotas antigas;
- evitar CTA que promete uma etapa diferente da etapa real seguinte;
- evitar que páginas legadas ensinem uma jornada que não existe mais.

### 3. Consistência entre produto, copy e páginas auxiliares

Valide coerência entre:

- páginas públicas;
- checkout;
- chat comercial;
- rotas-ponte e mensagens de depreciação;
- comentários técnicos que podem induzir futura regressão de copy;
- blocos de preview e cards de template.

## CRITÉRIOS DE CORREÇÃO

Quando corrigir, siga estas regras:

1. preferir linguagem simples e comercialmente segura;
2. explicitar a diferença entre implantação inicial e plano mensal quando houver risco de interpretação errada;
3. manter preço transparente desde a primeira tela relevante;
4. evitar comparações específicas com concorrentes sem necessidade;
5. evitar métricas ou números promocionais não comprovados;
6. trocar nomes de CTA genéricos quando eles induzirem leitura errada do funil;
7. preservar a proposta central: autonomia no painel ou implantação feita pela equipe.

## ENTREGÁVEIS ESPERADOS

1. lista objetiva dos desalinhamentos encontrados;
2. agrupamento por impacto no funil;
3. plano de correção priorizado;
4. aplicação das correções nos arquivos críticos do funil público;
5. validação final para confirmar que a jornada pública não comunica compra vitalícia, nem esconde mensalidade, nem mistura etapas de cobrança.

## PRIORIDADE DE EXECUÇÃO

Corrija primeiro:

1. landing e seções de conversão;
2. páginas de templates, previews e cards;
3. ofertas e preços;
4. rotas legadas e redirecionamentos;
5. chat comercial e textos auxiliares;
6. comentários técnicos que possam reintroduzir copy errada no futuro.

## RESULTADO IDEAL

Ao final da auditoria, o visitante deve entender sem esforço:

- o que compra;
- quanto paga agora;
- quanto mantém por mês;
- a diferença entre Faça Você Mesmo e Feito Pra Você;
- que a jornada pública atual começa pela implantação do template;
- que o cardápio continua no plano mensal correspondente;
- que não existe “pagamento único para sempre” escondido na promessa comercial.

# 📊 RELATÓRIO ESTRATÉGICO — Reestruturação da Landing Page Zairyx

> **Data**: 09/04/2026  
> **Autor**: Análise IA (Copilot) a pedido do Owner  
> **Escopo**: Reestruturação completa da página de vendas (`app/page.tsx`)  
> **Base**: Briefing do owner (áudio) + auditoria técnica da landing atual (18 seções)

---

## 1. DIAGNÓSTICO DA LANDING ATUAL

### O que está certo ✅

- **Prova social** funciona (0% comissão, 16 nichos, 30 min)
- **Calculadora de economia** é forte conversor (já existe, lazy-loaded)
- **FAQ** reduz objeções (lazy-loaded)
- **Editor visual + screenshots** dão tangibilidade ao produto
- **Templates reais** com CTA por nicho geram conversão segmentada
- **Página Google Meu Negócio** já existe com oferta de R$ 350

### O que está errado ❌

| Problema                                                    | Impacto                                                                  | Prioridade     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ | -------------- |
| **Hero fala de produto, não de resultado financeiro**       | Quem chega não sente "vou ganhar mais dinheiro" nos primeiros 5 segundos | CRÍTICO        |
| **Calculadora está na 7ª posição** — longe do topo          | O argumento mais forte (dados concretos de economia) está escondido      | ALTO           |
| **Google Meu Negócio está desconectado da narrativa**       | Aparece como "teaser solto" entre diferenciais e calculadora             | ALTO           |
| **Comparativo com concorrentes está na 16ª posição**        | O prospect já desistiu antes de chegar lá                                | MÉDIO          |
| **Blocos não conversam entre si** — são ilhas de informação | Não existe narrativa progressiva que guie o prospect para a compra       | CRÍTICO        |
| **Falta canal de fidelização/feedback visível**             | Prospect não sabe que pode ser ouvido após contratar                     | MÉDIO          |
| **Não existe e-book/guia educacional**                      | Perde oportunidade de captura de lead frio                               | BAIXO (fase 2) |

---

## 2. NOVA ARQUITETURA PROPOSTA

### Princípio: **Conversa Progressiva com Neuroancoragem**

Cada bloco é uma "fala" numa conversa real. O prospect lê e pensa:  
_"Isso sou eu" → "Estou perdendo dinheiro" → "Tem uma saída simples" → "E os concorrentes?" → "Ok, quero."_

### Nova ordem dos blocos (13 seções):

```
┌─────────────────────────────────────────────────────────────────┐
│  ① HERO — RESULTADO FINANCEIRO (não produto)                   │
│     "Você tem iFood e entregador próprio?                      │
│      Então está pagando comissão desnecessária."                │
│     → Ancoragem: +R$ 3.000/mês que voltam pro seu bolso        │
│     → CTA: "Calcule quanto está perdendo"                      │
│     → Sub-CTA: "Ver como funciona"                             │
├─────────────────────────────────────────────────────────────────┤
│  ② PROVA SOCIAL NUMÉRICA (compacta, mesma que hoje)            │
│     0% comissão · 16 nichos · 30 min · + margem                │
├─────────────────────────────────────────────────────────────────┤
│  ③ CALCULADORA DE ECONOMIA ← sobe para posição 3              │
│     SavingsCalculator (lazy) — o prospect vê SEUS números      │
│     → Neuro: "perda aversiva" — mostra quanto PERDE por mês    │
├─────────────────────────────────────────────────────────────────┤
│  ④ TRANSIÇÃO CONVERSACIONAL                                    │
│     "Ok, mas se eu tirar o iFood, como faço marketing?"        │
│     → A resposta é: Google Meu Negócio                         │
├─────────────────────────────────────────────────────────────────┤
│  ⑤ GOOGLE MEU NEGÓCIO — Expansão (não teaser)                  │
│     Turistas + busca local + raio 800m + link direto           │
│     → CTA: "Saiba como configurar" → /google-meu-negocio      │
│     → Oferta: "Configuramos pra você por R$ 350"               │
│     → E-book gratuito: "Passo a passo pra aparecer no Google"  │
├─────────────────────────────────────────────────────────────────┤
│  ⑥ TRANSIÇÃO: "E os outros sistemas que fazem cardápio?"       │
│     → "Eles vieram agora. Nós já estamos aqui.                 │
│        Veja a diferença com dados reais."                      │
├─────────────────────────────────────────────────────────────────┤
│  ⑦ COMPARATIVO SaaS RESUMIDO (inline) + CTA pro /comparativo  │
│     Tabela compacta: Anota AI vs Consumer vs Saipos vs Zairyx  │
│     → Destaque: Reclame Aqui, cancelamento, preço escondido    │
│     → CTA: "Ver análise completa com dados reais →"            │
├─────────────────────────────────────────────────────────────────┤
│  ⑧ COMO FUNCIONA — 3 passos (mantém)                           │
│     Escolher → Editar → Publicar                               │
├─────────────────────────────────────────────────────────────────┤
│  ⑨ PRODUTO VISUAL — Screenshots + IA (mantém)                  │
│     Dashboard + editor + 3 features (IA, mobile, segurança)    │
├─────────────────────────────────────────────────────────────────┤
│  ⑩ TEMPLATES POR NICHO (mantém)                                │
│     6 top templates + strip de todos os nichos                 │
├─────────────────────────────────────────────────────────────────┤
│  ⑪ DEPOIMENTOS + FIDELIZAÇÃO                                   │
│     Testimonials (mantém) + NOVO bloco: "Somos ouvidos"        │
│     → "Tem sugestão? Feedback? Estamos aqui."                  │
│     → Canal de feedback + compromisso de implementação rápida  │
├─────────────────────────────────────────────────────────────────┤
│  ⑫ PRICING + FAQ (condensado)                                  │
│     R$ 147/mês + inclusões + FAQ accordion                     │
├─────────────────────────────────────────────────────────────────┤
│  ⑬ CTA FINAL — Urgência + Garantia                             │
│     "Seu delivery pronto em minutos" + 7 dias arrependimento   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. TÉCNICAS NEUROCOMPORTAMENTAIS APLICADAS

### 3.1 — Aversão à Perda (Loss Aversion)

- **Onde**: Hero + Calculadora (blocos ① e ③)
- **Como**: "Quanto você está **perdendo** por mês?" em vez de "Quanto pode **economizar**?"
- **Dado**: Pesquisas de Kahneman mostram que a dor da perda é 2x mais forte que o prazer do ganho
- **Legal**: Usa dado real (taxas iFood publicadas) — verificável

### 3.2 — Ancoragem de Preço (Price Anchoring)

- **Onde**: Calculadora → Pricing
- **Como**: Primeiro mostra R$ 3.150/mês de taxas, depois mostra R$ 147/mês da Zairyx
- **Efeito**: R$ 147 parece absurdamente barato depois de ver R$ 3.150
- **Legal**: Comparação legítima baseada em dados públicos do blog de parceiros iFood

### 3.3 — Prova Social Sequencial

- **Onde**: Prova numérica (②) → Depoimentos (⑪) → Reclame Aqui concorrentes (⑦)
- **Como**: "Nosso sistema" + "o que clientes dizem" + "o que clientes DE OUTROS dizem"
- **Efeito**: Triangulação de confiança — 3 fontes diferentes

### 3.4 — Transição Conversacional (Objection Bridging)

- **Onde**: Blocos ④ e ⑥ (transições)
- **Como**: Antecipa a objeção mental do prospect e responde antes dele perguntar
- **Exemplo**: "Ok, mas se eu tirar o iFood, como faço marketing?" → Google Meu Negócio
- **Efeito**: O prospect sente que o texto foi escrito para ele pessoalmente

### 3.5 — Efeito Ikea (Ownership Effect)

- **Onde**: Calculadora interativa (③) + Editor visual (⑨)
- **Como**: O prospect manipula os números E vê o editor. Ele "experimenta" o produto antes de comprar
- **Legal**: Nenhum dado pessoal coletado na calculadora

### 3.6 — Compromisso de Escuta (Fidelização)

- **Onde**: Bloco ⑪ (novo sub-bloco)
- **Como**: "Tem sugestão? Feedback? Implementamos rápido."
- **Efeito**: Reduz medo de ficar preso em produto que não evolui (dor real do mercado — Saipos 17 dias de resposta)

---

## 4. SOBRE O E-BOOK GOOGLE MEU NEGÓCIO

### Análise de viabilidade

| Opção                                             | Prós                                     | Contras                                       | Recomendação  |
| ------------------------------------------------- | ---------------------------------------- | --------------------------------------------- | ------------- |
| **E-book PDF**                                    | Lead capture, autoridade, compartilhável | Precisa de infraestrutura de e-mail marketing | Fase 2        |
| **Blog post inline**                              | Rápido de implementar, SEO, acessível    | Não captura lead                              | ✅ **Fase 1** |
| **Página guia** (tipo `/guia/google-meu-negocio`) | Best of both worlds, SEO + autoridade    | Um pouco mais de trabalho                     | ✅ **Ideal**  |

### Recomendação

**Fase 1 (agora)**: Criar uma página `/guia/google-meu-negocio` com passo a passo visual (screenshots, 5 etapas). Gratuita, sem gate. Gera autoridade e SEO.

**Fase 2 (após validação)**: Converter em PDF + formulário de captura de lead para email marketing. Mas só faz sentido quando houver automação de e-mail configurada.

---

## 5. SOBRE O CHECKOUT DO SERVIÇO GOOGLE MEU NEGÓCIO (R$ 350)

### Situação atual

- A página `/google-meu-negocio` tem a oferta de R$ 350
- O CTA atual é um **mailto:** para `zairyx.ai@gmail.com`
- **Não tem checkout automatizado** — é manual

### Opções

| Opção                                      | Complexidade             | Conversão esperada                |
| ------------------------------------------ | ------------------------ | --------------------------------- |
| **A) Manter mailto** (atual)               | Zero                     | Baixa — exige effort do prospect  |
| **B) WhatsApp com mensagem pré-formatada** | Mínima (troca link)      | Média — mais natural pro público  |
| **C) Checkout com Mercado Pago**           | Média (nova rota + flow) | Alta — automatizado, profissional |

### Recomendação

**Curto prazo**: Opção B — trocar mailto por link WhatsApp com mensagem pré-formatada:

```
https://api.whatsapp.com/send?phone=SEUNUMERO&text=Olá! Quero contratar o serviço de configuração do Google Meu Negócio por R$ 350.
```

**Médio prazo**: Opção C — criar checkout dedicado quando houver demanda validada (>5 conversões manuais).

---

## 6. CANAL DE FIDELIZAÇÃO / FEEDBACK

### O que existe

- API `/api/feedback` com classificação por IA (Groq) — funcional
- Tabela `order_feedbacks` no Supabase — funcional
- Dashboard admin em `/admin/feedbacks` — funcional
- **Falta**: Página pública onde o cliente CONTRATANTE pode dar feedback sobre o SISTEMA (não sobre um pedido)

### Proposta

Adicionar um bloco na landing (⑪) e uma rota simples `/feedback-geral` onde qualquer pessoa pode enviar:

- Rating (1-5 estrelas)
- Categoria: "Sugestão", "Elogio", "Problema", "Melhoria"
- Texto livre
- Email opcional (para resposta)

**Copy neurocomportamental**:

> "Seu feedback vira código. A gente ouve, implementa e comunica — mais rápido que qualquer concorrente."

Isso ataca diretamente a dor de "suporte lento" (Saipos 17 dias, Cardápio Web 11 dias).

---

## 7. SOBRE CONCORRENTES "COPIANDO A ESTRATÉGIA"

### Risco real

Você identificou corretamente: o modelo "cardápio digital para quem já tem entregador" é simples o suficiente para ser copiado. Novos players vão surgir.

### Resposta estratégica (moats/fossos competitivos)

| Fosso                            | Como comunicar na landing                                       |
| -------------------------------- | --------------------------------------------------------------- |
| **Catálogo pronto de 16 nichos** | Ninguém mais tem isso — outros pedem cadastro manual            |
| **IA dentro do cardápio**        | Não é bot de WhatsApp — é IA conversacional no próprio cardápio |
| **Velocidade de implementação**  | "Seu concorrente demora 7 dias. Nós entregamos em 30 minutos."  |
| **Transparência**                | Preço público, cancela pelo painel, sem fidelidade              |
| **Escuta ativa**                 | Feedback → código → deploy rápido                               |

Na landing, a frase-âncora para posicionamento vs. copycats:

> **"Eles copiaram a ideia. A gente já tem o produto pronto, testado e rodando."**

---

## 8. MAPA DE IMPLEMENTAÇÃO

### Fase 1 — Reestruturação da Landing (PRIORITÁRIO)

| #   | Tarefa                                           | Complexidade | Arquivos afetados                        |
| --- | ------------------------------------------------ | ------------ | ---------------------------------------- |
| 1   | Reescrever Hero com foco em resultado financeiro | Média        | `app/page.tsx`, `components/hero-ab.tsx` |
| 2   | Subir Calculadora para posição 3 (mover bloco)   | Baixa        | `app/page.tsx` (reordenar)               |
| 3   | Criar bloco de transição ④ ("E o marketing?")    | Baixa        | `app/page.tsx` (novo bloco inline)       |
| 4   | Expandir bloco Google Meu Negócio na landing     | Média        | `app/page.tsx` (reescrever seção 6)      |
| 5   | Criar bloco de transição ⑥ ("E os outros?")      | Baixa        | `app/page.tsx` (novo bloco inline)       |
| 6   | Mover comparativo SaaS para posição 7            | Baixa        | `app/page.tsx` (reordenar)               |
| 7   | Adicionar sub-bloco fidelização/feedback         | Média        | `app/page.tsx` (novo sub-bloco em ⑪)     |
| 8   | Condensar pricing + FAQ                          | Baixa        | `app/page.tsx` (layout)                  |

### Fase 2 — Conteúdo Educacional

| #   | Tarefa                                             | Complexidade |
| --- | -------------------------------------------------- | ------------ |
| 9   | Criar `/guia/google-meu-negocio` com passo a passo | Média        |
| 10  | Trocar mailto por WhatsApp link na oferta R$ 350   | Mínima       |
| 11  | Criar `/feedback-geral` com form público           | Média        |

### Fase 3 — Expansão

| #   | Tarefa                                        | Complexidade |
| --- | --------------------------------------------- | ------------ |
| 12  | E-book PDF + lead capture                     | Alta         |
| 13  | Blog system (`/blog/[slug]`)                  | Alta         |
| 14  | Checkout automatizado para serviço GMB R$ 350 | Média        |

---

## 9. CONTEXTO LITORAL NORTE — ARGUMENTAÇÃO REGIONAL

O público-alvo primário do Zairyx está no **Litoral Norte Paulista** (São Sebastião, Ilhabela, Caraguatatuba, Ubatuba). Isso cria um argumento poderoso que nenhum SaaS nacional usa:

### Sazonalidade turística como gatilho

> **"Na temporada, turistas pesquisam 'pizza perto de mim' no Google. Se você não está no Google Meu Negócio, esse pedido vai pro iFood — e da comissão, você não escapa."**

### Argumento para a landing (bloco ⑤):

```
Quando o turista chega no Litoral Norte, ele abre o Google e digita:
"lanche perto de mim" · "pizza delivery" · "café da manhã perto"

O Google mostra negócios num raio de ~800m.

Se o seu delivery está no Google Meu Negócio → ele te acha.
Se não está → ele acha seu concorrente. Ou o iFood.

E se seu perfil tem o link do seu cardápio digital?
→ O turista pede DIRETO pelo seu canal. Sem comissão pra ninguém.
```

---

## 10. CHECKLIST DE SEGURANÇA LEGAL (MARKETING AGRESSIVO)

Tudo proposto neste relatório respeita:

- [x] **CDC Art. 37**: Sem propaganda enganosa — todos os dados são públicos com fonte
- [x] **CDC Art. 36**: Publicidade claramente identificada como tal
- [x] **Lei nº 12.529/2011 (CADE)**: Sem concorrência desleal — comparação com dados verificáveis
- [x] **LGPD**: Nenhum dado pessoal coletado ou exibido sem consentimento
- [x] **Marco Civil da Internet**: Direito de arrependimento comunicado claramente
- [x] **Reclame Aqui ToS**: Dados públicos usados com crédito e data de consulta

### O que NÃO fazer (mesmo com liberdade agressiva):

- ❌ Dizer que concorrente X é "ruim" ou "golpe"
- ❌ Usar screenshots de reclamações específicas de clientes de outros
- ❌ Inventar ou exagerar dados
- ❌ Fazer comparações sem mencionar a fonte e data
- ❌ Usar logos de concorrentes sem autorização

### O que PODE fazer (neurocomportamental agressivo legal):

- ✅ Publicar notas do Reclame Aqui com fonte e data
- ✅ Dizer "43% não voltariam" — é dado público
- ✅ Perguntar "seu sistema atual publica o preço?" — provocação legítima
- ✅ Mostrar tempo de resposta de suporte — dado público
- ✅ Comparar modelo (comissão vs. fixo) sem atacar empresa específica

---

## CONCLUSÃO

A landing atual é **boa tecnicamente** mas **fraca em narrativa de vendas**. O Hero fala de produto quando deveria falar de dinheiro no bolso. A calculadora está longe do topo. O Google Meu Negócio está desconectado da história. E os blocos não conversam entre si.

A reestruturação proposta transforma a landing de um **catálogo de features** em uma **conversa persuasiva** que guia o prospect pela jornada:

1. "Eu estou perdendo dinheiro" (Hero + Calculadora)
2. "Não preciso do iFood pra marketing" (Google Meu Negócio)
3. "Os concorrentes não são melhores" (Comparativo)
4. "Esse produto é fácil de usar" (Editor + Templates)
5. "Eles me ouvem" (Fidelização)
6. "R$ 147? Depois de ver R$ 3.150? Fechado." (Pricing)

**Aguardando autorização do owner para prosseguir com a Fase 1 da implementação.**

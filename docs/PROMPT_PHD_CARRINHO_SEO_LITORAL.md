# PROMPT PhD — AUDITORIA NEUROCOMPORTAMENTAL DA LANDING PAGE + CARRINHO + SEO REGIONAL

> **Versão:** 2.0 — 17 mar 2026
> **Uso:** Copiar integralmente e colar em um agente de IA (Claude, GPT-4, Copilot)
> para execução imediata no repositório.
> **Repositório:** `TiagoIA-UX/Card-pio-Digital` · branch `rename/cardapio-digital`

---

## DIRETRIZ OBRIGATÓRIA DE MARKETING — GATILHOS NEUROCOMPORTAMENTAIS

> **Esta diretriz se aplica a TODOS os prompts de marketing, copy e landing page deste projeto.**
> Deve ser tratada como regra permanente, não como sugestão pontual.

### Princípio central

Toda comunicação voltada ao dono de delivery/restaurante deve usar **gatilhos neurocomportamentais** de forma estratégica, sem poluir a interface. O objetivo é ativar mecanismos de decisão inconsciente que aceleram a conversão — nunca parecer agressivo ou manipulador.

### Gatilhos obrigatórios (aplicar em toda copy de vendas)

| Gatilho                                      | Como aplicar                                              | Exemplo de redação                                                                           |
| -------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Autonomia / Controle**                     | Mostrar que o dono não depende de ninguém                 | _"Você atualiza preços, fotos e categorias na hora, sem ligar para ninguém."_                |
| **Perda evitada (Loss Aversion)**            | Mostrar o custo de não ter                                | _"Cada pedido pelo app de terceiro custa até 30% da venda. Aqui, zero."_                     |
| **Prova social implícita**                   | Referenciar o comportamento do mercado sem números falsos | _"Donos de delivery que migraram para canal próprio reduziram dependência de marketplaces."_ |
| **Simplicidade cognitiva**                   | Reduzir carga mental com comparações diretas              | _"Se você usa WhatsApp, consegue manter o cardápio."_                                        |
| **Ancoragem de preço**                       | Mostrar o custo relativo, não absoluto                    | _"Menos que o custo de uma pizza por mês para manter seu canal ativo."_                      |
| **Urgência contextual (sem falsa escassez)** | Conectar à realidade do negócio                           | _"Seu cardápio pode estar no ar enquanto seus concorrentes ainda dependem de terceiros."_    |
| **Identidade / Pertencimento**               | Falar como igual, não como vendedor                       | _"Criado para quem vive a rotina de delivery e sabe que cada detalhe conta."_                |
| **Efeito Dotação**                           | Fazer o dono sentir que já é "dono" antes de comprar      | _"Escolha seu template, veja como fica o seu cardápio, publique quando quiser."_             |
| **Viés de autoridade**                       | Mostrar competência técnica sem arrogância                | _"Infraestrutura profissional que não pesa no bolso do restaurante."_                        |
| **Reciprocidade**                            | Dar algo antes de pedir                                   | _"Veja a prévia real do cardápio do seu nicho antes de decidir."_                            |

### Regras de aplicação

1. **Máximo 2 gatilhos por seção** — evita poluição e mantém naturalidade.
2. **Nunca inventar números** — se não tem dado real, use comparação contextual.
3. **Nunca usar "ÚLTIMO DIA", "VAGAS LIMITADAS"** ou escassez artificial.
4. **Tom:** Profissional, direto, empático. Como um consultor que entende a operação.
5. **Palavras-chave proibidas na copy:** "litoral norte", "templates prontos", "compre agora", "imperdível", "oferta relâmpago".
6. **Palavras-power permitidas:** "autonomia", "controle", "seu canal", "sem comissão", "na hora", "sem depender", "profissional", "sob seu comando".

---

## CONTEXTO DO SISTEMA

| Item                 | Valor                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Domínio**          | zairyx.com                                                                                 |
| **Stack**            | Next.js App Router · React · TypeScript · Tailwind CSS                                     |
| **Backend**          | Supabase (Auth SSR + Postgres + RLS)                                                       |
| **Deploy**           | Vercel                                                                                     |
| **Pedidos**          | WhatsApp (mensagem formatada com itens, totais e dados do cliente)                         |
| **Templates**        | 8 nichos: restaurante, pizzaria, lanchonete, bar, cafeteria, açaí, sushi, adega            |
| **Público-alvo**     | Donos de restaurantes, deliverys, quiosques e food trucks (foco inicial: Litoral Norte SP) |
| **Modelo comercial** | SaaS B2B — vende cardápio digital profissional para operações de alimentação               |

---

## SITUAÇÃO ATUAL (DIAGNÓSTICO)

### 1. Carrinho nos templates (app/r/[slug]/cardapio-client.tsx)

- O usuário final (cliente do restaurante) navega pelo cardápio e **adiciona produtos**.
- O estado do carrinho é mantido em `useState<CartItem[]>([])` dentro de `CardapioClient`.
- **Existe** um botão flutuante fixo no rodapé (`fixed right-4 bottom-6 left-4 z-40`) com ícone `MessageCircle` e badge de quantidade.
- Ao clicar nesse botão, abre o `CartDrawer` (overlay lateral) que exibe itens, formulário do cliente e botão de envio para WhatsApp.
- **PROBLEMA:** O botão flutuante diz **"Fazer pedido no WhatsApp"** e só aparece quando o drawer está fechado. **Não existe um botão/ícone dedicado de carrinho** (🛒) que mostre claramente ao usuário que ele pode **visualizar, adicionar e remover itens antes de finalizar**. A experiência atual faz o usuário pensar que clicar no botão já envia o pedido.
- O componente `CartButton` (`components/cart/cart-button.tsx`) **existe no projeto mas NÃO é usado** em nenhum template — ele usa Zustand (cart global para compra de templates), não o cart local dos restaurantes.

### 2. SEO e página de vendas

- **Keywords atuais** (app/layout.tsx): `cardápio digital`, `cardápio online`, `cardápio para delivery`, `cardápio para restaurante`, `cardápio whatsapp`, `google maps cardápio`.
- **Nenhuma keyword regional** — não menciona Litoral Norte, Caraguatatuba, São Sebastião, Ubatuba, Ilhabela.
- **Title atual:** `Cardápio Digital | Cardápio digital profissional para vender direto`.
- **Description atual:** `Cardápio digital profissional para Deliverys, pizzarias, hamburguerias, quiosques e operações de alimentação.` — genérica, sem diferencial regional.
- **Sitemap** (app/sitemap.ts): 17+ rotas, sem páginas regionais.
- **JSON-LD** (components/seo/json-ld.tsx): schemas genéricos, sem `areaServed` ou `GeoCircle`.
- **Slogans de templates** já mencionam "litoral" (restaurante: "peixes frescos e marmitas no litoral"; adega: "Bebidas geladas entregues no Litoral Norte") — **mas a landing page principal não aproveita isso**.
- O endereço demo já é de Caraguatatuba (lib/template-demo.ts) — oportunidade desperdiçada de SEO.

---

## METODOLOGIA OBRIGATÓRIA

### Regras de execução

1. **Antes de alterar qualquer arquivo, leia-o inteiro** e entenda o contexto.
2. **Preserve 100% das funcionalidades existentes** — não quebrar:
   - Fluxo de pedidos WhatsApp
   - Painel do restaurante
   - Editor de produtos
   - Integração de pagamento (Mercado Pago)
   - Deploy Vercel
3. **Cite arquivo e linha** ao descrever cada alteração.
4. **Teste cada etapa** antes de avançar para a próxima (use `get_errors` + verificação visual).
5. **Não crie arquivos desnecessários** — prefira editar os existentes.

### Classificação de achados na auditoria final

| Categoria              | Significado                                          |
| ---------------------- | ---------------------------------------------------- |
| **✅ CONFIRMADO**      | Evidência no código — cite arquivo e linha           |
| **⚠️ HIPÓTESE**        | Provável mas não verificável — explique o raciocínio |
| **❌ NÃO VERIFICÁVEL** | Depende de ambiente, produção ou serviço externo     |

---

## ETAPA 0 — AUDITORIA NEUROCOMPORTAMENTAL COMPLETA DA LANDING PAGE

### Objetivo

Realizar análise completa da página de vendas (`app/page.tsx`) e todos os seus componentes, avaliando cada seção quanto a: clareza da proposta, uso de gatilhos neurocomportamentais, exposição de benefícios/recursos e eficácia para conversão de donos de delivery.

### Mapa atual da landing page (seções na ordem de renderização)

| #   | Seção                                                 | Arquivo/Componente                       | Status atual |
| --- | ----------------------------------------------------- | ---------------------------------------- | ------------ |
| 1   | Header + navegação                                    | `components/home-header.tsx`             | A auditar    |
| 2   | Hero (imagem + H1 + CTA + métricas)                   | `app/page.tsx` inline                    | A auditar    |
| 3   | Benefícios em destaque (2 cards)                      | `app/page.tsx` — `HIGHLIGHT_BENEFITS`    | A auditar    |
| 4   | Produto (Dashboard + Editor screenshots)              | `app/page.tsx` inline                    | A auditar    |
| 5   | Templates por nicho (grid 8 cards)                    | `app/page.tsx` — `NICHE_TEMPLATES`       | A auditar    |
| 6   | Proposta de valor (4 features escuro)                 | `app/page.tsx` — `PLATFORM_FEATURES`     | A auditar    |
| 7   | Como funciona (3 passos)                              | `app/page.tsx` — `PROCESS_STEPS`         | A auditar    |
| 8   | Seção de conversão (comparação + planos + benefícios) | `components/sections/SecaoConversao.tsx` | A auditar    |
| 9   | CTA final (gradient card)                             | `app/page.tsx` inline                    | A auditar    |
| 10  | Footer                                                | `components/footer.tsx`                  | A auditar    |

### Para CADA seção, avaliar

1. **Copy atual** — Transcrever o texto principal (H2, subtítulo, descrição)
2. **Gatilhos presentes** — Quais gatilhos neurocomportamentais já estão ativos (mesmo que fracos)
3. **Gatilhos ausentes** — Quais gatilhos deveriam estar presentes nessa posição do funil
4. **Benefícios expostos** — O que o dono de delivery entende ao ler
5. **Benefícios ocultos** — Recursos reais do produto que NÃO estão sendo comunicados
6. **Recomendação** — Reescrever a copy com gatilhos aplicados (max 2 por seção)
7. **Nota de impacto** — 1 a 5 (sendo 5 = impacto crítico na conversão)

### Diagnóstico de problemas já identificados

**PROBLEMA 1 — Copy genérica sem diferencial claro:**

- H1 atual: _"Seu cardápio no ar com presença de marca e operação própria."_
- Análise: Bom tom, mas abstrato demais. Não comunica o benefício concreto.
- O dono de pizzaria não pensa em "presença de marca" — ele pensa em "receber mais pedidos sem pagar comissão".

**PROBLEMA 2 — Seção de benefícios repete o mesmo ponto:**

- "Adicione produtos" aparece 4x na landing (hero benefits, card editor, seção produto, how-it-works).
- Repetição cansa e desperdiça espaço que poderia comunicar outros benefícios.

**PROBLEMA 3 — Falta de benefícios financeiros concretos:**

- "0% de comissão" aparece em métrica mas sem contexto de quanto o dono economiza.
- Sem ancoragem: _"Se você vende R$ 10.000/mês no iFood, paga R$ 2.500 de comissão. Aqui, zero."_

**PROBLEMA 4 — FAQSection usa conteúdo genérico de templates Notion/Figma:**

- Perguntas sobre "projetos comerciais", "TypeScript", "Notion" — nada sobre delivery.
- Deveria responder: "Como os pedidos chegam?", "Posso editar o cardápio do celular?", "Quanto custa por mês?"

**PROBLEMA 5 — TestimonialsSection tem depoimentos fake de "Desenvolvedores":**

- "Lucas Silva - Desenvolvedor Freelancer" falando de templates Next.js.
- Deveria ter depoimentos de donos de delivery/restaurante (mesmo que exemplificados com personas realistas).

**PROBLEMA 6 — CTASection e HeroSection genéricos (não usados na page.tsx mas existem):**

- `components/cta-section.tsx` fala de "500 desenvolvedores" e "Bundle Pro".
- `components/hero-section.tsx` fala de "Templates Premium para Acelerar seus Projetos".
- Estes componentes NÃO são usados na `app/page.tsx` (que tem hero inline), mas se forem chamados em outro lugar, estão totalmente fora do contexto de delivery.

**PROBLEMA 7 — Sem menção a Templates adaptados por tipo de operação com copy persuasiva:**

- O grid de 8 templates mostra cards com descrição técnica.
- Falta copy neurocomportamental: _"Se a sua operação é pizzaria, o cardápio já vem organizado do jeito que seu cliente espera."_
- **Gatilho Efeito Dotação:** Fazer o dono sentir que o template "já é dele".

**PROBLEMA 8 — Sem storytelling de dor → solução:**

- A landing começa vendendo features (painel, editor).
- Deveria começar com a DOR: _"Cansado de pagar comissão toda vez que vende uma pizza?"_
- Depois apresentar a solução com alívio emocional.

### Benefícios e recursos COMPLETOS que devem estar expostos na landing

Auditar se os seguintes benefícios estão **visíveis e claros** para o dono de delivery:

| #   | Benefício/Recurso                                  | Gatilho principal              | Onde deveria aparecer    |
| --- | -------------------------------------------------- | ------------------------------ | ------------------------ |
| 1   | 0% de comissão sobre pedidos                       | Perda evitada                  | Hero + Comparação        |
| 2   | Canal próprio (não depende de marketplace)         | Autonomia                      | Hero + Proposta de valor |
| 3   | Painel visual para editar cardápio                 | Simplicidade                   | Produto + How-it-works   |
| 4   | 8 templates por nicho de alimentação               | Identidade                     | Grid de templates        |
| 5   | Funciona no celular e computador                   | Simplicidade                   | Features                 |
| 6   | Pedido chega direto no WhatsApp                    | Simplicidade                   | Features + FAQ           |
| 7   | Preço transparente (setup + mensal)                | Autoridade                     | Preços + Hero            |
| 8   | Edição em tempo real sem desenvolvedor             | Autonomia                      | Benefícios               |
| 9   | QR Code e link prontos                             | Simplicidade                   | How-it-works             |
| 10  | Preview real antes de comprar                      | Reciprocidade + Efeito Dotação | Grid de templates        |
| 11  | Implantação assistida disponível                   | Autoridade                     | Preços                   |
| 12  | Suporte por WhatsApp                               | Prova social                   | FAQ                      |
| 13  | Infraestrutura profissional (Vercel/Supabase)      | Autoridade                     | Proposta de valor        |
| 14  | Produtos com fotos, categorias, preços             | Simplicidade                   | Produto                  |
| 15  | Bordas recheadas, combos, adicionais               | Identidade                     | Templates                |
| 16  | Funciona para mesa, balcão e delivery              | Versatilidade                  | FAQ + Features           |
| 17  | Não precisa instalar app                           | Simplicidade                   | FAQ                      |
| 18  | Cardápio sempre atualizado (em tempo real)         | Urgência contextual            | Benefícios               |
| 19  | Forma de pagamento no pedido (Pix/Dinheiro/Cartão) | Autonomia                      | FAQ                      |
| 20  | Compartilhável no Instagram, WhatsApp, Google      | Prova social                   | How-it-works + CTA       |

### Implementação da copy neurocomportamental

Após auditar cada seção, reescrever a copy aplicando os gatilhos. A reescrita deve:

1. **Manter a estrutura visual atual** — não mudar layout, apenas texto.
2. **Usar no máximo 2 gatilhos por seção** — naturalidade acima de tudo.
3. **Não usar as palavras proibidas** (ver diretriz acima).
4. **Focar na DOR antes da FEATURE** — o dono precisa se reconhecer no problema.
5. **Falar na linguagem do dono de restaurante** — não de desenvolvedor.

#### Exemplo de reescrita do Hero:

**ANTES (atual):**

> H1: "Seu cardápio no ar com presença de marca e operação própria."
> Sub: "Um sistema elegante para vender sem comissão..."

**DEPOIS (com gatilhos):**

> H1: "Receba pedidos no seu WhatsApp — sem pagar comissão por venda." _(Perda evitada + Autonomia)_
> Sub: "Publique seu cardápio, atualize preços e fotos na hora, e tenha um canal que é só seu. Sem intermediário, sem surpresa na fatura." _(Simplicidade + Controle)_

#### Exemplo de reescrita do FAQ:

**ANTES:**

> "Posso usar os templates em projetos comerciais?"

**DEPOIS:**

> "Como os pedidos chegam até mim?"
> → "O cliente escolhe os itens no cardápio e o pedido chega direto no WhatsApp do seu negócio, formatado e pronto para preparar." _(Simplicidade)_

### Arquivos a auditar e editar

| Arquivo                                  | O que fazer                                                           |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `app/page.tsx`                           | Reescrever: H1, sub-hero, benefits, features text, process steps, CTA |
| `components/sections/SecaoConversao.tsx` | Auditar copy comparativa e benefit cards                              |
| `components/faq-section.tsx`             | Reescrever com perguntas de dono de delivery                          |
| `components/testimonials-section.tsx`    | Substituir depoimentos fake por personas de delivery                  |
| `components/hero-section.tsx`            | Se usado: reescrever para contexto delivery                           |
| `components/cta-section.tsx`             | Se usado: reescrever para contexto delivery                           |
| `components/pricing-section.tsx`         | Auditar copy de planos e features listadas                            |

---

## ETAPA 1 — ANÁLISE: SEO LITORAL NORTE NA PÁGINA DE VENDAS

### Objetivo

Determinar se é **mais vantajoso** posicionar a landing page (app/page.tsx) e o SEO do site com foco no **Litoral Norte de SP** vs. manter posicionamento genérico nacional.

**IMPORTANTE:** O SEO deve usar termos regionais nos metadados técnicos (title, description, keywords, JSON-LD, sitemap) para indexação no Google. Porém, na **copy visível da landing page**, NUNCA escrever literalmente "litoral norte" ou "templates prontos". Em vez disso, usar gatilhos neurocomportamentais que comuniquem pertencimento regional de forma implícita:

- "Cardápio pensado para quem vive a rotina de delivery na sua cidade." _(Identidade)_
- "Operações de alimentação que já funcionam no dia a dia do restaurante." _(Pertencimento)_
- O grid de templates com slogans por nicho já comunica regionalidade (ex: "peixes frescos", "kits praia") — isso é suficiente para o visitante local se identificar sem precisar escrever "litoral norte" na página.

### Análise exigida

1. **Volume de busca estimado** — Comparar:
   - `"cardápio digital"` (nacional, alta concorrência)
   - `"cardápio digital litoral norte"`, `"delivery caraguatatuba"`, `"cardápio digital são sebastião"`, `"cardápio whatsapp ubatuba"` (regional, baixa concorrência)

2. **Compatibilidade com o modelo de negócio:**
   - O público-alvo imediato está no Litoral Norte (prospecção ativa em Caraguatatuba).
   - Os templates já têm slogans e endereço demo da região.
   - A venda presencial foca na região (ver ESTRATEGIA_FECHAMENTO_PRESENCIAL.md).
   - SEO regional pode ser a **porta de entrada** para leads orgânicos quentes.

3. **Estratégia recomendada** — Avaliar:
   - **Opção A** — Landing page principal com foco regional:
     - Title: `Cardápio Digital para Restaurantes do Litoral Norte | Zairyx`
     - H1: `Cardápio digital para deliverys e restaurantes do Litoral Norte`
     - Mencionar: Caraguatatuba, São Sebastião, Ubatuba, Ilhabela
     - Vantagem: domina nicho regional com baixa concorrência
   - **Opção B** — Landing page genérica + página regional dedicada:
     - Manter landing atual genérica
     - Criar `/litoral-norte` com conteúdo otimizado para a região
     - Vantagem: ataca os dois mercados
   - **Opção C** — SEO híbrido na página principal:
     - Title com keyword primária nacional + subtítulo regional
     - Seção dedicada na landing: "Atendemos o Litoral Norte de SP"
     - JSON-LD com `areaServed` regional
     - Vantagem: não cria página extra, aproveita autoridade da home

4. **Decisão e implementação** — Após analisar, **implementar a opção mais vantajosa**. Justificar com dados.

### Arquivos envolvidos (verificar e editar conforme necessário)

| Arquivo                       | O que verificar/alterar                                   |
| ----------------------------- | --------------------------------------------------------- |
| `app/layout.tsx`              | metadata: title, description, keywords, openGraph         |
| `app/page.tsx`                | Hero copy, H1, seção regional, CTAs                       |
| `app/sitemap.ts`              | Adicionar rotas regionais se Opção B                      |
| `components/seo/json-ld.tsx`  | Adicionar `areaServed`, `GeoCircle`, localBusiness schema |
| `components/hero-section.tsx` | Copy principal, subtítulos                                |
| `components/faq-section.tsx`  | Adicionar FAQ regional se relevante                       |
| `lib/template-demo.ts`        | Endereço demo já é Caraguá — manter ou expandir           |

---

## ETAPA 2 — CARRINHO VISÍVEL EM TODOS OS TEMPLATES

### Objetivo

Criar um **botão de carrinho flutuante** (ícone 🛒 com badge de quantidade) visível em todos os templates de cardápio, que permita ao usuário final:

1. **Ver** os itens já adicionados ao carrinho **a qualquer momento**.
2. **Adicionar e remover** produtos (incrementar/decrementar quantidade).
3. **Revisar o pedido completo** antes de enviar para o WhatsApp.

### Especificação técnica

#### 2.1 — Botão flutuante de carrinho

**Arquivo principal:** `app/r/[slug]/cardapio-client.tsx`

- Criar um **botão circular flutuante** no canto inferior direito (ou esquerdo) com:
  - Ícone `ShoppingCart` (do lucide-react)
  - **Badge** com contagem de itens (mesmo padrão do `CartButton` existente)
  - **Animação bounce** ao adicionar novo item (300ms)
  - Cor: usar `cor_primaria` do template (dinâmica via CSS custom properties)
  - Z-index alto (z-50) para não conflitar com outros elementos
- Ao clicar no botão do carrinho → **abrir o CartDrawer** (`setIsCartOpen(true)`)
- O botão antigo "Fazer pedido no WhatsApp" deve ser **repensado**:
  - **Opção recomendada:** Transformar em **dois botões**:
    1. 🛒 Botão circular flutuante (sempre visível) → abre drawer para review
    2. Dentro do drawer, manter o botão "Enviar pedido no WhatsApp" como CTA final
  - O botão de WhatsApp no rodapé só deve dizer "Enviar pedido" quando o usuário já está no drawer com itens

#### 2.2 — Melhorias no CartDrawer existente

**Arquivo:** `app/r/[slug]/cardapio-client.tsx` (componente `CartDrawer` inline ou extraído)

- **Feedback visual ao adicionar item:**
  - Micro-animação no produto (escala 1.02 + verde por 300ms)
  - Toast/snackbar efêmero: `"✓ Calabresa adicionado"` (2s, auto-dismiss)
- **Botões de quantidade por produto:**
  - `[-]` `quantidade` `[+]` — já existe, manter
  - Botão `🗑️ Remover` — já existe, manter
- **Empty state aprimorado:**
  - Ícone ShoppingCart grande + texto: `"Seu carrinho está vazio"`
  - Subtexto: `"Adicione itens do cardápio para fazer seu pedido"`
  - Botão: `"Ver cardápio"` → fecha drawer
- **Resumo do pedido:**
  - Subtotal
  - Quantidade total de itens
  - Botão primário: `"Continuar para o pedido"` → rola para formulário de dados
  - Ou se dados já preenchidos: `"Enviar pedido no WhatsApp (X itens — R$ XX,XX)"`

#### 2.3 — Comportamento do carrinho (TODOS OS TEMPLATES)

Verificar que o fluxo funciona identicamente em todos os 8 templates:

| Template    | Slug          | Verificar                                              |
| ----------- | ------------- | ------------------------------------------------------ |
| Restaurante | `restaurante` | Marmitas, peixes, pratos do dia com carrinho funcional |
| Pizzaria    | `pizzaria`    | Pizzas + bordas extras + combos no carrinho            |
| Lanchonete  | `lanchonete`  | Hambúrgueres + shakes + combos no carrinho             |
| Bar/Pub     | `bar`         | Petiscos + drinks + cervejas no carrinho               |
| Cafeteria   | `cafeteria`   | Cafés + salgados + combos café da manhã no carrinho    |
| Açaí        | `acai`        | Copos + tigelas + adicionais no carrinho               |
| Sushi       | `sushi`       | Combinados + temakis + pratos quentes no carrinho      |
| Adega       | `adega`       | Cervejas + vinhos + kits praia no carrinho             |

**Atenção:** O `CardapioClient` é genérico — ele renderiza QUALQUER template via dados (restaurant + products). A alteração no carrinho deve ser feita **uma única vez** nesse componente e automaticamente funcionará em todos os 8 templates.

#### 2.4 — NÃO confundir os dois carts

| Cart                  | Escopo                         | Arquivo               | Store    |
| --------------------- | ------------------------------ | --------------------- | -------- |
| **Cart de templates** | Compra de plano (SaaS)         | `store/cart-store.ts` | Zustand  |
| **Cart de cardápio**  | Pedido de comida (restaurante) | `cardapio-client.tsx` | useState |

- **Não misturar.** O botão de carrinho desta etapa é para o **cart de cardápio** (useState local).
- O `CartButton` de `components/cart/cart-button.tsx` é para compra de templates — **não reutilizar** diretamente, mas pode servir de referência visual.

---

## ETAPA 3 — IMPLEMENTAÇÃO SEO (executar após decisão da Etapa 1)

### 3.1 — Keywords regionais

Adicionar ao metadata de `app/layout.tsx`:

```typescript
keywords: [
  // Nacionais (manter)
  'cardápio digital',
  'cardápio online',
  'cardápio para delivery',
  'cardápio para restaurante',
  'cardápio whatsapp',
  'google maps cardápio',
  // Regionais (adicionar)
  'cardápio digital litoral norte',
  'delivery caraguatatuba',
  'cardápio digital caraguatatuba',
  'cardápio digital são sebastião',
  'cardápio digital ubatuba',
  'cardápio digital ilhabela',
  'delivery litoral norte sp',
  'cardápio whatsapp litoral norte',
]
```

### 3.2 — JSON-LD regional

Em `components/seo/json-ld.tsx`, adicionar schema `LocalBusiness` ou `SoftwareApplication` com:

```json
{
  "@type": "SoftwareApplication",
  "areaServed": {
    "@type": "GeoCircle",
    "geoMidpoint": {
      "@type": "GeoCoordinates",
      "latitude": -23.6203,
      "longitude": -45.4131
    },
    "geoRadius": "80000"
  },
  "availableChannel": {
    "@type": "ServiceChannel",
    "serviceLocation": {
      "@type": "Place",
      "name": "Litoral Norte de São Paulo",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "SP",
        "addressLocality": "Caraguatatuba"
      }
    }
  }
}
```

### 3.3 — Seção de identificação regional na landing page (SEM palavras literais)

Em `app/page.tsx` ou componente dedicado — criar uma seção que comunique presença regional **sem escrever "litoral norte"**:

**Estratégia neurocomportamental (Identidade + Pertencimento):**

- Título: **"Feito para quem vive a rotina de delivery e sabe que cada detalhe conta."**
- Subtítulo: _"Cardápios organizados por tipo de operação — do açaí ao sushi, da pizzaria ao restaurante."_
- Grid visual com ícones dos 8 nichos (mesmos ícones do template grid) — o visitante local se identifica ao ver os segmentos da sua cidade
- CTA: _"Veja como fica o cardápio do seu segmento"_ → `/templates`
- **NÃO mencionar nomes de cidades na copy visível** — usar apenas nos metadados SEO (title, description, JSON-LD)
- Os slogans dos templates (ex: "peixes frescos", "kits para praia e churrasco") já carregam identidade regional de forma natural

### 3.4 — Sitemap atualizado

Se Opção B (página regional dedicada), adicionar em `app/sitemap.ts`:

```typescript
{
  url: `${baseUrl}/litoral-norte`,
  lastModified: new Date(),
  changeFrequency: 'weekly',
  priority: 0.9,
}
```

---

## ETAPA 4 — AUDITORIA FINAL (FLUXO COMPLETO)

Após implementar as Etapas 2 e 3, executar auditoria completa do fluxo:

### 4.1 — Fluxo do carrinho (testar por template)

Para **CADA um dos 8 templates**, verificar:

| Passo | Ação                                       | Resultado esperado                             |
| ----- | ------------------------------------------ | ---------------------------------------------- |
| 1     | Acessar `/templates/[slug]`                | Preview carrega com produtos do template       |
| 2     | Clicar em "Adicionar" em um produto        | Badge do carrinho incrementa + feedback visual |
| 3     | Clicar em "Adicionar" em outro produto     | Badge atualiza, segundo item aparece           |
| 4     | Clicar no botão do carrinho (🛒)           | Drawer abre mostrando os 2 itens               |
| 5     | Clicar [+] no primeiro item                | Quantidade sobe para 2, total atualiza         |
| 6     | Clicar [-] no segundo item                 | Item removido do carrinho                      |
| 7     | Verificar subtotal                         | Valor correto (preço × quantidade)             |
| 8     | Preencher dados (nome, telefone, endereço) | Formulário aceita input                        |
| 9     | Selecionar forma de pagamento              | Dinheiro/Pix/Cartão funciona                   |
| 10    | Clicar "Enviar pedido no WhatsApp"         | Monta mensagem formatada e abre WhatsApp       |
| 11    | Verificar mensagem WhatsApp                | Itens, quantidades, totais e dados corretos    |

### 4.2 — Fluxo SEO

| Passo | Verificação                                | Resultado esperado                            |
| ----- | ------------------------------------------ | --------------------------------------------- |
| 1     | Inspecionar `<head>` da home               | Keywords regionais presentes                  |
| 2     | Verificar `<title>` e `<meta description>` | Mencionam Litoral Norte ou região             |
| 3     | Acessar `/sitemap.xml`                     | Rotas regionais aparecem (se Opção B)         |
| 4     | Inspecionar JSON-LD                        | `areaServed` com coordenadas de Caraguatatuba |
| 5     | Google Structured Data Test (manual)       | Schema válido sem erros                       |
| 6     | Verificar seção regional na landing        | Texto, cidades e CTA visíveis                 |
| 7     | Core Web Vitals (Lighthouse)               | Sem regressão de performance                  |

### 4.3 — Regressão geral

| Verificação                       | Resultado esperado                         |
| --------------------------------- | ------------------------------------------ |
| `get_errors` em todos os arquivos | 0 erros TypeScript                         |
| Build completo (`npm run build`)  | Sem falhas                                 |
| Painel do restaurante funciona    | Login + CRUD de produtos ok                |
| Editor de cardápio funciona       | Edição + preview + salvar ok               |
| Integração WhatsApp funciona      | Mensagem formatada correta                 |
| Cart de templates (SaaS) funciona | Compra de plano não afetada                |
| Responsividade mobile             | Botão carrinho + drawer ok em telas 320px+ |

---

## ENTREGÁVEIS

Ao final da execução, gerar relatório contendo:

1. **Auditoria neurocomportamental** — Tabela das 10 seções × 7 critérios (copy atual, gatilhos presentes/ausentes, benefícios expostos/ocultos, recomendação, nota).
2. **Copy reescrita** — Antes/depois de cada seção com gatilhos aplicados.
3. **Decisão SEO** — Qual opção escolhida (A/B/C) e justificativa.
4. **Arquivos alterados** — Lista completa com caminho, linhas editadas e descrição da mudança.
5. **Antes/depois** — Comparação visual (ou textual) do botão de carrinho.
6. **Resultado da auditoria** — Tabela de todos os 8 templates × 11 passos do fluxo.
7. **Erros encontrados** — Classificados como ✅/⚠️/❌ conforme metodologia.
8. **Checklist de benefícios** — 20 benefícios × status (exposto/oculto/parcial) com localização na página.
9. **Sugestões de melhoria futura** — Itens que ficaram fora de escopo mas são relevantes.

---

## PRIORIDADE DE EXECUÇÃO

```text
0. Etapa 0 (Auditoria Neuro) ← Fundamenta toda a copy — executa primeiro
1. Etapa 2 (Carrinho)        ← Impacto direto na conversão de pedidos
2. Etapa 1 (Análise SEO)     ← Decide direção do SEO
3. Etapa 3 (Implementação)   ← Executa SEO conforme decisão
4. Etapa 4 (Auditoria)       ← Valida tudo antes de deploy
```

---

## RESTRIÇÕES

- **Não criar** novos frameworks ou bibliotecas de state management.
- **Não alterar** a lógica de envio para WhatsApp — apenas o UX antes do envio.
- **Não quebrar** o cart global de templates (Zustand) — são sistemas independentes.
- **Não mudar** URLs existentes que já estão indexadas.
- **Não usar na copy visível:** "litoral norte", "templates prontos", "compre agora", "imperdível", "oferta relâmpago", "últimas vagas".
- **Responsividade** é obrigatória — mobile-first.
- **Performance** — O botão de carrinho deve ter custo zero de re-render quando não interage.
- **Gatilhos neurocomportamentais** — Máximo 2 por seção, nunca inventar números, tom profissional.
- **Diretriz de marketing** — A seção "DIRETRIZ OBRIGATÓRIA DE MARKETING" deste prompt deve ser copiada como preâmbulo em TODO prompt futuro que envolva copy, landing page, email ou material de vendas.

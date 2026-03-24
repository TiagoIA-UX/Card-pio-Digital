# 📊 Análise Competitiva: Anota AI vs. Cardápio Digital

> **Data**: Março 2026  
> **Objetivo**: Mapear funcionalidades do concorrente Anota AI (anotaai.com) e identificar gaps e oportunidades de melhoria no Cardápio Digital.

---

## 1. Sobre o Anota AI

| Campo | Detalhe |
|---|---|
| **Site** | https://anotaai.com |
| **Tipo** | Plataforma SaaS de cardápio digital e gestão de pedidos para delivery |
| **Mercado** | Brasil — um dos maiores players do segmento |
| **Público-alvo** | Restaurantes, pizzarias, lanchonetes, hamburguerias, açaiterias, etc. |
| **Modelo de negócio** | Assinatura mensal (planos variados + % por pedido em alguns planos) |
| **Fundação** | 2019 — consolidado no mercado de delivery digital brasileiro |

---

## 2. Funcionalidades do Anota AI

### 🍽️ Cardápio Digital
- Cardápio digital online personalizado com link próprio
- Categorias de produtos com fotos
- Variações e complementos (tamanhos, adicionais, bordas, etc.)
- Produtos com preços promocionais
- Cardápio disponível 24h
- Busca de produtos no cardápio

### 📦 Gestão de Pedidos
- Painel de pedidos em tempo real
- Notificações sonoras de novos pedidos
- Status do pedido (recebido → em preparo → saiu para entrega → entregue)
- Impressão automática de pedidos (integração com impressora térmica)
- Histórico de pedidos completo

### 🚴 Delivery e Entrega
- Definição de área de entrega por bairro/raio
- Taxa de entrega por região
- Tempo estimado de entrega
- Entrega própria + retirada no balcão
- Integração com entregadores

### 💳 Pagamentos
- Pagamento online (cartão, PIX)
- Pagamento na entrega (dinheiro, cartão, PIX)
- Troco para pagamento em dinheiro
- Integração com múltiplos gateways de pagamento

### 📣 Marketing e Fidelização
- Cupons de desconto
- Programa de fidelidade (compre X ganhe Y)
- Notificações push para clientes
- Recuperação de carrinho abandonado
- Mensagens automáticas no WhatsApp
- Avaliações e reviews de clientes
- Campanhas de marketing por WhatsApp

### 🔗 Integrações
- WhatsApp (atendimento automático via chatbot)
- iFood (receber pedidos do iFood no mesmo painel)
- Instagram (link no bio)
- Google Meu Negócio
- Impressoras térmicas (Epson, Elgin, etc.)
- Sistemas de gestão (ERP)

### 📊 Painel Administrativo
- Dashboard com métricas (vendas, pedidos, ticket médio)
- Relatórios de vendas por período
- Produtos mais vendidos
- Horários de pico
- Gestão de clientes (base de dados)
- Gestão de entregadores
- Controle de estoque básico
- Múltiplos usuários/operadores

### 📱 App e Acesso
- App para Android e iOS (para o dono do restaurante)
- Site responsivo para o cliente
- QR Code para mesa
- Link personalizado (ex: `cardapio.anotaai.com/restaurante`)

### 🤖 Atendimento
- Chatbot no WhatsApp (atendimento automático)
- Robô de atendimento inteligente
- Mensagens personalizadas
- Horário de funcionamento automático (abre/fecha cardápio)

---

## 3. Tabela Comparativa Detalhada

| Funcionalidade | Anota AI | Cardápio Digital | Status |
|---|---|---|---|
| Cardápio digital online | ✅ | ✅ | ✅ Paridade |
| Templates multi-nicho (15) | ❌ (1-2 layouts) | ✅ 15 nichos | 🏆 Vantagem CD |
| White-label completo | ❌ (marca Anota AI aparece) | ✅ | 🏆 Vantagem CD |
| 0% comissão por pedido | ❌ (cobra % em alguns planos) | ✅ | 🏆 Vantagem CD |
| Pedidos WhatsApp | ✅ | ✅ | ✅ Paridade |
| QR Code mesa | ✅ | ✅ | ✅ Paridade |
| Checkout online | ✅ (múltiplos gateways) | ✅ (Mercado Pago) | ✅ Paridade |
| Cupons de desconto | ✅ | ❌ (em desenvolvimento) | 🔴 Gap |
| Programa de fidelidade | ✅ | ❌ (em desenvolvimento) | 🔴 Gap |
| Avaliações/reviews | ✅ | ❌ (em desenvolvimento) | 🔴 Gap |
| Dashboard analytics | ✅ (completo) | ⚠️ (admin, não operador) | 🟡 Gap parcial |
| Notificações push | ✅ | ❌ | 🔴 Gap |
| App nativo (iOS/Android) | ✅ | ❌ (web only) | 🔴 Gap |
| Impressora térmica | ✅ | ❌ | 🔴 Gap |
| Integração iFood | ✅ | ❌ | 🔴 Gap |
| Área de entrega por raio | ✅ | ❌ | 🔴 Gap |
| Taxa de entrega por região | ✅ | ❌ | 🔴 Gap |
| Status do pedido em tempo real | ✅ | ❌ | 🔴 Gap |
| Gestão de entregadores | ✅ | ❌ | 🔴 Gap |
| Controle de estoque | ✅ | ❌ | 🔴 Gap |
| Recuperação de carrinho | ✅ | ❌ | 🔴 Gap |
| Horário de funcionamento auto | ✅ | ❌ | 🔴 Gap |
| Chatbot WhatsApp | ✅ | ✅ (Groq/LLaMA) | ✅ Paridade (CD mais avançado) |
| Sistema de afiliados (6 tiers) | ❌ | ✅ | 🏆 Vantagem CD |
| Marketplace freelancer | ❌ | ✅ | 🏆 Vantagem CD |
| Penalidades progressivas | ❌ | ✅ | 🏆 Vantagem CD |
| Suporte com SLA cronometrado | ❌ | ✅ | 🏆 Vantagem CD |
| IA avançada (LLaMA 70B) | ❌ (chatbot simples) | ✅ | 🏆 Vantagem CD |
| CDN próprio (Cloudflare R2) | ❌ | ✅ | 🏆 Vantagem CD |
| Rate limiting avançado | ❌ | ✅ (Upstash Redis) | 🏆 Vantagem CD |
| RLS em todas as tabelas | ❌ (provável) | ✅ | 🏆 Vantagem CD |
| Cron jobs automáticos | ❌ | ✅ | 🏆 Vantagem CD |

---

## 4. Resumo de Gaps (O que implementar)

### 🔴 Gaps Críticos
> Features que clientes esperam — sem elas vão para o concorrente.

1. **Cupons de desconto** — EM DESENVOLVIMENTO (PR pendente)
2. **Programa de fidelidade** — EM DESENVOLVIMENTO (PR pendente)
3. **Status do pedido em tempo real** (recebido → preparo → saiu → entregue)
4. **Área de entrega configurável** (raio/bairro) + taxa por região
5. **Horário de funcionamento automático** (abre/fecha cardápio)
6. **Controle de estoque básico** (marcar produto indisponível)

### 🟡 Gaps Importantes
> Diferenciam, mas não são deal-breakers imediatos.

7. **Avaliações/reviews** — EM DESENVOLVIMENTO (PR pendente)
8. **Dashboard analytics para operador** — EM DESENVOLVIMENTO (PR pendente)
9. **Impressão automática** (impressora térmica)
10. **Notificações push / email transacional**
11. **Recuperação de carrinho abandonado**
12. **Múltiplos métodos de pagamento na entrega**

### 🟢 Gaps de Longo Prazo
> Backlog estratégico para expansão.

13. **App nativo** (iOS/Android)
14. **Integração iFood/Rappi**
15. **Gestão de entregadores**
16. **Multi-idioma** (i18n)

---

## 5. Vantagens Competitivas do Cardápio Digital

> Funcionalidades exclusivas que o Anota AI **não oferece**.

| # | Diferencial | Por que importa |
|---|---|---|
| 1 | **15 templates por nicho** | Restaurante, pizzaria, açaí, pet shop, etc. — cada segmento tem identidade visual própria. O Anota AI usa layout genérico. |
| 2 | **White-label 100%** | A marca do restaurante prevalece. No Anota AI, a marca da plataforma aparece para os clientes. |
| 3 | **0% comissão** | Modelo de assinatura fixa — sem surpresas no boleto à medida que o restaurante cresce. |
| 4 | **Sistema de afiliados (6 tiers)** | Bronze → Diamante com pagamento via PIX. Cria uma rede de vendas orgânica que escala sem custo de aquisição. |
| 5 | **Marketplace de freelancers** | Operadores podem contratar desenvolvedores diretamente na plataforma. Nenhum concorrente possui isso. |
| 6 | **IA avançada (LLaMA 70B via Groq)** | Chatbot com compreensão de linguagem natural de ponta. O Anota AI usa scripts simples de palavras-chave. |
| 7 | **CDN Cloudflare R2** | Imagens entregues globalmente com baixa latência e custo quase zero. |
| 8 | **Rate limiting com Upstash Redis** | Proteção de APIs contra abuso e DDoS — raridade em SaaS de cardápio. |
| 9 | **RLS + SECURITY DEFINER em todas as tabelas** | Isolamento de dados por operador no banco — segurança enterprise. |
| 10 | **Penalidades progressivas (sistema de strikes)** | Governança automatizada para operadores que violam termos — escalável sem intervenção manual. |

---

## 6. Plano de Ação Recomendado

### 🏃 Sprint 1 — 1 a 2 semanas (PRs já em andamento)
- [ ] Cupons e promoções
- [ ] Programa de fidelidade
- [ ] Avaliações e reviews
- [ ] Dashboard analytics para operador

### 🏃 Sprint 2 — 2 a 3 semanas
- [ ] Status do pedido em tempo real (recebido → preparo → saiu → entregue)
- [ ] Área de entrega configurável (raio/bairro + taxa por região)
- [ ] Horário de funcionamento automático
- [ ] Controle de estoque básico (marcar indisponível)

### 🏃 Sprint 3 — 3 a 4 semanas
- [ ] Integração com impressora térmica
- [ ] Notificações push / email transacional
- [ ] Recuperação de carrinho abandonado
- [ ] Múltiplos métodos de pagamento na entrega

### 📋 Sprint 4+ — Backlog estratégico
- [ ] App nativo (iOS/Android)
- [ ] Integração iFood/Rappi
- [ ] Gestão de entregadores
- [ ] Multi-idioma (i18n)

---

## 7. Conclusão

### Posicionamento atual

| Dimensão | Anota AI | Cardápio Digital |
|---|---|---|
| **Foco** | B2C (delivery, fidelidade, push) | B2B (afiliados, marketplace, IA) |
| **Maturidade de features B2C** | Alta | Baixa-média (em crescimento) |
| **Infraestrutura técnica** | Legada | Moderna (Next.js, Supabase, Cloudflare) |
| **Segurança** | Básica | Enterprise (RLS, rate limiting) |
| **Diferenciais exclusivos** | Poucos | Vários (afiliados, marketplace, IA) |

### Estratégia recomendada

> **Fechar os gaps B2C críticos (Sprints 1 e 2) sem abrir mão dos diferenciais B2B exclusivos.**

O Cardápio Digital tem uma base técnica **significativamente mais robusta** que o Anota AI, com diferenciais difíceis de copiar (afiliados em 6 níveis, marketplace freelancer, IA com LLaMA). O risco atual está nas features básicas de delivery que os restaurantes consideram obrigatórias.

Com 4 sprints dedicados, o projeto alcança **paridade competitiva completa** com o Anota AI nos pontos críticos — e mantém uma distância técnica considerável nos diferenciais B2B que nenhum concorrente oferece hoje.

### Meta
✅ **Paridade competitiva em features B2C críticas em 4 sprints**  
🏆 **Manter e ampliar vantagens B2B exclusivas continuamente**

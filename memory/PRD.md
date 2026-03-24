# Zairyx - Cardápio Digital SaaS | PRD

## Problema Original
Landing page de SaaS de cardápio digital para donos de delivery precisa ser otimizada para conversão com neuromarketing, linguagem simples e foco mobile-first.

## Arquitetura
- **Tech Stack**: Next.js 16, React 19, Tailwind CSS 4, TypeScript, Supabase
- **Deploy**: Vercel (zairyx.com)
- **Público**: Donos de delivery/restaurantes, baixa familiaridade técnica

## O que foi implementado

### Iteração 1 (24/03/2026) - Landing Page Redesign
1. **Hero Section** - "Receba mais pedidos direto no WhatsApp" + badge "0% comissão" + 2 CTAs + micro-provas
2. **Social Proof Strip** - 4 métricas: 0% comissão, 15 modelos, 30 min setup, 30 dias garantia
3. **Dor vs Solução** - Comparativo visual Apps tradicionais vs Zairyx
4. **Como Funciona** - 3 passos simples
5. **Benefícios Bento Grid** - 6 cards focados em resultado prático
6. **Seção Produto** - Screenshots do Dashboard e Editor
7. **Templates Showcase** - Top 6 + link "ver todos" + tags de 15 nichos
8. **FAQ Accordion** - 6 perguntas que reduzem objeções
9. **CTA Final** - Card dark com urgência + garantia
10. **Tipografia Premium**: Outfit + DM Sans
11. **Neuromarketing**: prova implícita, redução de esforço, ganho imediato, comparativo de perda

### Iteração 2 (24/03/2026) - Calculadora + Animações
1. **Calculadora de Economia Interativa** - Slider de faturamento + slider de comissão + presets rápidos + cálculos em tempo real + impacto anual + CTAs de conversão
2. **Scroll Reveal Animations** - Todas as seções fazem fade-in ao scrollar (IntersectionObserver + CSS transitions)
3. **Estilos de Slider Custom** - Sliders orange/red com hover states e glow effects

### Arquivos Modificados/Criados
- `/app/app/page.tsx` - Landing page completa (reescrita)
- `/app/app/layout.tsx` - Fontes Outfit + DM Sans
- `/app/app/globals.css` - Variables de font + slider styles
- `/app/components/sections/FaqSection.tsx` - FAQ accordion
- `/app/components/sections/SavingsCalculator.tsx` - Calculadora interativa
- `/app/components/scroll-reveal.tsx` - Hook + componente de scroll reveal

### Testes
- Iteração 1: 95% success
- Iteração 2: 100% success - Todos 20 testes passaram

## Personas
1. **Dono de Delivery** - Quer resultado rápido, não entende tech, compara com apps que cobram comissão
2. **Gerente de Restaurante** - Busca organização, precisa de algo que a equipe use
3. **Empreendedor Iniciante** - Orçamento apertado, quer presença digital profissional

## Backlog

### P0 (Próximas prioridades)
- Otimizar Core Web Vitals (LCP, CLS) - performance audit
- Adicionar depoimentos/testemunhos reais de clientes
- A/B testing na headline do hero e CTAs

### P1
- Heatmap integration (Hotjar/Microsoft Clarity)
- Micro-animações nos hover states dos cards
- Video hero background option
- Chat widget customizado (substituir Crisp)
- Contador de pedidos em tempo real (social proof dinâmica)

### P2
- Lottie animations para os 3 passos
- Landing page em espanhol para mercado LATAM
- Programa de referral gamificado

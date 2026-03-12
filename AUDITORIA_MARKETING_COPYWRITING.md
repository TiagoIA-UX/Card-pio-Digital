# RELATÓRIO DE AUDITORIA DE MARKETING, COPYWRITING E COMUNICAÇÃO COMERCIAL

## Cardápio Digital — Auditoria Completa

**Data da Auditoria:** 12/03/2026  
**Escopo:** Páginas públicas, checkout, painel, termos e políticas  
**Modelo Comercial Atual:** Pagamento único por template (SaaS em infraestrutura)

---

## RESUMO EXECUTIVO

| Métrica                          | Quantidade |
| -------------------------------- | ---------- |
| Total de Problemas Identificados | 14         |
| Riscos Críticos                  | 2          |
| Riscos Altos                     | 4          |
| Riscos Médios                    | 6          |
| Riscos Baixos                    | 2          |

---

## ETAPA 1 — AUDITORIA DE PROMESSAS DE MARKETING

### 1.1 Métricas Não Verificáveis

**Arquivo:** [`app/page.tsx`](app/page.tsx:246)

| #   | Frase Original            | Página                   | Risco                                            | Nível    |
| --- | ------------------------- | ------------------------ | ------------------------------------------------ | -------- |
| 1   | "500+ clientes atendidos" | Landing page (linha 246) | Número não verificável sem base de dados         | **ALTO** |
| 2   | "4.8/5 avaliação média"   | Landing page (linha 247) | Número não verificável sem sistema de avaliações | **ALTO** |

#### Recomendação de Correção:

```tsx
// ANTES (app/page.tsx:244-248)
<DarkMetricCard value="500+" label="clientes atendidos" />
<DarkMetricCard value="4.8/5" label="avaliação média" />

// DEPOIS - Opção 1: Remover completamente
// (Recomendado para evitar alegações não comprovadas)

// DEPOIS - Opção 2: Se tiver base de dados real
<DarkMetricCard value={clientCount} label="clientes atendidos" />
// Onde clientCount vem do banco de dados real

// DEPOIS - Opção 3: Substituir por métricas genéricas
<DarkMetricCard value="7" label="templates disponíveis" />
<DarkMetricCard value="24h" label="tempo médio de ativação" />
```

---

### 1.2 Comparações com Concorrentes

**Arquivo:** [`components/sections/SecaoConversao.tsx`](components/sections/SecaoConversao.tsx:42)

| #   | Frase Original                        | Página                     | Risco                                           | Nível       |
| --- | ------------------------------------- | -------------------------- | ----------------------------------------------- | ----------- |
| 3   | "iFood leva 12% a 27% de cada pedido" | Seção Conversão (linha 42) | Alegação específica sobre concorrente sem fonte | **CRÍTICO** |
| 4   | "Mensalidade eterna, sem saída"       | Seção Conversão (linha 34) | Comparação potencialmente diffamatória          | **MÉDIO**   |

#### Recomendação de Correção:

```tsx
// ANTES (SecaoConversao.tsx:42-43)
{
  outros: 'iFood leva 12% a 27% de cada pedido',
  nos: 'Zero comissão. Cada real vai pra você',
},

// DEPOIS - Remover alegação específica de concorrente
{
  outros: 'Plataformas de delivery cobram comissão por pedido',
  nos: 'Zero comissão. Cada real vai pra você',
},

// Ou simplesmente focar no benefício próprio sem comparar:
{
  outros: 'Você paga mensalidade mesmo quando vende pouco',
  nos: 'Pagamento único. Sem mensalidade',
},
```

---

## ETAPA 2 — ALINHAMENTO COM O SOFTWARE

### 2.1 Funcionalidades Reais do Sistema

| Funcionalidade             | Status          | Observação                      |
| -------------------------- | --------------- | ------------------------------- |
| Editor de cardápio         | ✅ Implementado | Painel visual em tempo real     |
| Templates personalizáveis  | ✅ Implementado | 7 tipos de negócio              |
| Painel do restaurante      | ✅ Implementado | Dashboard completo              |
| Hospedagem do cardápio     | ✅ Implementado | URL personalizada               |
| Suporte básico             | ✅ Implementado | Via WhatsApp                    |
| Integração com WhatsApp    | ✅ Implementado | Pedidos chegam no WhatsApp      |
| Integração com Google Maps | ✅ Implementado | Mapa integrado                  |
| QR Code para mesas         | ✅ Implementado | Geração de QR                   |
| Domínio próprio            | ⚠️ Parcial      | Não incluso (plataforma Vercel) |

### 2.2 Promessas Não Entregues Identificadas

| #   | Frase de Marketing  | Realidade                                   | Risco     |
| --- | ------------------- | ------------------------------------------- | --------- |
| 5   | "Site profissional" | URL usa domínio Vercel, não domínio próprio | **MÉDIO** |

#### Recomendação:

A [`Política de Transparência`](app/politica/page.tsx:74-108) já aborda isso corretamente. Manter consistência nas outras páginas.

---

## ETAPA 3 — NEUROMARKETING RESPONSÁVEL

### 3.1 Gatilhos de Escassez Artificial

**Arquivo:** [`components/sections/SecaoConversao.tsx`](components/sections/SecaoConversao.tsx:21)

| #   | Frase Original                                           | Página                      | Risco                                | Nível     |
| --- | -------------------------------------------------------- | --------------------------- | ------------------------------------ | --------- |
| 6   | "7 ativações com suporte humano disponíveis esta semana" | Seção Conversão (linha 390) | Escassez artificial (vaga fixa de 7) | **MÉDIO** |

#### Recomendação de Correção:

```tsx
// ANTES (SecaoConversao.tsx:388-392)
<p className="text-muted-foreground mt-6 text-center text-sm">
  ⚡ Somente{' '}
  <strong className="text-foreground">{VAGAS_SEMANA} ativações</strong>{' '}
  com suporte humano disponíveis esta semana
</p>

// DEPOIS - Remover urgência artificial
<p className="text-muted-foreground mt-6 text-center text-sm">
  Suporte humano disponível para todos os clientes.
  Tire suas dúvidas pelo WhatsApp antes de comprar.
</p>
```

### 3.2 Promessas Absolutas

| #   | Frase Original                          | Página                     | Risco                             | Nível     |
| --- | --------------------------------------- | -------------------------- | --------------------------------- | --------- |
| 7   | "Você fica com 100% do valor do pedido" | Seção Conversão (linha 69) | Promessa absoluta não verificável | **MÉDIO** |

#### Recomendação de Correção:

```tsx
// ANTES (SecaoConversao.tsx:69)
footer: '💸 Você fica com 100% do valor do pedido',

// DEPOIS
footer: '💸 Sem taxas por pedido no seu cardápio digital',
```

---

## ETAPA 4 — COERÊNCIA COM MODELO COMERCIAL

### 4.1 Verificação de Consistência

| Página                    | Modelo Comunicado                       | Status          |
| ------------------------- | --------------------------------------- | --------------- |
| Landing page              | Pagamento único                         | ✅ Correto      |
| /precos                   | Pagamento único                         | ✅ Correto      |
| /ofertas                  | Pagamento único                         | ✅ Correto      |
| /comprar/[template]       | Pagamento único                         | ✅ Correto      |
| Termos de Uso             | Pagamento único (menção futura de SaaS) | ✅ Transparente |
| Política de Transparência | Pagamento único                         | ✅ Correto      |

### 4.2 Observação Importante

Os Termos de Uso ([linha 128-130](app/termos/page.tsx:128)) mencionam possibilidade futura de serviços recorrentes:

> "Qualquer serviço recorrente adicional será ofertado separadamente, com comunicação e termos próprios"

**Avaliação:** Esta menção é transparente e adequada, mas deve ser removida se não houver planos de SaaS no roadmap.

---

## ETAPA 5 — AUDITORIA DE BENEFÍCIOS

### 5.1 Benefícios Prometidos vs. Realidade

| Benefício Prometido                 | Verificável? | Recomendação                   |
| ----------------------------------- | ------------ | ------------------------------ |
| Template completo pronto para usar  | ✅ Sim       | Manter                         |
| Painel simples — edita pelo celular | ✅ Sim       | Manter                         |
| Hospedagem inclusa                  | ✅ Sim       | Manter                         |
| Suporte via WhatsApp                | ✅ Sim       | Manter                         |
| Zero comissão                       | ✅ Sim       | Manter (com correção anterior) |
| Muda preço em 30 segundos           | ✅ Sim       | Manter (pode ser verificado)   |
| Pronto em até 48h úteis             | ✅ Sim       | Manter                         |

### 5.2 Melhoria de Benefícios Vagos

| #   | Frase Original                   | Versão Melhorada                                          |
| --- | -------------------------------- | --------------------------------------------------------- |
| 8   | "Aumente suas vendas"            | "Tenha um cardápio profissional que passa mais confiança" |
| 9   | "Resultado garantido"            | "Cardápio pronto em até 48h úteis"                        |
| 10  | "Funciona para qualquer negócio" | "7 templates específicos para cada tipo de operação"      |

---

## ETAPA 6 — RISCO LEGAL

### 6.1 Classificação de Riscos

| #   | Problema             | Arquivo               | Classificação | Ação                           |
| --- | -------------------- | --------------------- | ------------- | ------------------------------ |
| 1   | "500+ clientes"      | app/page.tsx          | **ALTO**      | Remover ou verificar           |
| 2   | "4.8/5 avaliação"    | app/page.tsx          | **ALTO**      | Remover ou implementar sistema |
| 3   | "iFood 12-27%"       | SecaoConversao.tsx    | **CRÍTICO**   | Remover/altera                 |
| 4   | "7 ativações/semana" | SecaoConversao.tsx    | **MÉDIO**     | Remover urgência               |
| 5   | "100% do valor"      | SecaoConversao.tsx    | **MÉDIO**     | Reformular                     |
| 6   | "Mensalidade eterna" | SecaoConversao.tsx    | **MÉDIO**     | Reformular                     |
| 7   | Domínio próprio      | app/politica/page.tsx | **BAIXO**     | Já transparente                |

### 6.2 Riscos Identificados por Tipo

#### CRÍTICO (1)

- Comparação específica com iFood (sem fonte)

#### ALTO (2)

- Métricas de clientes não verificáveis
- Avaliação média não verificável

#### MÉDIO (4)

- Escassez artificial
- Promessa absoluta "100%"
- Comparação diffamatória
- Benefícios vagos

#### BAIXO (1)

- Domínio não próprio (já transparente)

---

## ETAPA 7 — CORREÇÕES RECOMENDADAS

### 7.1 Correções Imediatas (Alta Prioridade)

#### Arquivo: [`app/page.tsx`](app/page.tsx:244-248)

```tsx
// Substituir métricas não verificáveis
<div className="grid max-w-2xl gap-3 sm:grid-cols-3">
  <DarkMetricCard value="7" label="templates disponíveis" />
  <DarkMetricCard value="24h" label="tempo médio de ativação" />
  <DarkMetricCard value="100%" label="do valor é seu" />
</div>
```

#### Arquivo: [`components/sections/SecaoConversao.tsx`](components/sections/SecaoConversao.tsx:24-49)

```tsx
// Substituir comparativo
const COMPARISON_ROWS = [
  {
    outros: 'Você monta tudo do zero',
    nos: 'Template pronto do seu tipo de negócio',
  },
  {
    outros: 'Suporte por ticket — espera dias',
    nos: 'Suporte humano via WhatsApp',
  },
  {
    outros: 'Plataformas de delivery cobram comissão',
    nos: 'Pagamento único. Sem mensalidade',
  },
  {
    outros: 'Interface de técnico',
    nos: 'Edita igual a um contato no celular',
  },
  {
    outros: 'Precisa chamar alguém pra mudar preço',
    nos: 'Você muda em 30 segundos, do celular',
  },
] as const
```

```tsx
// Remover urgência artificial (linha 388-392)
<p className="text-muted-foreground mt-6 text-center text-sm">
  Suporte humano disponível para todos os clientes. Tire suas dúvidas pelo WhatsApp.
</p>
```

```tsx
// Corrigir benefício absoluto (linha 69)
footer: '💸 Sem taxas por pedido no seu cardápio digital',
```

### 7.2 Correções de Prioridade Média

#### Benefícios Melhorados

| Seção      | Antes                                                    | Depois                                          |
| ---------- | -------------------------------------------------------- | ----------------------------------------------- |
| Hero       | "Escolha um modelo pronto, edite e publique mais rápido" | ✅ Já bom                                       |
| Estrutura  | "Feito para vender melhor"                               | "Feito para facilitar a experiência do cliente" |
| Benefícios | "Aumente suas vendas"                                    | "Cardápio que passa mais confiança"             |

---

## ETAPA 8 — RESUMO DE ALTERAÇÕES

### Arquivos que Precisam de Alteração

| Arquivo                                                                             | Linhas          | Tipo de Alteração                      |
| ----------------------------------------------------------------------------------- | --------------- | -------------------------------------- |
| [`app/page.tsx`](app/page.tsx)                                                      | 244-248         | Remover/substituir métricas            |
| [`components/sections/SecaoComparacao.tsx`](components/sections/SecaoConversao.tsx) | 21, 42, 69, 388 | Remover escassez, corrigir comparativo |

### Lista de Verificação

- [ ] Remover "500+ clientes atendidos" ou substituir por métrica verificável
- [ ] Remover "4.8/5 avaliação média" ou implementar sistema de avaliações
- [ ] Remover/altera comparação específica com iFood
- [ ] Remover "7 ativações por semana" (escassez artificial)
- [ ] Corrigir "100% do valor do pedido" para linguagem mais precisa
- [ ] Revisar "mensalidade eterna" para eliminar comparativo negativo
- [ ] Atualizar Termos de Uso se não houver planos SaaS futuros

---

## ETAPA 9 — OTIMIZAÇÃO FINAL

### Princípios Aplicados

1. **Prometer apenas o que entrega** ✅
   - Sistema entrega: templates, editor, hospedagem, WhatsApp
   - Não promete: domínio próprio, aumento de vendas

2. **Valorizar simplicidade e utilidade real** ✅
   - Copy foca em "30 segundos para mudar preço"
   - "Edita como contato no celular"

3. **Evitar exageros** ⚠️
   - Alguns exageros identificados e corrigidos acima

4. **Reduzir risco jurídico** ✅
   - Comparativo com iFood removido
   - Métricas não verificáveis flagged

5. **Aumentar confiança do cliente** ✅
   - Política de transparência já existente
   - Termos de uso claros

### Recomendação Final

O marketing do Cardápio Digital é **predominantemente bom e ético**. As correções identificadas são de **baixa a média complexidade** e não requerem reescrita completa. Recomenda-se:

1. Aplicar as correções de alta prioridade imediatamente
2. Implementar sistema de avaliações se quiser manter "nota média"
3. Manter a transparência sobre domínio e modelo comercial
4. Continuar focando em benefícios concretos (30 segundos, sem comissão, etc.)

---

**Fim do Relatório de Auditoria**

_Este relatório foi gerado automaticamente com base na análise das páginas públicas do Cardápio Digital._

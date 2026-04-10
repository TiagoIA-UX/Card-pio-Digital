# Análise do Feedback Emergent.sh — Landing Page Zairyx

**Data**: 10/04/2026  
**Fonte**: Análise Emergent.sh sobre zairyx.com.br  
**Filtro aplicado**: §9 do Protocolo de Proteção (Integridade Ética)

---

## RESUMO DA ANÁLISE EMERGENT

**Nota geral: 7.5/10** — Landing estruturalmente excelente (copy 9/10, proposta de valor 10/10), com lacuna principal em prova social real.

---

## TRIAGEM: O QUE É VIÁVEL vs O QUE VIOLA NOSSAS REGRAS

### ❌ REJEITADO — Viola §9 (Integridade Ética)

| Sugestão do Emergent                               | Por que rejeitamos                            | Alternativa ética                                                                                           |
| -------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| "Adicionar 3-5 depoimentos em vídeo"               | Não temos clientes reais com resultados ainda | Manter cenários ilustrativos rotulados + preparar estrutura para receber depoimentos reais quando existirem |
| "Escassez genuína (vagas limitadas)"               | Se não há limite real, é dark pattern         | Só usar quando houver limite técnico real (ex: capacidade de onboarding)                                    |
| "De R$ 297 por R$ 147" (ancoragem de preço)        | Se nunca custou R$ 297, é enganoso            | Comparar com custo real de equivalentes (ex: "menos que 1 dia de comissão no iFood")                        |
| "Screenshots de WhatsApp com clientes satisfeitos" | Fabricar conversas é fraude                   | Só usar quando tiver conversas reais COM autorização do cliente                                             |
| "Logo de parceiros/clientes"                       | Não temos parceiros formais para exibir       | Campo preparado: "Parceiros em breve" ou omitir                                                             |
| "Countdown fake / urgência fabricada"              | Dark pattern explícito                        | Urgência sutil baseada em fato: "enquanto você decide, concorrentes já vendem" (✅ já temos)                |

---

### ✅ APROVADO — Melhorias viáveis e éticas

#### 🚨 ALTA PRIORIDADE

| #   | Melhoria                                                                                             | Impacto                         | Esforço | Arquivo afetado                               |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------- | ------- | --------------------------------------------- |
| 1   | **Hero com GIF/vídeo do produto** — Mostrar o painel real funcionando (editar → publicar em minutos) | Alto — visualização é prova     | Médio   | `app/page.tsx` (hero section)                 |
| 2   | **Badge de garantia visual** — Selo "7 dias de arrependimento" destacado perto dos CTAs              | Alto — remove medo              | Baixo   | `app/page.tsx` (próximo aos botões de compra) |
| 3   | **Teste A/B no CTA** — "Começar agora" vs "Ver meu modelo pronto"                                    | Alto — dados reais de conversão | Baixo   | `app/page.tsx` + `components/hero-ab.tsx`     |
| 4   | **Tabelas responsivas mobile** — Cards deslizáveis 1v1 no mobile em vez de tabela com scroll         | Alto — público é mobile-first   | Médio   | `app/page.tsx` (seção comparativo)            |

#### ⚡ MÉDIA PRIORIDADE

| #   | Melhoria                                                                                                                | Impacto                      | Esforço | Arquivo afetado                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------- | ------------------------------------------------- |
| 5   | **Lead magnet — calculadora personalizada** — "Calcule SUA economia" com email para receber análise                     | Médio — captura leads mornos | Médio   | `components/sections/SavingsCalculator.tsx`       |
| 6   | **Gráfico de barras na calculadora** — Visualizar "Com iFood" vs "Com Zairyx" em barras                                 | Médio — mais impacto visual  | Baixo   | `components/sections/SavingsCalculator.tsx`       |
| 7   | **Timeline "Jornada do Cliente"** — Dia 1 → Semana 1 → Mês 1 (baseada em funcionalidades reais, rotulada como projeção) | Médio — substitui cenários   | Médio   | Novo componente ou substituir TestimonialsSection |
| 8   | **Sticky CTA no mobile** — Botão fixo no rodapé em telas pequenas                                                       | Médio — facilita conversão   | Baixo   | `app/page.tsx` ou componente global               |

#### 📋 BAIXA PRIORIDADE

| #   | Melhoria                                                               | Impacto                       | Esforço | Arquivo afetado          |
| --- | ---------------------------------------------------------------------- | ----------------------------- | ------- | ------------------------ |
| 9   | **SEO — Schema markup** — Rich snippets para FAQ, produto, organização | Baixo-médio — SEO longo prazo | Baixo   | `app/page.tsx` (JSON-LD) |
| 10  | **Blog para SEO** — Conteúdo educativo (economia delivery, dicas)      | Baixo — longo prazo           | Alto    | Nova seção `app/blog/`   |
| 11  | **Exit-intent popup** — Oferecer consultoria gratuita ao sair          | Baixo — pode irritar          | Médio   | Novo componente          |

---

## SOBRE PROVA SOCIAL — NOSSA POSIÇÃO

O Emergent identificou corretamente que prova social é a maior lacuna (nota 3/10). **Concordamos**, mas nossa resposta é diferente:

### O que NÃO faremos:

- Fabricar depoimentos ou avaliações
- Usar fotos de banco de imagens como "clientes"
- Inventar números de clientes atendidos
- Criar badges ou selos falsos

### O que FAREMOS:

1. **Manter cenários ilustrativos** rotulados claramente como "simulações baseadas nas funcionalidades do sistema" ✅ (já fazemos em `TestimonialsSection.tsx`)
2. **Preparar infraestrutura** para receber depoimentos reais quando existirem (form de coleta, área no banco)
3. **Usar transparência como diferencial** — ser novo no mercado e honesto sobre isso gera mais confiança do que números fake
4. **Priorizar prova funcional** — vídeo/GIF do produto REAL funcionando vale mais que 100 depoimentos inventados

### Referência legal:

- **CDC Art. 37**: Propaganda enganosa é crime
- **LGPD**: Uso de imagem de terceiro sem consentimento
- **CONAR**: Publicidade deve ser honesta e identificável

---

## AÇÕES SUGERIDAS — ORDEM DE EXECUÇÃO

### Sprint 1 (Impacto rápido)

1. ✅ Badge de garantia visual — selo próximo aos CTAs
2. ✅ Sticky CTA mobile — botão fixo no rodapé
3. ✅ Schema markup JSON-LD (FAQ + Product)

### Sprint 2 (Visual do produto)

4. 🎥 Gravar GIF/vídeo real do painel (sem edição, produto real)
5. 📊 Gráfico de barras na calculadora

### Sprint 3 (Conversão)

6. 📱 Tabelas responsivas mobile (cards 1v1)
7. 📧 Lead magnet com calculadora personalizada
8. 🧪 Teste A/B no CTA principal

### Futuro (quando houver dados reais)

9. 🗣️ Depoimentos reais de clientes (com autorização)
10. 📊 Métricas reais do banco de dados
11. 📝 Blog com conteúdo educativo

---

## CONCORDÂNCIA COM NOTA DO EMERGENT

| Critério            | Nota Emergent | Nossa visão                                                                |
| ------------------- | ------------- | -------------------------------------------------------------------------- |
| Copywriting         | 9/10          | ✅ Concordamos                                                             |
| Design/UX           | 7/10          | ✅ Concordamos — hero e tabelas mobile são melhoráveis                     |
| Prova Social        | 3/10          | ⚠️ Concordamos com a nota, DISCORDAMOS da solução — não fabricaremos dados |
| CTAs                | 8/10          | ✅ Concordamos — sticky mobile pode subir para 9                           |
| Remoção de Objeções | 9/10          | ✅ Concordamos — FAQ é sólido                                              |
| Proposta de Valor   | 10/10         | ✅ Concordamos                                                             |
| Trust/Credibilidade | 6/10          | ✅ Concordamos — mas transparência é estratégia, não fraqueza              |
| Mobile-Friendliness | 7/10          | ✅ Concordamos — tabelas são o ponto fraco                                 |

---

_Documento gerado para referência interna. Ações dependem de aprovação do owner._

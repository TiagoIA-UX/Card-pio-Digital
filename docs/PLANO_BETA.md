# 🚀 Plano de Beta — Cardápio Digital

**Data**: 2026-03-24
**Versão Beta**: 2.1.0-beta
**Produção**: https://zairyx.com
**Duração prevista**: 8 semanas (2 meses)

---

## 1. O que é a Fase Beta?

A fase beta é o período de **validação real** do produto com restaurantes parceiros. O objetivo não é vender — é **aprender, iterar e provar** que o produto resolve o problema antes de escalar.

### Objetivos da Beta
1. Validar product-market fit com restaurantes reais
2. Identificar bugs e problemas de UX que só aparecem em uso real
3. Coletar feedback estruturado para priorizar roadmap
4. Gerar primeiros cases de sucesso e depoimentos
5. Testar fluxo completo: cadastro → template → personalização → pedidos → pagamento
6. Validar integrações (WhatsApp, Mercado Pago, Cloudflare R2)
7. Medir métricas reais (pedidos/dia, ticket médio, tempo de setup)
8. Refinar precificação baseado em valor percebido

---

## 2. Pré-requisitos (antes de iniciar a beta)

### 2.1 Merge dos PRs pendentes
- [ ] audit: Auditoria PhD (corrige base do código)
- [ ] feat: Scripts + 6 Features (cupons, analytics, fidelidade, avaliações, PWA, email)
- [ ] docs: Todos os 4 PRs de documentação
- [ ] Dependabot: PRs #10-#16 (dependências atualizadas)
- [ ] Fechar: PR #31 (não-acionável)

### 2.2 Validação técnica
- [ ] Rodar `npm run pre-merge` — tudo verde
- [ ] Rodar `npm run setup:completo` — tudo validado
- [ ] Testar checkout Mercado Pago em sandbox completo
- [ ] Testar pedido WhatsApp end-to-end
- [ ] Testar upload de imagens (Cloudflare R2)
- [ ] Verificar rate limiting funcionando
- [ ] Verificar RLS em todas as tabelas novas

### 2.3 Infraestrutura
- [ ] Domínio configurado (zairyx.com)
- [ ] SSL ativo
- [ ] Vercel production deployment funcionando
- [ ] Supabase production configurado
- [ ] Mercado Pago production credentials
- [ ] Cloudflare R2 production bucket
- [ ] Upstash Redis production
- [ ] Groq API key production
- [ ] Monitoramento básico (Vercel Analytics + Speed Insights)

### 2.4 Conteúdo
- [ ] Landing page otimizada com CTA claro
- [ ] Página de preços (mesmo que beta seja gratuita)
- [ ] Termos de uso e política de privacidade atualizados
- [ ] Email de boas-vindas configurado
- [ ] Documentação de onboarding para operador

---

## 3. Estratégia de Recrutamento de Beta Testers

### 3.1 Perfil ideal do beta tester
- Restaurantes pequenos/médios (1-3 unidades)
- Já fazem delivery por WhatsApp (sem sistema)
- Frustrados com comissões do iFood
- Dispostos a dar feedback honesto
- Localizados em cidades médias (50k-500k habitantes)
- Nichos variados: pelo menos 1 de cada (pizzaria, lanchonete, restaurante, açaí, etc.)

### 3.2 Meta de beta testers
| Fase | Semana | Quantidade | Objetivo |
|---|---|---|---|
| Alpha fechada | 1-2 | 5 restaurantes | Encontrar bugs críticos |
| Beta fechada | 3-4 | 15 restaurantes | Validar fluxos e UX |
| Beta aberta | 5-8 | 30-50 restaurantes | Escalar e medir métricas |

### 3.3 Canais de recrutamento
1. **Abordagem direta** — Visitar restaurantes locais, mostrar demo no celular
2. **WhatsApp** — Grupos de donos de restaurantes
3. **Instagram** — Posts mostrando templates, stories com demo
4. **Facebook** — Grupos de empreendedores food-service
5. **Indicação** — Beta tester indica outro e ganha mês grátis extra
6. **LinkedIn** — Posts sobre tecnologia para food-service
7. **Google Meu Negócio** — Contatar restaurantes sem site próprio

### 3.4 Oferta da beta
- **3 meses GRÁTIS** do plano Profissional (R$ 99,90/mês)
- Setup assistido (ajudamos a configurar)
- Suporte prioritário via WhatsApp
- Feedback mensal com o fundador
- Desconto de 50% nos primeiros 6 meses após a beta
- Nome na página "Primeiros parceiros" (social proof)

---

## 4. Onboarding do Beta Tester

### 4.1 Fluxo de onboarding (30 minutos)
1. **Cadastro** (2 min) — Email + nome do restaurante
2. **Escolha do template** (3 min) — Selecionar nicho e template
3. **Personalização** (10 min) — Logo, cores, banner, nome, WhatsApp, endereço
4. **Cadastro de produtos** (10 min) — Mínimo 10 produtos com foto e preço
5. **Configuração de pagamento** (3 min) — Conectar Mercado Pago (ou só WhatsApp)
6. **Publicação** (2 min) — Gerar link e QR Code
7. **Primeiro pedido teste** — Fazer um pedido de teste junto com o operador

### 4.2 Kit de boas-vindas (email)
- Link do cardápio publicado
- QR Code para imprimir
- Guia rápido em PDF (como adicionar/editar produtos)
- Link do painel
- Contato do suporte (WhatsApp)
- Calendário de calls de feedback

---

## 5. Métricas da Beta

### 5.1 Métricas de ativação
| Métrica | Meta | Como medir |
|---|---|---|
| Taxa de cadastro completo | > 80% | Quantos completam onboarding |
| Tempo de setup | < 30 min | Timer no onboarding |
| Produtos cadastrados/restaurante | > 15 | Query no Supabase |
| Primeiro pedido em < 24h | > 50% | Timestamp do primeiro pedido |

### 5.2 Métricas de engajamento
| Métrica | Meta | Como medir |
|---|---|---|
| Pedidos por restaurante/semana | > 20 | Dashboard analytics |
| Ticket médio | > R$ 30 | Dashboard analytics |
| Logins no painel/semana | > 3 | Supabase Auth logs |
| Produtos atualizados/mês | > 5 | Audit log |

### 5.3 Métricas de satisfação
| Métrica | Meta | Como medir |
|---|---|---|
| NPS (Net Promoter Score) | > 50 | Pesquisa mensal |
| Bugs reportados | < 5/semana | Formulário de feedback |
| Feature requests | Coletar tudo | Formulário + calls |
| Taxa de churn na beta | < 10% | Quantos desistem |

### 5.4 Métricas de negócio
| Métrica | Meta | Como medir |
|---|---|---|
| Disposição a pagar | > 70% | Pesquisa no final da beta |
| Preço que pagariam | > R$ 49,90 | Pesquisa |
| Indicariam para amigo | > 80% | NPS |
| Depoimento escrito | > 50% | Solicitar |

---

## 6. Cronograma da Beta (8 semanas)

### Semana 1-2: Alpha Fechada (5 restaurantes)
- [ ] Recrutar 5 restaurantes locais (abordagem direta)
- [ ] Onboarding assistido presencial
- [ ] Monitorar diariamente (bugs, erros, UX)
- [ ] Call de feedback ao final da semana 2
- [ ] Corrigir bugs críticos encontrados

### Semana 3-4: Beta Fechada (15 restaurantes)
- [ ] Recrutar mais 10 restaurantes (WhatsApp, indicação)
- [ ] Onboarding por videocall
- [ ] Implementar feedback da alpha
- [ ] Primeira pesquisa NPS
- [ ] Ativar sistema de cupons com beta testers
- [ ] Testar programa de fidelidade

### Semana 5-6: Beta Aberta (30 restaurantes)
- [ ] Abrir inscrição pública (landing page com formulário)
- [ ] Onboarding self-service (guia automatizado)
- [ ] Implementar feedback da beta fechada
- [ ] Segunda pesquisa NPS
- [ ] Coletar primeiros depoimentos
- [ ] Testar programa de afiliados (beta testers como primeiros afiliados)

### Semana 7-8: Validação Final (50 restaurantes)
- [ ] Medir todas as métricas definidas
- [ ] Pesquisa de disposição a pagar
- [ ] Coletar depoimentos em vídeo (3-5)
- [ ] Cases de sucesso escritos (3)
- [ ] Definir precificação final baseada em feedback
- [ ] Preparar launch checklist
- [ ] Decidir: pivotar, iterar ou escalar

---

## 7. Feedback Loop

### 7.1 Canais de coleta
1. **WhatsApp** — Grupo exclusivo "Beta Testers Cardápio Digital"
2. **Formulário** — Google Forms com perguntas estruturadas (semanal)
3. **Call mensal** — 30 min com cada beta tester
4. **In-app** — Botão de feedback no painel (rota `/feedback` já existe)
5. **Analytics** — Métricas automáticas no dashboard

### 7.2 Perguntas semanais (formulário)
1. De 0 a 10, quanto você recomendaria o Cardápio Digital?
2. O que funcionou bem esta semana?
3. O que te frustrou esta semana?
4. Qual funcionalidade faz mais falta?
5. Seus clientes comentaram algo sobre o cardápio?
6. Quantos pedidos você recebeu pelo cardápio?

### 7.3 Processo de priorização
- Coletar todo feedback em uma planilha
- Categorizar: bug / UX / feature request / elogio
- Priorizar por: frequência × impacto × esforço
- Comunicar o que vai ser feito (e o que não vai) — transparência
- Implementar em sprints de 1 semana durante a beta

---

## 8. Riscos da Beta e Mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Poucos restaurantes se interessam | Média | Alto | Oferta irresistível (3 meses grátis + setup assistido) |
| Bugs críticos em produção | Média | Alto | Monitoramento diário, hotfix em < 4h |
| Mercado Pago falha no checkout | Baixa | Alto | Fallback para pedido via WhatsApp |
| Restaurante não sabe cadastrar produtos | Alta | Médio | Onboarding assistido + guia visual |
| Baixo engajamento após setup | Média | Alto | Mensagens automáticas + calls de check-in |
| Feedback negativo esmagador | Baixa | Alto | Iterar rápido, pivotar se necessário |
| Concorrente copia diferenciais | Baixa | Baixo | Velocidade de execução + ecossistema difícil de copiar |

---

## 9. Critérios de Sucesso (Go/No-Go para lançamento)

### ✅ GO (lançar comercialmente) se:
- NPS > 50
- > 70% dispostos a pagar
- > 20 pedidos/semana por restaurante
- < 10% churn na beta
- > 5 depoimentos positivos
- 0 bugs críticos não resolvidos

### ❌ NO-GO (iterar mais) se:
- NPS < 30
- < 50% dispostos a pagar
- < 10 pedidos/semana por restaurante
- > 30% churn na beta
- Feedback predominantemente negativo
- Bugs críticos recorrentes

### 🔄 PIVOT se:
- < 20% dispostos a pagar
- Restaurantes não veem valor no produto
- Concorrente gratuito atende melhor
- Modelo de negócio não se sustenta

---

## 10. Pós-Beta: Lançamento Comercial

### 10.1 Checklist de lançamento
- [ ] Precificação validada
- [ ] Planos configurados no Mercado Pago (recorrência)
- [ ] Landing page com depoimentos e cases
- [ ] Página de preços final
- [ ] Onboarding 100% self-service
- [ ] Suporte via tickets funcionando
- [ ] Programa de afiliados ativo
- [ ] Campanhas de marketing preparadas
- [ ] Meta de MRR mês 1: R$ 2.500 (50 clientes × R$ 49,90)

### 10.2 Escala gradual
| Mês | Meta clientes | Meta MRR | Foco |
|---|---|---|---|
| Mês 1 | 50 | R$ 2.500 | Beta testers convertendo |
| Mês 2 | 100 | R$ 5.000 | Afiliados ativando |
| Mês 3 | 200 | R$ 10.000 | Marketing pago (Facebook/Instagram) |
| Mês 6 | 500 | R$ 25.000 | Agências como canal |
| Mês 12 | 1.500 | R$ 75.000 | Multi-cidade + LatAm |

---

## 11. Template de Email para Convite Beta

**Assunto**: Seu restaurante precisa de um cardápio digital? 3 meses GRÁTIS 🎁

**Corpo**:

Olá [NOME],

Sou o Tiago, fundador do Cardápio Digital (zairyx.com). Estamos lançando uma plataforma de cardápio digital com:

✅ 15 templates profissionais por nicho
✅ Pedidos direto no seu WhatsApp
✅ Pagamento online (Mercado Pago)
✅ 0% de comissão — sempre
✅ QR Code para mesas

Estamos selecionando 50 restaurantes para a nossa beta exclusiva com **3 meses totalmente GRÁTIS** do plano Profissional (valor: R$ 99,90/mês).

Em troca, só pedimos:
- 5 minutos de feedback por semana
- Permissão para usar como case de sucesso

Quer participar? Responde esse WhatsApp que eu configuro tudo pra você em 30 minutos.

Abraço,
Tiago

---

## 12. Conclusão

A beta é onde a teoria vira realidade. O produto está tecnicamente sólido (score B+), com diferenciais únicos no mercado. Agora é hora de **colocar na mão de restaurantes reais** e provar que resolve o problema.

A meta é simples: **50 restaurantes felizes em 8 semanas**. Se conseguirmos isso, o lançamento comercial é questão de apertar o botão.

Bora! 🚀

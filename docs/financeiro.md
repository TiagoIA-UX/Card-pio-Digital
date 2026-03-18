# Modelo Financeiro — Cardápio Digital / Zairyx Tecnologia

> **Auditoria realizada em:** 15/03/2026  
> **Branch:** rename/cardapio-digital  
> **Status:** ✅ Margem positiva em todos os cenários analisados

---

## 1. Modelo de Negócio

### Taxa única de setup (one-time)

| Template                      | Complexidade | Self-Service PIX | Self-Service Card | Feito Pra Você PIX | Feito Pra Você Card |
| ----------------------------- | ------------ | ---------------- | ----------------- | ------------------ | ------------------- |
| Lanchonete / Açaí             | Simples (1)  | R$ 197           | R$ 237            | R$ 497             | R$ 597              |
| Restaurante / Cafeteria / Bar | Médio (2)    | R$ 247           | R$ 297            | R$ 597             | R$ 717              |
| Pizzaria / Sushi              | Complexo (3) | R$ 297           | R$ 357            | R$ 697             | R$ 837              |

### Assinatura recorrente (mensal)

| Plano                 | Mensal    | Anual (10×) | Origem                                   |
| --------------------- | --------- | ----------- | ---------------------------------------- |
| Básico (Self-Service) | R$ 59/mês | R$ 590/ano  | `cfg.priceMonthly` (templates-config.ts) |
| Pro (Feito Pra Você)  | R$ 89/mês | R$ 885/ano  | básico × 1,5                             |

_Valores exatos por template: 54-69 (básico). Usado R$59 como referência central._

---

## 2. Custos por Transação

### Taxa MercadoPago (estimativa Brasil — conta padrão)

| Método                   | Taxa            | Sobre       |
| ------------------------ | --------------- | ----------- |
| PIX                      | 0,99%           | Valor total |
| Cartão 1×                | 4,99% + R$0,40  | Valor total |
| Recorrência (assinatura) | ~3,49% + R$0,20 | Valor total |

### Comissão de afiliados (2 níveis)

| Nível                              | Percentual                                        | Sobre                       |
| ---------------------------------- | ------------------------------------------------- | --------------------------- |
| Vendedor (L1)                      | 30% (trainee-gerente), 32% (diretor), 35% (sócio) | Valor pago pelo restaurante |
| Líder (L2)                         | 10%                                               | Valor pago pelo restaurante |
| **Total máximo saindo da empresa** | **45%** (sócio + líder)                           | —                           |

---

## 3. Margem por Restaurante/Mês

### Cenário base: R$59/mês, PIX, afiliado trainee (30%)

```
Receita bruta:          R$ 59,00
(-) Taxa MP (0,99%):    R$  0,58
(-) Comissão L1 (30%):  R$ 17,70
(-) Comissão L2 (10%):  R$  5,90  ← se houver líder
(-) Infraestrutura:     R$  0,00  (Vercel/Supabase free-tier)
(=) Margem líquida:     R$ 34,82  →  59% de margem
```

### Resumo por tier de afiliado

| Tier afiliado   | L1 % | L1 R$/mês | L2 R$/mês | Empresa R$/mês | Margem  |
| --------------- | ---- | --------- | --------- | -------------- | ------- |
| Trainee-Gerente | 30%  | R$17,70   | R$5,90    | **R$34,82**    | **59%** |
| Diretor         | 32%  | R$18,88   | R$5,90    | **R$33,64**    | **57%** |
| Sócio           | 35%  | R$20,65   | R$5,90    | **R$31,87**    | **54%** |
| Sem afiliado    | —    | —         | —         | **R$58,42**    | **99%** |

_L2 só existe quando o vendedor foi recrutado por um líder ativo._

### Taxa única de setup (com afiliado 30%)

| Cenário                       | Receita | Custo MP | Afiliado 30% | Freelancer | Empresa            |
| ----------------------------- | ------- | -------- | ------------ | ---------- | ------------------ |
| Self-Service lanchonete PIX   | R$197   | R$1,95   | R$59,10      | —          | **R$135,95** (69%) |
| Self-Service pizzaria PIX     | R$297   | R$2,94   | R$89,10      | —          | **R$204,96** (69%) |
| Feito Pra Você lanchonete PIX | R$497   | R$4,92   | R$149,10     | ~R$275     | **R$67,98** (14%)  |
| Feito Pra Você pizzaria PIX   | R$697   | R$6,90   | R$209,10     | ~R$350     | **R$131,00** (19%) |

> ⚠️ **ALERTA 1:** FPVC com template simples (R$497) + custo de freelancer ≈ 14% de margem na venda inicial. Aceitável, mas não há gordura. Se o freelancer custar mais que R$300, a margem do lote simples some. Recomendação: manter R$497 como mínimo absoluto para FPVC.

---

## 4. Simulações

### 100 restaurantes ativos (70% via afiliado, R$59/mês médio)

```
Receita bruta:                  R$  5.900,00
(-) Taxa MP (PIX 0,99%):       R$     58,41
(-) Comissões L1 (70×30%×R$59):R$  1.239,00
(-) Comissões L2 (30% com líder R$5,90):  R$    124,00
(=) Receita líquida:           R$  4.478,59 / mês
```

### 500 restaurantes ativos (70% via afiliado, R$59/mês médio)

```
Receita bruta:                  R$ 29.500,00
(-) Taxa MP (PIX 0,99%):       R$    292,05
(-) Comissões L1:              R$  6.195,00
(-) Comissões L2:              R$    620,00
(=) Receita líquida:           R$ 22.392,95 / mês
```

### Break-even

> A empresa tem **margem positiva a partir do 1º restaurante ativo**, pois:
>
> - Infraestrutura = R$0 (free-tier Vercel + Supabase + Cloudflare)
> - Toda receita excede os custos variáveis (comissão + MP)
>
> O break-even muda apenas se infraestrutura migrar para tier pago (ex: Vercel Pro ≈ US$20/mês ≈ R$120/mês → 4 restaurantes cobrem).

---

## 5. Bônus por Volume — Antes vs. Depois

### Antes da auditoria (insustentável)

| Tier        | Restaurantes | Bônus    | Acumulado    |
| ----------- | ------------ | -------- | ------------ |
| Analista    | 3            | R$ 50    | R$ 50        |
| Coordenador | 10           | R$ 150   | R$ 200       |
| Gerente     | 25           | R$ 300   | R$ 500       |
| Diretor     | 50           | R$ 600   | R$ 1.100     |
| Sócio       | 100          | R$ 1.500 | **R$ 2.600** |

### Depois da auditoria (simbólico ✅)

| Tier        | Restaurantes | Bônus | Acumulado  | Justificativa                                             |
| ----------- | ------------ | ----- | ---------- | --------------------------------------------------------- |
| Analista    | 3            | R$ 0  | R$ 0       | Marco ainda não significativo                             |
| Coordenador | 10           | R$ 10 | R$ 10      | Empresa já fatura R$390+/mês deste afiliado               |
| Gerente     | 25           | R$ 25 | R$ 35      | Empresa fatura R$975+/mês deste afiliado                  |
| Diretor     | 50           | R$ 50 | R$ 85      | Empresa fatura R$1.975+/mês deste afiliado                |
| Sócio       | 100          | R$ 50 | **R$ 135** | Bônus não escala além de R$50 — suficientemente simbólico |

**Redução:** de R$2.600 para R$135 acumulados (−94,8%)  
**Payback do bônus máximo (R$50 no marco 50):** recouped em **menos de 1 dia** de receita gerada por esse afiliado.

---

## 6. Alertas de Sustentabilidade

| #   | Risco                            | Gatilho                                | Impacto                                            | Status                                  |
| --- | -------------------------------- | -------------------------------------- | -------------------------------------------------- | --------------------------------------- |
| 1   | FPVC margem apertada             | Freelancer > R$300 em template simples | Margem ~14% → negativa                             | ⚠️ Monitorar — não mudar código agora   |
| 2   | Sócio com 35% + líder 10%        | Afiliado com 100+ restaurantes         | Margem cai para 54%                                | ✅ Aceitável com free-tier              |
| 3   | Bônus acumulados antigos         | Era R$2.600/afiliado chegar ao Sócio   | Comprometia margens mês do pagamento               | ✅ Corrigido — migration 019            |
| 4   | Infraestrutura sair do free-tier | Supabase/Vercel pagos                  | Precisa de ~4-8 restaurantes orgânicos para cobrir | ✅ Fácil de absorver                    |
| 5   | Cupons de desconto sem teto      | Um cupom de 100% zera qualquer margem  | —                                                  | ⚠️ Verificar lógica de `validateCoupon` |

---

## 7. Recomendações Implementadas

### R1 — Bônus simbólicos ✅ (implementado agora)

- `lib/affiliate-tiers.ts`: novos valores (R$0/0/10/25/50/50)
- `supabase/migrations/019_symbolic_bonus_milestones.sql`: alinha DB

### R2 — Documentação financeira ✅ (este arquivo)

- Centraliza modelo para decisões futuras de pricing

### R3 — Preço mínimo FPVC como regra de negócio (a implementar quando necessário)

- Se templates complexidade 1 custarem menos que R$497 no FPVC, a margem com afiliado pode ficar negativa após renegociação com o freelancer
- Sugestão: adicionar `minFpvcPrice: 497` em `templates-config.ts` como guardrail

---

## 8. Estratégia de Reserva de Setup — Fundo de Bônus

### Como funciona

A cada pagamento de setup aprovado, **10% do valor** é automaticamente reservado em uma tabela `bonus_fund` (migration 021).  
O saldo fica em **conta-corrente com rendimento externo** (ex: CDB, conta-poupança empresarial).  
O owner credita o rendimento mensalmente via painel `/admin/bonus-fund`.

### Exemplos de reserva automática

| Valor do Setup                   | Reserva (10%) | Saldo restante empresa |
| -------------------------------- | ------------- | ---------------------- |
| R$ 197 (self-service simples)    | R$ 19,70      | R$ 177,30              |
| R$ 297 (self-service pizzaria)   | R$ 29,70      | R$ 267,30              |
| R$ 397 (self-service médio card) | R$ 39,70      | R$ 357,30              |
| R$ 497 (FPV simples)             | R$ 49,70      | R$ 447,30              |
| R$ 697 (FPV pizzaria)            | R$ 69,70      | R$ 627,30              |

### Capacidade de custeio de bônus

| Setups/mês (R$297 médio) | Fundo alimentado/mês | Bônus máximo 50 afiliados (R$50 cada) | Cobertura         |
| ------------------------ | -------------------- | ------------------------------------- | ----------------- |
| 10                       | R$ 297               | R$ 500                                | ⚠️ parcial        |
| 20                       | R$ 594               | R$ 500                                | ✅ total          |
| 50                       | R$ 1.485             | R$ 500                                | ✅ folga de R$985 |

> **Regra de saque:** ao pagar um bônus de marco pelo painel `/admin/comissoes`, o sistema verifica o saldo disponível e debita o fundo. Se insuficiente, um alerta é logado e o pagamento sai do caixa operacional (não bloqueante).

### Instrução operacional mensal

1. Acesse o extrato da conta-rendimento empresarial.
2. Abra `/admin/bonus-fund` e clique em **"Creditar Rendimento"**.
3. Insira o valor exato gerado no mês + descrição do extrato.
4. Monitore: saldo < R$200 = alerta laranja; saldo ≥ R$500 = fundo saudável (verde).

---

## 9. Fórmulas de Referência

```
// Margem por restaurante/mês com afiliado
margem = receita × (1 - taxaMP) × (1 - comissaoL1) × (1 - comissaoL2)

// Payback de bônus único
mesesParaRecouped = bonusUnico / (receita × (1 - taxaMP - comissaoL1 - comissaoL2))

// Exemplo Diretor (50 rest, novo bônus R$50):
empresa_por_rest = R$59 × (1 - 0.0099) × (1 - 0.32) = R$39.82/mês
empresa_total = 50 × R$39.82 = R$1.991/mês
payback_bonus = R$50 / R$1.991 = 0,025 meses = < 1 dia ✅
```

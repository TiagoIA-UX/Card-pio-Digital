# Auditoria PhD — Templates de Cardápio Digital

> Data: Junho 2025 | Contexto Regional: Litoral Norte SP (Caraguatatuba, Ubatuba, São Sebastião, Ilhabela)

## Resumo Executivo

Auditoria completa dos **15 templates** com ~900 produtos. Identificadas 5 falhas estruturais críticas e implementadas correções de alto impacto.

## Templates Auditados (15)

| # | Slug | Nome | Produtos | Combos | Score |
|---|------|------|----------|--------|-------|
| 1 | restaurante | Restaurante / Marmitaria | 47 → 52 | 0 → 5 | 5/10 → 8/10 |
| 2 | pizzaria | Pizzaria | 48 | 6 | 8/10 |
| 3 | lanchonete | Hamburgueria / Lanchonete | 46 | 5 | 7/10 |
| 4 | bar | Bar / Pub | 55 | 4 | 7/10 |
| 5 | cafeteria | Cafeteria | 43 | 3 | 6/10 |
| 6 | acai | Açaíteria | 38 | 4 | 7/10 |
| 7 | sushi | Japonês / Sushi | 46 | 6 | 8/10 |
| 8 | adega | Adega / Delivery de Bebidas | 83 | 11 | 7/10 |
| 9 | mercadinho | Mercadinho / Minimercado | 128 | 5 | 6/10 |
| 10 | padaria | Padaria / Confeitaria | 60 | 3 | 6/10 |
| 11 | sorveteria | Sorveteria | 50 | 0 | 5/10 |
| 12 | acougue | Açougue / Casa de Carnes | 53 | 6 | 7/10 |
| 13 | hortifruti | Hortifruti | ~70 | 2 | 5/10 |
| 14 | petshop | Petshop | ~170 | 0 | 4/10 |
| 15 | doceria | Doceria / Confeitaria | ~55 | 0 | 5/10 |

## 5 Falhas Estruturais Críticas

### 1. Restaurante sem combos (CORRIGIDO)
O template mais procurado não tinha NENHUM combo. Adicionados 5 combos estratégicos:
- Combo Executivo + Suco (R$ 34,90)
- Combo Casal (R$ 64,90)
- Combo Família (R$ 119,90)
- Combo Marmitão + Refri (R$ 38,90)
- Combo Parmegiana Completo (R$ 46,90)

### 2. Nomenclatura genérica (PARCIALMENTE CORRIGIDO)
Nomes como "Executivo da Casa", "Salada Completa", "Filé de Tilápia Grelhada" não vendem. Corrigidos para:
- "Executivo do Dia" (mais dinâmico)
- "Salada Fresca do Dia" (apelo sensorial)
- "Tilápia Grelhada na Manteiga" (técnica culinária)
- "Moqueca Caiçara de Peixe" (identidade regional)

### 3. Sorveteria, Petshop e Doceria sem combos
Templates sem combos/kits limitam ticket médio. Recomendação futura.

### 4. Overlap Adega vs Mercadinho
Ambos vendem bebidas. Diferenciação: Adega = experiência + kits temáticos. Mercadinho = conveniência + preço baixo.

### 5. Ausência de opções vegetarianas/veganas explícitas
Nenhum template tem categoria dedicada. Oportunidade para templates regionais com turistas.

## Contexto Regional — Litoral Norte SP

**Perfil do consumidor:**
- Turistas (impulsivos, ticket alto, WhatsApp-first)
- Moradores (preço-conscientes, fidelidade, entrega rápida)
- Sazonalidade extrema (verão = 3x faturamento)

**Adaptações regionais aplicadas:**
- Moqueca "Caiçara" — identidade local
- Água de Coco já presente no restaurante — "ideal pós-praia"
- Kits da adega com apelo praiano (Kit Churrasco na Praia, Kit Sunset)

## Próximos Passos (Backlog)

1. Adicionar combos a sorveteria, petshop e doceria
2. Criar categoria "Vegano & Sem Glúten" nos top 5 templates
3. Adicionar fotos reais como referência nos produtos
4. Implementar preço dinâmico por temporada (verão/inverno)
5. A/B test de nomes regionais vs genéricos no analytics

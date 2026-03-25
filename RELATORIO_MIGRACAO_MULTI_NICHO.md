# RELATÓRIO TÉCNICO — Migração Multi-Nicho Zairyx

**Data:** 23/03/2026  
**Autor:** Arquitetura de Software  
**Escopo:** Evolução de plataforma food-service → catálogos digitais multi-nicho  
**Branch:** main  

---

## A. RESUMO EXECUTIVO

| Métrica | Valor |
|---------|-------|
| **Arquivos com "restaurant/restaurante"** | **150 arquivos** — 1.615 ocorrências |
| **Arquivos com "cardapio/cardápio"** | **96 arquivos** — 474 ocorrências |
| **Arquivos com "mesa/mesas"** | **20 arquivos** — 202 ocorrências |
| **Templates já existentes** | 15 (restaurante, pizzaria, lanchonete, bar, cafeteria, acai, sushi, adega, mercadinho, padaria, sorveteria, acougue, hortifruti, petshop, doceria) |
| **Tabelas SQL afetadas** | 6 (restaurants, products, orders, order_items, restaurant_mesas, order_number_sequences) |
| **Risco geral** | **MÉDIO** — mitigável com views + feature toggles |
| **Estratégia** | Additive-only: VIEWS → Feature Toggles → Renomeação gradual |

### Princípios Invioláveis
1. **QR Codes impressos NUNCA quebram** — rota `/r/[slug]` permanece
2. **Afiliados continuam funcionando** durante toda a transição
3. **Nenhuma tabela é renomeada ou deletada** — apenas views e colunas novas
4. **Cada etapa é reversível** com DROP VIEW ou DROP COLUMN

---

## B. MAPA COMPLETO DE OCORRÊNCIAS

### B.1 — Classificação por Tipo

#### RENOMEAR — Nomes técnicos que devem mudar

| Atual | Proposto | Justificativa | Arquivos |
|-------|----------|---------------|----------|
| `restaurant_id` (FK em tables) | `store_id` | genérico para qualquer negócio | ~80 arquivos |
| `restaurants` (tabela SQL) | `stores` (view) | tabela principal de tenant | schema.sql, 30+ migrations |
| `restaurant_mesas` (tabela) | `store_tables` (view) | "mesas" é feature toggle | 037_restaurant_mesas.sql |
| `Restaurant` (interface TS) | `Store` (alias) | types/database.ts usa `Tenant` — manter | app/admin/*.tsx |
| `restaurantId` / `restaurantData` | `storeId` / `storeData` | variáveis internas | ~40 arquivos |
| `restaurantName` (form field) | `storeName` | campo de formulário | app/admin/venda-direta |
| `previewRestaurant` | `previewStore` | variável de preview | cardapio-editor-preview.tsx |
| `totalRestaurants` / `activeRestaurants` | `totalStores` / `activeStores` | métrica admin | app/admin/page.tsx |
| `RESTAURANT_TEMPLATE_CONFIGS` | `STORE_TEMPLATE_CONFIGS` | objeto de config templates | lib/templates-config.ts |
| `restaurant-onboarding.ts` | `store-onboarding.ts` | nome de arquivo | lib/ |
| `restaurant-customization.ts` | `store-customization.ts` | nome de arquivo | lib/ |
| `RestaurantTemplateSlug` | `StoreTemplateSlug` | tipo TypeScript | lib/restaurant-customization.ts |
| `buildRestaurantInstallation()` | `buildStoreInstallation()` | função onboarding | lib/restaurant-onboarding.ts |
| `getRestaurantPresentation()` | `getStorePresentation()` | função customização | lib/restaurant-customization.ts |
| `suspend_restaurant_for_nonpayment` (RPC) | `suspend_store_for_nonpayment` | procedure SQL | supabase/ |
| `reactivate_restaurant` (RPC) | `reactivate_store` | procedure SQL | supabase/ |
| `get_next_order_number(p_restaurant_id)` | `get_next_order_number(p_store_id)` | param da RPC | supabase/schema.sql |
| `minRestaurantes` / `maxRestaurantes` | `minStores` / `maxStores` | affiliate tiers | lib/affiliate-tiers.ts |
| `getTierByRestaurantes()` | `getTierByStores()` | função afiliados | lib/affiliate-tiers.ts |
| `totalRestaurantes` (affiliate) | `totalStores` | widget afiliados | hierarquia-widget.tsx |
| `R2Folder: 'restaurantes'` | `R2Folder: 'stores'` | pasta upload R2 | lib/r2.ts |
| `CardapioPublico` | `PublicCatalog` | tipo agregado público | types/database.ts |
| `getCardapioPublico()` | `getPublicCatalog()` | service function | services/tenant.service.ts |
| `getCardapioUrl()` | `getCatalogUrl()` | URL builder | modules/qrcode/index.ts |
| `buildCardapioViewModel()` | `buildCatalogViewModel()` | renderer | lib/cardapio-renderer.ts |
| `CardapioRestaurant` / `CardapioProduct` | `CatalogStore` / `CatalogProduct` | tipos renderer | lib/cardapio-renderer.ts |
| `cardapio-renderer.ts` | `catalog-renderer.ts` | nome de arquivo | lib/ |
| `cardapio-editor-preview.tsx` | `catalog-editor-preview.tsx` | nome de arquivo | components/ |
| `CardapioEditorPreview` | `CatalogEditorPreview` | componente | components/template-editor/ |
| `cardapio-client.tsx` | `catalog-client.tsx` | client component | app/r/[slug]/ |
| `CardapioClient` | `CatalogClient` | componente | app/r/[slug]/ |
| `DadosPedido.pizzaria` | `DadosPedido.store` | prop WhatsApp | modules/whatsapp/index.ts |
| `formatarPedidoWhatsApp` header emoji 🍕 | emoji dinâmico por template | WhatsApp msg | modules/whatsapp/index.ts |
| `criar-restaurante` (rota) | `criar-loja` | URL painel | app/painel/criar-restaurante/ |
| `PIZZADIGITAL SAAS` (header types) | `ZAIRYX SAAS` | comentário no types | types/database.ts |

#### MANTER — Nomes técnicos genéricos que funcionam para todos

| Termo | Razão |
|-------|-------|
| `slug` | Universal — identifica qualquer negócio |
| `products` / `Product` | Produtos servem qualquer nicho |
| `categories` / `Category` | Categorias são genéricas |
| `orders` / `Order` | Pedidos são universais |
| `order_items` / `OrderItem` | Itens de pedido são genéricos |
| `tenant_id` (já usado em DB) | Nomenclatura multi-tenant correta |
| `Tenant` (interface TypeScript) | Já é genérica — **não mudar** |
| `nome`, `telefone`, `whatsapp` | Campos universais |
| `template_slug` | Identifica o nicho via template |
| `plan_slug` | Planos são agnósticos de nicho |
| `AddOn`, `Promotion` | Concepts that work across all niches |
| `deliveryType` | Entrega/retirada servem todos |
| `/r/[slug]` (URL pública) | **NUNCA MUDAR** — QR Codes impressos dependem disso |
| `customizacao` (JSONB) | Já é flexível por natureza |

#### CONDICIONAL — Deve existir apenas para nichos específicos

| Termo | Nichos | Feature Toggle |
|-------|--------|----------------|
| `mesa` / `mesa_numero` / `restaurant_mesas` | Restaurante, Bar, Cafeteria, Pizzaria | `has_tables: boolean` |
| `origem_pedido: 'mesa'` | Apenas nichos com atendimento local | Condicional ao toggle `has_tables` |
| `config_pizza` (JSONB) | Pizzaria, Lanchonete (hamburger custom) | `has_pizza_builder: boolean` |
| `monte-sua-pizza` (rota) | Pizzaria | Condicional ao template_slug |
| `sabores` / `bordas` / `tamanhos` | Pizzaria | Condicional ao template_slug |
| `preco_por_peso` (novo) | Açougue, Hortifruti | `unit_type: 'kg' \| 'g'` |
| `pet_info` (novo) | Pet Shop | `custom_fields` JSONB |
| `endereco_entrega` | Delivery-only nichos | Todos que aceitam entrega |

#### TEXTO DE UI — Strings visíveis que mudam por template

| Texto Atual | Onde | Proposta |
|-------------|------|----------|
| `"Restaurante"` em labels | admin/venda-direta, admin/usuarios, admin/cardapios | "Estabelecimento" ou dinâmico por `template_slug` |
| `"Restaurante / Marmitaria"` | templates-config.ts, pricing.ts | Label do template — **manter** (é o nome do template) |
| `"restaurantes" em hierarquia-widget` | componente afiliados | "estabelecimentos" |
| `"Dados do Restaurante"` | admin pages | "Dados do Estabelecimento" |
| `"Criar restaurante"` | painel/criar-restaurante | "Criar meu negócio" |
| `"Seu restaurante"` | hooks/use-tenant.tsx | "Seu estabelecimento" |
| `"Restaurante não encontrado"` | hooks/use-tenant.tsx | "Estabelecimento não encontrado" |
| `"Restaurante Suspenso/Ativo"` | admin/clientes/[id] | "Estabelecimento Suspenso/Ativo" |
| `"1 restaurante ativo"` | pricing-section.tsx | "1 catálogo ativo" |
| `"Cardápio Digital"` | footer, home-header | "Catálogo Digital" (ou manter como marca) |
| `"Cardápio digital profissional para restaurantes..."` | footer.tsx, seo.ts | "Catálogos digitais profissionais para negócios..." |
| `"Pedido via Zairyx CardápioDigital"` | whatsapp/index.ts | "Pedido via Zairyx" |
| `"🍕 NOVO PEDIDO"` | whatsapp/index.ts | Emoji dinâmico: 🏪 genérico, 🍕 pizzaria, 🐾 petshop |
| `"Mesa X"` em mensagens | orders/route.ts | Condicional: só aparece se `has_tables = true` |
| `"Sem restaurante"` | admin/usuarios | "Sem estabelecimento" |

### B.2 — Arquivos com Maior Impacto (Top 20)

| # | Arquivo | Ocorrências | Criticidade |
|---|---------|-------------|-------------|
| 1 | scripts/migrations_unified.sql | 64 | BAIXA (script de ref.) |
| 2 | app/api/webhook/mercadopago/route.ts | 63 | ALTA (pagamento) |
| 3 | supabase/schema.sql | 59 | ALTA (schema base) |
| 4 | app/painel/editor/page.tsx | 57 | MÉDIA |
| 5 | app/painel/configuracoes/page.tsx | 55 | MÉDIA |
| 6 | app/admin/clientes/[id]/page.tsx | 52 | MÉDIA |
| 7 | app/r/[slug]/cardapio-client.tsx | 47 | ALTA (público) |
| 8 | app/painel/qrcode/page.tsx | 42 | ALTA (mesas) |
| 9 | app/api/admin/metrics/route.ts | 33 | BAIXA |
| 10 | app/api/admin/venda-direta/route.ts | 31 | MÉDIA |
| 11 | components/template-editor/cardapio-editor-preview.tsx | 31 | MÉDIA |
| 12 | lib/cardapio-renderer.ts | 31 | ALTA (core) |
| 13 | app/api/orders/route.ts | 29 | ALTA (pedidos) |
| 14 | lib/restaurant-customization.ts | 29 | ALTA (core) |
| 15 | scripts/simulate-onboarding.ts | 26 | BAIXA (script) |
| 16 | lib/templates-config.ts | 26 | ALTA (core) |
| 17 | app/api/onboarding/submit/route.ts | 22 | ALTA |
| 18 | app/r/[slug]/page.tsx | 22 | ALTA (público) |
| 19 | app/api/webhook/subscriptions/route.ts | 21 | ALTA (billing) |
| 20 | app/painel/page.tsx | 20 | MÉDIA |

---

## C. ANÁLISE POR TEMPLATE

### C.1 — Mesa / QR Code por Template

| Template | Mesa faz sentido? | Justificativa | Ação |
|----------|-------------------|---------------|------|
| **Restaurante** | ✅ SIM | Mesa física, atendimento no local | Feature toggle ON por padrão |
| **Pizzaria** | ✅ SIM | Salão com mesas | Feature toggle ON por padrão |
| **Bar / Pub** | ✅ SIM | Mesa/balcão obrigatório | Feature toggle ON por padrão |
| **Cafeteria** | ✅ SIM | Mesas internas | Feature toggle ON por padrão |
| **Lanchonete** | ⚠️ TALVEZ | Pode ter salão ou ser só delivery | Feature toggle OFF, ativável |
| **Sushi** | ⚠️ TALVEZ | Pode ter mesa ou ser delivery-only | Feature toggle OFF, ativável |
| **Pet Shop** | ⚠️ TALVEZ | Mesa de banho/tosa = "estação" | Feature toggle OFF (mas ativável como "Ponto de Atendimento") |
| **Açougue** | ⚠️ TALVEZ | Balcão com senha de atendimento | Feature toggle OFF (conceito ≠ mesa) |
| **Padaria** | ⚠️ TALVEZ | Pode ter mesas de café | Feature toggle OFF, ativável |
| **Adega** | ❌ NÃO | 100% delivery/retirada | Feature toggle OFF |
| **Mercadinho** | ❌ NÃO | Compra direta ou delivery | Feature toggle OFF |
| **Hortifruti** | ❌ NÃO | Delivery ou balcão = sem mesa | Feature toggle OFF |
| **Sorveteria** | ⚠️ TALVEZ | Pode ter mesas | Feature toggle OFF, ativável |
| **Doceria** | ❌ NÃO | Encomendas e retirada | Feature toggle OFF |
| **Açaíteria** | ⚠️ TALVEZ | Lojinha com mesa | Feature toggle OFF, ativável |

**Proposta para Feature Toggle de Mesas:**
```
Campo: restaurants.has_tables BOOLEAN DEFAULT FALSE
Template padrão: restaurante=TRUE, pizzaria=TRUE, bar=TRUE, cafeteria=TRUE
Todos os demais: FALSE (pode ser ativado nas configurações)
```

Quando `has_tables = FALSE`:
- QR Code mostra apenas link do catálogo (sem `?mesa=N`)
- Página de gestão de mesas fica oculta no painel
- UI do cardápio público não exibe seletor de mesa
- Link WhatsApp não menciona "Mesa"

### C.2 — Unidade de Medida

**Estado atual do carrinho:** Suporta **apenas quantidade inteira** (`quantidade: number` — inteiro positivo).

**Campo no banco:** A tabela `products` **NÃO tem** campo de unidade de medida. Todos os produtos assumem "unidade" implicitamente.

| Template | Unidades Necessárias | Exemplos |
|----------|---------------------|----------|
| **Açougue** | kg, g | Picanha R$89,90/kg, Linguiça R$29,90/kg |
| **Hortifruti** | kg, g, unidade, bandeja | Tomate R$8,90/kg, Alface R$3,50/un, Morango R$15/bandeja |
| **Adega** | ml, L, unidade | Vinho 750ml, Cerveja 350ml, Kit 6-pack |
| **Sorveteria** | ml, bola, unidade | Picolé (un), Pote 500ml, 1 bola R$8 |
| **Mercadinho** | kg, g, L, ml, unidade | Arroz 5kg, Leite 1L, Sabonete (un) |
| **Padaria** | kg, g, unidade, fatia | Pão (un), Bolo (fatia), Frios (100g) |
| **Doceria** | unidade, cento, kg | Brigadeiro (un), Mesa 150 doces (cento) |
| **Todos os demais** | unidade | Prato, pizza, hambúrguer, café, sorvete |

**Proposta de Migration:**
```sql
-- Adição SEGURA (não quebra nada existente)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(10) DEFAULT 'un'
    CHECK (unidade_medida IN ('un', 'kg', 'g', 'ml', 'l', 'fatia', 'bandeja', 'cento', 'bola'));

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS permite_fracionado BOOLEAN DEFAULT FALSE;

-- Legado: todos os produtos existentes = 'un' + não fracionado = zero impacto
COMMENT ON COLUMN products.unidade_medida IS 'Unidade padrão: un (unidade), kg, g, ml, l, fatia, bandeja, cento, bola';
COMMENT ON COLUMN products.permite_fracionado IS 'Se TRUE, carrinho aceita decimais (ex: 0.5kg)';
```

**No carrinho:**
- `permite_fracionado = false` → input de quantidade inteira (comportamento atual)
- `permite_fracionado = true` → input numérico com step 0.1 e display "0,5 kg"
- Label do preço no catálogo: `R$ 89,90/kg` em vez de `R$ 89,90`

### C.3 — Campos Extras no Checkout

**Estado atual:** Checkout coleta: nome, telefone, tipo atendimento (entrega/retirada), endereço (3 campos), pagamento, observações. **NÃO** existe estrutura para campos dinâmicos.

| Template | Campos Extras Necessários |
|----------|--------------------------|
| **Pet Shop** | Nome do pet, raça, porte (P/M/G), tipo (cão/gato/outro) |
| **Delivery (todos)** | Endereço completo (já existe), ponto de referência |
| **Retirada (todos)** | Horário preferido de retirada |
| **Açougue** | Tipo de corte (bife, moído, inteiro), espessura |
| **Doceria** | Data da festa/evento, sabor preferido, tema decoração |
| **Padaria** | Horário de retirada dos pães (manhã/tarde) |

**Proposta — Sem alterar schema existente:**

```sql
-- Usa campo JSONB extensível na tabela orders (aditivo)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Na tabela restaurants, define quais campos extras o template requer
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS checkout_custom_fields JSONB DEFAULT '[]';

COMMENT ON COLUMN orders.custom_fields IS 'Campos extras preenchidos no checkout (pet_info, horario_retirada, etc.)';
COMMENT ON COLUMN restaurants.checkout_custom_fields IS 'Schema dos campos extras do checkout: [{key, label, type, required, options}]';
```

**Exemplo de `checkout_custom_fields` para Pet Shop:**
```json
[
  {"key": "pet_nome", "label": "Nome do pet", "type": "text", "required": true},
  {"key": "pet_raca", "label": "Raça", "type": "text", "required": false},
  {"key": "pet_porte", "label": "Porte", "type": "select", "options": ["Pequeno", "Médio", "Grande"], "required": true}
]
```

O componente `OrderForm` renderiza esses campos dinamicamente com base no template do tenant.

### C.4 — Tipo de Pedido

**Estado atual:**
- `tipo_entrega`: `'delivery' | 'retirada'` — apenas dois modos
- `origem_pedido`: `'online' | 'mesa'` — de onde veio
- `mesa_numero`: preenchido quando `origem_pedido = 'mesa'`
- WhatsApp: mensagem **SIM** varia por tipo (delivery mostra endereço, retirada não)
- **NÃO** existe tipo "consumo no local sem mesa"

| Nicho | Modos de Pedido Necessários |
|-------|-----------------------------|
| Restaurante | Mesa (QR) + Delivery + Retirada |
| Pizzaria | Mesa + Delivery + Retirada |
| Pet Shop | Delivery (petshop leva) + Retirada (dono busca) |
| Açougue | Retirada (balcão) + Delivery |
| Hortifruti | Delivery + Retirada |
| Adega | Delivery (principal) + Retirada |
| Doceria | Encomenda + Retirada |
| Padaria | Balcão + Delivery + Retirada |
| Mercadinho | Delivery + Retirada |
| Sorveteria | Balcão + Delivery |

**Proposta — Expandir `tipo_entrega`:**

```sql
-- Aditivo: adicionar novos valores ao CHECK constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tipo_entrega_check;
ALTER TABLE orders ADD CONSTRAINT orders_tipo_entrega_check
  CHECK (tipo_entrega IN ('delivery', 'retirada', 'local', 'encomenda'));

COMMENT ON COLUMN orders.tipo_entrega IS 'delivery=entrega, retirada=cliente busca, local=consumo no local, encomenda=data futura';
```

**Variação da mensagem WhatsApp por tipo:**

| Tipo | Cabeçalho WhatsApp |
|------|-------------------|
| `mesa` | `"📋 Pedido da Mesa {N} — {itens}"` |
| `retirada` | `"📋 Pedido para Retirada — {itens}"` |
| `delivery` | `"📋 Pedido para Entrega — {endereço} — {itens}"` |
| `local` (sem mesa) | `"📋 Pedido para Consumo Local — {itens}"` |
| `encomenda` | `"📋 Encomenda para {data} — {itens}"` |

---

## D. ARQUITETURA DO FEATURE TOGGLE DE MESAS

### D.1 — Acoplamento Atual

| Componente | Acoplamento | Detalhes |
|------------|-------------|----------|
| **Tabela `restaurant_mesas`** | FK para `restaurants.id` | `restaurant_id UUID REFERENCES restaurants(id)` |
| **API de pedidos** (orders/route.ts) | Valida mesa contra whitelist | `from('restaurant_mesas').eq('restaurant_id', ...)` |
| **QR Code** (modules/qrcode) | `getCardapioUrl(slug)` = `/r/{slug}` | Mesa é parâmetro URL: `?mesa=N` (opcional) |
| **Middleware** | NÃO valida mesa | Mesa é tratada apenas no POST /api/orders |
| **Cardápio público** | `searchParams.get('mesa')` no client | Se presente, mostra "Mesa X" na UI |
| **Painel QR** (painel/qrcode) | CRUD de mesas + geração QR por mesa | Totalmente contido nessa página |

### D.2 — Proposta de Arquitetura

**1. Campo de configuração:**
```sql
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS has_tables BOOLEAN DEFAULT FALSE;

-- Setar padrão por template
UPDATE restaurants SET has_tables = TRUE
WHERE template_slug IN ('restaurante', 'pizzaria', 'bar', 'cafeteria');
```

**2. Fluxo com toggle ATIVADO (`has_tables = true`):**
- Menu do painel mostra "QR Code / Mesas"
- Página /painel/qrcode mostra CRUD de mesas + QR por mesa
- QR Code gerado inclui `?mesa=N`
- POST /api/orders aceita `order_origin: 'mesa'` + `table_number`
- Mensagem WhatsApp inclui "Mesa X"

**3. Fluxo com toggle DESATIVADO (`has_tables = false`):**
- Menu do painel mostra apenas "QR Code"
- Página /painel/qrcode mostra QR do catálogo (sem mesas)
- QR Code gera URL limpa: `/r/{slug}` (sem `?mesa=`)
- POST /api/orders rejeita `order_origin: 'mesa'` → retorna 400
- Mensagem WhatsApp NÃO menciona mesa

**4. QR Codes já existentes (compatibilidade):**
- URL `/r/{slug}?mesa=5` → se `has_tables = false`:
  - O cardápio **ABRE NORMALMENTE** (slug é o que importa)
  - O parâmetro `mesa` é **ignorado silenciosamente** no client
  - O formulário de pedido NÃO exibe campo de mesa
  - O pedido é criado como `origem_pedido: 'online'`
- **RESULTADO:** QR Code impresso continua funcionando → ZERO QUEBRA

### D.3 — Garantias de Não-Quebra

| Cenário | Comportamento |
|---------|---------------|
| QR Code com `?mesa=5` + toggle OFF | Abre catálogo normalmente, ignora mesa |
| QR Code com `?mesa=5` + toggle ON | Abre catálogo com "Mesa 5" pré-selecionada |
| QR Code sem mesa + toggle ON | Abre catálogo, usuário escolhe tipo |
| QR Code sem mesa + toggle OFF | Abre catálogo, sem opção de mesa |
| Link WhatsApp com mesa | Continua funcionando (dados no pedido) |
| Pedido histórico com mesa_numero | Dados preservados — campo nunca removido |
| Mesa deletada após QR impresso | QR abre catálogo, mesa inválida → erro 400 (comportamento atual) |

---

## E. PLANO DE MIGRAÇÃO SQL

### E.1 — Migration 038: Campos Aditivos Multi-Nicho

```sql
-- ============================================================
-- 038: Campos Aditivos para Multi-Nicho
-- Seguro: Apenas ADD COLUMN com defaults — zero impacto em dados existentes
-- Rollback: DROP COLUMN de cada campo adicionado
-- ============================================================

BEGIN;

-- 1. Feature Toggle de Mesas
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS has_tables BOOLEAN DEFAULT FALSE;

-- 2. Tipo de negócio explícito (redundante com template_slug mas útil para queries)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS store_type VARCHAR(30) DEFAULT 'restaurant';

-- 3. Campos extras de checkout (customizáveis por template)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS checkout_custom_fields JSONB DEFAULT '[]';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- 4. Unidade de medida em produtos
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS unidade_medida VARCHAR(10) DEFAULT 'un'
    CHECK (unidade_medida IN ('un', 'kg', 'g', 'ml', 'l', 'fatia', 'bandeja', 'cento', 'bola'));

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS permite_fracionado BOOLEAN DEFAULT FALSE;

-- 5. Tipo de pedido expandido
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tipo_entrega_check;
ALTER TABLE orders ADD CONSTRAINT orders_tipo_entrega_check
  CHECK (tipo_entrega IN ('delivery', 'retirada', 'local', 'encomenda'));

-- 6. Setar has_tables=TRUE para templates de atendimento local
UPDATE restaurants SET has_tables = TRUE
WHERE template_slug IN ('restaurante', 'pizzaria', 'bar', 'cafeteria')
  AND has_tables = FALSE;

-- 7. Setar store_type a partir de template_slug existente
UPDATE restaurants SET store_type = template_slug
WHERE template_slug IS NOT NULL AND store_type = 'restaurant';

-- 8. Índices
CREATE INDEX IF NOT EXISTS idx_restaurants_store_type ON restaurants(store_type);
CREATE INDEX IF NOT EXISTS idx_restaurants_has_tables ON restaurants(has_tables) WHERE has_tables = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_unidade ON products(unidade_medida) WHERE unidade_medida != 'un';

-- 9. Comentários
COMMENT ON COLUMN restaurants.has_tables IS 'Feature toggle: mesas/QR por mesa';
COMMENT ON COLUMN restaurants.store_type IS 'Tipo de negócio (restaurant, petshop, hortifruti, etc.)';
COMMENT ON COLUMN restaurants.checkout_custom_fields IS 'Schema JSON dos campos extras do checkout';
COMMENT ON COLUMN orders.custom_fields IS 'Dados extras preenchidos pelo cliente no checkout';
COMMENT ON COLUMN products.unidade_medida IS 'un=unidade, kg, g, ml, l, fatia, bandeja, cento, bola';
COMMENT ON COLUMN products.permite_fracionado IS 'Se TRUE, aceita quantidades decimais (ex: 0.5kg)';

COMMIT;
```

**Rollback da 038:**
```sql
BEGIN;
ALTER TABLE products DROP COLUMN IF EXISTS permite_fracionado;
ALTER TABLE products DROP COLUMN IF EXISTS unidade_medida;
ALTER TABLE orders DROP COLUMN IF EXISTS custom_fields;
ALTER TABLE restaurants DROP COLUMN IF EXISTS checkout_custom_fields;
ALTER TABLE restaurants DROP COLUMN IF EXISTS store_type;
ALTER TABLE restaurants DROP COLUMN IF EXISTS has_tables;
-- Restaurar check constraint original
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_tipo_entrega_check;
ALTER TABLE orders ADD CONSTRAINT orders_tipo_entrega_check
  CHECK (tipo_entrega IN ('delivery', 'retirada'));
COMMIT;
```

### E.2 — Migration 039: Views de Compatibilidade

```sql
-- ============================================================
-- 039: Views de Compatibilidade restaurant → store
-- Cria views que mapeiam nomenclatura antiga → nova
-- O código NOVO usa as views; código ANTIGO usa tabelas diretamente
-- Ambos funcionam ao mesmo tempo — migração gradual segura
-- Rollback: DROP VIEW de cada view criada
-- ============================================================

BEGIN;

-- View principal: stores
CREATE OR REPLACE VIEW public.stores AS
SELECT
  id,
  user_id,
  slug,
  nome,
  nome_fantasia,
  cnpj,
  email,
  telefone,
  whatsapp,
  template_slug,
  store_type,
  has_tables,
  google_maps_url,
  endereco_texto,
  customizacao,
  cor_primaria,
  cor_secundaria,
  logo_url,
  banner_url,
  endereco,
  cores,
  horario_funcionamento,
  taxa_entrega,
  pedido_minimo,
  raio_entrega_km,
  tempo_entrega_min,
  aceita_retirada,
  aceita_entrega,
  config_pizza,
  ativo,
  verificado,
  plan_slug,
  status_pagamento,
  suspended,
  suspended_at,
  suspended_reason,
  tenant_id,
  checkout_custom_fields,
  created_at,
  updated_at
FROM public.restaurants;

-- View de mesas
CREATE OR REPLACE VIEW public.store_tables AS
SELECT
  id,
  restaurant_id AS store_id,
  numero,
  label,
  ativa,
  created_at,
  updated_at
FROM public.restaurant_mesas;

-- Comentários
COMMENT ON VIEW public.stores IS 'View de compatibilidade: restaurants → stores (nomenclatura multi-nicho)';
COMMENT ON VIEW public.store_tables IS 'View de compatibilidade: restaurant_mesas → store_tables';

COMMIT;
```

**Rollback da 039:**
```sql
DROP VIEW IF EXISTS public.store_tables;
DROP VIEW IF EXISTS public.stores;
```

### E.3 — Tabelas Afetadas

| Tabela Atual | View Proposta | Impacto | Reversível? |
|---|---|---|---|
| `restaurants` | `stores` | Novo código usa a view; código antigo continua usando tabela | ✅ SIM — `DROP VIEW stores` |
| `restaurant_mesas` | `store_tables` | Mapeia `restaurant_id` → `store_id` | ✅ SIM — `DROP VIEW store_tables` |
| `products` | — (sem view) | Novo campo `unidade_medida` + `permite_fracionado` | ✅ SIM — `DROP COLUMN` |
| `orders` | — (sem view) | Novo campo `custom_fields` + constraint expandido | ✅ SIM — `DROP COLUMN` + restore constraint |
| `order_number_sequences` | — | Sem mudança (chave = `restaurant_id`) | ✅ N/A |
| `order_items` | — | Sem mudança | ✅ N/A |

### E.4 — Ordem de Execução

```
1. Migration 038 — Campos aditivos (zero breaking change)
   ↓ Testar: todos os clientes existentes funcionam normalmente
2. Migration 039 — Views de compatibilidade
   ↓ Testar: SELECT * FROM stores retorna mesmos dados de restaurants
3. Deploy código com feature toggle de mesas
   ↓ Testar: toggle on/off não quebra nada
4. Deploy código com unidades de medida
   ↓ Testar: produtos existentes continuam como 'un'
5. Deploy campos extras de checkout
   ↓ Testar: checkout sem campos extras = comportamento atual
6. Renomeação gradual de código (meses seguintes)
```

---

## F. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1 — Migrations Aditivas (Sem quebrar NADA) ⬜
- [ ] Executar migration 038 (campos aditivos)
- [ ] Executar migration 039 (views de compatibilidade)
- [ ] Verificar que todos os clientes ativos continuam funcionando
- [ ] Verificar que admin dashboard carrega normalmente
- [ ] Verificar que QR Codes existentes abrem o catálogo

### Fase 2 — Feature Toggle de Mesas ⬜
- [ ] Adicionar `has_tables` ao TypeScript type `Tenant`
- [ ] Modificar `/painel/qrcode` para condicional por `has_tables`
- [ ] Modificar `POST /api/orders` para rejeitar mesa se `has_tables = false`
- [ ] Garantir que `/r/[slug]?mesa=N` com toggle OFF → ignora mesa silenciosamente
- [ ] Adicionar toggle de mesas em `/painel/configuracoes`
- [ ] Testar QR Codes impressos com toggle em ambos estados

### Fase 3 — Unidades de Medida ⬜
- [ ] Adicionar `unidade_medida` e `permite_fracionado` ao TypeScript `Product`
- [ ] UI de cadastro de produto: seletor de unidade
- [ ] Catálogo público: display `R$ 89,90/kg` quando `unidade_medida != 'un'`
- [ ] Carrinho: input decimal quando `permite_fracionado = true`
- [ ] Cálculo de preço: `preco_base * quantidade` (funciona com decimais)
- [ ] Snapshot de ordem: incluir unidade no `observacao` do item

### Fase 4 — Campos Extras por Template ⬜
- [ ] Definir `checkout_custom_fields` padrão por template em templates-config.ts  
- [ ] Componente `DynamicCheckoutFields` renderiza campos de `checkout_custom_fields`
- [ ] `POST /api/orders` salva `custom_fields` do checkout
- [ ] Mensagem WhatsApp inclui campos extras relevantes
- [ ] Painel: configuração de campos extras em `/painel/configuracoes`

### Fase 5 — Renomeação Gradual de Código ⬜
- [ ] Criar type aliases: `type Store = Tenant`, `type StoreId = string`
- [ ] Renomear arquivos: `restaurant-onboarding.ts` → `store-onboarding.ts` (com re-export)
- [ ] Renomear funções com deprecation wrappers
- [ ] Atualizar textos de UI para linguagem genérica
- [ ] Atualizar variáveis internas (restaurantId → storeId)
- [ ] Atualizar comentários e documentação

### Fase 6 — Limpeza Final ⬜
- [ ] Remover wrappers de deprecação quando todo código usar nomenclatura nova
- [ ] Atualizar testes E2E para nomenclatura nova
- [ ] Atualizar documentação (.md files)
- [ ] Atualizar scripts de simulação
- [ ] Code review final de termos restritivos

---

## G. O QUE NÃO MUDAR

### Rotas Públicas (NUNCA ALTERAR)
| Rota | Razão |
|------|-------|
| `/r/[slug]` | **QR Codes impressos apontam para cá** — INVIOLÁVEL |
| `/r/[slug]?mesa=N` | Parâmetro legado — sempre aceito, ignorado se toggle OFF |
| `/r/[slug]/monte-sua-pizza` | QR Codes de pizzarias podem apontar aqui |
| `/api/orders` | Endpoint estável — apps terceiros podem consumir |
| `/api/webhook/mercadopago` | Configurado no Mercado Pago — NUNCA mudar |
| `/api/webhook/subscriptions` | Configurado no billing — NUNCA mudar |

### Dados Existentes (NUNCA DELETAR)
| Item | Razão |
|------|-------|
| Tabela `restaurants` | Todas as FK apontam para cá — view sim, rename não |
| Tabela `restaurant_mesas` | Dados de clientes ativos — view sim, drop não |
| Coluna `restaurant_id` em products/orders | Foreign keys ativas |
| Coluna `mesa_numero` em orders | Dados históricos de pedidos |
| Coluna `origem_pedido` valores existentes | `'online'` e `'mesa'` devem continuar validos |
| Template slug `'restaurante'` | Clientes existentes usam esse slug — NUNCA remover |
| `plan_slug` valores existentes | `'basico'` e `'pro'` são usados em billing |

### Slugs de Templates Existentes (NUNCA MUDAR)
```
restaurante, pizzaria, lanchonete, bar, cafeteria, acai, sushi,
adega, mercadinho, padaria, sorveteria, acougue, hortifruti, petshop, doceria
```
Esses slugs estão **gravados no banco de dados** de clientes ativos, em preferências do Mercado Pago, em QR Codes impressos e em links de afiliados. Renomear qualquer um deles quebraria dados existentes.

### Sistema de Afiliados (MANTER INTACTO DURANTE TRANSIÇÃO)
| Componente | Razão |
|------------|-------|
| Percentuais de comissão | Contratos ativos dependem deles |
| Tier hierarchy (6 níveis) | Afiliados ativos estão posicionados neles |
| Cálculo por "restaurantes indicados" | Renomear para "stores indicados" é cosmético — fazer na Fase 5 |
| Bonus milestones | Pagamentos em andamento |

### Infraestrutura (NÃO TOCAR)
| Item | Razão |
|------|-------|
| Bucket R2 pastas existentes | `logos/`, `banners/`, `pratos/`, `restaurantes/` — mídia já salva |
| Configuração Mercado Pago | Webhooks, external_reference format |
| Supabase RLS policies existentes | Segurança ativa — apenas additive |
| Vercel deploys / domains | Zero downtime deployment |
| `.env.local` keys | Sem mudança de variáveis de ambiente |

---

## H. MÓDULOS B2B — AFILIADOS E CUPONS

### H.1 — Afiliados

**Referências a "restaurant":**
- `lib/affiliate-tiers.ts`: propriedades `minRestaurantes`, `maxRestaurantes`, função `getTierByRestaurantes()`
- `components/afiliados/hierarquia-widget.tsx`: prop `totalRestaurantes`, textos "restaurantes"
- `lib/get-affiliate-tier.ts`: wrapper `getTierForReferrals()` já usa nomenclatura genérica

**Lógica de elegibilidade:** A comissão é calculada **por plano** (basico = R$59, pro = R$89), NÃO por nicho. Um afiliado que indica um pet shop recebe o **mesmo percentual** que um que indica restaurante — a única diferença é o preço do template (complexidade 1/2/3) que determina o ticket da venda inicial.

**Ação:** Na Fase 5, renomear propriedades para `minStores`/`maxStores` e textos de UI para "estabelecimentos". A lógica de cálculo **não muda**.

### H.2 — Cupons

**Estado atual:** Cupons são armazenados na tabela `promotions` com escopo por `tenant_id` (por restaurante individual). **NÃO** existem cupons globais da plataforma.

**Validação por tipo de negócio:** NÃO existe — cupom é válido para qualquer produto do tenant que o criou. Nenhuma mudança necessária.

| `cidade`, `estado` | ✅ SIM | Manter |
| `whatsapp` | ✅ SIM | Manter |
| `instagram` | ✅ SIM | Manter |
| `horario_funcionamento` | ✅ SIM | Funciona para qualquer nicho |
| `taxa_entrega` | ✅ SIM | Universal |
| `area_entrega` | ✅ SIM | Universal |
| `tempo_preparo` | ⚠️ CONDIC. | Para pet shop poderia ser "tempo de atendimento" |
| `categorias` + `produtos` | ✅ SIM | Genérico — nome + descrição + preço |

**Conclusão:** O onboarding é **95% genérico**. Apenas o label `"tempo_preparo"` precisa ser condicional (renomear para "tempo estimado" serve para qualquer nicho). A lista de `TIPOS_NEGOCIO` no onboarding já cobre múltiplos nichos corretamente.

---

## I. IMPACTO NO QR CODE E WHATSAPP

### I.1 — URL do QR Code

| Cenário | URL Gerada | Sistema Quebra? |
|---------|------------|-----------------|
| **Atual com mesa** | `/r/meu-restaurante?mesa=3` | ✅ Funciona |
| **Atual sem mesa** | `/r/meu-restaurante` | ✅ Funciona |
| **Futuro nicho sem mesa** | `/r/meu-petshop` | ✅ Funciona (sem `?mesa=`) |
| **QR antigo em nicho migrado** | `/r/meu-bar?mesa=5` + toggle OFF | ✅ Funciona — mesa ignorada |
| **`mesa=undefined`** | `/r/slug?mesa=undefined` | ✅ NÃO QUEBRA — `parseInt('undefined')` = `NaN` → ignorado |
| **`mesa=` vazio** | `/r/slug?mesa=` | ✅ NÃO QUEBRA — `trim()` = `''` → ignorado |

**Código atual em `cardapio-client.tsx`:**
```typescript
const tableNumber = searchParams.get('mesa')
```
Se `mesa` é `null`, `undefined` ou string vazia → o componente simplesmente não mostra UI de mesa. **Já resiliente.**

### I.2 — Mensagem do WhatsApp

**Mensagem atual (`modules/whatsapp/index.ts`):**
```
🍕 *NOVO PEDIDO - {restaurante.nome}*
┌─ Pedido #{numero}
...
✅ Pedido realizado via Zairyx CardápioDigital
```

**Problemas identificados:**
1. Emoji 🍕 é fixo — não adequado para pet shop ou açougue
2. Interface `DadosPedido.pizzaria` deveria ser `DadosPedido.store`
3. Footer diz "CardápioDigital" — ok como marca, pode manter

**Proposta — Emoji dinâmico por template:**

```typescript
const TEMPLATE_EMOJIS: Record<string, string> = {
  restaurante: '🍽️',
  pizzaria: '🍕',
  lanchonete: '🍔',
  bar: '🍺',
  cafeteria: '☕',
  acai: '🫐',
  sushi: '🍣',
  adega: '🍷',
  mercadinho: '🛒',
  padaria: '🥖',
  sorveteria: '🍦',
  acougue: '🥩',
  hortifruti: '🥬',
  petshop: '🐾',
  doceria: '🍰',
}

// Uso: const emoji = TEMPLATE_EMOJIS[store.template_slug] || '🏪'
```

**Variação por tipo de pedido (já suportada parcialmente):**

| Tipo | Texto na Mensagem |
|------|-------------------|
| Delivery | `🚚 *ENTREGA*\nEndereço: {full}` — **já funciona** |
| Retirada | `🏃 *RETIRADA*` — **já funciona** |
| Mesa | `🪑 *MESA {N}*` — adicionar condicionalmente |
| Encomenda | `📅 *ENCOMENDA para {data}*` — novo |

---

*Relatório gerado automaticamente. Nenhum código foi alterado.*
*Próximo passo: aprovar o plano e iniciar pela Fase 1 (Migration 038).*

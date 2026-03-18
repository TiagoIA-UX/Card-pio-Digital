# 🚀 3 Pilares Poderosos para o Cardápio Digital

Documento estratégico com planos de implementação para três recursos que diferenciam o SaaS.

---

## 1️⃣ Dashboard Secreto (Admin / Super Admin)

### O que é
Um painel **oculto** (não linkado no menu, URL secreta) para **você** monitorar a saúde do negócio: crescimento, ativação, churn e capacidade.

### Por que todo SaaS precisa
- **Decisões baseadas em dados** – saber quais restaurantes crescem, quais abandonam
- **Identificar problemas** – restaurantes que nunca receberam pedido, templates pouco usados
- **Prever churn** – inatividade prolongada, falta de produtos cadastrados
- **Métricas de produto** – MRR, ativação, conversão de trial

### Métricas essenciais

| Métrica | Fonte | Uso |
|---------|-------|-----|
| **Restaurantes ativos** | `restaurants` (ativo + status_pagamento) | Base de clientes |
| **Novos por período** | `restaurants.created_at` | Crescimento |
| **Pedidos totais** | `orders` | Volume do ecossistema |
| **Restaurantes com 1º pedido** | `activation_events` | Taxa de ativação |
| **Restaurantes sem pedido** | `restaurants` sem `activation_events` | Risco de churn |
| **Produtos por restaurante** | `products` | Engajamento |
| **Template mais usado** | `restaurants.template_slug` | Oferta de valor |
| **Ticket médio** | `orders.total` | Qualidade do uso |

### Estrutura sugerida

```
/app/admin/dashboard/page.tsx     → Dashboard principal (protegido)
/app/api/admin/metrics/route.ts   → API de métricas (auth admin)
```

**Proteção:** rota `/admin/*` só acessível com:
- Variável de ambiente `ADMIN_SECRET_KEY`
- Ou usuário com `role = 'admin'` em `auth.users` / tabela `profiles`

### Layout do dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Cardápio Digital - Admin (secreto)                       │
├─────────────────────────────────────────────────────────────┤
│  Hoje        │  Esta semana   │  Este mês                   │
│  +3 rest.    │  +12 rest.     │  +47 rest.                  │
│  89 pedidos  │  412 pedidos   │  1.847 pedidos              │
├─────────────────────────────────────────────────────────────┤
│  Ativação                                                    │
│  ████████████░░░░  78% receberam 1º pedido                   │
├─────────────────────────────────────────────────────────────┤
│  Restaurantes em risco (sem pedido há 7+ dias)              │
│  • Pizzaria do João (14 dias)                               │
│  • Lanchonete Central (21 dias)                              │
├─────────────────────────────────────────────────────────────┤
│  Templates mais usados                                       │
│  1. Pizzaria (34%)  2. Restaurante (28%)  3. Lanchonete (18%)│
└─────────────────────────────────────────────────────────────┘
```

### Implementação (concluída)

1. **API** `GET /api/admin/metrics` – métricas agregadas
2. **Página** `/admin/dashboard` – dashboard com cards e listas
3. **Proteção:** `ADMIN_SECRET_KEY` (header `Authorization: Bearer <key>`) ou `admin_users` (sessão)
4. **Variável de ambiente:** `ADMIN_SECRET_KEY` para acesso via cron ou scripts

---

## 2️⃣ Sistema de Alerta Automático de Capacidade

### O que é
Monitoramento de limites da hospedagem (Vercel + Supabase) com alertas antes de estourar.

### Por que importa
- **Vercel:** limites de bandwidth, funções serverless, builds
- **Supabase:** storage, banco (rows, connections), egress
- Evitar downtime ou bloqueio por limite

### O que monitorar

| Recurso | Limite típico (free/hobby) | Alerta sugerido |
|---------|---------------------------|-----------------|
| Vercel Bandwidth | 100 GB/mês | 80% |
| Vercel Serverless | 100 GB-hrs | 80% |
| Supabase DB size | 500 MB | 400 MB |
| Supabase Storage | 1 GB | 800 MB |
| Supabase API requests | 500k/mês | 400k |

### Implementação

#### Opção A: Cron + API interna + notificação

```
/app/api/cron/check-capacity/route.ts
```

- Rodar via Vercel Cron (vercel.json) 1x/dia
- Consultar Supabase: `pg_database_size`, `pg_total_relation_size`
- Consultar Vercel API (se tiver token): usage
- Se acima do threshold: enviar email/Slack/WhatsApp

#### Opção B: Integração com serviços externos

- **Better Stack (ex-Logtail)** – alertas de infra
- **Supabase Dashboard** – alertas nativos (se disponível no plano)
- **Vercel Analytics** – uso de bandwidth e funções

#### Código exemplo (Supabase)

```sql
-- Tamanho do banco em MB
SELECT pg_database_size(current_database()) / 1024 / 1024 AS size_mb;
```

```ts
// app/api/cron/check-capacity/route.ts
export async function GET(request: Request) {
  if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }
  const supabase = createAdminClient()
  const { data } = await supabase.rpc('get_db_size_mb') // ou raw query
  const sizeMb = data ?? 0
  const limitMb = 400
  if (sizeMb >= limitMb) {
    await sendAlert(`⚠️ Banco Supabase: ${sizeMb}MB / ${limitMb}MB`)
  }
  return Response.json({ sizeMb, ok: sizeMb < limitMb })
}
```

### vercel.json

```json
{
  "crons": [
    { "path": "/api/cron/check-capacity", "schedule": "0 9 * * *" }
  ]
}
```

---

## 3️⃣ Melhoria de UX que Pode Dobrar os Pedidos

### A ideia: "Adicionar e Pedir em 1 Clique"

Hoje o fluxo é:
1. Ver produto → Clicar Adicionar
2. Repetir para outros itens
3. Clicar "Fazer pedido"
4. Preencher nome, telefone, endereço, pagamento
5. Enviar no WhatsApp

**Problema:** muitos abandonam no meio. O formulário assusta.

### Solução: Modo Rápido (Quick Order)

**Fluxo alternativo para quem já conhece o restaurante:**

```
Produto X-Burger  R$ 18
[ + Adicionar ]  [ 📱 Pedir direto ]
```

**"Pedir direto"** = abre WhatsApp com mensagem pré-formatada:

```
Olá! Gostaria de pedir:

1x X-Burger - R$ 18,00

Total: R$ 18,00

*Nome:* [cliente preenche no chat]
*Endereço:* [se entrega]
```

O restaurante recebe no WhatsApp e responde com as perguntas que faltam. O cliente **não precisa** preencher formulário.

### Por que pode dobrar pedidos

1. **Menos fricção** – 1 clique vs 5+ campos
2. **Confiança** – cliente já está no WhatsApp, canal que conhece
3. **Retorno** – ideal para clientes recorrentes ("só quero meu X-Burger")
4. **Mobile-first** – formulários longos no celular são ruins

### Implementação

#### No ProductCard

```tsx
// Dois botões:
<button onClick={() => addProduct(product)}>+ Adicionar</button>
<button onClick={() => quickOrderWhatsApp(product)}>Pedir direto</button>
```

#### Função quickOrderWhatsApp

```ts
function buildQuickOrderMessage(product: CardapioProduct, restaurant: CardapioRestaurant) {
  return `Olá! Gostaria de pedir:

1x ${product.nome} - ${formatCurrency(product.preco)}

Total: ${formatCurrency(product.preco)}

Por favor, confirme disponibilidade e forma de pagamento.`
}
```

#### Comportamento

- Se `restaurant.telefone` existe → `window.open(wa.me/55...?text=...)`
- Se não → mostrar toast "Restaurante não configurou WhatsApp"

### Variação: "Pedir direto" com múltiplos itens

Se o carrinho já tem itens, "Pedir direto" pode enviar **tudo** do carrinho + o produto clicado, sem abrir o drawer. Útil para "mais um refri" ou "mais uma pizza".

### Métricas para validar

- Antes/depois: taxa de pedidos concluídos por sessão
- Uso de "Pedir direto" vs "Adicionar + Formulário"
- Tempo médio até primeiro pedido

---

## Resumo de Prioridades

| Pilar | Impacto | Esforço | Prioridade |
|-------|---------|---------|------------|
| Dashboard secreto | Alto (decisões) | Médio | 1 |
| Alertas de capacidade | Alto (evitar crise) | Baixo | 2 |
| Pedir direto (1 clique) | Muito alto (conversão) | Baixo | 1 |

---

## Próximos passos

1. **Dashboard:** criar `/admin/dashboard` + API de métricas
2. **Alertas:** adicionar cron `check-capacity` + envio de alerta
3. **Pedir direto:** botão no ProductCard + `quickOrderWhatsApp`

Se quiser, posso implementar qualquer um desses no código.

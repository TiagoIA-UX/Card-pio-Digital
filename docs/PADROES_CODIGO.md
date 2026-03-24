# Padrões de Código — Cardápio Digital

**Versão:** 2.0.0  
**Última atualização:** 2026-03-24

---

## 1. Naming Conventions

| Tipo | Padrão | Exemplo |
|---|---|---|
| Arquivos de componente | `PascalCase.tsx` | `HeroSection.tsx`, `CartDrawer.tsx` |
| Arquivos de rota | `kebab-case` (Next.js) | `app/termos-de-uso/page.tsx` |
| Arquivos de utilitário | `kebab-case.ts` | `rate-limit.ts`, `format-currency.ts` |
| Arquivos de script | `kebab-case.mjs` | `pre-merge-check.mjs` |
| Componentes React | `PascalCase` | `function HeroSection()` |
| Variáveis e funções | `camelCase` | `const siteUrl`, `function getSiteUrl()` |
| Constantes globais | `SCREAMING_SNAKE_CASE` | `const WHATSAPP_NUMBER`, `const RESTAURANT_TEMPLATES` |
| Interfaces/Types | `PascalCase` | `interface NicheTemplate`, `type TemplateIconKey` |
| CSS classes | `kebab-case` (Tailwind utilitários) | `text-foreground`, `bg-primary` |

---

## 2. Estrutura de API Routes

Todas as API routes do App Router seguem o padrão:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ... lógica

  return NextResponse.json({ data: result })
}
```

### Códigos de Status
| Situação | Status |
|---|---|
| Sucesso | `200` (GET/PUT) ou `201` (POST) |
| Não autorizado | `401` |
| Proibido (sem permissão) | `403` |
| Não encontrado | `404` |
| Dados inválidos | `400` |
| Erro de servidor | `500` |

### Formato de Resposta
```typescript
// Sucesso
{ data: T }

// Erro
{ error: string }

// Com metadados
{ data: T, meta: { page: number, total: number } }
```

---

## 3. Estrutura de Migrations

```
supabase/migrations/
  001_initial_schema.sql
  002_rls_policies.sql
  003_templates.sql
  ...
  NNN_nome-descritivo.sql
```

### Regras
- Numeração sequencial sem gaps (`001`, `002`, ...)
- Nome descritivo em `kebab-case`
- **RLS obrigatório** em todas as tabelas com dados de usuário
- Todas as views devem ter `SECURITY DEFINER` + `SET search_path = public`
- Todas as functions devem ter `SECURITY DEFINER` + `SET search_path = public`

### Template de Migration
```sql
-- Migration: NNN_nome-descritivo.sql
-- Descrição: O que esta migration faz

CREATE TABLE IF NOT EXISTS nome_tabela (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON nome_tabela FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON nome_tabela FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 4. Estrutura de Componentes

### Server Component (padrão — sem `'use client'`)
```typescript
// components/home/HeroSection.tsx
import Image from 'next/image'
import Link from 'next/link'

interface HeroSectionProps {
  // props tipadas com interface
}

export function HeroSection({ ... }: HeroSectionProps) {
  return (
    <section>
      {/* JSX */}
    </section>
  )
}
```

### Client Component (apenas quando necessário)
```typescript
// components/cart/cart-drawer.tsx
'use client'

import { useState } from 'react'

interface CartDrawerProps {
  // props tipadas com interface
}

export function CartDrawer({ ... }: CartDrawerProps) {
  const [open, setOpen] = useState(false)
  // ...
}
```

### Quando usar `'use client'`
- Hooks do React (`useState`, `useEffect`, `useRouter`, etc.)
- Event handlers interativos (`onClick`, `onChange`, etc.)
- APIs do browser (`localStorage`, `window`, etc.)
- Componentes de terceiros que exigem client-side

---

## 5. Padrão de Validação (Zod)

Todos os schemas Zod ficam em `lib/schemas/` ou inline na API route quando usados apenas uma vez.

```typescript
import { z } from 'zod'

const CheckoutSchema = z.object({
  templateSlug: z.string().min(1),
  email: z.string().email(),
  amount: z.number().positive(),
})

// Em API routes:
export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = CheckoutSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { templateSlug, email, amount } = parsed.data
  // ...
}
```

---

## 6. Padrão de Autenticação

```typescript
// Client-side
import { createBrowserClient } from '@/lib/supabase/client'

// Server-side (Server Components, API routes, middleware)
import { createServerClient } from '@/lib/supabase/server'

// Admin (apenas server-side, com service role key)
import { createAdminClient } from '@/lib/supabase/admin'
```

### Verificação em API Routes
```typescript
const supabase = await createServerClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Verificação Admin
```typescript
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (!adminCheck.ok) {
    return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status })
  }
  // ...
}
```

---

## 7. Padrão de Imports

### Ordem de Imports
```typescript
// 1. React e Next.js
import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// 2. Bibliotecas externas
import { z } from 'zod'
import { Store } from 'lucide-react'

// 3. Componentes internos (absolutos via @/)
import { HomeHeader } from '@/components/home-header'
import { Button } from '@/components/ui/button'

// 4. Libs e utilitários internos
import { createServerClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

// 5. Types
import type { Template } from '@/types/template'
```

### Alias de Paths
Todos os imports internos usam o alias `@/` (configurado em `tsconfig.json`):
```typescript
// ✅ Correto
import { Button } from '@/components/ui/button'

// ❌ Evitar (relativo a menos que seja no mesmo diretório)
import { Button } from '../../components/ui/button'
```

---

## 8. Padrão de Rate Limiting

```typescript
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await rateLimit(ip, 'endpoint-name', 10, '1 m')

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  // ...
}
```

---

## 9. Regras Gerais

1. **Zero `any`** — TypeScript strict mode ativo. Use tipos explícitos ou `unknown`.
2. **Zero `@ts-ignore`** — Se TypeScript reclamar, corrija o tipo.
3. **Server Components por padrão** — Adicione `'use client'` apenas quando necessário.
4. **Imagens via `next/image`** — Nunca use `<img>` para imagens locais ou CDN.
5. **Variáveis de ambiente** — Nunca hardcode secrets. Use `.env.local` + `process.env`.
6. **RLS sempre** — Toda tabela Supabase com dados de usuário deve ter RLS habilitado.
7. **Zod para validação** — Toda entrada externa (API request body, query params) deve ser validada.

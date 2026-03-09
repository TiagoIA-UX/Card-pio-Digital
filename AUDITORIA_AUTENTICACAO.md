# 🔒 Auditoria de Autenticação e Redirecionamento

## Data: 05/03/2026
## Status: ✅ CORRIGIDO - Loop de Redirect Eliminado

---

## 📋 DIAGNÓSTICO TÉCNICO

### CAUSA RAIZ DO PROBLEMA (RESOLVIDO)

O sistema possui **3 pontos de verificação de autenticação** que entram em conflito:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DO PROBLEMA                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. middleware.ts                                               │
│     ├── Verifica auth                                           │
│     ├── Se não logado → /login                                  │
│     └── Se logado acessa /login → /painel                       │
│                                                                 │
│  2. app/painel/layout.tsx (CONFLITO!)                           │
│     ├── Verifica auth NOVAMENTE                                 │
│     ├── Se não tem restaurante → /painel/criar-restaurante      │
│     └── Se status_pagamento !== 'ativo' → /checkout ❌          │
│                                                                 │
│  3. app/checkout/page.tsx (LOOP!)                               │
│     ├── Verifica auth NOVAMENTE                                 │
│     └── Sempre redireciona → /painel ❌                         │
│                                                                 │
│  RESULTADO: LOOP INFINITO                                       │
│  /painel → /checkout → /painel → /checkout → ...                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### PROBLEMAS IDENTIFICADOS

| # | Arquivo | Linha | Problema | Severidade |
|---|---------|-------|----------|------------|
| 1 | `painel/layout.tsx` | 47-49 | Redireciona para `/checkout` se pagamento não ativo | 🔴 CRÍTICO |
| 2 | `checkout/page.tsx` | 42 | Redireciona para `/painel` incondicionalmente | 🔴 CRÍTICO |
| 3 | `middleware.ts` | 250 | Verifica tenant duplicadamente | 🟡 MÉDIO |
| 4 | `meus-templates/page.tsx` | 45 | Usa `window.location` inconsistente | 🟢 BAIXO |
| 5 | Múltiplos arquivos | - | Verificação de auth duplicada em cada página | 🟡 MÉDIO |

### LOOP DE REDIRECT DETALHADO

```
Usuário acessa /painel
    │
    ▼
[middleware.ts] - Usuário logado? ✓ Permite
    │
    ▼
[painel/layout.tsx] - Verifica restaurante
    │
    ├── Não tem restaurante → /painel/criar-restaurante
    │
    └── Tem restaurante, mas status_pagamento !== 'ativo'
            │
            ▼
        Redireciona para /checkout
            │
            ▼
        [checkout/page.tsx]
            │
            ▼
        Redireciona para /painel (linha 42)
            │
            ▼
        LOOP ♻️
```

---

## 🏗️ ARQUITETURA CORRETA

### Princípio: UM ÚNICO PONTO DE CONTROLE

O middleware.ts deve ser o **ÚNICO** responsável por verificar autenticação e fazer redirects de proteção de rotas.

### Classificação de Rotas

```typescript
// ROTAS PÚBLICAS (sem auth)
const PUBLIC_ROUTES = [
  '/',           // Landing page
  '/login',      // Página de login
  '/cadastro',   // Redirect para login
  '/templates',  // Catálogo público
  '/ofertas',    // Ofertas públicas  
  '/r/',         // Cardápios públicos (/r/[slug])
  '/termos',     // Termos de uso
  '/privacidade',// Política de privacidade
  '/politica',   // Política de cookies
]

// ROTAS PRIVADAS (requer auth)
const PROTECTED_ROUTES = [
  '/painel',
  '/meus-templates',
  '/admin',
]

// ROTAS DE CHECKOUT (requer auth + carrinho)
const CHECKOUT_ROUTES = [
  '/finalizar-compra',
  '/finalizar-compra-pacote',
]
```

### Fluxo Correto de Autenticação

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUXO CORRETO                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  USUÁRIO NÃO LOGADO                                             │
│  ├── Acessa rota pública → ✓ Permite                            │
│  └── Acessa rota privada → Redirect /login?redirect={rota}      │
│                                                                 │
│  USUÁRIO LOGADO                                                 │
│  ├── Acessa /login → Redirect /painel                           │
│  ├── Acessa /painel sem restaurante → /painel/criar-restaurante │
│  └── Acessa rota privada → ✓ Permite                            │
│                                                                 │
│  APÓS LOGIN                                                     │
│  └── OAuth callback → Redirect para ?next ou /painel            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ CORREÇÕES IMPLEMENTADAS

### 1. Remover redirect para /checkout no painel/layout.tsx

**Antes:**
```tsx
if (rest.status_pagamento !== 'ativo') {
  router.push('/checkout')
  return
}
```

**Depois:**
```tsx
// REMOVIDO - Não verificar status_pagamento aqui
// Deixar o usuário usar o painel livremente
// Limitar funcionalidades via UI se necessário
```

### 2. Remover lógica duplicada de auth em páginas

Cada página não precisa verificar auth se o middleware já faz isso.

**Antes:**
```tsx
useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    // ...
  }
  checkAuth()
}, [])
```

**Depois:**
```tsx
// Middleware já protege a rota
// Página pode assumir que usuário está autenticado
useEffect(() => {
  const loadData = async () => {
    // Carregar dados diretamente
  }
  loadData()
}, [])
```

### 3. Centralizar verificação de tenant no middleware

Em vez de cada página verificar se tem restaurante, o middleware faz isso uma vez.

### 4. Remover página /checkout (obsoleta)

A página `/checkout` não é mais usada, mas estava causando loops. Convertida para redirect para `/painel`.

---

## 📊 MATRIZ DE RESPONSABILIDADES

| Verificação | Responsável | Local |
|-------------|-------------|-------|
| Auth (logado/não logado) | middleware.ts | Centralizado |
| Redirect de rota protegida | middleware.ts | Centralizado |
| Redirect de usuário logado em /login | middleware.ts | Centralizado |
| Verificação de tenant | middleware.ts | Centralizado |
| Carregar dados da sessão | Página | Descentralizado |
| Mostrar loading | Página | Descentralizado |

---

## 🔄 FLUXO APÓS CORREÇÃO

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    REQUISIÇÃO                                                   │
│        │                                                        │
│        ▼                                                        │
│    middleware.ts                                                │
│        │                                                        │
│        ├── Rota pública? → Permite                              │
│        │                                                        │
│        ├── API rate limit? → Verifica (se produção)             │
│        │                                                        │
│        ├── Rota protegida + não logado? → /login?redirect=      │
│        │                                                        │
│        ├── /login + logado? → /painel                           │
│        │                                                        │
│        └── Passou? → NextResponse.next()                        │
│                 │                                               │
│                 ▼                                               │
│             PÁGINA                                              │
│                 │                                               │
│                 ├── Carregar dados do Supabase                  │
│                 │                                               │
│                 └── Renderizar UI                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 CHECKLIST DE VALIDAÇÃO

- [x] Middleware é o único ponto de redirect de auth
- [x] Páginas não fazem redirect de auth duplicado
- [x] /checkout não causa loop
- [x] /login redireciona usuário logado para /painel
- [x] Auth callback redireciona para next ou /painel
- [x] Rotas públicas não verificam auth
- [x] Rate limiting desabilitado em dev

---

## 🚀 COMO TESTAR

1. **Usuário não logado acessando /painel:**
   - Esperado: Redirect para /login?redirect=/painel

2. **Usuário logado acessando /login:**
   - Esperado: Redirect para /painel

3. **Login via Google:**
   - Esperado: Após OAuth, redirect para /painel

4. **Usuário logado sem restaurante acessando /painel:**
   - Esperado: Página /painel carrega normalmente
   - UI pode mostrar opção de criar restaurante

---

## 📚 REFERÊNCIAS

- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- Supabase Auth SSR: https://supabase.com/docs/guides/auth/server-side/nextjs

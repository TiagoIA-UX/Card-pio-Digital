import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ========================================
// RATE LIMITING IN-MEMORY (Edge Compatible)
// ========================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const key = `rl:${identifier}`

  let entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + windowMs }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore) {
      if (v.resetTime < now) rateLimitStore.delete(k)
    }
  }

  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetIn: Math.max(0, entry.resetTime - now),
  }
}

const RATE_LIMITS = {
  webhook: { limit: 500, window: 60000 },
  auth: { limit: 100, window: 60000 },
  api: { limit: 500, window: 60000 },
}

// ========================================
// ARQUITETURA LIMPA DE AUTENTICAÇÃO
// O middleware é o ÚNICO ponto de controle de auth
// ========================================

// Rotas que REQUEREM autenticação
const PROTECTED_ROUTES = [
  '/painel',
  '/meus-templates',
  '/finalizar-compra',
  '/checkout-novo',
  '/admin',
]

// Rotas de autenticação (usuário logado não deve acessar)
const AUTH_ROUTES = ['/login', '/cadastro']

// Rotas que nunca devem ser redirect target
const INVALID_REDIRECT_TARGETS = ['/checkout', '/checkout-novo', '/finalizar-compra']

function matchesRoute(path: string, route: string): boolean {
  return path === route || path.startsWith(`${route}/`)
}

function getSafeRedirectTarget(redirectParam: string | null): string | null {
  if (!redirectParam || !redirectParam.startsWith('/')) {
    return null
  }

  if (redirectParam.startsWith('//')) {
    return null
  }

  if (INVALID_REDIRECT_TARGETS.some((route) => matchesRoute(redirectParam, route))) {
    return null
  }

  return redirectParam
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const clientIP = getClientIP(request)
  const isDev = process.env.NODE_ENV === 'development'

  // ========================================
  // RATE LIMITING (apenas produção)
  // ========================================
  if (!isDev) {
    if (path.startsWith('/api/webhook')) {
      const { success, resetIn } = checkRateLimit(
        `webhook:${clientIP}`,
        RATE_LIMITS.webhook.limit,
        RATE_LIMITS.webhook.window
      )
      if (!success) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(resetIn / 1000).toString(),
          },
        })
      }
    }

    if (AUTH_ROUTES.some((route) => matchesRoute(path, route))) {
      const { success } = checkRateLimit(
        `auth:${clientIP}`,
        RATE_LIMITS.auth.limit,
        RATE_LIMITS.auth.window
      )
      if (!success) {
        return new NextResponse(JSON.stringify({ error: 'Muitas tentativas' }), { status: 429 })
      }
    }

    if (path.startsWith('/api/') && !path.startsWith('/api/webhook')) {
      const { success } = checkRateLimit(
        `api:${clientIP}`,
        RATE_LIMITS.api.limit,
        RATE_LIMITS.api.window
      )
      if (!success) {
        return new NextResponse(JSON.stringify({ error: 'Rate limit' }), { status: 429 })
      }
    }
  }

  // ========================================
  // SUPABASE AUTH - PONTO ÚNICO DE CONTROLE
  // ========================================

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('⚠️ Supabase não configurado')
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obter sessão (mais confiável que getUser para middleware)
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const isAuthenticated = !!session?.user

  // ========================================
  // FLUXO DE REDIRECIONAMENTO LIMPO
  // ========================================

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => matchesRoute(path, route))
  const isAuthRoute = AUTH_ROUTES.some((route) => matchesRoute(path, route))
  const redirectParam = request.nextUrl.searchParams.get('redirect')
  const safeRedirectTarget = getSafeRedirectTarget(redirectParam)

  // 1. Rota protegida SEM autenticação → Login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', `${path}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Login/Cadastro COM autenticação → Painel (ou redirect válido)
  if (isAuthRoute && isAuthenticated) {
    let target = '/painel'
    if (safeRedirectTarget) {
      target = safeRedirectTarget
    }
    return NextResponse.redirect(new URL(target, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}

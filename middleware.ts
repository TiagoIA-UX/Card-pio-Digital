import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()
const lastSeenStore = new Map<string, number>()

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

  if (lastSeenStore.size > 10000) {
    const staleThreshold = now - 30 * 60 * 1000
    for (const [k, v] of lastSeenStore) {
      if (v < staleThreshold) lastSeenStore.delete(k)
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

const PROTECTED_ROUTES = ['/painel', '/meus-templates', '/onboarding', '/status', '/admin']
const AUTH_ROUTES = ['/login', '/cadastro']

const LEGACY_PURCHASE_ROUTES = ['/checkout', '/checkout-novo', '/finalizar-compra']
const DISALLOWED_REDIRECT_PREFIXES = ['/api', '/auth/callback', '/_next']

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

  if (redirectParam.includes('\r') || redirectParam.includes('\n')) {
    return null
  }

  if (DISALLOWED_REDIRECT_PREFIXES.some((route) => matchesRoute(redirectParam, route))) {
    return null
  }

  if (LEGACY_PURCHASE_ROUTES.some((route) => matchesRoute(redirectParam, route))) {
    return null
  }

  return redirectParam
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

function getOauthRecoveryRedirect(request: NextRequest): URL | null {
  const path = request.nextUrl.pathname
  const code = request.nextUrl.searchParams.get('code')

  if (!code || matchesRoute(path, '/auth/callback')) {
    return null
  }

  const callbackUrl = new URL('/auth/callback', request.url)
  callbackUrl.searchParams.set('code', code)

  const explicitNext = getSafeRedirectTarget(request.nextUrl.searchParams.get('next'))
  const remainingParams = new URLSearchParams(request.nextUrl.searchParams)
  remainingParams.delete('code')
  remainingParams.delete('next')

  const currentTarget = `${path}${remainingParams.toString() ? `?${remainingParams.toString()}` : ''}`
  const safeCurrentTarget = path === '/' ? null : getSafeRedirectTarget(currentTarget)

  callbackUrl.searchParams.set('next', explicitNext || safeCurrentTarget || '/painel')

  return callbackUrl
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const clientIP = getClientIP(request)
  const isDev = process.env.NODE_ENV === 'development'
  const oauthRecoveryRedirect = getOauthRecoveryRedirect(request)

  if (oauthRecoveryRedirect) {
    return NextResponse.redirect(oauthRecoveryRedirect)
  }

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

  // SEGURANÇA: getUser() valida o JWT com o servidor Supabase.
  // getSession() apenas decodifica cookies localmente — NÃO usar para decisões de auth.
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isAuthenticated = !!user

  if (isAuthenticated && user?.id) {
    const userId = user.id
    const now = Date.now()
    const lastSeen = lastSeenStore.get(userId) ?? 0
    if (now - lastSeen > 5 * 60 * 1000) {
      lastSeenStore.set(userId, now)
      supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', userId)
        .then(() => {})
    }
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => matchesRoute(path, route))
  const isAuthRoute = AUTH_ROUTES.some((route) => matchesRoute(path, route))
  const redirectParam = request.nextUrl.searchParams.get('redirect')
  const safeRedirectTarget = getSafeRedirectTarget(redirectParam)

  const refCode = request.nextUrl.searchParams.get('ref')
  const alreadyHasRef = request.cookies.get('aff_ref')?.value

  function setAffCookie<T extends NextResponse>(res: T, code: string): T {
    if (/^[a-z0-9_-]{3,30}$/i.test(code)) {
      res.cookies.set('aff_ref', code, {
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      })
    }
    return res
  }

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', `${path}${request.nextUrl.search}`)
    const res = NextResponse.redirect(loginUrl)
    if (refCode && !alreadyHasRef) setAffCookie(res, refCode)
    return res
  }

  if (isAuthRoute && isAuthenticated) {
    let target = '/painel'
    if (safeRedirectTarget) {
      target = safeRedirectTarget
    }
    const res = NextResponse.redirect(new URL(target, request.url))
    if (refCode && !alreadyHasRef) setAffCookie(res, refCode)
    return res
  }

  if (refCode && !alreadyHasRef) setAffCookie(response, refCode)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|google[0-9a-z]+\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

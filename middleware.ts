import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas que requerem autenticação
const PROTECTED_ROUTES = [
  '/painel',
  '/meus-templates',
  '/finalizar-compra',
  '/checkout-novo',
  '/api/carrinho',
  '/api/checkout/criar-sessao'
]

// Rotas públicas (não precisa de auth check)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/registrar',
  '/templates',
  '/ofertas',
  '/comprar',
  '/r/',
  '/api/webhook'
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  // Verificar autenticação
  const {
    data: { user }
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const redirectParam = request.nextUrl.searchParams.get('redirect')

  // Verificar se é rota protegida
  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    path.startsWith(route)
  )

  // Redirecionar para login se não autenticado em rota protegida
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // Se usuário está logado e acessa login COM redirect, mandar para o redirect
  if (path === '/login' && user && redirectParam) {
    return NextResponse.redirect(new URL(redirectParam, request.url))
  }

  // Se usuário está logado e acessa login SEM redirect, mandar para meus-templates
  if (path === '/login' && user && !redirectParam) {
    return NextResponse.redirect(new URL('/meus-templates', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}

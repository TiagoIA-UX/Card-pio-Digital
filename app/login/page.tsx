'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { PizzaIcon, Loader2, ShieldCheck } from 'lucide-react'

// Redirects legados de compra devem cair no painel para evitar rotas removidas.
const LEGACY_PURCHASE_REDIRECTS = ['/checkout', '/checkout-novo', '/finalizar-compra']

function isSafeRedirect(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) {
    return false
  }

  if (path.includes('\r') || path.includes('\n')) {
    return false
  }

  return !LEGACY_PURCHASE_REDIRECTS.some(
    (legacyPath) => path === legacyPath || path.startsWith(`${legacyPath}/`)
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const rawRedirect = searchParams.get('redirect') || '/painel'
  const redirectTo = isSafeRedirect(rawRedirect) ? rawRedirect : '/painel'

  const [isLoading, setIsLoading] = useState(false)

  // Redireciona automaticamente se o usuário já está autenticado
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.replace(redirectTo)
      }
    }
    void checkSession()
  }, [router, redirectTo])

  const handleGoogleLogin = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', redirectTo)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })

      if (error) throw error
    } catch (error) {
      console.error('Erro no login Google:', error)
      toast({
        title: 'Erro ao fazer login',
        description:
          'Não foi possível conectar com o Google. Verifique se o Google OAuth está configurado.',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="flex items-center justify-center gap-2">
          <PizzaIcon className="h-10 w-10 text-orange-500" />
          <span className="text-2xl font-bold text-gray-900">Cardápio Digital</span>
        </Link>
        <p className="mt-2 text-gray-500">Acesse sua conta</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
          <CardDescription>Entre com sua conta Google para continuar</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Login - Botão Principal */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="h-14 w-full border-2 border-gray-200 bg-white text-lg text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50"
          >
            {isLoading ? (
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            ) : (
              <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {isLoading ? 'Conectando...' : 'Continuar com Google'}
          </Button>

          {/* Segurança */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span>Login seguro via Google com verificação em 2 etapas</span>
          </div>

          {/* Benefícios */}
          <div className="space-y-2 rounded-lg bg-orange-50 p-4">
            <p className="text-sm font-medium text-orange-800">Por que usar Google?</p>
            <ul className="space-y-1 text-sm text-orange-700">
              <li>✓ Login rápido com 1 clique</li>
              <li>✓ Verificação em 2 etapas automática</li>
              <li>✓ Sem precisar decorar senhas</li>
              <li>✓ Mais seguro contra fraudes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Back link */}
      <Link href="/" className="mt-6 text-sm text-gray-500 hover:text-gray-700">
        ← Voltar para o início
      </Link>
    </div>
  )
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
      <div className="h-80 w-full max-w-md animate-pulse rounded-lg bg-white" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

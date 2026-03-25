'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient, resetBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { PizzaIcon, Loader2, Mail, ShieldCheck, KeyRound, Sparkles } from 'lucide-react'
import { getSafeAuthRedirect } from '@/lib/auth-access'
import {
  getLoginMethodGuidance,
  listLoginMethodGuidance,
  resolveRecommendedLoginMethod,
} from '@/lib/login-guidance'

function getOauthRedirectOrigin() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }

  const currentOrigin = window.location.origin
  const currentHost = window.location.hostname
  const isLocalHost = currentHost === 'localhost' || currentHost === '127.0.0.1'

  if (isLocalHost) {
    return currentOrigin
  }

  return process.env.NEXT_PUBLIC_SITE_URL || currentOrigin
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const redirectTo = getSafeAuthRedirect(searchParams.get('redirect'))
  const authError = searchParams.get('error')
  const recommendedMethod = resolveRecommendedLoginMethod(authError)
  const recommendedGuidance = getLoginMethodGuidance(recommendedMethod)

  const [isLoading, setIsLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [email, setEmail] = useState('')

  // Redireciona automaticamente se o usuário já está autenticado
  useEffect(() => {
    const checkSession = async () => {
      // Resetar singleton para garantir leitura limpa dos cookies atuais
      resetBrowserClient()
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.replace(redirectTo)
      }
    }
    void checkSession()
  }, [router, redirectTo])

  useEffect(() => {
    if (!authError) {
      return
    }

    const messages: Record<string, { title: string; description: string }> = {
      auth: {
        title: 'Não foi possível concluir o acesso',
        description: 'Tente novamente ou solicite um novo link por e-mail.',
      },
      recovery: {
        title: 'Link de recuperação inválido ou expirado',
        description: 'Peça um novo e-mail para redefinir sua senha.',
      },
    }

    const message = messages[authError]
    if (!message) {
      return
    }

    toast({
      title: message.title,
      description: message.description,
      variant: 'destructive',
    })
  }, [authError, toast])

  const handleGoogleLogin = async () => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Em localhost o callback precisa voltar para o próprio ambiente local.
      const siteOrigin = getOauthRedirectOrigin()
      const callbackUrl = new URL('/auth/callback', siteOrigin)
      callbackUrl.searchParams.set('next', redirectTo)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            prompt: 'select_account',
          },
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

  const handleEmailAccessLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      toast({
        title: 'Informe seu e-mail',
        description: 'Digite o e-mail usado na compra ou no cadastro.',
        variant: 'destructive',
      })
      return
    }

    setEmailLoading(true)

    try {
      const supabase = createClient()
      const siteOrigin = getOauthRedirectOrigin()
      const callbackUrl = new URL('/auth/callback', siteOrigin)
      callbackUrl.searchParams.set('next', redirectTo)

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          shouldCreateUser: false,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Link enviado',
        description: 'Verifique seu e-mail para acessar a conta e concluir o primeiro acesso.',
      })
    } catch (error) {
      console.error('Erro ao enviar magic link:', error)
      toast({
        title: 'Não foi possível enviar o link',
        description: 'Confira o e-mail informado e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setEmailLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      toast({
        title: 'Informe seu e-mail',
        description: 'Digite o e-mail da conta para receber o link de redefinição.',
        variant: 'destructive',
      })
      return
    }

    setResetLoading(true)

    try {
      const supabase = createClient()
      const siteOrigin = getOauthRedirectOrigin()
      const resetUrl = new URL('/redefinir-senha', siteOrigin)
      resetUrl.searchParams.set('next', redirectTo)

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: resetUrl.toString(),
      })

      if (error) {
        throw error
      }

      toast({
        title: 'E-mail de redefinição enviado',
        description: 'Abra o link do e-mail para escolher uma nova senha.',
      })
    } catch (error) {
      console.error('Erro ao enviar redefinição de senha:', error)
      toast({
        title: 'Não foi possível enviar a redefinição',
        description: 'Confira o e-mail informado e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Link href="/" className="flex items-center justify-center gap-2">
          <PizzaIcon className="h-10 w-10 text-orange-500" />
          <span className="text-2xl font-bold text-gray-900">Canal Digital</span>
        </Link>
        <p className="mt-2 text-gray-500">Acesse sua conta</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
          <CardDescription>
            Escolha a forma de acesso que combina com a sua situação
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-orange-100 p-2 text-orange-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-orange-900">
                  Recomendado agora: {recommendedGuidance.title}
                </p>
                <p className="text-sm text-orange-800">{recommendedGuidance.whenToUse}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {listLoginMethodGuidance().map((item) => {
              const isRecommended = item.method === recommendedMethod

              return (
                <div
                  key={item.method}
                  className={`rounded-xl border p-4 transition-colors ${
                    isRecommended ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{item.summary}</p>
                      <p className="mt-2 text-xs text-gray-500">{item.whenToUse}</p>
                    </div>
                    {isRecommended ? (
                      <span className="rounded-full bg-orange-100 px-2 py-1 text-[11px] font-semibold tracking-wide text-orange-700 uppercase">
                        recomendado
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

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

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">ou</span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleEmailAccessLink}>
            <div className="space-y-2">
              <Label htmlFor="email-access">Receber link de acesso por e-mail</Label>
              <Input
                id="email-access"
                type="email"
                autoComplete="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={emailLoading}
              />
            </div>

            <Button type="submit" variant="outline" className="w-full" disabled={emailLoading}>
              {emailLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {emailLoading ? 'Enviando link...' : 'Receber link de acesso'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={resetLoading}
              onClick={handlePasswordReset}
            >
              {resetLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              {resetLoading ? 'Enviando redefinição...' : 'Esqueci minha senha'}
            </Button>

            <p className="text-xs text-gray-500">
              Se você comprou no checkout, normalmente este é o caminho mais seguro para entrar pela
              primeira vez.
            </p>
          </form>
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

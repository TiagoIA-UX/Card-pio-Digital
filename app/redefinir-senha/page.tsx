'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { CheckCircle2, KeyRound, Loader2, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { getSafeAuthRedirect } from '@/lib/auth-access'
import { useToast } from '@/hooks/use-toast'
import { getPasswordRuleStatuses, isPasswordReady } from '@/lib/password-rules'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const next = getSafeAuthRedirect(searchParams.get('next'))
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [linkValid, setLinkValid] = useState(false)
  const passwordRules = getPasswordRuleStatuses(password)
  const passwordReady = isPasswordReady(password, confirmPassword)

  useEffect(() => {
    const supabase = createClient()

    const resolveRecoveryState = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        setLinkValid(true)
      }

      setLoading(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'PASSWORD_RECOVERY' || !!session?.user) {
        setLinkValid(true)
        setLoading(false)
      }
    })

    void resolveRecoveryState()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!passwordReady) {
      toast({
        title: 'Senha ainda não atende os requisitos',
        description: 'Revise as regras abaixo e confirme a mesma senha nos dois campos.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password,
        data: {
          requires_password_setup: false,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Senha atualizada',
        description: 'Sua nova senha já está ativa.',
      })

      router.replace(next)
    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
      toast({
        title: 'Não foi possível atualizar a senha',
        description: 'Solicite um novo link e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!linkValid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Link inválido ou expirado</CardTitle>
            <CardDescription>Solicite um novo e-mail para redefinir sua senha.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login?error=recovery">Voltar para login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>Escolha uma nova senha para voltar a acessar sua conta.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="reset-password">Nova senha</Label>
              <Input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Use pelo menos 8 caracteres"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-password-confirm">Confirmar nova senha</Label>
              <Input
                id="reset-password-confirm"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repita a nova senha"
                disabled={saving}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-orange-100 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">Sua nova senha precisa ter:</p>
                <Badge variant={passwordReady ? 'default' : 'outline'}>
                  {passwordReady ? 'Pronta para salvar' : 'Faltam ajustes'}
                </Badge>
              </div>
              <div className="space-y-2">
                {passwordRules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={`h-4 w-4 ${rule.valid ? 'text-green-600' : 'text-gray-300'}`}
                    />
                    <span className={rule.valid ? 'text-gray-900' : 'text-gray-500'}>
                      {rule.label}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2
                    className={`h-4 w-4 ${
                      confirmPassword.length > 0 && password === confirmPassword
                        ? 'text-green-600'
                        : 'text-gray-300'
                    }`}
                  />
                  <span
                    className={
                      confirmPassword.length > 0 && password === confirmPassword
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }
                  >
                    As duas senhas devem ser iguais
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-orange-50 p-3 text-sm text-orange-900">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-orange-600" />
                <p>
                  Depois de salvar, você poderá entrar com a nova senha ou continuar usando seus
                  links de acesso.
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saving || !passwordReady}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? 'Salvando...' : 'Salvar nova senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function ResetPasswordSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

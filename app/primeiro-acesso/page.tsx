'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { getSafeAuthRedirect } from '@/lib/auth-access'
import { getPasswordRuleStatuses, isPasswordReady } from '@/lib/password-rules'

function PrimeiroAcessoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const next = getSafeAuthRedirect(searchParams.get('next'))
  const passwordRules = getPasswordRuleStatuses(password)
  const passwordReady = isPasswordReady(password, confirmPassword)

  useEffect(() => {
    const verifyUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(next)}`)
        return
      }

      if (!user.user_metadata?.requires_password_setup) {
        router.replace(next)
        return
      }

      setLoading(false)
    }

    void verifyUser()
  }, [next, router])

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
          provisioned_via_checkout: false,
        },
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Senha definida',
        description: 'Seu acesso foi protegido. Você já pode entrar normalmente depois.',
      })

      router.replace(next)
    } catch (error) {
      console.error('Erro ao definir senha no primeiro acesso:', error)
      toast({
        title: 'Não foi possível salvar a senha',
        description: 'Tente novamente em alguns instantes.',
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <CardTitle>Proteja seu primeiro acesso</CardTitle>
          <CardDescription>
            Defina uma senha agora para não depender só do link mágico depois.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Use pelo menos 8 caracteres"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repita a senha"
                disabled={saving}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-orange-100 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-900">Sua senha precisa ter:</p>
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
                  Depois disso, você continua podendo usar link de acesso por e-mail, mas não fica
                  preso se ele expirar.
                </p>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={saving || !passwordReady}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? 'Salvando...' : 'Salvar senha e continuar'}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              <Link href="/login" className="underline underline-offset-4">
                Voltar para login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function PrimeiroAcessoSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-orange-50 to-red-50 p-4">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    </div>
  )
}

export default function PrimeiroAcessoPage() {
  return (
    <Suspense fallback={<PrimeiroAcessoSkeleton />}>
      <PrimeiroAcessoForm />
    </Suspense>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Loader2, AlertCircle, Gift, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function DevUnlockPage() {
  const showDevUnlock = process.env.NODE_ENV === 'development'
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  if (!showDevUnlock) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-orange-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Rota indisponivel</CardTitle>
            <CardDescription>
              Esta pagina fica disponivel apenas em ambiente de desenvolvimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/painel">
              <Button className="w-full">Voltar ao painel</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  async function handleUnlock() {
    setStatus('loading')
    try {
      const res = await fetch('/api/dev/unlock-all-templates', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || `${data.count} templates liberados!`)
      } else {
        setStatus('error')
        setMessage(data.error || 'Erro ao liberar templates')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Erro de conexão')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-b from-orange-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Gift className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Acesso Dev 🔧</CardTitle>
          <CardDescription>Libere todos os templates para teste</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <>
              <p className="text-muted-foreground text-center text-sm">
                Clique no botão abaixo para liberar todos os 7 templates (Pizzaria, Restaurante,
                Lanchonete, etc.) para sua conta.
              </p>
              <Button
                onClick={handleUnlock}
                className="w-full bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <Gift className="mr-2 h-5 w-5" />
                Liberar Todos os Templates
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                Você precisa estar logado. Se não estiver, faça login primeiro.
              </p>
              <Link href="/login?redirect=/dev/unlock">
                <Button variant="outline" className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Fazer Login
                </Button>
              </Link>
            </>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
              <p className="text-muted-foreground text-sm">Liberando templates...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-center font-medium text-green-700">{message}</p>
              <div className="flex w-full flex-col gap-2">
                <Link href="/meus-templates">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    Ver Meus Templates
                  </Button>
                </Link>
                <Link href="/painel">
                  <Button variant="outline" className="w-full">
                    Acessar Painel
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-center text-red-700">{message}</p>
              <div className="flex w-full flex-col gap-2">
                <Button onClick={() => setStatus('idle')} variant="outline" className="w-full">
                  Tentar Novamente
                </Button>
                <Link href="/login?redirect=/dev/unlock">
                  <Button className="w-full">Fazer Login</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

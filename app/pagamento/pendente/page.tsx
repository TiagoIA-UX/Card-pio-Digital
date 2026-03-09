'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, RefreshCw, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function PagamentoPendenteContent() {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')
  const supabase = createClient()

  const checkStatus = useCallback(async () => {
    setChecking(true)

    if (checkout) {
      const response = await fetch(`/api/pagamento/status?checkout=${checkout}`, {
        cache: 'no-store',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.payment_status === 'approved') {
          setStatus('approved')
          setTimeout(() => router.push(`/pagamento/sucesso?checkout=${checkout}`), 1200)
          return
        }
      }

      setChecking(false)
      return
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('restaurants')
      .select('status_pagamento')
      .eq('user_id', session.user.id)
      .single()

    if (data?.status_pagamento === 'ativo') {
      setStatus('approved')
      setTimeout(() => router.push('/pagamento/sucesso'), 1500)
    } else {
      setChecking(false)
    }
  }, [checkout, router, supabase])

  useEffect(() => {
    // Verificar status a cada 10 segundos
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [checkStatus])

  if (status === 'approved') {
    return (
      <div className="to-background flex min-h-screen items-center justify-center bg-linear-to-b from-green-50 p-4 dark:from-green-950/20">
        <div className="text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
          <h1 className="text-foreground text-2xl font-bold">Pagamento confirmado!</h1>
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="to-background flex min-h-screen items-center justify-center bg-linear-to-b from-yellow-50 p-4 dark:from-yellow-950/20">
      <div className="w-full max-w-md text-center">
        {/* Ícone */}
        <div className="mb-6">
          <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-yellow-500/10">
            <Clock className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-foreground mb-2 text-3xl font-bold">Aguardando pagamento</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Seu PIX foi gerado e está aguardando confirmação
        </p>

        {/* Card de instruções */}
        <div className="bg-card border-border mb-6 rounded-2xl border p-6 text-left">
          <h2 className="text-foreground mb-4 font-semibold">Como pagar:</h2>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white">
                1
              </span>
              <span>Abra o app do seu banco</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white">
                2
              </span>
              <span>Escaneie o QR Code ou cole o código PIX</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white">
                3
              </span>
              <span>Confirme o pagamento</span>
            </li>
          </ol>

          <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <strong>Importante:</strong> O PIX expira em 30 minutos
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <button
            onClick={checkStatus}
            disabled={checking}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold transition-all disabled:opacity-50"
          >
            {checking ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Já paguei, verificar
              </>
            )}
          </button>

          <Link
            href="/checkout"
            className="border-border bg-card text-foreground hover:bg-secondary inline-flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-4 font-semibold transition-all"
          >
            Escolher outra forma de pagamento
          </Link>

          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex w-full items-center justify-center gap-2 py-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          Esta página atualiza automaticamente quando o pagamento for confirmado
        </p>
      </div>
    </div>
  )
}

export default function PagamentoPendentePage() {
  return (
    <Suspense
      fallback={
        <div className="to-background flex min-h-screen items-center justify-center bg-linear-to-b from-yellow-50 p-4 dark:from-yellow-950/20">
          <div className="text-center">
            <Loader2 className="text-primary mx-auto mb-4 h-10 w-10 animate-spin" />
            <p className="text-muted-foreground">Carregando status do pagamento...</p>
          </div>
        </div>
      }
    >
      <PagamentoPendenteContent />
    </Suspense>
  )
}

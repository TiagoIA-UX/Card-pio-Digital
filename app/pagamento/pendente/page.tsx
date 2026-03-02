"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Clock, RefreshCw, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function PagamentoPendentePage() {
  const [checking, setChecking] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const checkStatus = useCallback(async () => {
    setChecking(true)
    
    const { data: { session } } = await supabase.auth.getSession()
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
  }, [router, supabase])

  useEffect(() => {
    // Verificar status a cada 10 segundos
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [checkStatus])

  if (status === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Pagamento confirmado!</h1>
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-background dark:from-yellow-950/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-500/10 mb-4">
            <Clock className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Aguardando pagamento
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Seu PIX foi gerado e está aguardando confirmação
        </p>

        {/* Card de instruções */}
        <div className="bg-card rounded-2xl border border-border p-6 mb-6 text-left">
          <h2 className="font-semibold text-foreground mb-4">
            Como pagar:
          </h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-white text-xs font-bold">1</span>
              <span>Abra o app do seu banco</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-white text-xs font-bold">2</span>
              <span>Escaneie o QR Code ou cole o código PIX</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-white text-xs font-bold">3</span>
              <span>Confirme o pagamento</span>
            </li>
          </ol>
          
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
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
            className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold transition-all hover:bg-primary/90 disabled:opacity-50"
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
            className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl border border-border bg-card text-foreground font-semibold transition-all hover:bg-secondary"
          >
            Escolher outra forma de pagamento
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Esta página atualiza automaticamente quando o pagamento for confirmado
        </p>
      </div>
    </div>
  )
}

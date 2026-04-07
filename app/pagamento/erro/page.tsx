'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { PAYMENT_OPERATOR_NOTE } from '@/lib/shared/brand'

function PagamentoErroContent() {
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')
  const [retryTemplateSlug, setRetryTemplateSlug] = useState<string | null>(null)
  const retryHref = retryTemplateSlug ? `/comprar/${retryTemplateSlug}` : '/templates'
  const retryLabel = retryTemplateSlug
    ? 'Tentar novamente com este template'
    : 'Escolher template novamente'

  useEffect(() => {
    if (!checkout) return

    let cancelled = false

    const loadTemplateContext = async () => {
      try {
        const response = await fetch(`/api/pagamento/status?checkout=${checkout}`, {
          cache: 'no-store',
        })

        if (!response.ok) return

        const data = await response.json()
        if (!cancelled) {
          setRetryTemplateSlug(typeof data.template_slug === 'string' ? data.template_slug : null)
        }
      } catch {
        // Mantém fallback para /templates quando não for possível consultar o checkout.
      }
    }

    void loadTemplateContext()

    return () => {
      cancelled = true
    }
  }, [checkout])

  return (
    <div className="to-background flex min-h-screen items-center justify-center bg-linear-to-b from-red-50 p-4 dark:from-red-950/20">
      <div className="w-full max-w-md text-center">
        {/* Ícone de erro */}
        <div className="mb-6">
          <div className="mb-4 inline-flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
        </div>

        {/* Título */}
        <h1 className="text-foreground mb-2 text-3xl font-bold">Pagamento não aprovado</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Não se preocupe, você pode tentar novamente
        </p>
        <p className="text-muted-foreground mb-6 text-sm">
          Se você viu outro nome na etapa de pagamento, isso é esperado: {PAYMENT_OPERATOR_NOTE}
        </p>

        {/* Card de motivos */}
        <div className="bg-card border-border mb-6 rounded-2xl border p-6 text-left">
          <h2 className="text-foreground mb-4 font-semibold">Possíveis motivos:</h2>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>• Cartão sem limite disponível</li>
            <li>• Dados do cartão incorretos</li>
            <li>• Transação não autorizada pelo banco</li>
            <li>• PIX expirado (válido por 30 minutos)</li>
          </ul>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <Link
            href={retryHref}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold transition-all"
          >
            <RefreshCw className="h-5 w-5" />
            {retryLabel}
          </Link>

          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground inline-flex w-full items-center justify-center gap-2 py-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PagamentoErroPage() {
  return (
    <Suspense fallback={null}>
      <PagamentoErroContent />
    </Suspense>
  )
}

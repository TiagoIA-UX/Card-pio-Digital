'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { StatusPedido } from '@/components/status-pedido'

function StatusContent() {
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    steps?: Array<{ key: string; label: string; done: boolean; current: boolean }>
    plan?: string
    message?: string
    restaurant_slug?: string
    activation_url?: string
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!checkout) {
      setLoading(false)
      setError('Informe o número do pedido na URL: /status?checkout=SEU_PEDIDO')
      return
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/onboarding/status?checkout=${checkout}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Erro ao buscar status')
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar status')
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
  }, [checkout])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link
            href="/"
            className="text-primary hover:underline font-medium"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    )
  }

  if (data?.plan === 'self-service') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <p className="text-muted-foreground mb-4">{data.message}</p>
          <Link
            href="/painel"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Acessar meu painel
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link
            href="/painel"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="font-semibold text-foreground">Acompanhar pedido</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Status do seu cardápio
        </h1>
        <p className="text-muted-foreground mb-6">
          Acompanhe em que etapa está a produção do seu cardápio digital.
        </p>

        {data?.steps && data.steps.length > 0 ? (
          <StatusPedido steps={data.steps} />
        ) : (
          <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
        )}

        {data?.restaurant_slug && (
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground mb-1">Seu cardápio está em:</p>
            <a
              href={`/r/${data.restaurant_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              /r/{data.restaurant_slug}
            </a>
          </div>
        )}

        {data?.activation_url && (
          <Link
            href={data.activation_url}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Acessar meu painel
          </Link>
        )}
      </main>
    </div>
  )
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  )
}

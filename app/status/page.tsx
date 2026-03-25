'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { StatusPedido } from '@/components/status-pedido'

function StatusContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    steps?: Array<{ key: string; label: string; done: boolean; current: boolean }>
    plan?: string
    message?: string
    restaurant_slug?: string
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
        if (res.status === 401) {
          router.replace(`/login?redirect=${encodeURIComponent(`/status?checkout=${checkout}`)}`)
          return
        }
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Erro ao buscar status')
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar status')
      } finally {
        setLoading(false)
      }
    }

    void fetchStatus()
  }, [checkout, router])

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link href="/" className="text-primary font-medium hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    )
  }

  if (data?.plan === 'self-service') {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <p className="text-muted-foreground mb-4">{data.message}</p>
          <Link
            href="/painel"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold"
          >
            Acessar meu painel
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <Link
            href="/painel"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="text-foreground font-semibold">Acompanhar pedido</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-foreground mb-2 text-2xl font-bold">Status do seu canal digital</h1>
        <p className="text-muted-foreground mb-6">
          Acompanhe em que etapa está a produção do seu canal digital.
        </p>

        {data?.steps && data.steps.length > 0 ? (
          <StatusPedido steps={data.steps} />
        ) : (
          <p className="text-muted-foreground">Nenhum pedido encontrado.</p>
        )}

        {data?.restaurant_slug && (
          <div className="border-border bg-card mt-6 rounded-xl border p-4">
            <p className="text-muted-foreground mb-1 text-sm">Seu canal digital está em:</p>
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
        <Link
          href="/painel"
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold"
        >
          Acessar meu painel
        </Link>
      </main>
    </div>
  )
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <StatusContent />
    </Suspense>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Store,
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  Loader2,
  ExternalLink,
  BarChart3,
} from 'lucide-react'

interface AdminMetrics {
  restaurantes: {
    total: number
    ativos: number
    comPedido: number
    semPedido: number
  }
  pedidos: {
    hoje: number
    esteMes: number
    total: number
  }
  ticketMedio: number
  ativacao: {
    taxa: number
    comPrimeiroPedido: number
  }
  produtos: {
    total: number
    porRestaurante: number
  }
  templatesMaisUsados: { slug: string; count: number }[]
  restaurantesSemPedido: { id: string; nome: string; slug: string }[]
  restaurantesEmRisco: { id: string; nome: string; slug: string; dias_sem_pedido: number }[]
}

const TEMPLATE_LABELS: Record<string, string> = {
  restaurante: 'Restaurante',
  pizzaria: 'Pizzaria',
  lanchonete: 'Lanchonete',
  bar: 'Bar',
  cafeteria: 'Cafeteria',
  acai: 'Açaí',
  sushi: 'Sushi',
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      const { data: adminCheck } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!adminCheck) {
        router.push('/painel')
        return
      }

      setIsAdmin(true)

      try {
        const res = await fetch('/api/admin/metrics', { credentials: 'include' })
        if (!res.ok) {
          throw new Error(res.status === 401 ? 'Não autorizado' : 'Erro ao carregar métricas')
        }
        const data = await res.json()
        setMetrics(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar métricas')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin || !metrics) {
    return null
  }

  if (error) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="text-destructive mx-auto mb-4 h-12 w-12" />
          <p className="text-foreground font-medium">{error}</p>
          <Link href="/admin" className="text-primary mt-4 inline-block text-sm hover:underline">
            Voltar ao admin
          </Link>
        </div>
      </div>
    )
  }

  const {
    restaurantes,
    pedidos,
    ticketMedio,
    ativacao,
    produtos,
    templatesMaisUsados,
    restaurantesSemPedido,
    restaurantesEmRisco,
  } = metrics

  return (
    <div className="bg-background min-h-screen">
      <header className="border-border bg-card border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold">
              <BarChart3 className="h-6 w-6" />
              Admin – Cardápio Digital
            </h1>
            <p className="text-muted-foreground text-sm">Dashboard secreto de métricas</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Clientes
            </Link>
            <Link
              href="/admin/comissoes"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Comissões
            </Link>
            <Link
              href="/admin/equipe"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Equipe
            </Link>
            <Link
              href="/painel"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Voltar ao painel
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Cards principais */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-border bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Store className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{restaurantes.ativos}</p>
                <p className="text-muted-foreground text-sm">Restaurantes ativos</p>
              </div>
            </div>
          </div>

          <div className="border-border bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <ShoppingCart className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{pedidos.hoje}</p>
                <p className="text-muted-foreground text-sm">Pedidos hoje</p>
              </div>
            </div>
          </div>

          <div className="border-border bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">{pedidos.esteMes}</p>
                <p className="text-muted-foreground text-sm">Pedidos este mês</p>
              </div>
            </div>
          </div>

          <div className="border-border bg-card rounded-xl border p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2">
                <Package className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-foreground text-2xl font-bold">
                  R$ {ticketMedio.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-muted-foreground text-sm">Ticket médio</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ativação */}
        <div className="border-border bg-card mb-8 rounded-xl border p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">Ativação</h2>
          <div className="flex items-center gap-4">
            <div className="bg-muted h-4 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-primary progress-fill h-full rounded-full transition-all"
                data-progress={Math.min(Math.max(ativacao.taxa, 0), 100)}
                ref={(el) => {
                  if (el)
                    el.style.setProperty(
                      '--progress',
                      `${Math.min(Math.max(ativacao.taxa, 0), 100)}%`
                    )
                }}
              />
            </div>
            <span className="text-foreground shrink-0 font-medium">{ativacao.taxa}%</span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            {ativacao.comPrimeiroPedido} de {restaurantes.total} restaurantes receberam o primeiro
            pedido
          </p>
        </div>

        {/* Templates mais usados */}
        <div className="border-border bg-card mb-8 rounded-xl border p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">Templates mais usados</h2>
          <div className="flex flex-wrap gap-3">
            {templatesMaisUsados.map((t, i) => (
              <div
                key={t.slug}
                className="border-border flex items-center gap-2 rounded-lg border px-4 py-2"
              >
                <span className="text-muted-foreground text-sm">#{i + 1}</span>
                <span className="text-foreground font-medium">
                  {TEMPLATE_LABELS[t.slug] || t.slug}
                </span>
                <span className="text-muted-foreground text-sm">({t.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Restaurantes em risco */}
        <div className="border-border bg-card mb-8 rounded-xl border p-6">
          <h2 className="text-foreground mb-4 flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Restaurantes em risco (7+ dias sem pedido)
          </h2>
          {restaurantesEmRisco.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum restaurante em risco no momento.</p>
          ) : (
            <ul className="space-y-2">
              {restaurantesEmRisco.map((r) => (
                <li
                  key={r.id}
                  className="border-border flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <div>
                    <span className="text-foreground font-medium">{r.nome}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      ({r.dias_sem_pedido} dias)
                    </span>
                  </div>
                  <Link
                    href={`/r/${r.slug}`}
                    target="_blank"
                    className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
                  >
                    Ver cardápio
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Restaurantes sem pedido */}
        <div className="border-border bg-card rounded-xl border p-6">
          <h2 className="text-foreground mb-4 text-lg font-semibold">
            Restaurantes sem pedido (onboarding)
          </h2>
          {restaurantesSemPedido.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Todos os restaurantes ativos já receberam pelo menos um pedido.
            </p>
          ) : (
            <ul className="space-y-2">
              {restaurantesSemPedido.map((r) => (
                <li
                  key={r.id}
                  className="border-border flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <span className="text-foreground font-medium">{r.nome}</span>
                  <Link
                    href={`/r/${r.slug}`}
                    target="_blank"
                    className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
                  >
                    Ver cardápio
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

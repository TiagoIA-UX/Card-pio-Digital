'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart2, TrendingUp, ShoppingBag, DollarSign, Clock, Package } from 'lucide-react'
import type { AnalyticsResumo, ProdutoMaisVendido, PedidoPorHora } from '@/types/analytics'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string
  sublabel?: string
}

function StatCard({ icon: Icon, label, value, sublabel }: StatCardProps) {
  return (
    <div className="bg-card border-border rounded-xl border p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="bg-primary/10 rounded-lg p-2">
          <Icon className="text-primary h-5 w-5" />
        </div>
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
      </div>
      <p className="text-foreground text-2xl font-bold">{value}</p>
      {sublabel && <p className="text-muted-foreground mt-1 text-xs">{sublabel}</p>}
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function AnalyticsPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [resumo, setResumo] = useState<AnalyticsResumo | null>(null)
  const [produtos, setProdutos] = useState<ProdutoMaisVendido[]>([])
  const [pedidosPorHora, setPedidosPorHora] = useState<PedidoPorHora[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: rest } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!rest) return
      setRestaurantId(rest.id)

      const [{ data: analyticsData }, { data: produtosData }, { data: horasData }] =
        await Promise.all([
          supabase
            .from('vw_analytics_operador')
            .select('*')
            .eq('restaurant_id', rest.id)
            .maybeSingle(),
          supabase.rpc('fn_produtos_mais_vendidos', {
            p_restaurant_id: rest.id,
            p_dias: 30,
            p_limite: 10,
          }),
          supabase.rpc('fn_pedidos_por_hora', {
            p_restaurant_id: rest.id,
            p_dias: 7,
          }),
        ])

      if (analyticsData) setResumo(analyticsData as AnalyticsResumo)
      if (produtosData) setProdutos(produtosData as ProdutoMaisVendido[])
      if (horasData) setPedidosPorHora(horasData as PedidoPorHora[])
      setLoading(false)
    }

    loadData()
  }, [supabase])

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  const horasPico = pedidosPorHora.length > 0
    ? pedidosPorHora.reduce((max, h) => (h.total > max.total ? h : max), pedidosPorHora[0])
    : null

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <BarChart2 className="text-primary h-6 w-6" />
        <h1 className="text-foreground text-2xl font-bold">Analytics</h1>
      </div>

      {/* Cards de resumo */}
      <section className="mb-8">
        <h2 className="text-foreground mb-4 text-sm font-semibold uppercase tracking-wide">
          Resumo operacional
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <StatCard
            icon={ShoppingBag}
            label="Pedidos hoje"
            value={String(resumo?.pedidos_hoje ?? 0)}
          />
          <StatCard
            icon={DollarSign}
            label="Faturamento hoje"
            value={formatCurrency(resumo?.faturamento_hoje ?? 0)}
          />
          <StatCard
            icon={TrendingUp}
            label="Pedidos (30 dias)"
            value={String(resumo?.pedidos_30d ?? 0)}
          />
          <StatCard
            icon={DollarSign}
            label="Faturamento (30 dias)"
            value={formatCurrency(resumo?.faturamento_30d ?? 0)}
          />
          <StatCard
            icon={BarChart2}
            label="Ticket médio (30 dias)"
            value={formatCurrency(resumo?.ticket_medio_30d ?? 0)}
          />
          <StatCard
            icon={Clock}
            label="Pedidos pendentes"
            value={String(resumo?.pedidos_pendentes ?? 0)}
            sublabel="Aguardando confirmação"
          />
          {horasPico && (
            <StatCard
              icon={Clock}
              label="Horário de pico (7 dias)"
              value={`${horasPico.hora}h`}
              sublabel={`${horasPico.total} pedidos`}
            />
          )}
        </div>
      </section>

      {/* Produtos mais vendidos */}
      {produtos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-foreground mb-4 text-sm font-semibold uppercase tracking-wide">
            Produtos mais vendidos (30 dias)
          </h2>
          <div className="bg-card border-border overflow-hidden rounded-xl border">
            {produtos.map((produto, index) => {
              const maxVendido = produtos[0]?.total_vendido ?? 1
              const pct = Math.round((produto.total_vendido / maxVendido) * 100)
              return (
                <div
                  key={produto.produto_nome}
                  className="border-border flex items-center gap-4 border-b p-4 last:border-0"
                >
                  <span className="text-muted-foreground w-6 text-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate font-medium">{produto.produto_nome}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="bg-muted h-1.5 flex-1 rounded-full">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-foreground text-sm font-semibold">
                      {produto.total_vendido}x
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatCurrency(produto.receita_total)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Pedidos por hora */}
      {pedidosPorHora.length > 0 && (
        <section>
          <h2 className="text-foreground mb-4 text-sm font-semibold uppercase tracking-wide">
            Distribuição por hora (7 dias)
          </h2>
          <div className="bg-card border-border overflow-hidden rounded-xl border">
            <div className="flex items-end gap-1 p-6" style={{ height: '160px' }}>
              {Array.from({ length: 24 }, (_, hora) => {
                const dado = pedidosPorHora.find((h) => h.hora === hora)
                const maxTotal = Math.max(...pedidosPorHora.map((h) => h.total), 1)
                const altura = dado ? Math.round((dado.total / maxTotal) * 100) : 0
                return (
                  <div key={hora} className="group relative flex-1" title={`${hora}h: ${dado?.total ?? 0} pedidos`}>
                    <div
                      className="bg-primary/80 hover:bg-primary w-full rounded-t transition-all"
                      style={{ height: `${altura}%`, minHeight: altura > 0 ? '4px' : '0' }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="border-border flex justify-between border-t px-6 py-2 text-xs text-gray-400">
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
              <span>18h</span>
              <span>23h</span>
            </div>
          </div>
        </section>
      )}

      {!resumo && !loading && (
        <div className="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
          <Package className="mb-4 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">Nenhum dado disponível ainda</p>
          <p className="mt-1 text-sm">Os dados aparecerão conforme os pedidos forem sendo recebidos.</p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient, type Restaurant } from '@/lib/supabase/client'
import { getActiveRestaurantForUser } from '@/lib/active-restaurant'
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react'

interface DashboardMetrics {
  totalPedidos: number
  pedidosHoje: number
  pedidosSemana: number
  pedidosMes: number
  faturamentoHoje: number
  faturamentoSemana: number
  faturamentoMes: number
  faturamentoTotal: number
  ticketMedio: number
  produtosMaisVendidos: { nome: string; quantidade: number }[]
  pedidosPorDia: { data: string; quantidade: number; valor: number }[]
}

interface MetricsOrder {
  id: string
  total: number | null
  created_at: string
  status: string
}

interface MetricsOrderItem {
  product_name: string | null
  quantity: number | null
  order_id: string
}

export default function MetricasPage() {
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const rest = await getActiveRestaurantForUser<Restaurant>(supabase, user.id)
      if (!rest) {
        setLoading(false)
        return
      }

      setRestaurant(rest)

      // Datas de referência
      const now = new Date()
      const hoje = now.toISOString().split('T')[0]
      const seteDiasAtras = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const trintaDiasAtras = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

      try {
        // Buscar todos os pedidos do restaurante
        const { data: allOrders } = await supabase
          .from('orders')
          .select('id, total, created_at, status')
          .eq('restaurant_id', rest.id)
          .order('created_at', { ascending: false })

        const orders: MetricsOrder[] = allOrders || []

        // Filtrar pedidos por período
        const pedidosHoje = orders.filter((o) => o.created_at?.startsWith(hoje))
        const pedidosSemana = orders.filter((o) => new Date(o.created_at) >= new Date(seteDiasAtras))
        const pedidosMes = orders.filter((o) => new Date(o.created_at) >= new Date(trintaDiasAtras))

        // Calcular faturamentos
        const calcularFaturamento = (pedidos: typeof orders) =>
          pedidos.reduce((sum: number, o) => sum + Number(o.total || 0), 0)

        const faturamentoHoje = calcularFaturamento(pedidosHoje)
        const faturamentoSemana = calcularFaturamento(pedidosSemana)
        const faturamentoMes = calcularFaturamento(pedidosMes)
        const faturamentoTotal = calcularFaturamento(orders)

        // Ticket médio
        const ticketMedio = orders.length > 0 ? faturamentoTotal / orders.length : 0

        // Buscar itens dos pedidos para produtos mais vendidos
        const { data: allOrderItems } = await supabase
          .from('order_items')
          .select('product_name, quantity, order_id')
        const orderItems: MetricsOrderItem[] = allOrderItems || []

        // Agrupar por produto
        const produtosMap = new Map<string, number>()
        const orderIds = new Set(orders.map((o) => o.id))
        orderItems.forEach((item) => {
          if (orderIds.has(item.order_id)) {
            const nome = item.product_name || 'Produto'
            produtosMap.set(nome, (produtosMap.get(nome) || 0) + (item.quantity || 1))
          }
        })

        const produtosMaisVendidos = [...produtosMap.entries()]
          .map(([nome, quantidade]) => ({ nome, quantidade }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5)

        // Pedidos por dia (últimos 7 dias)
        const pedidosPorDia: { data: string; quantidade: number; valor: number }[] = []
        for (let i = 6; i >= 0; i--) {
          const data = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dataStr = data.toISOString().split('T')[0]
          const pedidosDia = orders.filter((o) => o.created_at?.startsWith(dataStr))
          pedidosPorDia.push({
            data: data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
            quantidade: pedidosDia.length,
            valor: calcularFaturamento(pedidosDia),
          })
        }

        setMetrics({
          totalPedidos: orders.length,
          pedidosHoje: pedidosHoje.length,
          pedidosSemana: pedidosSemana.length,
          pedidosMes: pedidosMes.length,
          faturamentoHoje,
          faturamentoSemana,
          faturamentoMes,
          faturamentoTotal,
          ticketMedio,
          produtosMaisVendidos,
          pedidosPorDia,
        })
      } catch (error) {
        console.error('Erro ao carregar métricas:', error)
        setMetrics({
          totalPedidos: 0,
          pedidosHoje: 0,
          pedidosSemana: 0,
          pedidosMes: 0,
          faturamentoHoje: 0,
          faturamentoSemana: 0,
          faturamentoMes: 0,
          faturamentoTotal: 0,
          ticketMedio: 0,
          produtosMaisVendidos: [],
          pedidosPorDia: [],
        })
      }

      setLoading(false)
    }

    void loadData()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Restaurante não encontrado</p>
      </div>
    )
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-foreground text-2xl font-bold">Métricas</h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho do seu delivery
        </p>
      </div>

      {/* Cards principais */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Pedidos Hoje"
          value={metrics?.pedidosHoje || 0}
          icon={<ShoppingBag className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Faturamento Hoje"
          value={formatCurrency(metrics?.faturamentoHoje || 0)}
          icon={<DollarSign className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(metrics?.ticketMedio || 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="orange"
        />
        <MetricCard
          title="Total de Pedidos"
          value={metrics?.totalPedidos || 0}
          icon={<BarChart3 className="h-5 w-5" />}
          color="purple"
        />
      </div>

      {/* Resumo por período */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-card border-border rounded-xl border p-6">
          <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            Resumo por Período
          </h2>
          <div className="space-y-4">
            <PeriodRow
              label="Últimos 7 dias"
              pedidos={metrics?.pedidosSemana || 0}
              faturamento={formatCurrency(metrics?.faturamentoSemana || 0)}
            />
            <PeriodRow
              label="Últimos 30 dias"
              pedidos={metrics?.pedidosMes || 0}
              faturamento={formatCurrency(metrics?.faturamentoMes || 0)}
            />
            <PeriodRow
              label="Todo o período"
              pedidos={metrics?.totalPedidos || 0}
              faturamento={formatCurrency(metrics?.faturamentoTotal || 0)}
              highlight
            />
          </div>
        </div>

        <div className="bg-card border-border rounded-xl border p-6">
          <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Produtos Mais Vendidos
          </h2>
          {metrics?.produtosMaisVendidos && metrics.produtosMaisVendidos.length > 0 ? (
            <div className="space-y-3">
              {metrics.produtosMaisVendidos.map((produto, index) => (
                <div
                  key={produto.nome}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-foreground font-medium">{produto.nome}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {produto.quantidade} vendidos
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum produto vendido ainda
            </p>
          )}
        </div>
      </div>

      {/* Gráfico de pedidos por dia */}
      <div className="bg-card border-border rounded-xl border p-6">
        <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
          <BarChart3 className="h-5 w-5 text-purple-500" />
          Pedidos nos Últimos 7 Dias
        </h2>
        {metrics?.pedidosPorDia && metrics.pedidosPorDia.length > 0 ? (
          <div className="flex items-end justify-between gap-2 h-48">
            {metrics.pedidosPorDia.map((dia) => {
              const maxQtd = Math.max(...metrics.pedidosPorDia.map((d) => d.quantidade), 1)
              const altura = (dia.quantidade / maxQtd) * 100
              return (
                <div key={dia.data} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-foreground text-sm font-semibold">
                    {dia.quantidade}
                  </span>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-orange-500 to-orange-400 transition-all"
                    style={{ height: `${Math.max(altura, 8)}%` }}
                  />
                  <span className="text-muted-foreground text-xs">{dia.data}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Nenhum dado disponível ainda
          </p>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'orange' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    orange: 'bg-orange-500/10 text-orange-600',
    purple: 'bg-purple-500/10 text-purple-600',
  }

  return (
    <div className="bg-card border-border rounded-xl border p-6">
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-3 ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="text-foreground text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  )
}

function PeriodRow({
  label,
  pedidos,
  faturamento,
  highlight,
}: {
  label: string
  pedidos: number
  faturamento: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg p-3 ${
        highlight ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-zinc-50 dark:bg-zinc-800/50'
      }`}
    >
      <span className={`font-medium ${highlight ? 'text-orange-700 dark:text-orange-400' : 'text-foreground'}`}>
        {label}
      </span>
      <div className="text-right">
        <p className={`font-bold ${highlight ? 'text-orange-700 dark:text-orange-400' : 'text-foreground'}`}>
          {faturamento}
        </p>
        <p className="text-muted-foreground text-xs">{pedidos} pedidos</p>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Package, ClipboardList, DollarSign, TrendingUp, ExternalLink, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface Stats {
  totalProdutos: number
  pedidosHoje: number
  pedidosPendentes: number
  faturamentoHoje: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalProdutos: 0, pedidosHoje: 0, pedidosPendentes: 0, faturamentoHoje: 0 })
  const [restaurant, setRestaurant] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [activationEvents, setActivationEvents] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Buscar restaurante
      const { data: rest } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (!rest) return
      setRestaurant(rest)

      // Buscar estatísticas
      const today = new Date().toISOString().split('T')[0]

      const [productsRes, ordersRes, pendingRes, recentRes, activationRes, anyOrderRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('restaurant_id', rest.id),
        supabase.from('orders').select('total').eq('restaurant_id', rest.id).gte('created_at', today),
        supabase.from('orders').select('id', { count: 'exact' }).eq('restaurant_id', rest.id).eq('status', 'pending'),
        supabase.from('orders').select('*').eq('restaurant_id', rest.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('activation_events').select('event_type').eq('restaurant_id', rest.id),
        supabase.from('orders').select('id', { count: 'exact' }).eq('restaurant_id', rest.id)
      ])

      const faturamento = ordersRes.data?.reduce((sum, o) => sum + Number(o.total), 0) || 0

      setStats({
        totalProdutos: productsRes.count || 0,
        pedidosHoje: ordersRes.data?.length || 0,
        pedidosPendentes: pendingRes.count || 0,
        faturamentoHoje: faturamento
      })

      setRecentOrders(recentRes.data || [])
      setActivationEvents((activationRes.data || []).map((e: any) => e.event_type as string))
      // anyOrderRes.count já é usado indiretamente no checklist
    }

    loadData()
  }, [])

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    confirmed: 'bg-blue-500/10 text-blue-600',
    preparing: 'bg-purple-500/10 text-purple-600',
    ready: 'bg-green-500/10 text-green-600',
    delivered: 'bg-gray-500/10 text-gray-600',
    cancelled: 'bg-red-500/10 text-red-600',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  }

  const steps = useMemo(() => {
    const createdRestaurant = !!restaurant
    const hasFiveProducts = stats.totalProdutos >= 5
    const hasAnyOrder = recentOrders.length > 0
    const hasFirstOrderEvent = activationEvents.includes('received_first_order')
    return [
      { key: 'created_restaurant', label: 'Criar restaurante', done: createdRestaurant },
      { key: 'added_products', label: 'Adicionar 5 produtos', done: hasFiveProducts },
      { key: 'test_order', label: 'Testar pedido', done: hasAnyOrder },
      { key: 'received_first_order', label: 'Receber 1 pedido real', done: hasFirstOrderEvent },
    ]
  }, [restaurant, stats.totalProdutos, recentOrders, activationEvents])

  const progressPercent = useMemo(() => {
    const total = steps.length
    const done = steps.filter(s => s.done).length
    return Math.round((done / total) * 100)
  }, [steps])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        {restaurant && (
          <Link 
            href={`/r/${restaurant.slug}`} 
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <ExternalLink className="h-4 w-4" />
            Ver Cardápio
          </Link>
        )}
      </div>

      {/* Activation Checklist */}
      <div className="mb-8 rounded-xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Ativação do seu cardápio</p>
            <p className="text-xs text-muted-foreground">Complete os passos para deixar tudo pronto em poucos minutos.</p>
          </div>
          <div className="text-sm font-medium text-primary">
            {progressPercent}% concluído
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary/60 mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {steps.map(step => (
            <div key={step.key} className="flex items-center gap-2 text-xs sm:text-sm">
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                  step.done ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {step.done ? <CheckCircle2 className="h-3 w-3" /> : ""}
              </span>
              <span className={step.done ? "line-through text-muted-foreground" : "text-foreground"}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produtos</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalProdutos}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-500/10">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pedidos Hoje</p>
              <p className="text-2xl font-bold text-foreground">{stats.pedidosHoje}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-foreground">{stats.pedidosPendentes}</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Faturamento Hoje</p>
              <p className="text-2xl font-bold text-foreground">
                R$ {stats.faturamentoHoje.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Pedidos Recentes</h2>
          <Link href="/painel/pedidos" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum pedido ainda</p>
            <p className="text-sm">Compartilhe seu cardápio para começar a receber pedidos!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map(order => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-secondary/50">
                <div>
                  <span className="font-medium text-foreground">Pedido #{order.numero_pedido}</span>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-foreground">
                    R$ {Number(order.total).toFixed(2).replace('.', ',')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Package,
  ClipboardList,
  DollarSign,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  Settings,
  QrCode,
  FlaskConical,
} from 'lucide-react'
import Link from 'next/link'
import { getPaymentModeBadgeLabel, isPublicSandboxMode } from '@/lib/payment-mode'

interface Stats {
  totalProdutos: number
  pedidosHoje: number
  pedidosPendentes: number
  faturamentoHoje: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProdutos: 0,
    pedidosHoje: 0,
    pedidosPendentes: 0,
    faturamentoHoje: 0,
  })
  const [restaurant, setRestaurant] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [activationEvents, setActivationEvents] = useState<string[]>([])
  const supabase = createClient()
  const isSandboxMode = isPublicSandboxMode()
  const paymentBadge = getPaymentModeBadgeLabel()

  useEffect(() => {
    const loadData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
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

      const [productsRes, ordersRes, pendingRes, recentRes, activationRes, anyOrderRes] =
        await Promise.all([
          supabase.from('products').select('id', { count: 'exact' }).eq('restaurant_id', rest.id),
          supabase
            .from('orders')
            .select('total')
            .eq('restaurant_id', rest.id)
            .gte('created_at', today),
          supabase
            .from('orders')
            .select('id', { count: 'exact' })
            .eq('restaurant_id', rest.id)
            .eq('status', 'pending'),
          supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', rest.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase.from('activation_events').select('event_type').eq('restaurant_id', rest.id),
          supabase.from('orders').select('id', { count: 'exact' }).eq('restaurant_id', rest.id),
        ])

      const faturamento =
        ordersRes.data?.reduce((sum: number, o: { total: number }) => sum + Number(o.total), 0) || 0

      setStats({
        totalProdutos: productsRes.count || 0,
        pedidosHoje: ordersRes.data?.length || 0,
        pedidosPendentes: pendingRes.count || 0,
        faturamentoHoje: faturamento,
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
    const done = steps.filter((s) => s.done).length
    return Math.round((done / total) * 100)
  }, [steps])

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        {restaurant && (
          <Link
            href={`/r/${restaurant.slug}`}
            target="_blank"
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2"
          >
            <ExternalLink className="h-4 w-4" />
            Ver Cardápio
          </Link>
        )}
      </div>

      {/* Activation Checklist */}
      <div className="bg-card border-border mb-8 rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm font-semibold">Ativação do seu cardápio</p>
            <p className="text-muted-foreground text-xs">
              Complete os passos para deixar tudo pronto em poucos minutos.
            </p>
          </div>
          <div className="text-primary text-sm font-medium">{progressPercent}% concluído</div>
        </div>
        <div className="bg-secondary/60 mb-3 h-2 w-full overflow-hidden rounded-full">
          <progress
            value={progressPercent}
            max={100}
            className="progress-bar progress-bar-primary h-full w-full overflow-hidden rounded-full"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {steps.map((step) => (
            <div key={step.key} className="flex items-center gap-2 text-xs sm:text-sm">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  step.done
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {step.done ? <CheckCircle2 className="h-3 w-3" /> : ''}
              </span>
              <span
                className={step.done ? 'text-muted-foreground line-through' : 'text-foreground'}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-card border-border rounded-xl border p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="text-primary h-5 w-5" />
            <h2 className="text-foreground font-semibold">Primeiros passos do dono</h2>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            O caminho mais simples para deixar o cardápio pronto e começar a receber pedidos sem
            depender de suporte técnico.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/painel/configuracoes"
              className="border-border hover:bg-secondary/40 rounded-xl border p-4 transition-colors"
            >
              <Settings className="text-primary mb-2 h-5 w-5" />
              <p className="text-foreground text-sm font-semibold">1. Ajuste sua vitrine</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Nome, banner, WhatsApp, Google Maps e textos de apresentação.
              </p>
            </Link>
            <Link
              href="/painel/produtos"
              className="border-border hover:bg-secondary/40 rounded-xl border p-4 transition-colors"
            >
              <Package className="text-primary mb-2 h-5 w-5" />
              <p className="text-foreground text-sm font-semibold">2. Cadastre produtos</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Organize categorias, fotos, preços e itens mais vendidos.
              </p>
            </Link>
            <Link
              href="/painel/qrcode"
              className="border-border hover:bg-secondary/40 rounded-xl border p-4 transition-colors"
            >
              <QrCode className="text-primary mb-2 h-5 w-5" />
              <p className="text-foreground text-sm font-semibold">3. Compartilhe e teste</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Gere QR das mesas, copie o link e faça um pedido de conferência.
              </p>
            </Link>
          </div>
        </div>

        {isSandboxMode ? (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
            <div className="mb-3 flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              <h2 className="font-semibold">{paymentBadge}</h2>
            </div>
            <p className="mb-3 text-sm text-amber-800">
              Os pagamentos deste ambiente devem ser testados com credenciais sandbox. Isso evita
              cobrança real enquanto voce configura o sistema.
            </p>
            <div className="space-y-2 text-sm text-amber-900">
              <p>Vendedor de teste: TESTUSER796097820704191816</p>
              <p>Comprador de teste: TESTUSER5736431075969203028</p>
              <p>
                Quando estiver pronto para vender, troque o ambiente para producao no arquivo de
                variaveis.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card border-border rounded-xl border p-5">
            <h2 className="text-foreground mb-2 font-semibold">Operacao publicada</h2>
            <p className="text-muted-foreground text-sm">
              Seu painel esta configurado para usar credenciais reais do Mercado Pago. Valide links,
              webhook e atendimento antes de divulgar o cardapio em massa.
            </p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card border-border rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Produtos</p>
              <p className="text-foreground text-2xl font-bold">{stats.totalProdutos}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border-border rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-500/10 p-3">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Pedidos Hoje</p>
              <p className="text-foreground text-2xl font-bold">{stats.pedidosHoje}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border-border rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-yellow-500/10 p-3">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Pendentes</p>
              <p className="text-foreground text-2xl font-bold">{stats.pedidosPendentes}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border-border rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 rounded-lg p-3">
              <DollarSign className="text-primary h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Faturamento Hoje</p>
              <p className="text-foreground text-2xl font-bold">
                R$ {stats.faturamentoHoje.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card border-border overflow-hidden rounded-xl border">
        <div className="border-border flex items-center justify-between border-b p-4">
          <h2 className="text-foreground font-semibold">Pedidos Recentes</h2>
          <Link href="/painel/pedidos" className="text-primary text-sm hover:underline">
            Ver todos
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center">
            <ClipboardList className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Nenhum pedido ainda</p>
            <p className="text-sm">Compartilhe seu cardápio para começar a receber pedidos!</p>
          </div>
        ) : (
          <div className="divide-border divide-y">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="hover:bg-secondary/50 flex items-center justify-between p-4"
              >
                <div>
                  <span className="text-foreground font-medium">
                    Pedido #{order.numero_pedido || order.numero}
                  </span>
                  <p className="text-muted-foreground text-sm">
                    {new Date(order.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-foreground font-semibold">
                    R$ {Number(order.total).toFixed(2).replace('.', ',')}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[order.status]}`}
                  >
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

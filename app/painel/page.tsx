'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient, type Restaurant } from '@/lib/supabase/client'
import {
  getActiveRestaurantContextForUser,
  getRestaurantDisplayName,
  getRestaurantScopedHref,
  getRestaurantUnitBadgeLabel,
} from '@/lib/active-restaurant'
import {
  Clock,
  Package,
  ClipboardList,
  DollarSign,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  Settings,
  QrCode,
  FlaskConical,
  MessageCircle,
} from 'lucide-react'
import Link from 'next/link'
import { getPaymentModeBadgeLabel, isPublicSandboxMode } from '@/lib/payment-mode'
import {
  getDashboardSetupChecklist,
  getDashboardSetupProgress,
  getNextDashboardSetupStep,
} from '@/lib/panel-setup'

interface Stats {
  totalProdutos: number
  pedidosHoje: number
  pedidosPendentes: number
  faturamentoHoje: number
}

interface RecentOrder {
  id: string
  numero_pedido?: string | null
  numero?: string | null
  created_at: string
  total: number | string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
}

interface ActivationEventRow {
  event_type: string
}

interface DashboardRestaurantContext {
  organizationRestaurants: Restaurant[]
  headquartersRestaurant: Restaurant | null
  isNetwork: boolean
}

const WHATSAPP_SUPPORT_LINK = 'https://api.whatsapp.com/send?phone=5512996887993'

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProdutos: 0,
    pedidosHoje: 0,
    pedidosPendentes: 0,
    faturamentoHoje: 0,
  })
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [restaurantContext, setRestaurantContext] = useState<DashboardRestaurantContext>({
    organizationRestaurants: [],
    headquartersRestaurant: null,
    isNetwork: false,
  })
  const [paymentPending, setPaymentPending] = useState(false)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [activationEvents, setActivationEvents] = useState<string[]>([])
  const supabase = useMemo(() => createClient(), [])
  const isSandboxMode = isPublicSandboxMode()
  const paymentBadge = getPaymentModeBadgeLabel()

  useEffect(() => {
    const loadData = async () => {
      // SEGURANÇA: getUser() valida o JWT com o servidor Supabase.
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const context = await getActiveRestaurantContextForUser<Restaurant>(supabase, user.id)
      const rest = context.activeRestaurant

      if (!rest) return

      setRestaurant(rest)
      setRestaurantContext({
        organizationRestaurants: context.organizationRestaurants,
        headquartersRestaurant: context.headquartersRestaurant,
        isNetwork: context.isNetwork,
      })

      if (rest.status_pagamento !== 'ativo') {
        setPaymentPending(true)
        return
      }

      setPaymentPending(false)

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

      setRecentOrders((recentRes.data || []) as RecentOrder[])
      setActivationEvents(
        ((activationRes.data || []) as ActivationEventRow[]).map((event) => event.event_type)
      )
      // anyOrderRes.count já é usado indiretamente no checklist
    }

    const timer = setTimeout(() => {
      void loadData()
    }, 0)

    return () => clearTimeout(timer)
  }, [supabase])

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

  const steps = useMemo(
    () =>
      getDashboardSetupChecklist({
        hasRestaurant: !!restaurant,
        totalProducts: stats.totalProdutos,
        recentOrdersCount: recentOrders.length,
        activationEvents,
      }),
    [restaurant, stats.totalProdutos, recentOrders.length, activationEvents]
  )

  const progressPercent = useMemo(() => getDashboardSetupProgress(steps), [steps])
  const nextStep = useMemo(() => getNextDashboardSetupStep(steps), [steps])

  const publicMenuHref = useMemo(() => {
    if (!restaurant) return '#'

    if (stats.totalProdutos === 0) {
      const templateSlug = restaurant.template_slug || 'restaurante'
      return `/templates/${templateSlug}`
    }

    return `/r/${restaurant.slug}`
  }, [restaurant, stats.totalProdutos])

  const publicMenuLabel = stats.totalProdutos === 0 ? 'Ver Modelo Pronto' : 'Ver Canal'
  const painelContextParam = restaurant?.id ? `?restaurant=${restaurant.id}` : ''
  const activeUnitLabel = getRestaurantDisplayName(restaurant)
  const headquartersLabel = getRestaurantDisplayName(restaurantContext.headquartersRestaurant)

  if (paymentPending) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center p-6">
        <div className="bg-card w-full rounded-2xl border border-yellow-500/20 p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
          <h1 className="text-foreground mb-3 text-2xl font-bold">Confirmando seu pagamento...</h1>
          <p className="text-muted-foreground mx-auto mb-6 max-w-xl text-sm leading-6">
            Seu delivery será ativado automaticamente assim que o pagamento for confirmado pelo
            Mercado Pago. Isso pode levar alguns minutos, mas pode demorar mais quando o pagamento
            entra em análise.
          </p>
          <a
            href={WHATSAPP_SUPPORT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-secondary hover:bg-secondary/80 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-medium transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Falar com suporte no WhatsApp
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {restaurantContext.isNetwork
              ? `Visão geral da unidade ${activeUnitLabel}`
              : 'Visão geral do seu negócio'}
          </p>
        </div>
        {restaurant && (
          <Link
            href={publicMenuHref}
            target="_blank"
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2"
          >
            <ExternalLink className="h-4 w-4" />
            {publicMenuLabel}
          </Link>
        )}
      </div>

      {restaurant && restaurantContext.organizationRestaurants.length > 1 && (
        <div className="bg-card border-border mb-6 rounded-xl border p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-foreground text-sm font-semibold">Rede e unidades</p>
              <p className="text-muted-foreground text-xs">
                {headquartersLabel ? `Matriz: ${headquartersLabel}. ` : ''}
                Troque a unidade ativa para navegar pelo painel preservando o contexto atual.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {restaurantContext.organizationRestaurants.map((unit) => {
                const isActive = unit.id === restaurant.id
                const unitLabel = getRestaurantDisplayName(unit)
                const unitBadge = getRestaurantUnitBadgeLabel(unit)

                return (
                  <Link
                    key={unit.id}
                    href={getRestaurantScopedHref('/painel', unit.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-orange-300 hover:text-orange-600'
                    }`}
                  >
                    {unitLabel} · {unitBadge}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Activation Checklist */}
      <div className="bg-card border-border mb-8 rounded-xl border p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-foreground text-sm font-semibold">Ativação do seu canal digital</p>
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
            <div key={step.key} className="flex items-start gap-2 text-xs sm:text-sm">
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  step.done
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {step.done ? <CheckCircle2 className="h-3 w-3" /> : ''}
              </span>
              <div>
                <p className={step.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
                  {step.label}
                </p>
                <p className="text-muted-foreground text-[11px] leading-5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {nextStep ? (
          <div className="border-border bg-secondary/20 mt-4 flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-foreground text-sm font-semibold">Próxima ação recomendada</p>
              <p className="text-muted-foreground text-sm">
                {nextStep.label}: {nextStep.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={getRestaurantScopedHref(nextStep.href, restaurant?.id)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium"
              >
                Abrir etapa atual
              </Link>
              <a
                href={`${WHATSAPP_SUPPORT_LINK}&text=${encodeURIComponent(`Olá, preciso de ajuda para concluir a etapa "${nextStep.label}" no meu painel.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border bg-background hover:bg-secondary rounded-lg border px-4 py-2 text-sm font-medium"
              >
                Pedir ajuda no WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className="border-border bg-primary/5 mt-4 rounded-xl border p-4">
            <p className="text-foreground text-sm font-semibold">Implantação concluída</p>
            <p className="text-muted-foreground text-sm">
              Seu delivery já passou pelos primeiros marcos. Agora o foco fica em operação,
              divulgação e repetição de pedidos.
            </p>
          </div>
        )}
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-card border-border rounded-xl border p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="text-primary h-5 w-5" />
            <h2 className="text-foreground font-semibold">Primeiros passos do dono</h2>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            O caminho mais simples para deixar o canal digital pronto e começar a receber pedidos
            sem depender de suporte técnico.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href={`/painel/editor${painelContextParam}`}
              className="border-border hover:bg-secondary/40 rounded-xl border p-4 transition-colors"
            >
              <Settings className="text-primary mb-2 h-5 w-5" />
              <p className="text-foreground text-sm font-semibold">1. Edite seu canal digital</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Editor visual em tempo real. Nome, logo, banner e preview ao vivo.
              </p>
            </Link>
            <Link
              href={`/painel/produtos${painelContextParam}`}
              className="border-border hover:bg-secondary/40 rounded-xl border p-4 transition-colors"
            >
              <Package className="text-primary mb-2 h-5 w-5" />
              <p className="text-foreground text-sm font-semibold">2. Cadastre produtos</p>
              <p className="text-muted-foreground mt-1 text-xs">
                Organize categorias, fotos, preços e itens mais vendidos.
              </p>
            </Link>
            <Link
              href={`/painel/qrcode${painelContextParam}`}
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
              <p>
                Consulte as credenciais de teste na documentação interna ou no painel do Mercado
                Pago.
              </p>
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
          <Link
            href={`/painel/pedidos${painelContextParam}`}
            className="text-primary text-sm hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-muted-foreground p-8 text-center">
            <ClipboardList className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Nenhum pedido ainda</p>
            <p className="text-sm">Compartilhe seu canal digital para começar a receber pedidos!</p>
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

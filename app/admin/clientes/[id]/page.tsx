'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Save,
  Ban,
  CheckCircle,
  RefreshCw,
  Store,
  User,
  Phone,
  Calendar,
  CreditCard,
  Edit,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react'

interface Restaurant {
  id: string
  nome: string
  slug: string
  telefone: string
  logo_url: string | null
  ativo: boolean
  suspended: boolean
  suspended_reason: string | null
  suspended_at: string | null
  plan_slug: string
  cor_primaria: string
  cor_secundaria: string
  created_at: string
  user_id: string
}

interface Subscription {
  id: string
  status: string
  mp_subscription_status: string
  current_period_start: string
  current_period_end: string
  last_payment_date: string | null
  next_payment_date: string | null
  failed_payments: number
}

const TEMPLATES = [
  { slug: 'restaurante', name: 'Restaurante' },
  { slug: 'pizzaria', name: 'Pizzaria' },
  { slug: 'lanchonete', name: 'Lanchonete' },
  { slug: 'bar', name: 'Bar' },
  { slug: 'cafeteria', name: 'Cafeteria' },
  { slug: 'acai', name: 'Açaíteria' },
  { slug: 'sushi', name: 'Sushi' },
]

const PLANS = [
  { slug: 'basico', name: 'Básico', price: 49 },
  { slug: 'pro', name: 'Profissional', price: 99 },
  { slug: 'premium', name: 'Premium', price: 199 },
]

export default function ClienteDetailPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useParams()
  const restaurantId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [productsCount, setProductsCount] = useState(0)
  const [ordersCount, setOrdersCount] = useState(0)

  // Form state
  const [selectedPlan, setSelectedPlan] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadData = useCallback(async () => {
    // Verificar admin
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
      .single()

    if (!adminCheck) {
      router.push('/painel')
      return
    }

    // Carregar restaurante
    const { data: restaurantData } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()

    if (restaurantData) {
      setRestaurant(restaurantData as Restaurant)
      setSelectedPlan(restaurantData.plan_slug || 'basico')
    }

    // Carregar assinatura
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subData) {
      setSubscription(subData as Subscription)
    }

    // Contar produtos
    const { count: prodCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)

    setProductsCount(prodCount || 0)

    // Contar pedidos
    const { count: ordCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)

    setOrdersCount(ordCount || 0)

    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSuspend = async () => {
    if (!restaurant) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase.rpc('suspend_restaurant_for_nonpayment', {
      p_restaurant_id: restaurant.id,
    })

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao suspender: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Restaurante suspenso com sucesso' })
      await loadData()
    }
    setSaving(false)
  }

  const handleReactivate = async () => {
    if (!restaurant) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase.rpc('reactivate_restaurant', {
      p_restaurant_id: restaurant.id,
    })

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao reativar: ' + error.message })
    } else {
      setMessage({ type: 'success', text: 'Restaurante reativado com sucesso' })
      await loadData()
    }
    setSaving(false)
  }

  const handleChangePlan = async () => {
    if (!restaurant || selectedPlan === restaurant.plan_slug) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('restaurants')
      .update({ plan_slug: selectedPlan })
      .eq('id', restaurant.id)

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao alterar plano: ' + error.message })
    } else {
      // Registrar ação admin
      const {
        data: { session },
      } = await supabase.auth.getSession()
      await supabase.from('admin_actions').insert({
        admin_id: session?.user.id,
        action_type: 'change_plan',
        target_restaurant_id: restaurant.id,
        details: { from: restaurant.plan_slug, to: selectedPlan },
      })

      setMessage({ type: 'success', text: 'Plano alterado com sucesso' })
      await loadData()
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Delivery não encontrado</p>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:bg-secondary rounded-lg p-2">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-foreground text-xl font-bold">{restaurant.nome}</h1>
              <p className="text-muted-foreground text-sm">/{restaurant.slug}</p>
            </div>
            <Link
              href={`/r/${restaurant.slug}`}
              target="_blank"
              className="bg-secondary hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            >
              Ver Canal
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        {/* Message */}
        {message && (
          <div
            className={`rounded-lg p-4 ${
              message.type === 'success'
                ? 'border border-green-500/40 bg-green-500/10 text-green-700'
                : 'border border-red-500/40 bg-red-500/10 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Status Card */}
        <div
          className={`rounded-xl border p-6 ${
            restaurant.suspended ? 'border-red-500/40 bg-red-500/5' : 'bg-card'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {restaurant.suspended ? (
                <>
                  <div className="rounded-full bg-red-500/10 p-3">
                    <Ban className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-600">Restaurante Suspenso</p>
                    <p className="text-muted-foreground text-sm">
                      {restaurant.suspended_reason || 'Inadimplência'}
                    </p>
                    {restaurant.suspended_at && (
                      <p className="text-muted-foreground text-xs">
                        Desde {new Date(restaurant.suspended_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-green-500/10 p-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-600">Restaurante Ativo</p>
                    <p className="text-muted-foreground text-sm">Funcionando normalmente</p>
                  </div>
                </>
              )}
            </div>

            {restaurant.suspended ? (
              <button
                onClick={handleReactivate}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Reativar
              </button>
            ) : (
              <button
                onClick={handleSuspend}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4" />
                )}
                Suspender
              </button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Dados do Restaurante */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
              <Store className="text-primary h-5 w-5" />
              Dados do Restaurante
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="font-medium">{restaurant.nome}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Slug</dt>
                <dd className="font-medium">/{restaurant.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Telefone</dt>
                <dd className="font-medium">{restaurant.telefone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Produtos</dt>
                <dd className="font-medium">{productsCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pedidos</dt>
                <dd className="font-medium">{ordersCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Criado em</dt>
                <dd className="font-medium">
                  {new Date(restaurant.created_at).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Assinatura */}
          <div className="bg-card rounded-xl border p-6">
            <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
              <CreditCard className="text-primary h-5 w-5" />
              Assinatura
            </h2>
            {subscription ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd
                    className={`font-medium ${
                      subscription.status === 'active'
                        ? 'text-green-500'
                        : subscription.status === 'past_due'
                          ? 'text-red-500'
                          : 'text-yellow-500'
                    }`}
                  >
                    {subscription.status.toUpperCase()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status MP</dt>
                  <dd className="font-medium">{subscription.mp_subscription_status || '-'}</dd>
                </div>
                {subscription.last_payment_date && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Último Pagamento</dt>
                    <dd className="font-medium">
                      {new Date(subscription.last_payment_date).toLocaleDateString('pt-BR')}
                    </dd>
                  </div>
                )}
                {subscription.next_payment_date && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Próximo Pagamento</dt>
                    <dd className="font-medium">
                      {new Date(subscription.next_payment_date).toLocaleDateString('pt-BR')}
                    </dd>
                  </div>
                )}
                {subscription.failed_payments > 0 && (
                  <div className="flex justify-between text-red-500">
                    <dt>Pagamentos Falhos</dt>
                    <dd className="font-medium">{subscription.failed_payments}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma assinatura encontrada</p>
            )}
          </div>
        </div>

        {/* Alterar Plano */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-foreground mb-4 font-semibold">Alterar Plano</h2>
          <div className="flex items-center gap-4">
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="bg-background flex-1 rounded-lg border px-4 py-2"
              aria-label="Selecionar plano"
            >
              {PLANS.map((plan) => (
                <option key={plan.slug} value={plan.slug}>
                  {plan.name} - R$ {plan.price}/mês
                </option>
              ))}
            </select>
            <button
              onClick={handleChangePlan}
              disabled={saving || selectedPlan === restaurant.plan_slug}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </button>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Plano atual:{' '}
            <span className="font-medium uppercase">{restaurant.plan_slug || 'basico'}</span>
          </p>
        </div>

        {/* Ações Rápidas */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-foreground mb-4 font-semibold">Ações Rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/painel/produtos?admin_view=${restaurant.id}`}
              className="bg-secondary hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            >
              <Edit className="h-4 w-4" />
              Editar Produtos
            </Link>
            <Link
              href={`/painel/pedidos?admin_view=${restaurant.id}`}
              className="bg-secondary hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            >
              Ver Pedidos
            </Link>
            <Link
              href={`/painel/configuracoes?admin_view=${restaurant.id}`}
              className="bg-secondary hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
            >
              Configurações
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Package,
  Download,
  ExternalLink,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Settings,
  Unlock,
  Store,
  ShoppingBag,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { OrderListSkeleton } from '@/components/shared/loading-skeleton'

interface Purchase {
  id: string
  templateId: string
  templateName: string
  templateSlug: string
  templateImage: string
  status: string
  paymentStatus?: string | null
  orderStatus?: string | null
  purchasedAt?: string
  licenseKey?: string
  restaurantId?: string
  restaurantSlug?: string
  restaurantNome?: string
}

interface UserPurchaseRow {
  id: string
  template_id: string
  order_id?: string | null
  status: string
  purchased_at: string
  license_key?: string | null
}

interface OrderRow {
  id: string
  status?: string | null
  payment_status?: string | null
  metadata?: {
    provisioned_restaurant_id?: string | null
    provisioned_restaurant_slug?: string | null
  } | null
}

interface RestaurantRow {
  id: string
  slug: string
  nome: string
  template_slug?: string | null
}

interface TemplateRow {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

export default function MeusTemplatesPage() {
  const showDevUnlock =
    process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ALLOW_DEV_UNLOCK === 'true'
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [hasRestaurant, setHasRestaurant] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockMessage, setUnlockMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const supabase = createClient()

  const resolvePurchaseStatus = useCallback((purchaseStatus: string, order?: OrderRow) => {
    const paymentStatus = order?.payment_status?.toLowerCase() || null
    const orderStatus = order?.status?.toLowerCase() || null

    if (paymentStatus === 'approved') return 'active'

    if (
      paymentStatus === 'pending' ||
      paymentStatus === 'in_process' ||
      paymentStatus === 'in_mediation' ||
      orderStatus === 'pending'
    ) {
      return 'awaiting_payment'
    }

    if (
      paymentStatus === 'rejected' ||
      paymentStatus === 'cancelled' ||
      paymentStatus === 'refunded' ||
      paymentStatus === 'charged_back'
    ) {
      return 'payment_failed'
    }

    return purchaseStatus
  }, [])

  const loadPurchases = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // Usar router em vez de window.location para consistência
      // O middleware já protege esta rota, mas mantemos por segurança
      return
    }

    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, slug, nome, template_slug')
      .eq('user_id', session.user.id)

    setHasRestaurant(!!(restaurants && restaurants.length > 0))

    const { data: purchaseRows, error: purchasesError } = await supabase
      .from('user_purchases')
      .select('id, template_id, order_id, status, purchased_at, license_key')
      .eq('user_id', session.user.id)
      .order('purchased_at', { ascending: false })

    if (purchasesError) {
      console.error('Erro ao carregar user_purchases:', purchasesError)
      setPurchases([])
      setLoading(false)
      return
    }

    const typedPurchaseRows = (purchaseRows || []) as UserPurchaseRow[]
    const orderIds = [
      ...new Set(typedPurchaseRows.map((purchase) => purchase.order_id).filter(Boolean)),
    ] as string[]

    const { data: templateRows, error: templatesError } = await supabase
      .from('templates')
      .select('id, name, slug, image_url')
      .order('name', { ascending: true })

    if (templatesError) {
      console.error('Erro ao carregar templates das compras:', templatesError)
    }

    const templatesById = new Map(
      ((templateRows || []) as TemplateRow[]).map((template) => [template.id, template])
    )
    const latestPurchaseByTemplateId = new Map<string, UserPurchaseRow>()
    for (const purchase of typedPurchaseRows) {
      if (!latestPurchaseByTemplateId.has(purchase.template_id)) {
        latestPurchaseByTemplateId.set(purchase.template_id, purchase)
      }
    }
    const typedRestaurants = (restaurants || []) as RestaurantRow[]

    let ordersById = new Map<string, OrderRow>()
    if (orderIds.length > 0) {
      const { data: orderRows, error: ordersError } = await supabase
        .from('template_orders')
        .select('id, status, payment_status, metadata')
        .in('id', orderIds)

      if (ordersError) {
        console.error('Erro ao carregar pedidos das compras:', ordersError)
      } else {
        ordersById = new Map(((orderRows || []) as OrderRow[]).map((order) => [order.id, order]))
      }
    }

    const resolvedPurchases = ((templateRows || []) as TemplateRow[]).map((template) => {
      const purchase = latestPurchaseByTemplateId.get(template.id)
      const tSlug = template.slug || ''
      const order = purchase?.order_id ? ordersById.get(purchase.order_id) : undefined
      const provisionedRestaurantId = order?.metadata?.provisioned_restaurant_id || null
      const provisionedRestaurantSlug = order?.metadata?.provisioned_restaurant_slug || null
      const exactRestaurant = provisionedRestaurantId
        ? typedRestaurants.find((restaurant) => restaurant.id === provisionedRestaurantId)
        : provisionedRestaurantSlug
          ? typedRestaurants.find((restaurant) => restaurant.slug === provisionedRestaurantSlug)
          : null
      const templateRestaurants = typedRestaurants.filter(
        (restaurant) => restaurant.template_slug === tSlug
      )
      const fallbackRestaurant =
        !exactRestaurant && purchase && !purchase.order_id && templateRestaurants.length === 1
          ? templateRestaurants[0]
          : null
      const linkedRestaurant = exactRestaurant || fallbackRestaurant
      const hasLegacyActivation = Boolean(
        purchase && !purchase.order_id && (linkedRestaurant || purchase.license_key)
      )
      const isDevUnlockedWithoutRealPurchase = Boolean(
        purchase && !purchase.order_id && !hasLegacyActivation
      )
      const resolvedStatus = !purchase
        ? 'available'
        : isDevUnlockedWithoutRealPurchase
          ? 'available'
          : hasLegacyActivation
            ? 'active'
            : resolvePurchaseStatus(purchase.status, order)

      return {
        id: purchase?.id || `template-${template.id}`,
        templateId: template.id,
        templateName: template.name || 'Template',
        templateSlug: tSlug,
        templateImage: template.image_url || '',
        status: resolvedStatus,
        paymentStatus: order?.payment_status || null,
        orderStatus: order?.status || null,
        purchasedAt: purchase?.purchased_at,
        licenseKey: purchase?.license_key || undefined,
        restaurantId: linkedRestaurant?.id,
        restaurantSlug: linkedRestaurant?.slug || provisionedRestaurantSlug || undefined,
        restaurantNome: linkedRestaurant?.nome,
      }
    })

    setPurchases(resolvedPurchases)

    setLoading(false)
  }, [resolvePurchaseStatus, supabase])

  useEffect(() => {
    void loadPurchases()
  }, [loadPurchases])

  const handleUnlockAllTemplates = async () => {
    setUnlocking(true)
    setUnlockMessage(null)
    try {
      const res = await fetch('/api/dev/unlock-all-templates', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setUnlockMessage({ type: 'error', text: data.error || 'Erro ao desbloquear.' })
        return
      }
      setUnlockMessage({
        type: 'success',
        text: data.message || `${data.count} templates liberados!`,
      })
      await loadPurchases()
    } finally {
      setUnlocking(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
            <CheckCircle className="h-3 w-3" />
            Ativo
          </span>
        )
      case 'pending':
      case 'awaiting_payment':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600">
            <Clock className="h-3 w-3" />
            Aguardando pagamento
          </span>
        )
      case 'payment_failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600">
            <AlertCircle className="h-3 w-3" />
            Pagamento não aprovado
          </span>
        )
      case 'available':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-600">
            <ShoppingBag className="h-3 w-3" />
            Não comprado
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-600">
            <AlertCircle className="h-3 w-3" />
            {status}
          </span>
        )
    }
  }

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={hasRestaurant ? '/painel' : '/'}
              className="text-muted-foreground hover:bg-accent rounded-lg p-2 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-foreground font-semibold">Meus Cardápios</h1>
              <p className="text-muted-foreground text-sm">Cardápios que você adquiriu</p>
            </div>
          </div>
          {showDevUnlock ? (
            <button
              onClick={handleUnlockAllTemplates}
              disabled={unlocking}
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 inline-flex items-center gap-2 self-start rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 sm:self-center"
            >
              {unlocking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              {unlocking ? 'Liberando...' : 'Liberar todos os templates'}
            </button>
          ) : null}
        </div>
        {showDevUnlock && unlockMessage && (
          <div
            className={`mx-auto max-w-4xl px-4 pb-3 text-sm ${unlockMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}
          >
            {unlockMessage.text}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <OrderListSkeleton count={3} />
        ) : purchases.length === 0 ? (
          <EmptyState
            variant="orders"
            title="Você ainda não tem templates"
            description="Os templates que você comprar aparecerão aqui"
            action={{
              label: 'Ver Templates',
              href: '/templates',
            }}
          />
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-card border-border hover:border-primary/30 rounded-2xl border p-5 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Imagem */}
                  <div className="bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    {purchase.templateImage && (
                      <Image
                        src={purchase.templateImage}
                        alt={purchase.templateName}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-foreground font-semibold">{purchase.templateName}</h3>
                        {purchase.purchasedAt ? (
                          <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(purchase.purchasedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        ) : (
                          <p className="text-muted-foreground mt-1 text-sm">
                            Disponível para compra
                          </p>
                        )}
                      </div>
                      {getStatusBadge(purchase.status)}
                    </div>

                    {/* Actions */}
                    {purchase.status === 'active' ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {purchase.restaurantId ? (
                          <>
                            <Link
                              href={`/painel?restaurant=${purchase.restaurantId}`}
                              onClick={() => {
                                if (purchase.restaurantId) {
                                  localStorage.setItem(
                                    'active_restaurant_id',
                                    purchase.restaurantId
                                  )
                                }
                              }}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Acessar Painel
                            </Link>
                            {purchase.restaurantSlug && (
                              <Link
                                href={`/r/${purchase.restaurantSlug}`}
                                target="_blank"
                                className="bg-secondary text-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                              >
                                <Store className="h-4 w-4" />
                                Ver Cardápio
                              </Link>
                            )}
                          </>
                        ) : (
                          <Link
                            href={`/painel/criar-restaurante?template=${purchase.templateSlug}`}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            Configurar Meu Cardápio
                          </Link>
                        )}
                        {purchase.licenseKey && (
                          <button
                            onClick={() => navigator.clipboard.writeText(purchase.licenseKey!)}
                            className="bg-secondary text-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                          >
                            <Package className="h-4 w-4" />
                            Copiar Licença
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link
                          href={`/comprar/${purchase.templateSlug}`}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          {purchase.status === 'awaiting_payment'
                            ? 'Comprar novamente'
                            : 'Comprar agora'}
                        </Link>
                        <p className="text-muted-foreground text-sm">
                          O cardápio só é liberado após a aprovação do pagamento.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export interface TemplateCatalogEntry {
  slug: string
  name: string
  imageUrl?: string | null
}

export interface TemplateRow {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

export interface UserPurchaseRow {
  id: string
  template_id: string
  order_id?: string | null
  status: string
  purchased_at: string
  license_key?: string | null
}

export interface OrderRow {
  id: string
  status?: string | null
  payment_status?: string | null
  metadata?: {
    provisioned_restaurant_id?: string | null
    provisioned_restaurant_slug?: string | null
    template_slug?: string | null
  } | null
}

export interface RestaurantRow {
  id: string
  slug: string
  nome: string
  template_slug?: string | null
}

export interface ActivationEventRow {
  restaurant_id: string
  details?: {
    order_id?: string | null
  } | null
}

export interface VisibleTemplatePurchase {
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
  orderId?: string
  restaurantId?: string
  restaurantSlug?: string
  restaurantNome?: string
  linkResolution: 'linked' | 'setup_required' | 'unresolved' | 'available'
}

export function resolveTemplatePurchaseStatus(purchaseStatus: string, order?: OrderRow) {
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
}

export function buildVisibleTemplatePurchases({
  purchaseRows,
  templateRows,
  restaurants,
  activationEvents,
  orders,
  catalog,
}: {
  purchaseRows: UserPurchaseRow[]
  templateRows: TemplateRow[]
  restaurants: RestaurantRow[]
  activationEvents: ActivationEventRow[]
  orders: OrderRow[]
  catalog: TemplateCatalogEntry[]
}): VisibleTemplatePurchase[] {
  const templatesById = new Map(templateRows.map((template) => [template.id, template]))
  const catalogBySlug = new Map(catalog.map((template) => [template.slug, template]))
  const ordersById = new Map(orders.map((order) => [order.id, order]))
  const activationEventsByOrderId = new Map(
    activationEvents
      .map((event) => [event.details?.order_id || '', event.restaurant_id] as const)
      .filter(([orderId, restaurantId]) => Boolean(orderId && restaurantId))
  )
  const seenTemplateSlugs = new Set<string>()
  const visiblePurchases: VisibleTemplatePurchase[] = []

  for (const purchase of purchaseRows) {
    const templateFromDb = templatesById.get(purchase.template_id)
    const templateSlug =
      templateFromDb?.slug ||
      ordersById.get(purchase.order_id || '')?.metadata?.template_slug ||
      null

    if (!templateSlug || seenTemplateSlugs.has(templateSlug)) {
      continue
    }

    seenTemplateSlugs.add(templateSlug)

    const templateFromCatalog = catalogBySlug.get(templateSlug)
    const order = purchase.order_id ? ordersById.get(purchase.order_id) : undefined
    const provisionedRestaurantId =
      order?.metadata?.provisioned_restaurant_id ||
      (purchase.order_id ? activationEventsByOrderId.get(purchase.order_id) : null) ||
      null
    const provisionedRestaurantSlug = order?.metadata?.provisioned_restaurant_slug || null
    const exactRestaurant = provisionedRestaurantId
      ? restaurants.find((restaurant) => restaurant.id === provisionedRestaurantId)
      : provisionedRestaurantSlug
        ? restaurants.find((restaurant) => restaurant.slug === provisionedRestaurantSlug)
        : null
    const templateRestaurants = restaurants.filter(
      (restaurant) => restaurant.template_slug === templateSlug
    )
    const fallbackRestaurant =
      !exactRestaurant && !purchase.order_id && templateRestaurants.length === 1
        ? templateRestaurants[0]
        : null
    const linkedRestaurant = exactRestaurant || fallbackRestaurant
    const hasLegacyActivation = Boolean(purchase.license_key && !purchase.order_id)
    const resolvedStatus = hasLegacyActivation
      ? 'active'
      : resolveTemplatePurchaseStatus(purchase.status, order)
    const linkResolution: VisibleTemplatePurchase['linkResolution'] = linkedRestaurant
      ? 'linked'
      : purchase.order_id && resolvedStatus === 'active'
        ? 'unresolved'
        : resolvedStatus === 'active'
          ? 'setup_required'
          : 'available'

    visiblePurchases.push({
      id: purchase.id,
      templateId: templateFromDb?.id || purchase.template_id,
      templateName: templateFromDb?.name || templateFromCatalog?.name || 'Template',
      templateSlug,
      templateImage: templateFromDb?.image_url || templateFromCatalog?.imageUrl || '',
      status: resolvedStatus,
      paymentStatus: order?.payment_status || null,
      orderStatus: order?.status || null,
      purchasedAt: purchase.purchased_at,
      licenseKey: purchase.license_key || undefined,
      orderId: purchase.order_id || undefined,
      restaurantId: linkedRestaurant?.id,
      restaurantSlug: linkedRestaurant?.slug || provisionedRestaurantSlug || undefined,
      restaurantNome: linkedRestaurant?.nome,
      linkResolution,
    })
  }

  return visiblePurchases
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { getRestaurantAiAssistantSettings } from '@/lib/domains/core/restaurant-customization'
import { isTerminalEnabled, resolveDeliveryMode } from '@/lib/domains/core/delivery-mode'

export async function POST(req: NextRequest) {
  const isDebugEnabled =
    process.env.NODE_ENV === 'development' ||
    process.env.ENABLE_DEBUG_ENDPOINTS === 'true'

  if (!isDebugEnabled) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  const admin = await requireAdmin(req, 'admin')
  if (!admin) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const context = body?.context || {}

  if (!context.restaurantId && !context.restaurantSlug) {
    return NextResponse.json({ error: 'Informe restaurantId ou restaurantSlug.' }, { status: 400 })
  }

  const db = createAdminClient()
  const query = db
    .from('restaurants')
    .select('id, slug, nome, ativo, status_pagamento, suspended, customizacao, delivery_mode')

  const restaurantResult = context.restaurantId
    ? await query.eq('id', context.restaurantId).maybeSingle()
    : await query.eq('slug', context.restaurantSlug || '').maybeSingle()

  const restaurant = restaurantResult.data
  const aiSettings = restaurant ? getRestaurantAiAssistantSettings(restaurant.customizacao) : null
  const deliveryMode = restaurant
    ? resolveDeliveryMode(restaurant.delivery_mode, restaurant.customizacao)
    : null

  return NextResponse.json({
    requested: context,
    found: !!restaurant,
    restaurant,
    queryError: restaurantResult.error?.message ?? null,
    aiSettings,
    deliveryMode,
    terminalEnabled: deliveryMode ? isTerminalEnabled(deliveryMode) : null,
    active: restaurant
      ? restaurant.ativo !== false &&
        restaurant.status_pagamento === 'ativo' &&
        !restaurant.suspended
      : null,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'

export async function GET(req: NextRequest) {
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

  const url = new URL(req.url)
  const restaurantId = url.searchParams.get('restaurantId')
  const restaurantSlug = url.searchParams.get('restaurantSlug')

  if (!restaurantId && !restaurantSlug) {
    return NextResponse.json({ error: 'Informe restaurantId ou restaurantSlug.' }, { status: 400 })
  }

  const db = createAdminClient()
  const query = db
    .from('restaurants')
    .select('id, slug, nome, ativo, status_pagamento, delivery_mode, customizacao')

  const result = restaurantId
    ? await query.eq('id', restaurantId).maybeSingle()
    : await query.eq('slug', restaurantSlug || '').maybeSingle()

  return NextResponse.json({
    requested: {
      restaurantId,
      restaurantSlug,
    },
    found: !!result.data,
    data: result.data ?? null,
    error: result.error ? { message: result.error.message } : null,
  })
}

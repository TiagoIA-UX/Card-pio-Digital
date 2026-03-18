import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getRateLimitIdentifier, withRateLimit } from '@/lib/rate-limit'

function getMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, unknown>
  }

  return value as Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const checkout = request.nextUrl.searchParams.get('checkout')?.trim()

  if (!checkout) {
    return NextResponse.json({ error: 'Checkout não informado' }, { status: 400 })
  }

  const rateLimit = await withRateLimit(getRateLimitIdentifier(request), {
    limit: 20,
    windowMs: 60000,
  })
  if (rateLimit.limited) {
    return rateLimit.response
  }

  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Faça login para consultar este pedido' },
      { status: 401, headers: rateLimit.headers }
    )
  }

  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from('template_orders')
    .select('user_id, order_number, status, payment_status, metadata, updated_at')
    .eq('order_number', checkout)
    .single()

  if (error || !order) {
    return NextResponse.json(
      { error: 'Checkout não encontrado' },
      { status: 404, headers: rateLimit.headers }
    )
  }

  if (!order.user_id || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: rateLimit.headers })
  }

  const metadata = getMetadata(order.metadata)

  if (metadata.checkout_type !== 'restaurant_onboarding') {
    return NextResponse.json({ error: 'Checkout inválido para onboarding' }, { status: 400 })
  }

  return NextResponse.json(
    {
      checkout: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      plan_slug: metadata.plan_slug ?? null,
      onboarding_status: metadata.onboarding_status ?? 'awaiting_payment',
      restaurant_slug: metadata.provisioned_restaurant_slug ?? null,
      restaurant_id: metadata.provisioned_restaurant_id ?? null,
      updated_at: order.updated_at,
    },
    { headers: rateLimit.headers }
  )
}

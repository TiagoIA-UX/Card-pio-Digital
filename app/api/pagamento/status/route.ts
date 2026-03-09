import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from('template_orders')
    .select('order_number, status, payment_status, metadata, updated_at')
    .eq('order_number', checkout)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Checkout não encontrado' }, { status: 404 })
  }

  const metadata = getMetadata(order.metadata)

  if (metadata.checkout_type !== 'restaurant_onboarding') {
    return NextResponse.json({ error: 'Checkout inválido para onboarding' }, { status: 400 })
  }

  return NextResponse.json({
    checkout: order.order_number,
    status: order.status,
    payment_status: order.payment_status,
    onboarding_status: metadata.onboarding_status ?? 'awaiting_payment',
    activation_url: metadata.activation_url ?? null,
    restaurant_slug: metadata.provisioned_restaurant_slug ?? null,
    restaurant_id: metadata.provisioned_restaurant_id ?? null,
    updated_at: order.updated_at,
  })
}

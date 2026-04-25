import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_PRICE_IDS = new Set([
  process.env.STRIPE_PRICE_START_MONTHLY!,
  process.env.STRIPE_PRICE_START_ANNUAL!,
  process.env.STRIPE_PRICE_PRO_MONTHLY!,
  process.env.STRIPE_PRICE_PRO_ANNUAL!,
  process.env.STRIPE_PRICE_ELITE_MONTHLY!,
  process.env.STRIPE_PRICE_ELITE_ANNUAL!,
])

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { price_id: string; tenant_id: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { price_id, tenant_id } = body

  if (!price_id || !VALID_PRICE_IDS.has(price_id)) {
    return NextResponse.json({ error: `price_id inválido: ${price_id}` }, { status: 400 })
  }

  if (!tenant_id) {
    return NextResponse.json({ error: 'tenant_id obrigatório' }, { status: 400 })
  }

  const { data: tenant, error: tenantError } = await supabase
    .from('restaurants')
    .select('id, stripe_customer_id, email')
    .eq('id', tenant_id)
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
  }

  if (tenant.stripe_customer_id) {
    const portal = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })
    return NextResponse.json({ url: portal.url })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card', 'boleto'],
    line_items: [{ price: price_id, quantity: 1 }],
    customer_email: tenant.email,
    metadata: { tenant_id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
    locale: 'pt-BR',
    subscription_data: { metadata: { tenant_id } },
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe não retornou URL' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}


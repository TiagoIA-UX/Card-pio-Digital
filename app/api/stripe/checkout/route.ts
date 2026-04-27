import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

// Price IDs válidos — mapeados para os planos do produto
const VALID_PRICE_IDS = new Set(
  [
    process.env.STRIPE_PRICE_IMPULSO_MONTHLY,
    process.env.STRIPE_PRICE_IMPULSO_ANNUAL,
    process.env.STRIPE_PRICE_OPERACAO_MONTHLY,
    process.env.STRIPE_PRICE_OPERACAO_ANNUAL,
    process.env.STRIPE_PRICE_ESCALA_MONTHLY,
    process.env.STRIPE_PRICE_ESCALA_ANNUAL,
    process.env.STRIPE_PRICE_EXPANSAO_MONTHLY,
    process.env.STRIPE_PRICE_EXPANSAO_ANNUAL,
  ].filter(Boolean) as string[]
)

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

  const supabase = createAdminClient()

  const { data: tenant, error: tenantError } = await supabase
    .from('restaurants')
    .select('id, stripe_customer_id, email')
    .eq('id', tenant_id)
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
  }

  // Se já tem customer Stripe, redirecionar para o portal de billing
  if (tenant.stripe_customer_id) {
    const portal = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/painel`,
    })
    return NextResponse.json({ url: portal.url })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: price_id, quantity: 1 }],
    customer_email: tenant.email,
    metadata: { tenant_id },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/painel?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/precos?checkout=canceled`,
    locale: 'pt-BR',
    allow_promotion_codes: true,
    subscription_data: { metadata: { tenant_id } },
  })

  if (!session.url) {
    return NextResponse.json({ error: 'Stripe não retornou URL' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}

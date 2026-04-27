import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { tenant_id: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const { tenant_id } = body

  if (!tenant_id) {
    return NextResponse.json({ error: 'tenant_id obrigatório' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: tenant, error } = await supabase
    .from('restaurants')
    .select('stripe_customer_id')
    .eq('id', tenant_id)
    .single()

  if (error || !tenant?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'Nenhuma assinatura Stripe vinculada a este tenant' },
      { status: 404 }
    )
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/painel`,
  })

  return NextResponse.json({ url: session.url })
}

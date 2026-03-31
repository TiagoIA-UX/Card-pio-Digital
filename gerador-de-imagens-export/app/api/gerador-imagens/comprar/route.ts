import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createMercadoPagoPreferenceClient } from '@/lib/mercadopago'
import { isServerSandboxMode } from '@/lib/payment-mode'
import { getRequestSiteUrl } from '@/lib/site-url'
import { getCreditPack } from '@/lib/ai-image-generator'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { COMPANY_PAYMENT_DESCRIPTOR, BRAND_SHORT } from '@/lib/brand'

const BuySchema = z.object({
  packSlug: z.enum(['starter', 'basic', 'pro', 'unlimited']),
})

export async function POST(request: NextRequest) {
  const identifier = getRateLimitIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, { limit: 10, windowMs: 60_000 })

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em breve.' },
      { status: 429, headers: rateLimit.headers }
    )
  }

  // Auth obrigatória para compra
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Faça login para adquirir créditos', code: 'UNAUTHENTICATED' },
      { status: 401, headers: rateLimit.headers }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = BuySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Pacote inválido', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { packSlug } = parsed.data
  const pack = getCreditPack(packSlug)
  if (!pack) {
    return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })
  }

  const admin = createAdminClient()
  const siteUrl = getRequestSiteUrl(request)

  // Criar pedido no banco com status pending
  const externalReference = `ai-img-${user.id}-${packSlug}-${Date.now()}`

  const { data: order, error: orderError } = await admin
    .from('ai_image_orders')
    .insert({
      user_id: user.id,
      pack_slug: packSlug,
      credits_amount: pack.credits,
      amount_paid: pack.price,
      currency: 'BRL',
      status: 'pending',
      mp_external_reference: externalReference,
    })
    .select()
    .single()

  if (orderError || !order) {
    console.error('Erro ao criar pedido de créditos:', orderError)
    return NextResponse.json(
      { error: 'Erro ao criar pedido. Tente novamente.' },
      { status: 500 }
    )
  }

  // Criar preferência no Mercado Pago
  const mpClient = createMercadoPagoPreferenceClient()

  const isSandbox = isServerSandboxMode()

  const preference = await mpClient.create({
    body: {
      items: [
        {
          id: `ai-img-${packSlug}`,
          title: `${BRAND_SHORT} — Gerador IA: Pacote ${pack.name} (${pack.credits} créditos)`,
          description: pack.description,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: pack.price,
        },
      ],
      payer: {
        email: user.email,
      },
      back_urls: {
        success: `${siteUrl}/gerador-imagens?status=sucesso&pack=${packSlug}`,
        failure: `${siteUrl}/gerador-imagens?status=erro`,
        pending: `${siteUrl}/gerador-imagens?status=pendente`,
      },
      auto_return: 'approved',
      external_reference: externalReference,
      notification_url: `${siteUrl}/api/webhook/gerador-imagens`,
      statement_descriptor: COMPANY_PAYMENT_DESCRIPTOR,
      ...(isSandbox && { sandbox: true }),
    },
  })

  // Atualizar pedido com ID da preferência MP
  await admin
    .from('ai_image_orders')
    .update({ mp_preference_id: preference.id })
    .eq('id', order.id)

  return NextResponse.json(
    {
      success: true,
      checkoutUrl: preference.init_point,
      sandboxCheckoutUrl: preference.sandbox_init_point,
      preferenceId: preference.id,
      orderId: order.id,
    },
    { headers: rateLimit.headers }
  )
}

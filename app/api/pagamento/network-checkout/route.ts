import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createMercadoPagoPreferenceClient } from '@/lib/mercadopago'
import {
  calculateNetworkPrice,
  validateBranchEmails,
  formatCurrency,
  getDiscountTierLabel,
} from '@/lib/network-expansion'
import { PUBLIC_SUBSCRIPTION_PRICES } from '@/lib/pricing'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { getSiteUrl } from '@/lib/site-url'
import { COMPANY_NAME, COMPANY_PAYMENT_DESCRIPTOR } from '@/lib/brand'

const networkCheckoutSchema = z.object({
  parentRestaurantId: z.string().uuid(),
  branchEmails: z.array(z.string().email()).min(1).max(50),
})

export async function POST(request: NextRequest) {
  // Rate limit
  const identifier = getRateLimitIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, { limit: 5, windowMs: 60_000 })

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: Math.ceil(rateLimit.resetIn / 1000) },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(),
          ...rateLimit.headers,
        },
      }
    )
  }

  // Auth
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = networkCheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { parentRestaurantId, branchEmails } = parsed.data

  // Verify restaurant ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, nome, slug, user_id, plan_slug')
    .eq('id', parentRestaurantId)
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    return NextResponse.json(
      { error: 'Delivery não encontrado ou não pertence a este usuário' },
      { status: 404 }
    )
  }

  // Validate emails
  const emailValidation = validateBranchEmails(branchEmails)
  if (emailValidation.invalid.length > 0) {
    return NextResponse.json(
      { error: 'Invalid emails found', invalid: emailValidation.invalid },
      { status: 400 }
    )
  }

  if (emailValidation.duplicates.length > 0) {
    return NextResponse.json(
      { error: 'Duplicate emails found', duplicates: emailValidation.duplicates },
      { status: 400 }
    )
  }

  const branchCount = emailValidation.valid.length
  const planSlug = (restaurant.plan_slug || 'premium') as keyof typeof PUBLIC_SUBSCRIPTION_PRICES
  const planMonthlyPrice =
    PUBLIC_SUBSCRIPTION_PRICES[planSlug]?.monthly ?? PUBLIC_SUBSCRIPTION_PRICES.premium.monthly
  const pricing = calculateNetworkPrice(branchCount, planMonthlyPrice)
  const unitPrice = pricing.monthlyPrice
  const totalPrice = pricing.totalMonthly

  // Create Mercado Pago preference
  const mercadopago = createMercadoPagoPreferenceClient()
  const baseUrl = getSiteUrl()

  try {
    const preference = await mercadopago.create({
      body: {
        items: [
          {
            id: `network-${parentRestaurantId}`,
            title: `${COMPANY_NAME} — Expansão de Rede (${branchCount} filiais)`,
            description: `${branchCount} filiais para ${restaurant.nome} — ${formatCurrency(unitPrice)}/mês por filial`,
            quantity: branchCount,
            currency_id: 'BRL',
            unit_price: unitPrice,
          },
        ],
        payer: {
          email: user.email ?? '',
        },
        back_urls: {
          success: `${baseUrl}/pagamento/sucesso?type=network`,
          failure: `${baseUrl}/pagamento/erro?type=network`,
          pending: `${baseUrl}/pagamento/pendente?type=network`,
        },
        auto_return: 'approved',
        external_reference: `network:${parentRestaurantId}:${branchCount}`,
        notification_url: `${baseUrl}/api/webhook/mercadopago`,
        statement_descriptor: COMPANY_PAYMENT_DESCRIPTOR,
        metadata: {
          type: 'network_expansion',
          parent_restaurant_id: parentRestaurantId,
          branch_emails: emailValidation.valid,
          branch_count: branchCount,
          user_id: user.id,
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          preferenceId: preference.id,
          initPoint: preference.init_point,
          sandboxInitPoint: preference.sandbox_init_point,
          pricing: {
            unitPrice,
            totalPrice,
            branchCount,
            discountRate: pricing.discountRate,
            discountTier: getDiscountTierLabel(branchCount),
            savings:
              pricing.discountRate > 0
                ? formatCurrency(planMonthlyPrice * branchCount - totalPrice)
                : null,
          },
        },
      },
      { status: 200, headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('[network-checkout] Mercado Pago error:', error)
    return NextResponse.json({ error: 'Payment provider error' }, { status: 502 })
  }
}

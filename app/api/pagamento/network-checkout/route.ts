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
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit'
import { getSiteUrl } from '@/lib/site-url'
import { COMPANY_NAME, COMPANY_PAYMENT_DESCRIPTOR } from '@/lib/brand'

const networkCheckoutSchema = z.object({
  parentRestaurantId: z.string().uuid(),
  branchEmails: z.array(z.string().email()).min(1).max(50),
  paymentMethod: z.enum(['pix', 'card']),
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

  const { parentRestaurantId, branchEmails, paymentMethod } = parsed.data

  // Verify restaurant ownership
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, nome, slug, user_id')
    .eq('id', parentRestaurantId)
    .eq('user_id', user.id)
    .single()

  if (!restaurant) {
    return NextResponse.json({ error: 'Restaurant not found or not owned' }, { status: 404 })
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
  const pricing = calculateNetworkPrice(branchCount)
  const unitPrice = paymentMethod === 'pix' ? pricing.pixPrice : pricing.cardPrice
  const totalPrice = paymentMethod === 'pix' ? pricing.totalPix : pricing.totalCard

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
            description: `${branchCount} filiais para ${restaurant.nome} — ${formatCurrency(unitPrice)}/filial`,
            quantity: branchCount,
            currency_id: 'BRL',
            unit_price: unitPrice,
          },
        ],
        payer: {
          email: user.email ?? '',
        },
        payment_methods:
          paymentMethod === 'card'
            ? { installments: 12 }
            : { excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }] },
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
            paymentMethod,
            savings:
              pricing.discountRate > 0
                ? formatCurrency(
                    (paymentMethod === 'pix'
                      ? pricing.pixPrice / (1 - pricing.discountRate)
                      : pricing.cardPrice / (1 - pricing.discountRate)) *
                      branchCount -
                      totalPrice
                  )
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

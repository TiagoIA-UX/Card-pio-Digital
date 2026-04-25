import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { createClient } from '@/lib/shared/supabase/server'
import { getRateLimitIdentifier, withRateLimit } from '@/lib/shared/rate-limit'
import { getRequestSiteUrl } from '@/lib/shared/site-url'
import { createDeliveryCheckout } from '@/lib/domains/core/delivery-payment'
import { z } from 'zod'

const CheckoutSchema = z.object({
  orderId: z.string().uuid(),
  restaurantSlug: z.string().min(1).max(100),
})

export async function POST(request: NextRequest) {
  // Rate limit
  const rateLimit = await withRateLimit(getRateLimitIdentifier(request), {
    limit: 10,
    windowMs: 60000,
  })
  if (rateLimit.limited) {
    return rateLimit.response
  }

  try {
    // Auth: exigir usuário logado (anti-bot)
    const supabaseAuth = await createClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Autenticação necessária para realizar pagamento' },
        { status: 401, headers: rateLimit.headers }
      )
    }

    const body = await request.json()
    const validation = CheckoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const { orderId, restaurantSlug } = validation.data
    const siteUrl = getRequestSiteUrl(request)
    const admin = createAdminClient()

    const result = await createDeliveryCheckout(admin, {
      orderId,
      restaurantSlug,
      siteUrl,
    })

    return NextResponse.json(
      {
        success: true,
        checkout: {
          paymentId: result.paymentId,
          checkoutUrl: result.checkoutUrl,
          sandboxCheckoutUrl: result.sandboxCheckoutUrl,
          amount: result.amount,
        },
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno'
    const isClientError =
      message.includes('não encontrado') ||
      message.includes('não está ativo') ||
      message.includes('não habilitado') ||
      message.includes('não pertence') ||
      message.includes('não está pendente') ||
      message.includes('já possui pagamento') ||
      message.includes('inválido')

    return NextResponse.json(
      { error: message },
      { status: isClientError ? 400 : 500 }
    )
  }
}


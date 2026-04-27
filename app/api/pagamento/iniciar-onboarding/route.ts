import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createOnboardingCheckout,
  OnboardingCheckoutCreationError,
  OnboardingCheckoutSchema,
} from '@/lib/domains/core'
import { sanitizeAffiliateRef } from '@/lib/domains/core/onboarding-checkout'
import { getRateLimitIdentifier, RATE_LIMITS, withRateLimit } from '@/lib/shared/rate-limit'
import { getRequestSiteUrl } from '@/lib/shared/site-url'
import { createClient as createServerClient } from '@/lib/shared/supabase/server'

// Fluxo oficial de compra: /comprar/[template] -> Mercado Pago -> webhook -> provisionamento.

export async function POST(request: NextRequest) {
  const rateLimit = await withRateLimit(getRateLimitIdentifier(request), RATE_LIMITS.checkout)
  if (rateLimit.limited) {
    return rateLimit.response
  }

  try {
    const rawBody = await request.json()
    const body = OnboardingCheckoutSchema.parse(
      rawBody
    ) as import('@/lib/domains/core/contracts').OnboardingCheckoutInput

    const authSupabase = await createServerClient()
    const {
      data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Faça login para iniciar a compra' },
        { status: 401, headers: rateLimit.headers }
      )
    }

    const sessionEmail = user.email?.trim().toLowerCase()
    if (!sessionEmail) {
      return NextResponse.json(
        { error: 'Sua conta não possui e-mail válido' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const checkout = await createOnboardingCheckout(body, {
      ownerUserId: user.id,
      sessionEmail,
      siteUrl: getRequestSiteUrl(request),
      affRef: sanitizeAffiliateRef(request.cookies.get('aff_ref')?.value || null),
    })

    return NextResponse.json(
      {
        checkout: checkout.checkout,
        init_point: checkout.initPoint,
        sandbox_init_point: checkout.sandboxInitPoint,
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', issues: error.flatten() },
        { status: 400, headers: rateLimit.headers }
      )
    }

    if (error instanceof OnboardingCheckoutCreationError) {
      return NextResponse.json(
        { error: error.publicMessage },
        { status: error.statusCode, headers: rateLimit.headers }
      )
    }

    const err = error as Error & { cause?: unknown; response?: { data?: unknown } }
    console.error('Erro ao iniciar onboarding:', {
      message: err?.message ?? 'Erro desconhecido',
      cause: err?.cause,
      apiError: err?.response?.data,
      stack: err?.stack,
    })

    return NextResponse.json(
      { error: 'Não foi possível iniciar o checkout agora. Tente novamente em instantes.' },
      { status: 500, headers: rateLimit.headers }
    )
  }
}

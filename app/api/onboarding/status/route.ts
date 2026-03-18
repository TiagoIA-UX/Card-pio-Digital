import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getRateLimitIdentifier, withRateLimit } from '@/lib/rate-limit'

/**
 * Estados do pedido (Feito Pra Você):
 * 1. Pedido recebido - pagamento aprovado
 * 2. Aguardando informações - cliente precisa preencher formulário
 * 3. Em produção - formulário enviado, equipe montando
 * 4. Revisão - cardápio em revisão final
 * 5. Publicado - cardápio no ar
 */
export type StatusPedidoKey =
  | 'pedido_recebido'
  | 'aguardando_informacoes'
  | 'em_producao'
  | 'revisao'
  | 'publicado'

export interface StatusPedidoItem {
  key: StatusPedidoKey
  label: string
  done: boolean
  current: boolean
}

export async function GET(request: NextRequest) {
  try {
    const checkout = request.nextUrl.searchParams.get('checkout')?.trim()
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

    if (!checkout) {
      return NextResponse.json(
        { error: 'Checkout não informado' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const admin = createAdminClient()

    const { data: order, error: orderError } = await admin
      .from('template_orders')
      .select('id, user_id, order_number, payment_status, metadata')
      .eq('order_number', checkout)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404, headers: rateLimit.headers }
      )
    }

    if (!order.user_id || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: rateLimit.headers })
    }

    const metadata = (order.metadata || {}) as Record<string, unknown>
    const planSlug = metadata.plan_slug as string | undefined
    const restaurantId = metadata.provisioned_restaurant_id as string | undefined
    const restaurantSlug = metadata.provisioned_restaurant_slug as string | undefined

    if (planSlug !== 'feito-pra-voce') {
      return NextResponse.json(
        {
          checkout,
          plan: 'self-service',
          message: 'Plano Self Service — acesso imediato ao painel',
        },
        { headers: rateLimit.headers }
      )
    }

    let onboardingStatus: 'pending' | 'in_production' | 'completed' | null = null
    if (restaurantId) {
      const { data: submission } = await admin
        .from('onboarding_submissions')
        .select('status')
        .eq('restaurant_id', restaurantId)
        .single()
      onboardingStatus = submission?.status as typeof onboardingStatus
    } else {
      const { data: submission } = await admin
        .from('onboarding_submissions')
        .select('status')
        .eq('order_id', order.id)
        .single()
      onboardingStatus = submission?.status as typeof onboardingStatus
    }

    const paymentApproved = order.payment_status === 'approved'

    const steps: StatusPedidoItem[] = [
      {
        key: 'pedido_recebido',
        label: 'Pedido recebido',
        done: paymentApproved,
        current: !paymentApproved,
      },
      {
        key: 'aguardando_informacoes',
        label: 'Aguardando informações',
        done: !!onboardingStatus,
        current: paymentApproved && !onboardingStatus,
      },
      {
        key: 'em_producao',
        label: 'Cardápio em produção',
        done: onboardingStatus === 'in_production' || onboardingStatus === 'completed',
        current: onboardingStatus === 'pending',
      },
      {
        key: 'revisao',
        label: 'Revisão final',
        done: onboardingStatus === 'completed',
        current: onboardingStatus === 'in_production',
      },
      {
        key: 'publicado',
        label: 'Publicado',
        done: onboardingStatus === 'completed',
        current: false,
      },
    ]

    return NextResponse.json(
      {
        checkout,
        plan: 'feito-pra-voce',
        payment_approved: paymentApproved,
        onboarding_status: onboardingStatus,
        restaurant_slug: restaurantSlug,
        restaurant_id: restaurantId,
        steps,
      },
      { headers: rateLimit.headers }
    )
  } catch (err) {
    console.error('Erro ao buscar status:', err)
    return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
  }
}

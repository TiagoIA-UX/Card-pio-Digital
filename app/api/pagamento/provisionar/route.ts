import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getRequestSiteUrl } from '@/lib/site-url'
import { isServerSandboxMode } from '@/lib/payment-mode'
import { getRateLimitIdentifier, withRateLimit } from '@/lib/rate-limit'
import {
  resolveManualProvisioningResultStatus,
  resolveOnboardingProvisioningDecision,
} from '@/lib/onboarding-provisioning'

// Rota de provisionamento manual — usada SOMENTE em sandbox quando o webhook
// do Mercado Pago não dispara (localhost não recebe webhooks).
// Em produção esta rota retorna 403.

function getMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, unknown>
  }
  return value as Record<string, unknown>
}

export async function POST(request: NextRequest) {
  // Bloquear em produção — provisionamento DEVE vir pelo webhook
  if (!isServerSandboxMode()) {
    return NextResponse.json(
      { error: 'Provisionamento manual disponível apenas em sandbox' },
      { status: 403 }
    )
  }

  const rateLimit = await withRateLimit(getRateLimitIdentifier(request), {
    limit: 5,
    windowMs: 60000,
  })
  if (rateLimit.limited) return rateLimit.response

  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Faça login' }, { status: 401, headers: rateLimit.headers })
  }

  const body = await request.json()
  const checkout = String(body.checkout || '').trim()

  if (!checkout) {
    return NextResponse.json(
      { error: 'checkout obrigatório' },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const admin = createAdminClient()
  const { data: order, error: orderError } = await admin
    .from('template_orders')
    .select('id, user_id, status, payment_status, metadata')
    .eq('order_number', checkout)
    .single()

  if (orderError || !order) {
    return NextResponse.json(
      { error: 'Pedido não encontrado' },
      { status: 404, headers: rateLimit.headers }
    )
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: rateLimit.headers })
  }

  const metadata = getMetadata(order.metadata)
  const initialDecision = resolveOnboardingProvisioningDecision({
    status: order.status,
    payment_status: order.payment_status,
    metadata,
  })

  // Se já provisionado, retornar direto
  if (metadata.provisioned_restaurant_id) {
    return NextResponse.json(
      {
        already: true,
        onboarding_status: 'ready',
        restaurant_slug: metadata.provisioned_restaurant_slug,
        restaurant_id: metadata.provisioned_restaurant_id,
      },
      { headers: rateLimit.headers }
    )
  }

  // Importar a função de provisionamento do webhook (reuso total)
  const { processOnboardingPayment } = await import('@/app/api/webhook/mercadopago/route')
  const siteUrl = getRequestSiteUrl(request)

  try {
    // Simular pagamento aprovado para provisionamento
    await processOnboardingPayment(
      admin,
      order.id,
      {
        id: Date.now(), // ID fictício para sandbox
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: Number(metadata.total || 0) || 0,
        payment_method_id: String(metadata.payment_method || 'sandbox'),
        payment_type_id: 'credit_card',
      },
      siteUrl
    )

    // Recarregar metadata atualizada
    const { data: updated } = await admin
      .from('template_orders')
      .select('metadata')
      .eq('id', order.id)
      .single()

    const updatedMeta = getMetadata(updated?.metadata)
    const resultStatus = resolveManualProvisioningResultStatus(
      initialDecision,
      Boolean(updatedMeta.provisioned_restaurant_id)
    )

    return NextResponse.json(
      {
        provisioned: resultStatus === 'provisioned' || resultStatus === 'recovered',
        status: resultStatus,
        onboarding_status: 'ready',
        restaurant_slug: updatedMeta.provisioned_restaurant_slug ?? null,
        restaurant_id: updatedMeta.provisioned_restaurant_id ?? null,
      },
      { headers: rateLimit.headers }
    )
  } catch (err) {
    console.error('Erro no provisionamento manual (sandbox):', err)
    return NextResponse.json(
      { error: 'Erro ao provisionar restaurante' },
      { status: 500, headers: rateLimit.headers }
    )
  }
}

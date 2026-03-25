import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestSiteUrl } from '@/lib/site-url'
import { requireAdmin } from '@/lib/admin-auth'
import {
  resolveManualProvisioningResultStatus,
  resolveOnboardingProvisioningDecision,
} from '@/lib/onboarding-provisioning'

// Rota de admin para provisionar pedidos pendentes manualmente.
// POST /api/admin/provisionar-pendentes
// Header: Authorization: Bearer <ADMIN_SECRET_KEY>

function getMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, unknown>
  }
  return value as Record<string, unknown>
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request, 'admin')
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createAdminClient()
  const siteUrl = getRequestSiteUrl(request)

  // Buscar todos os pedidos de onboarding pendentes de provisionamento
  const { data: orders, error } = await supabaseAdmin
    .from('template_orders')
    .select('id, order_number, user_id, status, payment_status, metadata, updated_at')
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 })
  }

  const pendingOrders = (orders || []).filter((o) => {
    const meta = getMetadata(o.metadata)
    const decision = resolveOnboardingProvisioningDecision({
      status: o.status,
      payment_status: o.payment_status,
      updated_at: o.updated_at,
      metadata: meta,
    })

    return (
      meta.checkout_type === 'restaurant_onboarding' &&
      !meta.provisioned_restaurant_id &&
      (decision === 'fresh-claim' || decision === 'stale-recovery')
    )
  })

  if (pendingOrders.length === 0) {
    return NextResponse.json({ message: 'Nenhum pedido pendente de provisionamento', count: 0 })
  }

  const { processOnboardingPayment } = await import('@/app/api/webhook/mercadopago/route')
  const results: Array<{ order: string; status: string; error?: string }> = []

  for (const order of pendingOrders) {
    const meta = getMetadata(order.metadata)
    const initialDecision = resolveOnboardingProvisioningDecision({
      status: order.status,
      payment_status: order.payment_status,
      updated_at: order.updated_at,
      metadata: meta,
    })

    try {
      await processOnboardingPayment(
        supabaseAdmin,
        order.id,
        {
          id: Date.now(),
          status: 'approved',
          status_detail: 'accredited',
          transaction_amount: Number(meta.total || 0) || 0,
          payment_method_id: String(meta.payment_method || 'manual'),
          payment_type_id: 'credit_card',
        },
        siteUrl
      )

      const { data: updatedOrder } = await supabaseAdmin
        .from('template_orders')
        .select('status, payment_status, metadata, updated_at')
        .eq('id', order.id)
        .single()

      const updatedMeta = getMetadata(updatedOrder?.metadata)
      const resultStatus = resolveManualProvisioningResultStatus(
        initialDecision,
        Boolean(updatedMeta.provisioned_restaurant_id)
      )

      results.push({ order: order.order_number, status: resultStatus })
    } catch (err) {
      results.push({
        order: order.order_number,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown',
      })
    }
  }

  const completedCount = results.filter(
    (result) => result.status === 'provisioned' || result.status === 'recovered'
  ).length

  return NextResponse.json({
    message: `${completedCount}/${pendingOrders.length} provisionados`,
    results,
  })
}

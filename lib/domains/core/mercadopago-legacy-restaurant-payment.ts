import { mapMercadoPagoStatus } from '@/lib/domains/core/payment-status'
import { notifyPaymentRejected } from '@/lib/shared/notifications'
import { createAdminClient } from '@/lib/shared/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

export interface MercadoPagoLegacyRestaurantPaymentInput {
  id?: number | null
  status?: string | null
  status_detail?: string | null
  transaction_amount?: number | null
  date_approved?: string | null
  payer?: { email?: string | null } | null
}

export function buildLegacyRestaurantPaymentUpdateData(params: {
  status?: string | null
  currentPlan?: string | null
  transactionAmount?: number | null
  paidAt?: string
}) {
  const mappedStatus = mapMercadoPagoStatus(params.status)
  const updateData: Record<string, unknown> = {
    status_pagamento: mappedStatus.restaurantPaymentStatus,
  }

  if (params.status === 'approved') {
    updateData.ativo = true
    updateData.plano = params.currentPlan ?? 'self-service'
    updateData.valor_pago = params.transactionAmount ?? null
    updateData.data_pagamento = params.paidAt ?? new Date().toISOString()
  }

  if (params.status === 'rejected' || params.status === 'cancelled') {
    updateData.ativo = false
  }

  return {
    mappedStatus,
    updateData,
  }
}

export function shouldNotifyLegacyRejectedPayment(status?: string | null) {
  return status === 'rejected' || status === 'cancelled'
}

export async function processLegacyRestaurantPayment(
  admin: AdminClient,
  restaurantId: string,
  payment: MercadoPagoLegacyRestaurantPaymentInput
) {
  const { data: restaurantData } = await admin
    .from('restaurants')
    .select('plano')
    .eq('id', restaurantId)
    .maybeSingle()

  const { mappedStatus, updateData } = buildLegacyRestaurantPaymentUpdateData({
    status: payment.status,
    currentPlan: restaurantData?.plano ?? null,
    transactionAmount: payment.transaction_amount ?? null,
    paidAt: payment.date_approved ?? undefined,
  })

  const { error } = await admin.from('restaurants').update(updateData).eq('id', restaurantId)

  if (error) {
    console.error('Erro ao atualizar restaurante:', error)
  } else {
    console.log(
      `Restaurante ${restaurantId} atualizado para ${mappedStatus.restaurantPaymentStatus}`
    )
  }

  if (shouldNotifyLegacyRejectedPayment(payment.status)) {
    try {
      await notifyPaymentRejected({
        orderId: restaurantId,
        customerEmail: payment.payer?.email || 'desconhecido',
        amount: payment.transaction_amount ?? undefined,
        reason: payment.status_detail ?? undefined,
        paymentId: payment.id ?? undefined,
      })
    } catch (notifyErr) {
      console.error('Falha ao notificar pagamento rejeitado (legado):', notifyErr)
    }
  }
}

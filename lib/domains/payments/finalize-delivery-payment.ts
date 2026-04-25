import { createAdminClient } from '@/lib/shared/supabase/admin'
import { getSiteUrl } from '@/lib/shared/site-url'
import { createDomainLogger } from '@/lib/shared/domain-logger'
import {
  buildWhatsAppLinkAfterPayment,
  enqueueDeliveryPaymentPostCommitTask,
} from '@/lib/domains/payments/delivery-payment-post-commit'

const log = createDomainLogger('core')

type AdminClient = ReturnType<typeof createAdminClient>

type DeliveryPaymentRow = {
  id: string
  restaurant_id: string
  order_id: string
  amount: number
  status: string
  payment_method_used: string | null
  paid_at: string | null
  whatsapp_sent: boolean | null
  reconciliation_status: 'pending' | 'synced' | 'failed' | null
  reconciliation_attempts: number | null
  last_reconciliation_at: string | null
  last_reconciliation_error: string | null
  last_external_status_snapshot: Record<string, unknown> | null
  anomaly_flag: boolean | null
  anomaly_code: string | null
  created_at: string | null
  metadata: Record<string, unknown> | null
}

type OrderRow = {
  id: string
  status: string
}

export interface DeliveryPaymentSnapshot {
  id?: number | null
  status?: string | null
  status_detail?: string | null
  transaction_amount?: number | null
  payment_method_id?: string | null
  payment_type_id?: string | null
  date_approved?: string | null
  payer?: { email?: string | null } | null
  external_reference?: string | null
}

export interface FinalizeDeliveryPaymentInput {
  orderId: string
  payment: DeliveryPaymentSnapshot
  siteUrl?: string
  source?: 'webhook' | 'cron' | 'manual'
}

export interface FinalizeDeliveryPaymentResult {
  orderId: string
  paymentId: string
  finalPaymentStatus: 'approved' | 'rejected' | 'pending'
  orderStatus: string
  alreadyFinalized: boolean
  whatsappSent: boolean
}

export interface ReconcilePendingDeliveryPaymentsResult {
  checked: number
  finalized: number
  stillPending: number
  notFound: number
  failed: number
  details: Array<{
    orderId: string
    paymentId: string
    action: 'finalized' | 'pending' | 'not_found' | 'failed'
    status?: string | null
    error?: string
  }>
}

export const DELIVERY_PAYMENT_RETRYABLE_ANOMALY_CODES = [
  'gateway_fetch_failed',
  'gateway_payment_not_found',
  'order_update_failed',
  'payment_update_failed',
  'reconciliation_update_failed',
] as const

export const DELIVERY_PAYMENT_TERMINAL_ANOMALY_CODES = ['amount_mismatch'] as const

export const DELIVERY_PAYMENT_MAX_RECONCILIATION_ATTEMPTS = 5
export const DELIVERY_PAYMENT_RETRY_BACKOFF_MINUTES = 15

type DeliveryPaymentRetryableAnomalyCode = (typeof DELIVERY_PAYMENT_RETRYABLE_ANOMALY_CODES)[number]
type DeliveryPaymentTerminalAnomalyCode = (typeof DELIVERY_PAYMENT_TERMINAL_ANOMALY_CODES)[number]
type DeliveryPaymentAnomalyCode =
  | DeliveryPaymentRetryableAnomalyCode
  | DeliveryPaymentTerminalAnomalyCode
  | 'whatsapp_post_payment_failed'
  | 'lock_release_failed'
  | 'unknown_reconciliation_failure'

type DeliveryPaymentReconciliationStatus = 'pending' | 'synced' | 'failed'

function toMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function normalizePaymentStatus(status: string | null | undefined) {
  if (status === 'approved') return 'approved' as const
  if (status === 'rejected' || status === 'cancelled') return 'rejected' as const
  return 'pending' as const
}

function normalizeReconciliationStatus(status: string | null | undefined) {
  if (status === 'synced') return 'synced' as const
  if (status === 'failed') return 'failed' as const
  return 'pending' as const
}

function isRetryableDeliveryPaymentAnomalyCode(
  code: string | null | undefined
): code is DeliveryPaymentRetryableAnomalyCode {
  return DELIVERY_PAYMENT_RETRYABLE_ANOMALY_CODES.includes(
    code as DeliveryPaymentRetryableAnomalyCode
  )
}

function isTerminalDeliveryPaymentAnomalyCode(
  code: string | null | undefined
): code is DeliveryPaymentTerminalAnomalyCode {
  return DELIVERY_PAYMENT_TERMINAL_ANOMALY_CODES.includes(
    code as DeliveryPaymentTerminalAnomalyCode
  )
}

export function shouldRetryDeliveryPaymentRow(input: {
  status: string | null | undefined
  reconciliationStatus: string | null | undefined
  anomalyCode: string | null | undefined
  reconciliationAttempts: number | null | undefined
  lastReconciliationAt: string | null | undefined
  maxAttempts?: number
  retryBackoffMinutes?: number
}) {
  const paymentStatus = normalizePaymentStatus(input.status)
  const reconciliationStatus = normalizeReconciliationStatus(input.reconciliationStatus)
  const attempts = Math.max(0, input.reconciliationAttempts ?? 0)
  const maxAttempts = input.maxAttempts ?? DELIVERY_PAYMENT_MAX_RECONCILIATION_ATTEMPTS
  const retryBackoffMinutes = input.retryBackoffMinutes ?? DELIVERY_PAYMENT_RETRY_BACKOFF_MINUTES

  if (attempts >= maxAttempts) return false
  if (paymentStatus === 'pending') return true
  if (reconciliationStatus === 'pending') return true
  if (reconciliationStatus !== 'failed') return false
  if (isTerminalDeliveryPaymentAnomalyCode(input.anomalyCode)) return false
  if (!isRetryableDeliveryPaymentAnomalyCode(input.anomalyCode)) return false

  const lastAttemptAt = input.lastReconciliationAt ? new Date(input.lastReconciliationAt) : null
  if (!lastAttemptAt || Number.isNaN(lastAttemptAt.getTime())) return true

  const backoffMs = retryBackoffMinutes * 60 * 1000
  return Date.now() - lastAttemptAt.getTime() >= backoffMs
}

function buildExternalStatusSnapshot(payment: DeliveryPaymentSnapshot) {
  return {
    id: payment.id ?? null,
    status: payment.status ?? null,
    status_detail: payment.status_detail ?? null,
    transaction_amount: payment.transaction_amount ?? null,
    payment_method_id: payment.payment_method_id ?? null,
    payment_type_id: payment.payment_type_id ?? null,
    date_approved: payment.date_approved ?? null,
    payer_email: payment.payer?.email ?? null,
    external_reference: payment.external_reference ?? null,
  }
}

function classifyDeliveryPaymentFailure(error: unknown): DeliveryPaymentAnomalyCode {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  if (message.includes('valor do pagamento divergente')) return 'amount_mismatch'
  if (message.includes('falha ao atualizar payment')) return 'payment_update_failed'
  if (message.includes('falha ao confirmar pedido') || message.includes('falha ao cancelar pedido'))
    return 'order_update_failed'
  return 'unknown_reconciliation_failure'
}

async function updateDeliveryPaymentReconciliationState(
  admin: AdminClient,
  paymentId: string,
  input: {
    status: DeliveryPaymentReconciliationStatus
    externalSnapshot?: Record<string, unknown>
    errorMessage?: string | null
    anomalyCode?: DeliveryPaymentAnomalyCode | null
    anomalyFlag?: boolean
    incrementAttempts?: boolean
  }
) {
  const payload: Record<string, unknown> = {
    reconciliation_status: input.status,
    last_reconciliation_at: new Date().toISOString(),
  }

  if (input.incrementAttempts) {
    const { data: current, error: currentError } = await admin
      .from('delivery_payments')
      .select('reconciliation_attempts')
      .eq('id', paymentId)
      .single()

    if (currentError) {
      throw new Error(
        `Falha ao carregar tentativas de reconciliação do pagamento ${paymentId}: ${currentError.message}`
      )
    }

    payload.reconciliation_attempts = Math.max(0, current?.reconciliation_attempts ?? 0) + 1
  }

  if (input.externalSnapshot) payload.last_external_status_snapshot = input.externalSnapshot
  if (input.errorMessage !== undefined) payload.last_reconciliation_error = input.errorMessage
  if (input.anomalyCode !== undefined) payload.anomaly_code = input.anomalyCode
  if (input.anomalyFlag !== undefined) payload.anomaly_flag = input.anomalyFlag

  const { error } = await admin.from('delivery_payments').update(payload).eq('id', paymentId)
  if (error)
    throw new Error(`Falha ao atualizar reconciliação do pagamento ${paymentId}: ${error.message}`)
}

function amountsMatch(expected: number, received?: number | null) {
  if (!Number.isFinite(expected)) return false
  if (!Number.isFinite(received ?? NaN)) return false
  return Math.abs(expected - Number(received)) < 0.01
}

async function loadDeliveryPaymentByOrderId(admin: AdminClient, orderId: string) {
  const { data, error } = await admin
    .from('delivery_payments')
    .select(
      'id, restaurant_id, order_id, amount, status, payment_method_used, paid_at, whatsapp_sent, metadata'
    )
    .eq('order_id', orderId)
    .single()

  if (error || !data) throw new Error(`Pagamento de delivery não encontrado para pedido ${orderId}`)
  return data as DeliveryPaymentRow
}

async function loadDeliveryPaymentById(admin: AdminClient, paymentId: string) {
  const { data, error } = await admin
    .from('delivery_payments')
    .select(
      'id, restaurant_id, order_id, amount, status, payment_method_used, paid_at, whatsapp_sent, metadata'
    )
    .eq('id', paymentId)
    .single()

  if (error || !data) throw new Error(`Pagamento de delivery não encontrado pelo id ${paymentId}`)
  return data as DeliveryPaymentRow
}

async function acquireDeliveryPaymentLock(admin: AdminClient, paymentId: string) {
  const { data, error } = await admin.rpc('acquire_delivery_payment_lock', {
    p_payment_id: paymentId,
  })
  if (error) throw new Error(`Falha ao adquirir lock do pagamento ${paymentId}: ${error.message}`)
  const row = Array.isArray(data) ? data[0] : data
  return row ? (row as DeliveryPaymentRow) : null
}

async function releaseDeliveryPaymentLock(admin: AdminClient, paymentId: string) {
  const { error } = await admin.rpc('release_delivery_payment_lock', { p_payment_id: paymentId })
  if (error) throw new Error(`Falha ao liberar lock do pagamento ${paymentId}: ${error.message}`)
}

async function loadOrder(admin: AdminClient, orderId: string) {
  const { data, error } = await admin.from('orders').select('id, status').eq('id', orderId).single()
  if (error || !data) throw new Error(`Pedido não encontrado para pagamento ${orderId}`)
  return data as OrderRow
}

async function writeAuditLog(
  admin: AdminClient,
  paymentRow: DeliveryPaymentRow,
  status: 'approved' | 'rejected' | 'pending',
  payment: DeliveryPaymentSnapshot
) {
  const { error } = await admin.from('audit_logs').insert({
    actor: 'system',
    action: `delivery_payment_finalize_${status}`,
    resource_type: 'delivery_payments',
    resource_id: paymentRow.id,
    restaurant_id: paymentRow.restaurant_id,
    metadata: {
      order_id: paymentRow.order_id,
      payment_id: payment.id ?? null,
      payment_status: payment.status ?? null,
      payment_method: payment.payment_method_id ?? null,
    },
  })

  if (error) {
    await enqueueDeliveryPaymentPostCommitTask(admin, {
      paymentId: paymentRow.id,
      restaurantId: paymentRow.restaurant_id,
      orderId: paymentRow.order_id,
      taskType: 'audit_log_finalize',
      dedupeKey: `delivery_payment_finalize_${status}:${paymentRow.id}`,
      payload: {
        action: `delivery_payment_finalize_${status}`,
        payment: { id: payment.id ?? null, status: payment.status ?? null },
      },
    })
  }
}

async function writeReconciliationFailureAuditLog(
  admin: AdminClient,
  paymentRow: DeliveryPaymentRow,
  input: {
    source: 'webhook' | 'cron' | 'manual'
    anomalyCode: DeliveryPaymentAnomalyCode
    errorMessage: string
    payment: DeliveryPaymentSnapshot
  }
) {
  const { error } = await admin.from('audit_logs').insert({
    actor: 'system',
    action: 'delivery_payment_reconciliation_failed',
    resource_type: 'delivery_payments',
    resource_id: paymentRow.id,
    restaurant_id: paymentRow.restaurant_id,
    metadata: {
      order_id: paymentRow.order_id,
      source: input.source,
      anomaly_code: input.anomalyCode,
      error_message: input.errorMessage,
      payment_id: input.payment.id ?? null,
      payment_status: input.payment.status ?? null,
    },
  })

  if (error) {
    await enqueueDeliveryPaymentPostCommitTask(admin, {
      paymentId: paymentRow.id,
      restaurantId: paymentRow.restaurant_id,
      orderId: paymentRow.order_id,
      taskType: 'audit_log_reconciliation_failed',
      dedupeKey: `delivery_payment_reconciliation_failed:${paymentRow.id}:${input.source}:${input.anomalyCode}`,
      payload: {
        action: 'delivery_payment_reconciliation_failed',
        source: input.source,
        anomalyCode: input.anomalyCode,
        errorMessage: input.errorMessage,
        payment: input.payment,
      },
    })
  }
}

export async function finalizeDeliveryPayment({
  orderId,
  payment,
  siteUrl = getSiteUrl(),
  source = 'manual',
}: FinalizeDeliveryPaymentInput): Promise<FinalizeDeliveryPaymentResult> {
  const admin = createAdminClient()
  let paymentRow = await loadDeliveryPaymentByOrderId(admin, orderId)
  let order = await loadOrder(admin, orderId)
  const targetStatus = normalizePaymentStatus(payment.status)
  const externalSnapshot = buildExternalStatusSnapshot(payment)

  const alreadyAtTarget =
    paymentRow.status === targetStatus &&
    normalizeReconciliationStatus(paymentRow.reconciliation_status) === 'synced' &&
    ((targetStatus === 'approved' && order.status === 'confirmed') ||
      (targetStatus === 'rejected' && order.status === 'cancelled') ||
      targetStatus === 'pending')

  if (alreadyAtTarget) {
    return {
      orderId,
      paymentId: paymentRow.id,
      finalPaymentStatus: targetStatus,
      orderStatus: order.status,
      alreadyFinalized: true,
      whatsappSent: Boolean(paymentRow.whatsapp_sent),
    }
  }

  const lockedPaymentRow = await acquireDeliveryPaymentLock(admin, paymentRow.id)

  if (!lockedPaymentRow) {
    log.info('Finalização já em andamento, ignorando chamada concorrente', {
      order_id: orderId,
      payment_id: paymentRow.id,
      source,
    })
    return {
      orderId,
      paymentId: paymentRow.id,
      finalPaymentStatus: normalizePaymentStatus(paymentRow.status),
      orderStatus: order.status,
      alreadyFinalized: true,
      whatsappSent: Boolean(paymentRow.whatsapp_sent),
    }
  }

  paymentRow = await loadDeliveryPaymentById(admin, lockedPaymentRow.id)
  order = await loadOrder(admin, orderId)

  try {
    const metadata = toMetadata(paymentRow.metadata)

    await updateDeliveryPaymentReconciliationState(admin, paymentRow.id, {
      status: 'pending',
      externalSnapshot,
      errorMessage: null,
      anomalyCode: null,
      anomalyFlag: false,
      incrementAttempts: true,
    })

    if (
      targetStatus === 'approved' &&
      !amountsMatch(paymentRow.amount, payment.transaction_amount)
    ) {
      throw new Error('Valor do pagamento divergente do pedido')
    }

    const nextMetadata = {
      ...metadata,
      payment_status: payment.status ?? null,
      payment_status_detail: payment.status_detail ?? null,
      payment_type: payment.payment_type_id ?? null,
      payer_email: payment.payer?.email ?? null,
      finalize_last_run_at: new Date().toISOString(),
      finalize_source: source,
    }

    const { error } = await admin
      .from('delivery_payments')
      .update({
        status: targetStatus,
        payment_method_used: payment.payment_method_id || null,
        paid_at:
          targetStatus === 'approved'
            ? paymentRow.paid_at || payment.date_approved || new Date().toISOString()
            : paymentRow.paid_at,
        metadata: nextMetadata,
      })
      .eq('id', paymentRow.id)

    if (error) throw new Error(`Falha ao atualizar payment ${paymentRow.id}: ${error.message}`)

    let finalOrderStatus = order.status

    if (targetStatus === 'approved' && ['pending', 'cancelled'].includes(order.status)) {
      const { error } = await admin
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id)
      if (error) throw new Error(`Falha ao confirmar pedido ${order.id}: ${error.message}`)
      finalOrderStatus = 'confirmed'
    }

    if (targetStatus === 'rejected' && order.status === 'pending') {
      const { error } = await admin
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
      if (error) throw new Error(`Falha ao cancelar pedido ${order.id}: ${error.message}`)
      finalOrderStatus = 'cancelled'
    }

    let whatsappSent = Boolean(paymentRow.whatsapp_sent)
    let anomalyFlag = false
    let anomalyCode: DeliveryPaymentAnomalyCode | null = null

    if (targetStatus === 'approved' && !paymentRow.whatsapp_sent) {
      try {
        const whatsappLink = await buildWhatsAppLinkAfterPayment(
          admin,
          orderId,
          paymentRow.restaurant_id
        )
        if (whatsappLink) {
          const { error } = await admin
            .from('delivery_payments')
            .update({
              whatsapp_sent: true,
              whatsapp_link: whatsappLink,
              whatsapp_sent_at: new Date().toISOString(),
            })
            .eq('id', paymentRow.id)

          if (error) {
            await enqueueDeliveryPaymentPostCommitTask(admin, {
              paymentId: paymentRow.id,
              restaurantId: paymentRow.restaurant_id,
              orderId: paymentRow.order_id,
              taskType: 'whatsapp_post_payment',
              dedupeKey: `whatsapp_post_payment:${paymentRow.id}`,
              payload: { action: 'whatsapp_post_payment' },
            })
            anomalyFlag = true
            anomalyCode = 'whatsapp_post_payment_failed'
          } else {
            whatsappSent = true
          }
        }
      } catch (error) {
        await enqueueDeliveryPaymentPostCommitTask(admin, {
          paymentId: paymentRow.id,
          restaurantId: paymentRow.restaurant_id,
          orderId: paymentRow.order_id,
          taskType: 'whatsapp_post_payment',
          dedupeKey: `whatsapp_post_payment:${paymentRow.id}`,
          payload: { action: 'whatsapp_post_payment' },
        })
        anomalyFlag = true
        anomalyCode = 'whatsapp_post_payment_failed'
      }
    }

    await writeAuditLog(admin, paymentRow, targetStatus, payment)
    await updateDeliveryPaymentReconciliationState(admin, paymentRow.id, {
      status: 'synced',
      externalSnapshot,
      errorMessage: null,
      anomalyCode,
      anomalyFlag,
    })

    return {
      orderId,
      paymentId: paymentRow.id,
      finalPaymentStatus: targetStatus,
      orderStatus: finalOrderStatus,
      alreadyFinalized: paymentRow.status === targetStatus && finalOrderStatus === order.status,
      whatsappSent,
    }
  } catch (error) {
    const anomalyCode = classifyDeliveryPaymentFailure(error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    await updateDeliveryPaymentReconciliationState(admin, paymentRow.id, {
      status: 'failed',
      externalSnapshot,
      errorMessage,
      anomalyCode,
      anomalyFlag: true,
    }).catch(() => {})

    await writeReconciliationFailureAuditLog(admin, paymentRow, {
      source,
      anomalyCode,
      errorMessage,
      payment,
    })

    throw error
  } finally {
    await releaseDeliveryPaymentLock(admin, paymentRow.id).catch(async (error) => {
      log.error('Falha ao liberar lock do pagamento delivery', error, {
        order_id: orderId,
        payment_id: paymentRow.id,
        source,
      })
      await updateDeliveryPaymentReconciliationState(admin, paymentRow.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
        anomalyCode: 'lock_release_failed',
        anomalyFlag: true,
      }).catch(() => {})
    })
  }
}

// Reconciliação desativada — gateway de delivery a definir
export async function reconcilePendingDeliveryPayments(_input?: {
  limit?: number
  siteUrl?: string
}): Promise<ReconcilePendingDeliveryPaymentsResult> {
  log.warn('reconcilePendingDeliveryPayments desativada: gateway de delivery pendente de migração')
  return { checked: 0, finalized: 0, stillPending: 0, notFound: 0, failed: 0, details: [] }
}

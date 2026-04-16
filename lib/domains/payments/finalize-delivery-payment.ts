import {
  createMercadoPagoPaymentClient,
  getMercadoPagoAccessToken,
} from '@/lib/domains/core/mercadopago'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { getSiteUrl } from '@/lib/shared/site-url'
import { createDomainLogger } from '@/lib/shared/domain-logger'
import { formatarPedidoWhatsApp, gerarLinkWhatsApp } from '@/modules/whatsapp'

const log = createDomainLogger('core')

type AdminClient = ReturnType<typeof createAdminClient>

type DeliveryPaymentRow = {
  id: string
  restaurant_id: string
  order_id: string
  amount: number
  status: string
  mp_preference_id: string | null
  mp_payment_id: string | null
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
  /** Origem da chamada: 'webhook' | 'cron' | 'manual' */
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

type DeliveryPaymentRetryableAnomalyCode =
  (typeof DELIVERY_PAYMENT_RETRYABLE_ANOMALY_CODES)[number]

type DeliveryPaymentTerminalAnomalyCode =
  (typeof DELIVERY_PAYMENT_TERMINAL_ANOMALY_CODES)[number]

type DeliveryPaymentAnomalyCode =
  | DeliveryPaymentRetryableAnomalyCode
  | DeliveryPaymentTerminalAnomalyCode
  | 'whatsapp_post_payment_failed'
  | 'lock_release_failed'
  | 'unknown_reconciliation_failure'

type DeliveryPaymentReconciliationStatus = 'pending' | 'synced' | 'failed'

function toMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

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
  return DELIVERY_PAYMENT_TERMINAL_ANOMALY_CODES.includes(code as DeliveryPaymentTerminalAnomalyCode)
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
  const retryBackoffMinutes =
    input.retryBackoffMinutes ?? DELIVERY_PAYMENT_RETRY_BACKOFF_MINUTES

  if (attempts >= maxAttempts) {
    return false
  }

  if (paymentStatus === 'pending') {
    return true
  }

  if (reconciliationStatus === 'pending') {
    return true
  }

  if (reconciliationStatus !== 'failed') {
    return false
  }

  if (isTerminalDeliveryPaymentAnomalyCode(input.anomalyCode)) {
    return false
  }

  if (!isRetryableDeliveryPaymentAnomalyCode(input.anomalyCode)) {
    return false
  }
  const lastAttemptAt = input.lastReconciliationAt ? new Date(input.lastReconciliationAt) : null
  if (!lastAttemptAt || Number.isNaN(lastAttemptAt.getTime())) {
    return true
  }

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

  if (message.includes('valor do pagamento divergente')) {
    return 'amount_mismatch'
  }

  if (message.includes('falha ao consultar mercado pago')) {
    return 'gateway_fetch_failed'
  }

  if (message.includes('falha ao atualizar payment')) {
    return 'payment_update_failed'
  }

  if (message.includes('falha ao confirmar pedido') || message.includes('falha ao cancelar pedido')) {
    return 'order_update_failed'
  }

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

  if (input.externalSnapshot) {
    payload.last_external_status_snapshot = input.externalSnapshot
  }

  if (input.errorMessage !== undefined) {
    payload.last_reconciliation_error = input.errorMessage
  }

  if (input.anomalyCode !== undefined) {
    payload.anomaly_code = input.anomalyCode
  }

  if (input.anomalyFlag !== undefined) {
    payload.anomaly_flag = input.anomalyFlag
  }

  const { error } = await admin.from('delivery_payments').update(payload).eq('id', paymentId)

  if (error) {
    throw new Error(
      `Falha ao atualizar reconciliação do pagamento ${paymentId}: ${error.message}`
    )
  }
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
      'id, restaurant_id, order_id, amount, status, mp_preference_id, mp_payment_id, payment_method_used, paid_at, whatsapp_sent, metadata'
    )
    .eq('order_id', orderId)
    .single()

  if (error || !data) {
    throw new Error(`Pagamento de delivery não encontrado para pedido ${orderId}`)
  }

  return data as DeliveryPaymentRow
}

async function loadDeliveryPaymentById(admin: AdminClient, paymentId: string) {
  const { data, error } = await admin
    .from('delivery_payments')
    .select(
      'id, restaurant_id, order_id, amount, status, mp_preference_id, mp_payment_id, payment_method_used, paid_at, whatsapp_sent, metadata'
    )
    .eq('id', paymentId)
    .single()

  if (error || !data) {
    throw new Error(`Pagamento de delivery não encontrado pelo id ${paymentId}`)
  }

  return data as DeliveryPaymentRow
}

async function acquireDeliveryPaymentLock(admin: AdminClient, paymentId: string) {
  const { data, error } = await admin.rpc('acquire_delivery_payment_lock', {
    p_payment_id: paymentId,
  })

  if (error) {
    throw new Error(`Falha ao adquirir lock do pagamento ${paymentId}: ${error.message}`)
  }

  const row = Array.isArray(data) ? data[0] : data
  return row ? (row as DeliveryPaymentRow) : null
}

async function releaseDeliveryPaymentLock(admin: AdminClient, paymentId: string) {
  const { error } = await admin.rpc('release_delivery_payment_lock', {
    p_payment_id: paymentId,
  })

  if (error) {
    throw new Error(`Falha ao liberar lock do pagamento ${paymentId}: ${error.message}`)
  }
}

async function loadOrder(admin: AdminClient, orderId: string) {
  const { data, error } = await admin.from('orders').select('id, status').eq('id', orderId).single()

  if (error || !data) {
    throw new Error(`Pedido não encontrado para pagamento ${orderId}`)
  }

  return data as OrderRow
}

async function buildWhatsAppLinkAfterPayment(
  admin: AdminClient,
  orderId: string,
  restaurantId: string
) {
  const { data: restaurant } = await admin
    .from('restaurants')
    .select('id, nome, telefone, template_slug')
    .eq('id', restaurantId)
    .single()

  if (!restaurant?.telefone) {
    return null
  }

  const { data: order } = await admin
    .from('orders')
    .select(
      `
      id, numero_pedido, cliente_nome, cliente_telefone, cliente_email,
      tipo_entrega, endereco_rua, endereco_bairro, endereco_complemento,
      forma_pagamento, troco_para, observacoes, total, created_at, status
    `
    )
    .eq('id', orderId)
    .single()

  if (!order) {
    return null
  }

  const { data: items } = await admin
    .from('order_items')
    .select('id, nome_snapshot, preco_snapshot, quantidade, observacao')
    .eq('order_id', orderId)

  if (!items || items.length === 0) {
    return null
  }

  const dadosPedido = {
    store: {
      nome: restaurant.nome,
      whatsapp: restaurant.telefone,
      template_slug: restaurant.template_slug || 'restaurante',
    },
    pedido: {
      numero: order.numero_pedido,
      cliente_nome: order.cliente_nome || 'Cliente',
      cliente_telefone: order.cliente_telefone || '',
      cliente_email: order.cliente_email || null,
      tipo_entrega: order.tipo_entrega === 'retirada' ? 'retirada' : 'delivery',
      cliente_endereco: order.endereco_rua
        ? {
            logradouro: order.endereco_rua,
            bairro: order.endereco_bairro || undefined,
            complemento: order.endereco_complemento || undefined,
          }
        : null,
      forma_pagamento: 'online',
      troco_para: null,
      observacoes: order.observacoes || null,
      total: Number(order.total),
      subtotal: Number(order.total),
      taxa_entrega: 0,
      desconto: 0,
      cupom_codigo: null,
      tempo_estimado: null,
      created_at: order.created_at,
    },
    itens: items.map((item) => ({
      nome_produto: item.nome_snapshot,
      quantidade: item.quantidade,
      preco_total: Number(item.preco_snapshot) * item.quantidade,
      personalizacao: null,
      observacoes: item.observacao || null,
    })),
  }

  const mensagem = formatarPedidoWhatsApp(dadosPedido as never)
  const mensagemComPagamento = mensagem.replace(
    '💳 *PAGAMENTO*\n',
    '💳 *PAGAMENTO*\n✅ *PAGO ONLINE via Mercado Pago*\n'
  )

  return gerarLinkWhatsApp(restaurant.telefone, mensagemComPagamento)
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
      mp_payment_id: payment.id ?? null,
      mp_status: payment.status ?? null,
      payment_method: payment.payment_method_id ?? null,
    },
  })

  if (error) {
    log.warn('Falha ao gravar audit log do finalizador de pagamento', {
      payment_id: paymentRow.id,
      order_id: paymentRow.order_id,
      error: error.message,
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
      mp_payment_id: input.payment.id ?? null,
      mp_status: input.payment.status ?? null,
      payment_method: input.payment.payment_method_id ?? null,
    },
  })

  if (error) {
    log.warn('Falha ao gravar audit log crítico de reconciliação delivery', {
      payment_id: paymentRow.id,
      order_id: paymentRow.order_id,
      error: error.message,
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

  // ── Check de estado final: já está no destino → noop ──
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
    log.warn('Finalização já em andamento, ignorando chamada concorrente', {
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

    const alreadyAtTargetAfterLock =
      paymentRow.status === targetStatus &&
      normalizeReconciliationStatus(paymentRow.reconciliation_status) === 'synced' &&
      ((targetStatus === 'approved' && order.status === 'confirmed') ||
        (targetStatus === 'rejected' && order.status === 'cancelled') ||
        targetStatus === 'pending')

    if (alreadyAtTargetAfterLock) {
      return {
        orderId,
        paymentId: paymentRow.id,
        finalPaymentStatus: targetStatus,
        orderStatus: order.status,
        alreadyFinalized: true,
        whatsappSent: Boolean(paymentRow.whatsapp_sent),
      }
    }

    if (
      targetStatus === 'approved' &&
      !amountsMatch(paymentRow.amount, payment.transaction_amount)
    ) {
      log.error('Divergência de valor em pagamento aprovado de delivery', undefined, {
        order_id: orderId,
        delivery_payment_id: paymentRow.id,
        expected_amount: paymentRow.amount,
        received_amount: payment.transaction_amount ?? null,
        mp_payment_id: payment.id ?? null,
      })
      throw new Error('Valor do pagamento divergente do pedido')
    }

    const nextMetadata = {
      ...metadata,
      mp_status: payment.status ?? null,
      mp_status_detail: payment.status_detail ?? null,
      mp_payment_type: payment.payment_type_id ?? null,
      mp_payer_email: payment.payer?.email ?? null,
      finalize_last_run_at: new Date().toISOString(),
      finalize_source: source,
    }

    const { error } = await admin
      .from('delivery_payments')
      .update({
        status: targetStatus,
        mp_payment_id: payment.id?.toString() || null,
        payment_method_used: payment.payment_method_id || null,
        paid_at:
          targetStatus === 'approved'
            ? paymentRow.paid_at || payment.date_approved || new Date().toISOString()
            : paymentRow.paid_at,
        metadata: nextMetadata,
      })
      .eq('id', paymentRow.id)

    if (error) {
      throw new Error(`Falha ao atualizar payment ${paymentRow.id}: ${error.message}`)
    }

    let finalOrderStatus = order.status

    if (targetStatus === 'approved' && ['pending', 'cancelled'].includes(order.status)) {
      const { error } = await admin
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id)
      if (error) {
        throw new Error(`Falha ao confirmar pedido ${order.id}: ${error.message}`)
      }
      finalOrderStatus = 'confirmed'
    }

    if (targetStatus === 'rejected' && order.status === 'pending') {
      const { error } = await admin
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)
      if (error) {
        throw new Error(`Falha ao cancelar pedido ${order.id}: ${error.message}`)
      }
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
            log.warn('Falha ao persistir link de WhatsApp do pagamento delivery', {
              order_id: orderId,
              payment_id: paymentRow.id,
              error: error.message,
            })
            anomalyFlag = true
            anomalyCode = 'whatsapp_post_payment_failed'
          } else {
            whatsappSent = true
          }
        }
      } catch (error) {
        log.warn('Falha desacoplada ao gerar WhatsApp de pagamento delivery', {
          order_id: orderId,
          payment_id: paymentRow.id,
          error: error instanceof Error ? error.message : String(error),
          site_url: siteUrl,
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

    const alreadyFinalized = paymentRow.status === targetStatus && finalOrderStatus === order.status

    log.info('Pagamento de delivery finalizado', {
      order_id: orderId,
      payment_id: paymentRow.id,
      mp_payment_id: payment.id ?? null,
      final_payment_status: targetStatus,
      final_order_status: finalOrderStatus,
      already_finalized: alreadyFinalized,
      whatsapp_sent: whatsappSent,
      source,
    })

    return {
      orderId,
      paymentId: paymentRow.id,
      finalPaymentStatus: targetStatus,
      orderStatus: finalOrderStatus,
      alreadyFinalized,
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
    }).catch((reconciliationError) => {
      log.error('Falha ao persistir estado failed de reconciliação delivery', reconciliationError, {
        order_id: orderId,
        payment_id: paymentRow.id,
      })
    })

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

async function fetchMercadoPagoPaymentByExternalReference(externalReference: string) {
  const accessToken = getMercadoPagoAccessToken()
  const params = new URLSearchParams({
    external_reference: externalReference,
    sort: 'date_created',
    criteria: 'desc',
    limit: '1',
  })

  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    }
  )

  if (!response.ok) {
    throw new Error(`Falha ao consultar Mercado Pago (${response.status})`)
  }

  const body = (await response.json()) as { results?: Array<Record<string, unknown>> }
  const result = body.results?.[0]

  if (!result) {
    return null
  }

  return {
    id: typeof result.id === 'number' ? result.id : Number(result.id ?? 0),
    status: typeof result.status === 'string' ? result.status : null,
    status_detail: typeof result.status_detail === 'string' ? result.status_detail : null,
    transaction_amount:
      typeof result.transaction_amount === 'number'
        ? result.transaction_amount
        : Number(result.transaction_amount ?? NaN),
    payment_method_id:
      typeof result.payment_method_id === 'string' ? result.payment_method_id : null,
    payment_type_id: typeof result.payment_type_id === 'string' ? result.payment_type_id : null,
    date_approved: typeof result.date_approved === 'string' ? result.date_approved : null,
    payer:
      result.payer && typeof result.payer === 'object'
        ? { email: typeof result.payer['email'] === 'string' ? result.payer['email'] : null }
        : null,
    external_reference,
  } satisfies DeliveryPaymentSnapshot
}

async function fetchMercadoPagoPaymentSnapshot(paymentRow: DeliveryPaymentRow) {
  const paymentClient = createMercadoPagoPaymentClient()

  if (paymentRow.mp_payment_id) {
    const payment = await paymentClient.get({ id: paymentRow.mp_payment_id })
    return {
      id: typeof payment.id === 'number' ? payment.id : Number(payment.id ?? 0),
      status: payment.status,
      status_detail: payment.status_detail,
      transaction_amount: payment.transaction_amount,
      payment_method_id: payment.payment_method_id,
      payment_type_id: payment.payment_type_id,
      date_approved: payment.date_approved,
      payer: payment.payer,
      external_reference:
        typeof payment.external_reference === 'string' ? payment.external_reference : null,
    } satisfies DeliveryPaymentSnapshot
  }

  const metadata = toMetadata(paymentRow.metadata)
  const externalReference =
    typeof metadata.external_reference === 'string'
      ? metadata.external_reference
      : `delivery:${paymentRow.order_id}`

  return fetchMercadoPagoPaymentByExternalReference(externalReference)
}

export async function reconcilePendingDeliveryPayments(input?: {
  limit?: number
  siteUrl?: string
}): Promise<ReconcilePendingDeliveryPaymentsResult> {
  const admin = createAdminClient()
  const limit = input?.limit ?? 50
  const siteUrl = input?.siteUrl ?? getSiteUrl()

  const { data, error } = await admin
    .from('delivery_payments')
    .select(
      'id, restaurant_id, order_id, amount, status, mp_preference_id, mp_payment_id, payment_method_used, paid_at, whatsapp_sent, metadata'
    )
    .or('status.eq.pending,reconciliation_status.eq.pending,reconciliation_status.eq.failed')
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Falha ao carregar pagamentos pendentes: ${error.message}`)
  }

  const rows = (data ?? []) as DeliveryPaymentRow[]
  const eligibleRows = rows.filter((row) =>
    shouldRetryDeliveryPaymentRow({
      status: row.status,
      reconciliationStatus: row.reconciliation_status,
      anomalyCode: row.anomaly_code,
      reconciliationAttempts: row.reconciliation_attempts,
      lastReconciliationAt: row.last_reconciliation_at,
    })
  )
  const details: ReconcilePendingDeliveryPaymentsResult['details'] = []
  let finalized = 0
  let stillPending = 0
  let notFound = 0
  let failed = 0

  for (const row of eligibleRows) {
    try {
      const snapshot = await fetchMercadoPagoPaymentSnapshot(row)

      if (!snapshot) {
        await updateDeliveryPaymentReconciliationState(admin, row.id, {
          status: 'failed',
          errorMessage: 'Pagamento não encontrado no gateway durante reconciliação',
          anomalyCode: 'gateway_payment_not_found',
          anomalyFlag: true,
        })

        notFound += 1
        details.push({
          orderId: row.order_id,
          paymentId: row.id,
          action: 'not_found',
        })
        continue
      }

      const normalized = normalizePaymentStatus(snapshot.status)
      if (normalized === 'pending') {
        stillPending += 1
        details.push({
          orderId: row.order_id,
          paymentId: row.id,
          action: 'pending',
          status: snapshot.status ?? null,
        })
        continue
      }

      await finalizeDeliveryPayment({
        orderId: row.order_id,
        payment: snapshot,
        siteUrl,
        source: 'cron',
      })

      finalized += 1
      details.push({
        orderId: row.order_id,
        paymentId: row.id,
        action: 'finalized',
        status: snapshot.status ?? null,
      })
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : String(error)
      const anomalyCode = classifyDeliveryPaymentFailure(error)

      await updateDeliveryPaymentReconciliationState(admin, row.id, {
        status: 'failed',
        errorMessage: message,
        anomalyCode,
        anomalyFlag: true,
      }).catch(() => {})

      await writeReconciliationFailureAuditLog(admin, row, {
        source: 'cron',
        anomalyCode,
        errorMessage: message,
        payment: {
          status: null,
          external_reference: `delivery:${row.order_id}`,
        },
      })

      log.error('Falha na reconciliação de pagamento delivery', error, {
        order_id: row.order_id,
        payment_id: row.id,
      })
      details.push({
        orderId: row.order_id,
        paymentId: row.id,
        action: 'failed',
        error: message,
      })
    }
  }

  return {
    checked: eligibleRows.length,
    finalized,
    stillPending,
    notFound,
    failed,
    details,
  }
}

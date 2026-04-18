import {
  createMercadoPagoPaymentClient,
  getMercadoPagoAccessToken,
} from '@/lib/domains/core/mercadopago'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { createDomainLogger } from '@/lib/shared/domain-logger'
import { formatarPedidoWhatsApp, gerarLinkWhatsApp } from '@/modules/whatsapp'

const log = createDomainLogger('core')

type AdminClient = ReturnType<typeof createAdminClient>

export type DeliveryPaymentPostCommitTaskType =
  | 'audit_log_finalize'
  | 'audit_log_reconciliation_failed'
  | 'whatsapp_post_payment'

export const DELIVERY_PAYMENT_POST_COMMIT_MAX_ATTEMPTS = 3
export const DELIVERY_PAYMENT_POST_COMMIT_BACKOFF_MINUTES = 15

type DeliveryPaymentPostCommitQueueRow = {
  id: string
  payment_id: string
  restaurant_id: string
  order_id: string
  task_type: DeliveryPaymentPostCommitTaskType
  dedupe_key: string
  status: 'pending' | 'completed' | 'failed'
  payload: Record<string, unknown> | null
  retry_attempts: number
  max_attempts: number
  next_retry_at: string
  last_error: string | null
  escalated_at: string | null
}

type DeliveryPaymentRow = {
  id: string
  restaurant_id: string
  order_id: string
  anomaly_flag: boolean | null
  anomaly_code: string | null
  whatsapp_sent: boolean | null
  whatsapp_link: string | null
  metadata: Record<string, unknown> | null
}

type DeliveryPaymentSnapshot = {
  id?: number | null
  status?: string | null
  payment_method_id?: string | null
}

type AuditFinalizePayload = {
  action:
    | 'delivery_payment_finalize_approved'
    | 'delivery_payment_finalize_rejected'
    | 'delivery_payment_finalize_pending'
  payment: DeliveryPaymentSnapshot
}

type AuditFailurePayload = {
  action: 'delivery_payment_reconciliation_failed'
  source: 'webhook' | 'cron' | 'manual'
  anomalyCode: string
  errorMessage: string
  payment: DeliveryPaymentSnapshot
}

type WhatsAppPayload = {
  action: 'whatsapp_post_payment'
}

type DeliveryPaymentPostCommitPayload = AuditFinalizePayload | AuditFailurePayload | WhatsAppPayload

export interface EnqueueDeliveryPaymentPostCommitTaskInput {
  paymentId: string
  restaurantId: string
  orderId: string
  taskType: DeliveryPaymentPostCommitTaskType
  dedupeKey: string
  payload: DeliveryPaymentPostCommitPayload
}

export interface ProcessDeliveryPaymentPostCommitQueueResult {
  checked: number
  completed: number
  failed: number
  escalated: number
  details: Array<{
    queueId: string
    paymentId: string
    taskType: DeliveryPaymentPostCommitTaskType
    action: 'completed' | 'failed' | 'escalated'
    error?: string
  }>
}

function toRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function buildNextRetryAt(retryAttempts: number, baseDate = new Date()) {
  const effectiveAttempts = Math.max(retryAttempts, 1)
  return new Date(
    baseDate.getTime() +
      effectiveAttempts * DELIVERY_PAYMENT_POST_COMMIT_BACKOFF_MINUTES * 60 * 1000
  ).toISOString()
}

export function shouldRetryDeliveryPaymentPostCommitTask(input: {
  status: 'pending' | 'completed' | 'failed' | null | undefined
  retryAttempts: number
  maxAttempts?: number | null
  nextRetryAt?: string | null
  now?: Date | string
}) {
  if (input.status !== 'pending') {
    return false
  }

  const maxAttempts = input.maxAttempts ?? DELIVERY_PAYMENT_POST_COMMIT_MAX_ATTEMPTS
  if (input.retryAttempts >= maxAttempts) {
    return false
  }

  if (!input.nextRetryAt) {
    return true
  }

  const now =
    input.now instanceof Date ? input.now.getTime() : new Date(input.now ?? Date.now()).getTime()
  return new Date(input.nextRetryAt).getTime() <= now
}

export async function enqueueDeliveryPaymentPostCommitTask(
  admin: AdminClient,
  input: EnqueueDeliveryPaymentPostCommitTaskInput
) {
  const nowIso = new Date().toISOString()
  const { error } = await admin.from('delivery_payment_post_commit_queue').upsert(
    {
      payment_id: input.paymentId,
      restaurant_id: input.restaurantId,
      order_id: input.orderId,
      task_type: input.taskType,
      dedupe_key: input.dedupeKey,
      payload: input.payload,
      status: 'pending',
      next_retry_at: nowIso,
      resolved_at: null,
      updated_at: nowIso,
    },
    { onConflict: 'dedupe_key', ignoreDuplicates: false }
  )

  if (error) {
    throw error
  }
}

async function loadDeliveryPayment(admin: AdminClient, paymentId: string) {
  const { data, error } = await admin
    .from('delivery_payments')
    .select(
      'id, restaurant_id, order_id, anomaly_flag, anomaly_code, whatsapp_sent, whatsapp_link, metadata'
    )
    .eq('id', paymentId)
    .single()

  if (error || !data) {
    throw new Error(`Pagamento de delivery não encontrado pelo id ${paymentId}`)
  }

  return data as DeliveryPaymentRow
}

export async function buildWhatsAppLinkAfterPayment(
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

async function processAuditLogFinalizeTask(
  admin: AdminClient,
  queueRow: DeliveryPaymentPostCommitQueueRow,
  payload: AuditFinalizePayload
) {
  const existing = await admin
    .from('audit_logs')
    .select('id')
    .eq('resource_id', queueRow.payment_id)
    .eq('action', payload.action)
    .contains('metadata', { queue_id: queueRow.id })
    .maybeSingle()

  if (existing.data?.id) {
    return
  }

  const { error } = await admin.from('audit_logs').insert({
    actor: 'system',
    action: payload.action,
    resource_type: 'delivery_payments',
    resource_id: queueRow.payment_id,
    restaurant_id: queueRow.restaurant_id,
    metadata: {
      order_id: queueRow.order_id,
      queue_id: queueRow.id,
      mp_payment_id: payload.payment.id ?? null,
      mp_status: payload.payment.status ?? null,
      payment_method: payload.payment.payment_method_id ?? null,
    },
  })

  if (error) {
    throw error
  }
}

async function processAuditLogFailureTask(
  admin: AdminClient,
  queueRow: DeliveryPaymentPostCommitQueueRow,
  payload: AuditFailurePayload
) {
  const existing = await admin
    .from('audit_logs')
    .select('id')
    .eq('resource_id', queueRow.payment_id)
    .eq('action', payload.action)
    .contains('metadata', { queue_id: queueRow.id })
    .maybeSingle()

  if (existing.data?.id) {
    return
  }

  const { error } = await admin.from('audit_logs').insert({
    actor: 'system',
    action: payload.action,
    resource_type: 'delivery_payments',
    resource_id: queueRow.payment_id,
    restaurant_id: queueRow.restaurant_id,
    metadata: {
      order_id: queueRow.order_id,
      queue_id: queueRow.id,
      source: payload.source,
      anomaly_code: payload.anomalyCode,
      error_message: payload.errorMessage,
      mp_payment_id: payload.payment.id ?? null,
      mp_status: payload.payment.status ?? null,
      payment_method: payload.payment.payment_method_id ?? null,
    },
  })

  if (error) {
    throw error
  }
}

async function processWhatsAppPostPaymentTask(
  admin: AdminClient,
  queueRow: DeliveryPaymentPostCommitQueueRow
) {
  const paymentRow = await loadDeliveryPayment(admin, queueRow.payment_id)
  if (paymentRow.whatsapp_sent && paymentRow.whatsapp_link) {
    return
  }

  const whatsappLink = await buildWhatsAppLinkAfterPayment(
    admin,
    queueRow.order_id,
    queueRow.restaurant_id
  )

  if (!whatsappLink) {
    throw new Error('Link de WhatsApp pós-pagamento não pôde ser gerado')
  }

  const metadata = toRecord(paymentRow.metadata)
  const { error } = await admin
    .from('delivery_payments')
    .update({
      whatsapp_sent: true,
      whatsapp_link: whatsappLink,
      whatsapp_sent_at: new Date().toISOString(),
      anomaly_flag:
        paymentRow.anomaly_code === 'whatsapp_post_payment_failed'
          ? false
          : paymentRow.anomaly_flag,
      anomaly_code:
        paymentRow.anomaly_code === 'whatsapp_post_payment_failed' ? null : paymentRow.anomaly_code,
    })
    .eq('id', queueRow.payment_id)

  if (error) {
    throw error
  }
}

async function processQueueRow(admin: AdminClient, queueRow: DeliveryPaymentPostCommitQueueRow) {
  const payload = toRecord(queueRow.payload) as DeliveryPaymentPostCommitPayload

  if (queueRow.task_type === 'audit_log_finalize') {
    await processAuditLogFinalizeTask(admin, queueRow, payload as AuditFinalizePayload)
    return
  }

  if (queueRow.task_type === 'audit_log_reconciliation_failed') {
    await processAuditLogFailureTask(admin, queueRow, payload as AuditFailurePayload)
    return
  }

  if (queueRow.task_type === 'whatsapp_post_payment') {
    await processWhatsAppPostPaymentTask(admin, queueRow)
    return
  }

  throw new Error(`Task pós-commit não suportada: ${queueRow.task_type}`)
}

async function markQueueTaskCompleted(
  admin: AdminClient,
  queueRow: DeliveryPaymentPostCommitQueueRow
) {
  const nowIso = new Date().toISOString()
  const { error } = await admin
    .from('delivery_payment_post_commit_queue')
    .update({
      status: 'completed',
      last_error: null,
      resolved_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', queueRow.id)

  if (error) {
    throw error
  }
}

async function registerQueueTaskRetry(
  admin: AdminClient,
  queueRow: DeliveryPaymentPostCommitQueueRow,
  error: unknown
) {
  const now = new Date()
  const nowIso = now.toISOString()
  const errorMessage = normalizeErrorMessage(error)
  const retryAttempts = Math.min((queueRow.retry_attempts ?? 0) + 1, queueRow.max_attempts)
  const manualReviewRequired = retryAttempts >= queueRow.max_attempts
  const nextRetryAt = manualReviewRequired ? nowIso : buildNextRetryAt(retryAttempts, now)

  const { error: queueError } = await admin
    .from('delivery_payment_post_commit_queue')
    .update({
      status: manualReviewRequired ? 'failed' : 'pending',
      retry_attempts: retryAttempts,
      next_retry_at: nextRetryAt,
      last_attempt_at: nowIso,
      last_error: errorMessage,
      escalated_at:
        manualReviewRequired && !queueRow.escalated_at ? nowIso : (queueRow.escalated_at ?? null),
      updated_at: nowIso,
    })
    .eq('id', queueRow.id)

  if (queueError) {
    throw queueError
  }

  if (manualReviewRequired && !queueRow.escalated_at) {
    const { error: alertError } = await admin.from('system_alerts').insert({
      severity: 'warning',
      channel: 'delivery_payment_post_commit',
      title: 'Retry pós-commit de pagamento delivery esgotado',
      body: `Pagamento ${queueRow.payment_id} esgotou retries da tarefa ${queueRow.task_type}.`,
      metadata: {
        queue_id: queueRow.id,
        payment_id: queueRow.payment_id,
        order_id: queueRow.order_id,
        task_type: queueRow.task_type,
        retry_attempts: retryAttempts,
        last_error: errorMessage,
      },
    })

    if (alertError) {
      throw alertError
    }
  }

  return {
    retryAttempts,
    manualReviewRequired,
  }
}

export async function processDeliveryPaymentPostCommitQueue(input?: { limit?: number }) {
  const admin = createAdminClient()
  const limit = input?.limit ?? 50
  const nowIso = new Date().toISOString()
  const { data, error } = await admin
    .from('delivery_payment_post_commit_queue')
    .select(
      'id, payment_id, restaurant_id, order_id, task_type, dedupe_key, status, payload, retry_attempts, max_attempts, next_retry_at, last_error, escalated_at'
    )
    .eq('status', 'pending')
    .order('next_retry_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw error
  }

  const eligibleRows = ((data ?? []) as DeliveryPaymentPostCommitQueueRow[]).filter((row) =>
    shouldRetryDeliveryPaymentPostCommitTask({
      status: row.status,
      retryAttempts: row.retry_attempts,
      maxAttempts: row.max_attempts,
      nextRetryAt: row.next_retry_at,
      now: nowIso,
    })
  )

  const result: ProcessDeliveryPaymentPostCommitQueueResult = {
    checked: eligibleRows.length,
    completed: 0,
    failed: 0,
    escalated: 0,
    details: [],
  }

  for (const row of eligibleRows) {
    try {
      await processQueueRow(admin, row)
      await markQueueTaskCompleted(admin, row)
      result.completed += 1
      result.details.push({
        queueId: row.id,
        paymentId: row.payment_id,
        taskType: row.task_type,
        action: 'completed',
      })
    } catch (error) {
      const retryState = await registerQueueTaskRetry(admin, row, error)
      if (retryState.manualReviewRequired) {
        result.escalated += 1
        result.details.push({
          queueId: row.id,
          paymentId: row.payment_id,
          taskType: row.task_type,
          action: 'escalated',
          error: normalizeErrorMessage(error),
        })
      } else {
        result.failed += 1
        result.details.push({
          queueId: row.id,
          paymentId: row.payment_id,
          taskType: row.task_type,
          action: 'failed',
          error: normalizeErrorMessage(error),
        })
      }
    }
  }

  return result
}

export async function fetchMercadoPagoPaymentByExternalReference(externalReference: string) {
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

  const paymentClient = createMercadoPagoPaymentClient()
  if (typeof result.id === 'number' || typeof result.id === 'string') {
    return paymentClient.get({ id: result.id })
  }

  return null
}

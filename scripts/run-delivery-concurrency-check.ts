import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import {
  finalizeDeliveryPayment,
  type DeliveryPaymentSnapshot,
} from '@/lib/domains/payments/finalize-delivery-payment'
import { flushDomainLogs } from '@/lib/shared/domain-logger'

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function ensureEnvironment() {
  const rootDir = process.cwd()
  loadEnvFile(path.join(rootDir, '.env.local'))
  loadEnvFile(path.join(rootDir, '.env.production'))

  const missing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
      ? 'SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY'
      : null,
  ].filter(Boolean)

  if (missing.length > 0) {
    throw new Error(`Variáveis ausentes: ${missing.join(', ')}`)
  }
}

function getArg(name: string) {
  const direct = process.argv.find((arg) => arg.startsWith(`--${name}=`))
  if (!direct) {
    return null
  }

  return direct.slice(name.length + 3)
}

async function resolveTestRestaurant(admin: ReturnType<typeof createAdminClient>, slug?: string) {
  let query = admin
    .from('restaurants')
    .select('id, nome, slug')
    .eq('ativo', true)
    .order('created_at', { ascending: false })
    .limit(1)

  if (slug) {
    query = query.eq('slug', slug)
  } else {
    query = query.ilike('slug', 'ship-mode-%')
  }

  const { data, error } = await query.single()

  if (error || !data) {
    throw new Error(
      slug
        ? `Delivery de teste não encontrado para o slug ${slug}`
        : 'Nenhum delivery de teste ship-mode encontrado'
    )
  }

  return data
}

async function getProducts(admin: ReturnType<typeof createAdminClient>, restaurantId: string) {
  const { data, error } = await admin
    .from('products')
    .select('id, nome, preco')
    .eq('restaurant_id', restaurantId)
    .eq('ativo', true)
    .limit(2)

  if (error || !data || data.length === 0) {
    throw new Error('Delivery de teste sem produtos ativos suficientes')
  }

  return data
}

async function getNextOrderNumber(
  admin: ReturnType<typeof createAdminClient>,
  restaurantId: string
) {
  const { data, error } = await admin
    .from('orders')
    .select('numero_pedido')
    .eq('restaurant_id', restaurantId)
    .order('numero_pedido', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Falha ao obter próximo número do pedido: ${error.message}`)
  }

  return (data?.numero_pedido ?? 0) + 1
}

async function getGateSnapshot(admin: ReturnType<typeof createAdminClient>) {
  const { data, error } = await admin.from('financial_anomalies').select('severity')

  if (error) {
    throw new Error(`Falha ao consultar financial_anomalies: ${error.message}`)
  }

  const anomalies = data ?? []
  const criticalCount = anomalies.filter((row) => row.severity === 'critical').length
  const warningCount = anomalies.filter((row) => row.severity === 'warning').length

  return {
    critical_count: criticalCount,
    warning_count: warningCount,
    can_deploy_financial: criticalCount === 0,
    gate_status: criticalCount > 0 ? 'FAIL' : warningCount > 0 ? 'PASS_WITH_WARNING' : 'PASS',
  }
}

async function main() {
  ensureEnvironment()
  const admin = createAdminClient()
  const slug = getArg('slug') ?? undefined
  const keepArtifacts = process.argv.includes('--keep-artifacts')
  const unique = Date.now().toString(36)

  let orderId: string | null = null
  let paymentId: string | null = null
  let auditLogIds: string[] = []

  try {
    const restaurant = await resolveTestRestaurant(admin, slug)
    const products = await getProducts(admin, restaurant.id)
    const nextOrderNumber = await getNextOrderNumber(admin, restaurant.id)
    const total = products.reduce((sum, product) => sum + Number(product.preco), 0)

    const beforeGate = await getGateSnapshot(admin)

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        restaurant_id: restaurant.id,
        numero_pedido: nextOrderNumber,
        cliente_nome: `Teste Concorrencia ${unique}`,
        cliente_telefone: '11999999999',
        tipo_entrega: 'retirada',
        origem_pedido: 'online',
        forma_pagamento: 'online',
        total,
        status: 'pending',
        observacoes: `Teste controlado de concorrencia ${unique}`,
      })
      .select('id, numero_pedido, status, total, restaurant_id')
      .single()

    if (orderError || !order) {
      throw new Error(`Falha ao criar pedido de teste: ${orderError?.message}`)
    }

    orderId = order.id

    const { error: orderItemsError } = await admin.from('order_items').insert(
      products.map((product) => ({
        order_id: order.id,
        product_id: product.id,
        nome_snapshot: product.nome,
        preco_snapshot: Number(product.preco),
        quantidade: 1,
      }))
    )

    if (orderItemsError) {
      throw new Error(`Falha ao criar itens do pedido: ${orderItemsError.message}`)
    }

    const { data: payment, error: paymentError } = await admin
      .from('delivery_payments')
      .insert({
        restaurant_id: restaurant.id,
        order_id: order.id,
        mp_preference_id: `hardening-pref-${unique}`,
        checkout_url: 'https://example.invalid/checkout',
        sandbox_checkout_url: null,
        amount: total,
        status: 'pending',
        metadata: {
          external_reference: `delivery:${order.id}`,
          restaurant_slug: restaurant.slug,
          restaurant_name: restaurant.nome,
          order_number: order.numero_pedido,
          customer_name: `Teste Concorrencia ${unique}`,
          customer_phone: '11999999999',
          sandbox: false,
          created_by: 'run-delivery-concurrency-check',
        },
      })
      .select('id')
      .single()

    if (paymentError || !payment) {
      throw new Error(`Falha ao criar delivery_payment de teste: ${paymentError?.message}`)
    }

    paymentId = payment.id

    const approvedPayment: DeliveryPaymentSnapshot = {
      id: 990001,
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: total,
      payment_method_id: 'pix',
      payment_type_id: 'bank_transfer',
      date_approved: new Date().toISOString(),
      payer: { email: 'hardening-test@zairyx.com' },
      external_reference: `delivery:${order.id}`,
    }

    const executionStartedAt = new Date().toISOString()

    const results = await Promise.allSettled([
      finalizeDeliveryPayment({
        orderId: order.id,
        payment: approvedPayment,
        source: 'webhook',
      }),
      finalizeDeliveryPayment({
        orderId: order.id,
        payment: approvedPayment,
        source: 'cron',
      }),
    ])

    await flushDomainLogs()

    const executionFinishedAt = new Date().toISOString()

    const { data: finalPayment, error: finalPaymentError } = await admin
      .from('delivery_payments')
      .select(
        'id, order_id, status, mp_payment_id, payment_method_used, paid_at, whatsapp_sent, metadata'
      )
      .eq('id', payment.id)
      .single()

    if (finalPaymentError || !finalPayment) {
      throw new Error(`Falha ao reler delivery_payment final: ${finalPaymentError?.message}`)
    }

    const { data: finalOrder, error: finalOrderError } = await admin
      .from('orders')
      .select('id, status, forma_pagamento, total, updated_at')
      .eq('id', order.id)
      .single()

    if (finalOrderError || !finalOrder) {
      throw new Error(`Falha ao reler pedido final: ${finalOrderError?.message}`)
    }

    const { data: auditLogs, error: auditLogError } = await admin
      .from('audit_logs')
      .select('id, action, resource_id, metadata, created_at')
      .eq('resource_id', payment.id)
      .order('created_at', { ascending: true })

    if (auditLogError) {
      throw new Error(`Falha ao consultar audit_logs: ${auditLogError.message}`)
    }

    auditLogIds = (auditLogs ?? []).map((log) => log.id)

    const { data: domainLogs, error: domainLogError } = await admin
      .from('domain_logs')
      .select('id, level, message, metadata, created_at')
      .contains('metadata', { order_id: order.id })
      .order('created_at', { ascending: true })

    if (domainLogError) {
      throw new Error(`Falha ao consultar domain_logs: ${domainLogError.message}`)
    }

    const afterGate = await getGateSnapshot(admin)

    const payload = {
      ok: true,
      restaurant: {
        id: restaurant.id,
        nome: restaurant.nome,
        slug: restaurant.slug,
      },
      evidence: {
        execution_started_at: executionStartedAt,
        execution_finished_at: executionFinishedAt,
        gate_before: beforeGate,
        gate_after: afterGate,
        order_final: finalOrder,
        delivery_payment_final: finalPayment,
        concurrent_results: results.map((result, index) => ({
          source: index === 0 ? 'webhook' : 'cron',
          status: result.status,
          value: result.status === 'fulfilled' ? result.value : null,
          reason: result.status === 'rejected' ? String(result.reason) : null,
        })),
        audit_logs: auditLogs ?? [],
        domain_logs: domainLogs ?? [],
      },
    }

    console.log(JSON.stringify(payload, null, 2))
  } finally {
    if (keepArtifacts) {
      return
    }

    if (auditLogIds.length > 0) {
      await admin.from('audit_logs').delete().in('id', auditLogIds)
    }

    if (paymentId) {
      await admin.from('delivery_payments').delete().eq('id', paymentId)
    }

    if (orderId) {
      await admin.from('order_items').delete().eq('order_id', orderId)
      await admin.from('orders').delete().eq('id', orderId)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})


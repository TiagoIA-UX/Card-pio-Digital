#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { createAdminClient } from '@/lib/shared/supabase/admin'

type PendingClassification =
  | 'likely_legitimate_pending'
  | 'capture_gap_suspected'
  | 'manual_state_mismatch'

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
    const rawValue = line.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

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

function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function classifyPending(params: {
  approvedOrderFound: boolean
  subscriptionStatus: string | null
  mpSubscriptionStatus: string | null
  lastPaymentDate: string | null
  restaurantActive: boolean | null
  restaurantPaymentStatus: string | null
}) {
  if (
    params.approvedOrderFound ||
    params.subscriptionStatus === 'active' ||
    params.mpSubscriptionStatus === 'authorized' ||
    Boolean(params.lastPaymentDate)
  ) {
    return 'capture_gap_suspected' as const
  }

  if (params.restaurantActive && params.restaurantPaymentStatus === 'pendente') {
    return 'manual_state_mismatch' as const
  }

  return 'likely_legitimate_pending' as const
}

async function main() {
  ensureEnvironment()
  const admin = createAdminClient()

  const [
    { data: pendingTruthRows, error: pendingError },
    { data: approvedOrders, error: ordersError },
    { data: restaurants, error: restaurantsError },
    { data: subscriptions, error: subscriptionsError },
  ] = await Promise.all([
    admin
      .from('financial_truth')
      .select('tenant_id, status, reason, source, last_event_at')
      .eq('status', 'pending'),
    admin
      .from('template_orders')
      .select('id, order_number, payment_status, status, metadata')
      .eq('payment_status', 'approved'),
    admin.from('restaurants').select('id, slug, nome, ativo, suspended, status_pagamento'),
    admin
      .from('subscriptions')
      .select(
        'restaurant_id, status, mp_subscription_status, last_payment_date, mp_preapproval_id, canceled_at, created_at'
      )
      .order('created_at', { ascending: false }),
  ])

  if (pendingError) {
    throw new Error(`Falha ao listar financial_truth pendente: ${pendingError.message}`)
  }

  if (ordersError) {
    throw new Error(`Falha ao listar template_orders aprovados: ${ordersError.message}`)
  }

  if (restaurantsError) {
    throw new Error(`Falha ao listar deliverys: ${restaurantsError.message}`)
  }

  if (subscriptionsError) {
    throw new Error(`Falha ao listar subscriptions: ${subscriptionsError.message}`)
  }

  const restaurantById = new Map((restaurants ?? []).map((row) => [row.id, row]))
  const subscriptionByRestaurantId = new Map<
    string,
    typeof subscriptions extends Array<infer T> ? T : never
  >()

  for (const subscription of subscriptions ?? []) {
    if (!subscription.restaurant_id || subscriptionByRestaurantId.has(subscription.restaurant_id)) {
      continue
    }

    subscriptionByRestaurantId.set(subscription.restaurant_id, subscription)
  }

  const approvedOrderByTenant = new Map<
    string,
    { order_id: string; order_number: string | null; status: string | null }[]
  >()

  for (const order of approvedOrders ?? []) {
    const metadata = asObject(order.metadata)
    const provisionedRestaurantId =
      typeof metadata?.provisioned_restaurant_id === 'string'
        ? metadata.provisioned_restaurant_id
        : null

    if (!provisionedRestaurantId) {
      continue
    }

    const current = approvedOrderByTenant.get(provisionedRestaurantId) ?? []
    current.push({
      order_id: order.id,
      order_number: typeof order.order_number === 'string' ? order.order_number : null,
      status: typeof order.status === 'string' ? order.status : null,
    })
    approvedOrderByTenant.set(provisionedRestaurantId, current)
  }

  const rows = (pendingTruthRows ?? []).map((row) => {
    const restaurant = restaurantById.get(row.tenant_id) ?? null
    const subscription = subscriptionByRestaurantId.get(row.tenant_id) ?? null
    const approvedOrdersForTenant = approvedOrderByTenant.get(row.tenant_id) ?? []

    const classification = classifyPending({
      approvedOrderFound: approvedOrdersForTenant.length > 0,
      subscriptionStatus: subscription?.status ?? null,
      mpSubscriptionStatus: subscription?.mp_subscription_status ?? null,
      lastPaymentDate: subscription?.last_payment_date ?? null,
      restaurantActive: restaurant?.ativo ?? null,
      restaurantPaymentStatus: restaurant?.status_pagamento ?? null,
    })

    return {
      tenant_id: row.tenant_id,
      slug: restaurant?.slug ?? null,
      nome: restaurant?.nome ?? null,
      financial_reason: row.reason,
      restaurant_active: restaurant?.ativo ?? null,
      restaurant_suspended: restaurant?.suspended ?? null,
      restaurant_payment_status: restaurant?.status_pagamento ?? null,
      subscription_status: subscription?.status ?? null,
      mp_subscription_status: subscription?.mp_subscription_status ?? null,
      last_payment_date: subscription?.last_payment_date ?? null,
      mp_preapproval_id: subscription?.mp_preapproval_id ?? null,
      approved_orders: approvedOrdersForTenant,
      classification,
    }
  })

  const summary = rows.reduce(
    (acc, row) => {
      acc.total_pending += 1
      acc[row.classification] += 1
      return acc
    },
    {
      total_pending: 0,
      likely_legitimate_pending: 0,
      capture_gap_suspected: 0,
      manual_state_mismatch: 0,
    } satisfies Record<'total_pending' | PendingClassification, number>
  )

  console.log(
    JSON.stringify(
      {
        summary,
        rows,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  )
  process.exit(1)
})


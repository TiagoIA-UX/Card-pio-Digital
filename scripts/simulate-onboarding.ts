import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createAdminClient } from '@/lib/supabase/admin'
import { __internal as mercadoPagoWebhookInternal } from '@/app/api/webhook/mercadopago/route'

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

  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Variáveis ausentes para simulação: ${missing.join(', ')}`)
  }
}

async function main() {
  ensureEnvironment()
  const admin = createAdminClient()
  const unique = Date.now().toString(36)
  const testEmail = `shipmode-${unique}@example.com`
  const restaurantName = `Ship Mode Test ${unique}`
  const orderNumber = `SIM-${unique}`.toUpperCase()

  let orderId = ''
  let restaurantId: string | null = null
  let userId: string | null = null

  try {
    const { data: order, error: orderError } = await admin
      .from('template_orders')
      .insert({
        order_number: orderNumber,
        status: 'pending',
        subtotal: 247,
        total: 247,
        payment_method: 'pix',
        payment_status: 'pending',
        metadata: {
          checkout_type: 'restaurant_onboarding',
          template_slug: 'pizzaria',
          plan_slug: 'self-service',
          subscription_plan_slug: 'basico',
          customer_name: 'Ship Mode Tester',
          customer_email: testEmail,
          customer_phone: '11999999999',
          restaurant_name: restaurantName,
          restaurant_slug_base: `ship-mode-${unique}`,
          onboarding_status: 'awaiting_payment',
          activation_url: null,
          provisioned_restaurant_id: null,
          provisioned_restaurant_slug: null,
          owner_user_id: null,
        },
      })
      .select('id')
      .single()

    if (orderError || !order) {
      throw orderError || new Error('Falha ao criar pedido de simulação')
    }

    orderId = order.id

    await mercadoPagoWebhookInternal.processOnboardingPayment(
      admin,
      orderId,
      {
        id: 999001,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 247,
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
      },
      'http://localhost:3000'
    )

    await mercadoPagoWebhookInternal.processOnboardingPayment(
      admin,
      orderId,
      {
        id: 999001,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 247,
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer',
      },
      'http://localhost:3000'
    )

    const { data: updatedOrder, error: updatedOrderError } = await admin
      .from('template_orders')
      .select('status, payment_status, metadata')
      .eq('id', orderId)
      .single()

    if (updatedOrderError || !updatedOrder) {
      throw updatedOrderError || new Error('Falha ao reler pedido após simulação')
    }

    restaurantId = String(
      (updatedOrder.metadata as Record<string, unknown>).provisioned_restaurant_id || ''
    )
    userId = String((updatedOrder.metadata as Record<string, unknown>).owner_user_id || '')

    if (!restaurantId || !userId) {
      throw new Error('Provisionamento não gerou restaurant_id e owner_user_id')
    }

    const [{ data: restaurant }, { data: subscription }, { data: adminUser }, { data: events }] =
      await Promise.all([
        admin
          .from('restaurants')
          .select('id, slug, ativo, plan_slug')
          .eq('id', restaurantId)
          .single(),
        admin
          .from('subscriptions')
          .select('id, status, restaurant_id')
          .eq('restaurant_id', restaurantId)
          .single(),
        admin.from('admin_users').select('id, user_id, role').eq('user_id', userId).single(),
        admin
          .from('activation_events')
          .select('event_type')
          .eq('restaurant_id', restaurantId)
          .eq('event_type', 'onboarding_provisioned'),
      ])

    if (!restaurant?.ativo) {
      throw new Error('Restaurante não ficou ativo após provisioning')
    }

    if (subscription?.status !== 'active') {
      throw new Error('Assinatura não ficou ativa após provisioning')
    }

    if (!adminUser?.id) {
      throw new Error('Registro em admin_users não foi criado')
    }

    if ((events || []).length !== 1) {
      throw new Error('Evento onboarding_provisioned não está idempotente')
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          orderId,
          restaurantId,
          restaurantSlug: restaurant.slug,
          subscriptionStatus: subscription.status,
          adminRole: adminUser.role,
          activationEventCount: events?.length ?? 0,
        },
        null,
        2
      )
    )
  } finally {
    if (restaurantId) {
      await admin.from('activation_events').delete().eq('restaurant_id', restaurantId)
      await admin.from('subscriptions').delete().eq('restaurant_id', restaurantId)
      await admin.from('products').delete().eq('restaurant_id', restaurantId)
      await admin.from('restaurants').delete().eq('id', restaurantId)
    }

    if (orderId) {
      const { error: checkoutSessionDeleteError } = await admin
        .from('checkout_sessions')
        .delete()
        .eq('order_id', orderId)

      if (checkoutSessionDeleteError) {
        console.error(
          'Falha ao remover checkout_sessions de simulação:',
          checkoutSessionDeleteError
        )
      }

      await admin.from('template_orders').delete().eq('id', orderId)
    }

    if (userId) {
      await admin.from('admin_users').delete().eq('user_id', userId)
      await admin.auth.admin.deleteUser(userId).catch(() => undefined)
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

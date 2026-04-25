#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import crypto from 'node:crypto'

import { NextRequest } from 'next/server'

import {
  GET as getPaymentRecoveryMetricsRoute,
  POST as paymentRecoveryActionRoute,
} from '@/app/api/admin/payment-recovery/route'
import { POST as paymentRecoveryScanRoute } from '@/app/api/ops/payment-recovery/route'
import { createAdminClient } from '@/lib/shared/supabase/admin'

type JsonRecord = Record<string, unknown>

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
    !process.env.ADMIN_SECRET_KEY ? 'ADMIN_SECRET_KEY' : null,
  ].filter(Boolean)

  if (missing.length > 0) {
    throw new Error(`Variáveis ausentes: ${missing.join(', ')}`)
  }
}

function createAuthorizedRequest(url: string, method: 'GET' | 'POST', body?: JsonRecord) {
  return new NextRequest(url, {
    method,
    headers: {
      authorization: `Bearer ${process.env.ADMIN_SECRET_KEY}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

async function parseResponse(response: Response) {
  const data = (await response.json().catch(() => ({}))) as JsonRecord
  return {
    ok: response.ok,
    status: response.status,
    data,
  }
}

function stringify(value: unknown) {
  return JSON.stringify(value ?? {})
}

async function main() {
  ensureEnvironment()

  const admin = createAdminClient()
  const startedAt = new Date().toISOString()
  const testRunId = `payment-recovery-e2e-${Date.now()}`
  const orderId = crypto.randomUUID()
  const orderNumber = `CHK-TEST-${Date.now()}`
  const checkoutSessionId = crypto.randomUUID()
  const checkoutUrl = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${testRunId}`
  const note = `Teste controlado ${testRunId}`
  const alertIds: string[] = []
  const logIds: string[] = []

  const previousNotificationEnv = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  }

  process.env.RESEND_API_KEY = ''
  process.env.ALERT_WEBHOOK_URL = ''
  process.env.TELEGRAM_BOT_TOKEN = ''
  process.env.TELEGRAM_CHAT_ID = ''

  try {
    const { error: orderError } = await admin.from('template_orders').insert({
      id: orderId,
      user_id: null,
      order_number: orderNumber,
      status: 'pending',
      subtotal: 97,
      discount: 0,
      total: 97,
      payment_method: 'card',
      payment_status: 'rejected',
      metadata: {
        checkout_type: 'restaurant_onboarding',
        onboarding_status: 'payment_rejected',
        customer_name: 'Teste Recovery',
        customer_email: `${testRunId}@example.com`,
        customer_phone: '12999998888',
        restaurant_name: `Recovery Test ${testRunId}`,
        template_slug: 'pizzaria',
        plan_slug: 'self-service',
        test_run_id: testRunId,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (orderError) {
      throw new Error(`Falha ao criar template_order de teste: ${orderError.message}`)
    }

    const { error: checkoutError } = await admin.from('checkout_sessions').insert({
      id: checkoutSessionId,
      order_id: orderId,
      user_id: null,
      template_slug: 'pizzaria',
      onboarding_plan_slug: 'self-service',
      subscription_plan_slug: 'basico',
      payment_method: 'card',
      mp_preference_id: testRunId,
      status: 'rejected',
      init_point: checkoutUrl,
      sandbox_init_point: null,
      metadata: {
        test_run_id: testRunId,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (checkoutError) {
      throw new Error(`Falha ao criar checkout_session de teste: ${checkoutError.message}`)
    }

    const firstScan = await parseResponse(
      await paymentRecoveryScanRoute(
        createAuthorizedRequest('https://zairyx.com.br/api/ops/payment-recovery', 'POST', {
          lookbackDays: 7,
          cooldownHours: 24,
          forceNotify: false,
        })
      )
    )

    if (!firstScan.ok) {
      throw new Error(`Scan inicial falhou: HTTP ${firstScan.status} ${stringify(firstScan.data)}`)
    }

    const report = firstScan.data.report as JsonRecord | undefined
    const reportRows = Array.isArray(report?.rows) ? report.rows : []
    const foundOnScan = reportRows.some(
      (row) => row && typeof row === 'object' && (row as JsonRecord).order_id === orderId
    )

    if (!foundOnScan) {
      throw new Error('O scan inicial não encontrou o pedido sintético criado para o teste.')
    }

    const { data: alertsAfterScan, error: alertsError } = await admin
      .from('system_alerts')
      .select('id, resolved, title, body, metadata, created_at')
      .eq('channel', 'payment')
      .gte('created_at', startedAt)
      .order('created_at', { ascending: false })

    if (alertsError) {
      throw new Error(`Falha ao consultar system_alerts: ${alertsError.message}`)
    }

    const matchingAlert = (alertsAfterScan ?? []).find((alert) => {
      const haystack = `${alert.title || ''}\n${alert.body || ''}\n${stringify(alert.metadata)}`
      return (
        haystack.includes(orderId) || haystack.includes(orderNumber) || haystack.includes(testRunId)
      )
    })

    if (!matchingAlert?.id) {
      throw new Error('O alerta do caso sintético não foi registrado na Central de Alertas.')
    }

    alertIds.push(matchingAlert.id)

    const actionResponse = await parseResponse(
      await paymentRecoveryActionRoute(
        createAuthorizedRequest('https://zairyx.com.br/api/admin/payment-recovery', 'POST', {
          order_id: orderId,
          action: 'resend_payment_link',
          note,
          alert_id: matchingAlert.id,
        })
      )
    )

    if (!actionResponse.ok) {
      throw new Error(
        `Ação resend_payment_link falhou: HTTP ${actionResponse.status} ${stringify(actionResponse.data)}`
      )
    }

    const openUrl = String(actionResponse.data.open_url || '')
    if (!openUrl.includes('api.whatsapp.com/send')) {
      throw new Error('A ação principal não retornou um link de WhatsApp válido.')
    }

    const secondActionResponse = await parseResponse(
      await paymentRecoveryActionRoute(
        createAuthorizedRequest('https://zairyx.com.br/api/admin/payment-recovery', 'POST', {
          order_id: orderId,
          action: 'resend_payment_link',
          note,
        })
      )
    )

    if (secondActionResponse.status !== 409) {
      throw new Error(
        `Cooldown não bloqueou o segundo reenvio. Resposta: HTTP ${secondActionResponse.status} ${stringify(secondActionResponse.data)}`
      )
    }

    const secondScan = await parseResponse(
      await paymentRecoveryScanRoute(
        createAuthorizedRequest('https://zairyx.com.br/api/ops/payment-recovery', 'POST', {
          lookbackDays: 7,
          cooldownHours: 24,
          forceNotify: false,
        })
      )
    )

    if (!secondScan.ok) {
      throw new Error(
        `Scan pós-ação falhou: HTTP ${secondScan.status} ${stringify(secondScan.data)}`
      )
    }

    const secondScanReport = secondScan.data.report as JsonRecord | undefined
    if (Number(secondScanReport?.flagged_count ?? -1) !== 0) {
      throw new Error('O scan pós-ação ainda retornou o caso em cooldown como elegível.')
    }

    const { data: alertsAfterSecondScan, error: alertsAfterSecondScanError } = await admin
      .from('system_alerts')
      .select('id, title, body, metadata, created_at')
      .eq('channel', 'payment')
      .gte('created_at', startedAt)

    if (alertsAfterSecondScanError) {
      throw new Error(
        `Falha ao consultar alertas após o segundo scan: ${alertsAfterSecondScanError.message}`
      )
    }

    const repeatedAlerts = (alertsAfterSecondScan ?? []).filter((alert) => {
      const haystack = `${alert.title || ''}\n${alert.body || ''}\n${stringify(alert.metadata)}`
      return (
        haystack.includes(orderId) || haystack.includes(orderNumber) || haystack.includes(testRunId)
      )
    })

    if (repeatedAlerts.length !== 1) {
      throw new Error(
        'O segundo scan criou novo alerta para um caso que deveria ficar em cooldown.'
      )
    }

    const metricsResponse = await parseResponse(
      await getPaymentRecoveryMetricsRoute(
        createAuthorizedRequest(
          'https://zairyx.com.br/api/admin/payment-recovery?windowDays=30',
          'GET'
        )
      )
    )

    if (!metricsResponse.ok) {
      throw new Error(
        `Consulta de métricas falhou: HTTP ${metricsResponse.status} ${stringify(metricsResponse.data)}`
      )
    }

    const metrics = metricsResponse.data.metrics as JsonRecord | undefined
    if (Number(metrics?.actions_total ?? 0) < 1 || Number(metrics?.resend_actions ?? 0) < 1) {
      throw new Error('As métricas não refletiram a ação controlada executada no teste.')
    }

    const { data: checkoutAfterAction, error: checkoutAfterActionError } = await admin
      .from('checkout_sessions')
      .select('last_recovery_action_at, last_recovery_action_type, last_recovery_action_note')
      .eq('id', checkoutSessionId)
      .maybeSingle()

    if (checkoutAfterActionError) {
      throw new Error(
        `Falha ao validar checkout_session pós-ação: ${checkoutAfterActionError.message}`
      )
    }

    if (
      !checkoutAfterAction?.last_recovery_action_at ||
      checkoutAfterAction.last_recovery_action_type !== 'resend_payment_link' ||
      checkoutAfterAction.last_recovery_action_note !== note
    ) {
      throw new Error('O checkout_session não registrou corretamente a ação de recovery.')
    }

    const { data: recentLogs, error: recentLogsError } = await admin
      .from('system_logs')
      .select('id, action, created_at, metadata')
      .in('action', ['payment_recovery_scan', 'payment_recovery_action'])
      .gte('created_at', startedAt)
      .order('created_at', { ascending: false })

    if (recentLogsError) {
      throw new Error(`Falha ao consultar system_logs: ${recentLogsError.message}`)
    }

    const matchingLogs = (recentLogs ?? []).filter((log) => {
      const haystack = stringify(log.metadata)
      return (
        haystack.includes(orderId) || haystack.includes(orderNumber) || haystack.includes(testRunId)
      )
    })

    if (matchingLogs.length < 2) {
      throw new Error('Os logs esperados de scan/ação não foram encontrados para o caso sintético.')
    }

    logIds.push(...matchingLogs.map((log) => log.id))

    console.log(
      JSON.stringify(
        {
          ok: true,
          test_run_id: testRunId,
          order_id: orderId,
          order_number: orderNumber,
          first_scan: {
            flagged_count: report?.flagged_count ?? null,
            notified: firstScan.data.notified ?? null,
            suppressedDuplicate: firstScan.data.suppressedDuplicate ?? null,
          },
          action: {
            status: actionResponse.status,
            open_url: openUrl,
            cooldown_block_status: secondActionResponse.status,
          },
          second_scan: {
            flagged_count: secondScanReport?.flagged_count ?? null,
            notified: secondScan.data.notified ?? null,
            suppressedDuplicate: secondScan.data.suppressedDuplicate ?? null,
          },
          metrics,
          logs_found: matchingLogs.length,
          alert_id: matchingAlert.id,
        },
        null,
        2
      )
    )
  } finally {
    process.env.RESEND_API_KEY = previousNotificationEnv.RESEND_API_KEY
    process.env.ALERT_WEBHOOK_URL = previousNotificationEnv.ALERT_WEBHOOK_URL
    process.env.TELEGRAM_BOT_TOKEN = previousNotificationEnv.TELEGRAM_BOT_TOKEN
    process.env.TELEGRAM_CHAT_ID = previousNotificationEnv.TELEGRAM_CHAT_ID

    const { data: cleanupAlerts } = await admin
      .from('system_alerts')
      .select('id, title, body, metadata, created_at')
      .eq('channel', 'payment')
      .gte('created_at', startedAt)

    const additionalAlertIds = (cleanupAlerts ?? [])
      .filter((alert) => {
        const haystack = `${alert.title || ''}\n${alert.body || ''}\n${stringify(alert.metadata)}`
        return (
          haystack.includes(orderId) ||
          haystack.includes(orderNumber) ||
          haystack.includes(testRunId)
        )
      })
      .map((alert) => alert.id)

    if (additionalAlertIds.length > 0) {
      alertIds.push(...additionalAlertIds)
    }

    const uniqueAlertIds = Array.from(new Set(alertIds))
    if (uniqueAlertIds.length > 0) {
      await admin.from('system_alerts').delete().in('id', uniqueAlertIds)
    }

    const { data: cleanupLogs } = await admin
      .from('system_logs')
      .select('id, action, created_at, metadata')
      .in('action', ['payment_recovery_scan', 'payment_recovery_action'])
      .gte('created_at', startedAt)

    const additionalLogIds = (cleanupLogs ?? [])
      .filter((log) => {
        const haystack = stringify(log.metadata)
        return (
          haystack.includes(orderId) ||
          haystack.includes(orderNumber) ||
          haystack.includes(testRunId)
        )
      })
      .map((log) => log.id)

    if (additionalLogIds.length > 0) {
      logIds.push(...additionalLogIds)
    }

    const uniqueLogIds = Array.from(new Set(logIds))
    if (uniqueLogIds.length > 0) {
      await admin.from('system_logs').delete().in('id', uniqueLogIds)
    }

    await admin.from('checkout_sessions').delete().eq('id', checkoutSessionId)
    await admin.from('template_orders').delete().eq('id', orderId)
  }
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


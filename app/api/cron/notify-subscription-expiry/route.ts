import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'

function getDaysUntilBlock(alertType: string) {
  switch (alertType) {
    case 'warning_7days':
      return 7
    case 'critical_3days':
      return 3
    case 'blocked':
      return 0
    default:
      return 0
  }
}

async function handleNotifySubscriptionExpiry() {
  const supabase = createAdminClient()

  const { data: pendingAlerts, error: alertsError } = await supabase
    .from('subscription_alerts')
    .select('id, restaurant_id, alert_type, created_at')
    .is('whatsapp_response_status', null)
    .limit(50)

  if (alertsError) {
    console.error('[notify-subscription-expiry] Failed to fetch alerts:', alertsError)
    return NextResponse.json({ error: alertsError.message }, { status: 500 })
  }

  if (!pendingAlerts || pendingAlerts.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: 'No pending alerts',
    })
  }

  const results = await Promise.allSettled(
    pendingAlerts.map(async (alert) => {
      const { data: restaurant, error: fetchError } = await supabase
        .from('restaurants')
        .select('id, nome, nome_fantasia, whatsapp_para_pedidos')
        .eq('id', alert.restaurant_id)
        .single()

      if (fetchError || !restaurant?.whatsapp_para_pedidos) {
        console.warn(
          `[notify-subscription-expiry] No WhatsApp for restaurant ${alert.restaurant_id}`
        )
        await supabase
          .from('subscription_alerts')
          .update({ whatsapp_response_status: 'no_phone' })
          .eq('id', alert.id)
        return { alertId: alert.id, status: 'skipped', reason: 'no_phone' }
      }

      const restaurantName = restaurant.nome_fantasia || restaurant.nome || 'Seu delivery'
      const { data: messageData, error: messageError } = await supabase.rpc(
        'format_subscription_alert_message',
        {
          p_alert_type: alert.alert_type,
          p_restaurant_name: restaurantName,
          p_days_until_block: getDaysUntilBlock(alert.alert_type),
        }
      )

      if (messageError || !messageData) {
        console.error('[notify-subscription-expiry] Failed to format message:', messageError)
        await supabase
          .from('subscription_alerts')
          .update({ whatsapp_response_status: 'format_error' })
          .eq('id', alert.id)
        return { alertId: alert.id, status: 'failed', reason: 'format_error' }
      }

      const whatsappResult = await sendWhatsAppMessage(
        restaurant.whatsapp_para_pedidos,
        messageData
      )

      const updateStatus = whatsappResult.success ? 'sent' : 'failed'
      const { error: updateError } = await supabase
        .from('subscription_alerts')
        .update({
          whatsapp_response_status: updateStatus,
          whatsapp_response_code: whatsappResult.code,
          whatsapp_sent_at: new Date().toISOString(),
        })
        .eq('id', alert.id)

      if (updateError) {
        console.error('[notify-subscription-expiry] Failed to update alert:', updateError)
      }

      return {
        alertId: alert.id,
        restaurantId: alert.restaurant_id,
        status: updateStatus,
        message: whatsappResult.message,
      }
    })
  )

  const processed = results.filter((r) => r.status === 'fulfilled').length
  const sent = results.filter((r) => r.status === 'fulfilled' && r.value.status === 'sent').length
  const failed = results.filter(
    (r) => r.status === 'fulfilled' && r.value.status === 'failed'
  ).length

  console.log(
    `[notify-subscription-expiry] Processed: ${processed}, Sent: ${sent}, Failed: ${failed}`
  )

  return NextResponse.json({
    success: true,
    processed,
    sent,
    failed,
    details: results,
  })
}

/**
 * CRON: Notify subscription expiry via WhatsApp
 *
 * Runs every 6 hours to send subscription alerts:
 * - Day 84: "7 days until blocking"
 * - Day 88: "3 days until blocking"
 * - Day 90: "BLOCKED - no access"
 *
 * GET /api/cron/notify-subscription-expiry?key=CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const cronSecret = req.nextUrl.searchParams.get('key')
  const expectedSecret = process.env.CRON_SECRET_KEY || 'secret-key-change-me'

  if (cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return await handleNotifySubscriptionExpiry()
  } catch (error) {
    console.error('[notify-subscription-expiry] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Send WhatsApp message via MercadoPago/Twilio
 *
 * Currently integrates with existing WhatsApp infrastructure
 * If not available, gracefully fails with status 'skipped'
 */
async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; code: string; message: string }> {
  try {
    // Check if MercadoPago WhatsApp adapter is configured
    const mpWhatsappApiUrl = process.env.MERCADOPAGO_WHATSAPP_API_URL
    const mpWhatsappToken = process.env.MERCADOPAGO_WHATSAPP_ACCESS_TOKEN

    if (!mpWhatsappApiUrl || !mpWhatsappToken) {
      console.warn('[sendWhatsAppMessage] MercadoPago WhatsApp not configured, skipping')
      return {
        success: false,
        code: 'not_configured',
        message: 'WhatsApp integration not configured',
      }
    }

    // Format phone number: ensure international format (55...)
    const formattedPhone = phoneNumber.replace(/\D/g, '')
    const finalPhone = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`

    // Step 1: Send message via MercadoPago WhatsApp API
    const response = await fetch(`${mpWhatsappApiUrl}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpWhatsappToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: finalPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[sendWhatsAppMessage] API error:', data)
      return {
        success: false,
        code: `mp_error_${response.status}`,
        message: data?.error?.message || 'WhatsApp API error',
      }
    }

    return {
      success: true,
      code: 'sent',
      message: data?.messages?.[0]?.id || 'Message sent',
    }
  } catch (error) {
    console.error('[sendWhatsAppMessage] Error:', error)
    return {
      success: false,
      code: 'send_error',
      message: String(error),
    }
  }
}

/**
 * POST endpoint for manual trigger (useful for testing)
 *
 * POST /api/cron/notify-subscription-expiry
 * Header: Authorization: Bearer {CRON_SECRET_KEY}
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET_KEY || 'secret-key-change-me'

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return await handleNotifySubscriptionExpiry()
  } catch (error) {
    console.error('[notify-subscription-expiry] Unhandled POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}


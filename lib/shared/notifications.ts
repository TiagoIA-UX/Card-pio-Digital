/**
 * lib/notifications.ts
 * Sistema centralizado de notificações para produção.
 *
 * Canais:
 *  1. system_alerts (tabela Supabase)  — todos os alertas ficam registrados
 *  2. WhatsApp link (admin)           — link pronto para enviar para o admin
 *  3. Resend (email)                  — quando RESEND_API_KEY estiver configurado
 *
 * Uso:
 *   await notify({ severity: 'critical', channel: 'payment', title: '...', body: '...' })
 */
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { resolveForgeOpsWebhookConfig } from '@/lib/shared/forgeops/config'

// ── Tipos ────────────────────────────────────────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertChannel =
  | 'payment'
  | 'subscription'
  | 'cron'
  | 'security'
  | 'onboarding'
  | 'affiliate'
  | 'system'

export interface NotifyPayload {
  severity: AlertSeverity
  channel: AlertChannel
  title: string
  body: string
  metadata?: Record<string, unknown>
  /** Se true, também tenta enviar email ao admin */
  emailAdmin?: boolean
}

// ── Config ───────────────────────────────────────────────────────────────────
const ADMIN_WHATSAPP = '5512996887993'
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'globemarket7@gmail.com'

type SuspendedAlertData = {
  restaurantId: string
  restaurantName: string
  ownerEmail: string
  daysOverdue: number
  ownerName?: string
  ownerWhatsapp?: string
}

type SuspendedContactContext = {
  restaurantName: string
  ownerName?: string
  ownerEmail?: string
  ownerWhatsapp?: string
  restaurantPhone?: string
}

export function getSuspendedContactWhatsapp(context: SuspendedContactContext) {
  return context.ownerWhatsapp || context.restaurantPhone || 'não informado'
}

export function buildRestaurantSuspendedNotificationPayload(
  data: SuspendedAlertData,
  context: SuspendedContactContext
): NotifyPayload {
  const bestWhatsapp = getSuspendedContactWhatsapp(context)

  return {
    severity: 'critical',
    channel: 'subscription',
    title: `Delivery suspenso por inadimplência: ${context.restaurantName}`,
    body: [
      `O delivery "${context.restaurantName}" foi suspenso por inadimplência (${data.daysOverdue} dias vencido).`,
      `ID do delivery: ${data.restaurantId}`,
      '',
      'Dados do responsável:',
      `- Nome: ${context.ownerName || 'não informado'}`,
      `- Email: ${context.ownerEmail || 'não informado'}`,
      `- WhatsApp: ${bestWhatsapp}`,
      `- Telefone do delivery: ${context.restaurantPhone || 'não informado'}`,
    ].join('\n'),
    metadata: {
      ...data,
      resolved_owner_name: context.ownerName ?? null,
      resolved_owner_email: context.ownerEmail ?? null,
      resolved_owner_whatsapp: context.ownerWhatsapp ?? null,
      resolved_restaurant_phone: context.restaurantPhone ?? null,
      resolved_restaurant_name: context.restaurantName,
    },
    emailAdmin: true,
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildWhatsAppLink(text: string): string {
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(text)}`
}

async function resolveSuspendedContactContext(
  data: SuspendedAlertData
): Promise<SuspendedContactContext> {
  const supabase = createAdminClient()

  let restaurantName = data.restaurantName || data.restaurantId
  let restaurantPhone: string | undefined
  let ownerId: string | undefined

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, nome, telefone, user_id')
    .eq('id', data.restaurantId)
    .maybeSingle()

  if (restaurant) {
    restaurantName = restaurant.nome || restaurantName
    restaurantPhone = restaurant.telefone || undefined
    ownerId = restaurant.user_id || undefined
  }

  let ownerEmail =
    data.ownerEmail && data.ownerEmail !== 'desconhecido' ? data.ownerEmail : undefined
  let ownerName = data.ownerName
  let ownerWhatsapp = data.ownerWhatsapp

  if (ownerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nome, email')
      .eq('id', ownerId)
      .maybeSingle()

    ownerName = ownerName || profile?.nome || undefined
    ownerEmail = ownerEmail || profile?.email || undefined

    const { data: authData } = await supabase.auth.admin.getUserById(ownerId)
    const authUser = authData?.user
    ownerEmail = ownerEmail || authUser?.email || undefined
    ownerName =
      ownerName ||
      (typeof authUser?.user_metadata?.full_name === 'string'
        ? authUser.user_metadata.full_name
        : undefined) ||
      (typeof authUser?.user_metadata?.name === 'string' ? authUser.user_metadata.name : undefined)
    ownerWhatsapp = ownerWhatsapp || authUser?.phone || undefined
  }

  return {
    restaurantName,
    ownerName,
    ownerEmail,
    ownerWhatsapp,
    restaurantPhone,
  }
}

// ── Notificação principal ────────────────────────────────────────────────────
export async function notify(payload: NotifyPayload) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  // 1. Salvar no banco (system_alerts)
  try {
    await supabase.from('system_alerts').insert({
      severity: payload.severity,
      channel: payload.channel,
      title: payload.title,
      body: payload.body,
      metadata: payload.metadata ?? {},
      whatsapp_link: buildWhatsAppLink(
        `🚨 [${payload.severity.toUpperCase()}] ${payload.title}\n\n${payload.body}`
      ),
      created_at: now,
      read: false,
    })
  } catch (err) {
    // Se a tabela não existir ainda, não quebra a aplicação
    console.error('[notify] Falha ao salvar alerta no banco:', err)
  }

  // 2. Envio de email (Resend) — só se configurado
  if (payload.emailAdmin || payload.severity === 'critical') {
    await sendEmailAlert(payload)
  }

  // 3. Entrega de alerta em canal único para evitar notificações duplicadas.
  // Prioridade: Dev Agent (quando configurado). Fallback: Telegram direto.
  if (payload.severity !== 'info') {
    const deliveredByAgent = await sendToPythonAgent(payload)
    if (!deliveredByAgent) {
      void sendTelegramAlert(payload)
    }
  }

  // 5. Log estruturado (sempre aparece nos logs da Vercel)
  const logLevel =
    payload.severity === 'critical' ? 'error' : payload.severity === 'warning' ? 'warn' : 'info'
  const logFn =
    logLevel === 'error' ? console.error : logLevel === 'warn' ? console.warn : console.log
  logFn(
    JSON.stringify({
      type: 'SYSTEM_ALERT',
      severity: payload.severity,
      channel: payload.channel,
      title: payload.title,
      body: payload.body,
      ts: now,
    })
  )
}

// ── Telegram direto (sem servidor externo — roda no Vercel) ─────────────────
async function sendTelegramAlert(payload: NotifyPayload) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return

  const icon = payload.severity === 'critical' ? '🔴' : payload.severity === 'warning' ? '🟡' : 'ℹ️'
  const ts = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const text = `${icon} <b>[${payload.severity.toUpperCase()}] ${payload.title}</b>\n\n${payload.body}\n\n<i>🕐 ${ts} · Zairyx</i>`

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    console.warn('[notify] Telegram indisponível:', (err as Error).message)
  }
}

// ── Zairyx Dev Agent (Python) ────────────────────────────────────────────────
async function sendToPythonAgent(payload: NotifyPayload): Promise<boolean> {
  const forgeOpsConfig = resolveForgeOpsWebhookConfig()
  if (!forgeOpsConfig.alertWebhookUrl) return false // Agente não configurado — usa fallback

  const secret = process.env.INTERNAL_API_SECRET ?? ''

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    await fetch(forgeOpsConfig.alertWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        source: payload.channel,
        error: payload.body,
        title: payload.title,
        severity: payload.severity,
        context: payload.metadata,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)
    return true
  } catch (err) {
    // Timeout ou agente offline — não quebra o fluxo principal
    console.warn('[notify] Dev Agent indisponível:', (err as Error).message)
    return false
  }
}

// ── Email via Resend ─────────────────────────────────────────────────────────
async function sendEmailAlert(payload: NotifyPayload) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return // Email não configurado — apenas loga

  try {
    const fromDomain = process.env.RESEND_FROM_DOMAIN ?? 'zairyx.com.br'
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Zairyx Alertas <alertas@${fromDomain}>`,
        to: [OWNER_EMAIL],
        subject: `[${payload.severity.toUpperCase()}] ${payload.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${payload.severity === 'critical' ? '#dc2626' : payload.severity === 'warning' ? '#d97706' : '#2563eb'}; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">🚨 ${payload.title}</h2>
            </div>
            <div style="background: #18181b; color: #e4e4e7; padding: 24px; border-radius: 0 0 8px 8px;">
              <p style="white-space: pre-wrap;">${payload.body}</p>
              ${payload.metadata ? `<pre style="background: #27272a; padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto;">${JSON.stringify(payload.metadata, null, 2)}</pre>` : ''}
              <hr style="border-color: #3f3f46; margin: 16px 0;" />
              <p style="font-size: 12px; color: #71717a;">
                Canal: ${payload.channel} · ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
            </div>
          </div>
        `,
      }),
    })
  } catch (err) {
    console.error('[notify] Falha ao enviar email Resend:', err)
  }
}

// ── Helpers pré-prontos para casos comuns ─────────────────────────────────────

/** Pagamento rejeitado — notifica admin */
export async function notifyPaymentRejected(data: {
  orderId: string
  customerEmail: string
  customerName?: string
  amount?: number
  reason?: string
  paymentId?: string | number
}) {
  await notify({
    severity: 'critical',
    channel: 'payment',
    title: 'Pagamento Rejeitado',
    body: [
      `Pedido: ${data.orderId}`,
      `Cliente: ${data.customerName ?? 'N/A'} (${data.customerEmail})`,
      data.amount ? `Valor: R$ ${(data.amount / 100).toFixed(2)}` : '',
      data.reason ? `Motivo MP: ${data.reason}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    metadata: data,
    emailAdmin: true,
  })
}

/** Pagamento aprovado — log informativo */
export async function notifyPaymentApproved(data: {
  orderId: string
  customerEmail: string
  amount?: number
  restaurantSlug?: string
}) {
  await notify({
    severity: 'info',
    channel: 'payment',
    title: 'Novo Pagamento Aprovado ✅',
    body: [
      `Pedido: ${data.orderId}`,
      `Cliente: ${data.customerEmail}`,
      data.amount ? `Valor: R$ ${data.amount.toFixed(2)}` : '',
      data.restaurantSlug ? `Restaurante: /r/${data.restaurantSlug}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    metadata: data,
  })
}

/** Cron falhou */
export async function notifyCronFailure(data: {
  cronName: string
  error: string
  details?: Record<string, unknown>
}) {
  await notify({
    severity: 'critical',
    channel: 'cron',
    title: `Cron Falhou: ${data.cronName}`,
    body: `O cron ${data.cronName} falhou com erro:\n${data.error}`,
    metadata: data.details,
    emailAdmin: true,
  })
}

/** Assinatura prestes a expirar */
export async function notifySubscriptionExpiring(data: {
  restaurantId: string
  restaurantName: string
  daysLeft: number
  ownerEmail: string
}) {
  await notify({
    severity: data.daysLeft <= 1 ? 'critical' : 'warning',
    channel: 'subscription',
    title: `Assinatura Expirando: ${data.restaurantName}`,
    body: `O restaurante "${data.restaurantName}" tem assinatura expirando em ${data.daysLeft} dia(s).\nDono: ${data.ownerEmail}`,
    metadata: data,
    emailAdmin: data.daysLeft <= 1,
  })
}

/** Restaurante suspenso por inadimplência */
export async function notifyRestaurantSuspended(data: SuspendedAlertData) {
  const context = await resolveSuspendedContactContext(data)
  await notify(buildRestaurantSuspendedNotificationPayload(data, context))
}


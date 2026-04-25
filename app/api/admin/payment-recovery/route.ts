import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import {
  buildRecoverablePaymentMessage,
  buildRecoverablePaymentWhatsAppUrl,
  getPaymentRecoveryMetrics,
  getRecoverablePaymentReport,
} from '@/lib/domains/ops/payment-recovery'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const LOOKBACK_DAYS = 7
const COOLDOWN_HOURS = 24

export async function GET(req: NextRequest) {
  const actor = await requireAdmin(req, 'admin')
  if (!actor) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const windowDays = Number(new URL(req.url).searchParams.get('windowDays') ?? '30')
  const admin = createAdminClient()
  const metrics = await getPaymentRecoveryMetrics(admin, {
    windowDays: Number.isFinite(windowDays) && windowDays > 0 ? windowDays : 30,
  })

  return NextResponse.json({ success: true, metrics })
}

const actionSchema = z.object({
  order_id: z.string().uuid(),
  action: z.enum(['resend_payment_link', 'mark_waiting_customer', 'register_manual_review']),
  note: z.string().min(8).max(500),
  alert_id: z.string().uuid().optional(),
})

type CheckoutSessionUpdate = {
  last_recovery_action_at: string
  last_recovery_action_type: string
  last_recovery_action_note: string
  metadata: Record<string, unknown>
}

function mergeMetadata(
  current: Record<string, unknown> | null,
  input: {
    action: 'resend_payment_link' | 'mark_waiting_customer' | 'register_manual_review'
    actorId: string
    note: string
    openUrl?: string | null
  }
) {
  const history = Array.isArray(current?.payment_recovery_history)
    ? current.payment_recovery_history
    : []

  return {
    ...(current ?? {}),
    payment_recovery_last_action: input.action,
    payment_recovery_last_note: input.note,
    payment_recovery_last_actor_id: input.actorId,
    payment_recovery_last_at: new Date().toISOString(),
    ...(input.openUrl ? { payment_recovery_last_open_url: input.openUrl } : {}),
    payment_recovery_history: [
      {
        action: input.action,
        actor_id: input.actorId,
        note: input.note,
        at: new Date().toISOString(),
      },
      ...history,
    ].slice(0, 10),
  }
}

export async function POST(req: NextRequest) {
  const actor = await requireAdmin(req, 'admin')
  if (!actor) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const raw = await req.json().catch(() => ({}))
  const parsed = actionSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const input = parsed.data
  const report = await getRecoverablePaymentReport(admin, {
    lookbackDays: LOOKBACK_DAYS,
    cooldownHours: COOLDOWN_HOURS,
  })

  const row = report.rows.find((candidate) => candidate.order_id === input.order_id)
  if (!row) {
    return NextResponse.json(
      {
        error:
          'O pedido não está mais elegível para recuperação. Revalide o status atual antes de nova ação.',
      },
      { status: 409 }
    )
  }

  if (input.action === 'resend_payment_link' && row.cooldown_active) {
    return NextResponse.json(
      { error: 'Este link já foi reenviado recentemente. Aguarde o cooldown operacional.' },
      { status: 409 }
    )
  }

  const { data: checkoutSession, error: checkoutError } = await admin
    .from('checkout_sessions')
    .select('id, metadata')
    .eq('id', row.checkout_session_id)
    .maybeSingle()

  if (checkoutError) {
    return NextResponse.json({ error: checkoutError.message }, { status: 500 })
  }
  if (!checkoutSession) {
    return NextResponse.json({ error: 'Checkout session não encontrado' }, { status: 404 })
  }

  const openUrl =
    input.action === 'resend_payment_link' ? buildRecoverablePaymentWhatsAppUrl(row) : null
  if (input.action === 'resend_payment_link' && !openUrl) {
    return NextResponse.json(
      { error: 'O cliente não possui telefone válido para envio do link.' },
      { status: 409 }
    )
  }

  const mergedMetadata = mergeMetadata(checkoutSession.metadata as Record<string, unknown> | null, {
    action: input.action,
    actorId: actor.id,
    note: input.note,
    openUrl,
  })

  const updatePayload: CheckoutSessionUpdate = {
    last_recovery_action_at: new Date().toISOString(),
    last_recovery_action_type: input.action,
    last_recovery_action_note: input.note,
    metadata: mergedMetadata,
  }

  const { error: updateError } = await admin
    .from('checkout_sessions')
    .update(updatePayload)
    .eq('id', row.checkout_session_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await admin.from('system_logs').insert({
    actor_id: actor.id === 'service-account' ? null : actor.id,
    actor_type: actor.id === 'service-account' ? 'system' : 'admin',
    action: 'payment_recovery_action',
    entity: 'template_order',
    entity_id: row.order_id,
    metadata: {
      timestamp: new Date().toISOString(),
      action: input.action,
      order_id: row.order_id,
      order_number: row.order_number,
      checkout_session_id: row.checkout_session_id,
      actor_id: actor.id,
      actor_role: actor.role,
      note: input.note,
      customer_phone_present: Boolean(row.customer_phone),
      open_url_generated: Boolean(openUrl),
    },
  })

  if (input.alert_id) {
    await admin
      .from('system_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString(), read: true })
      .eq('id', input.alert_id)
  }

  const message =
    input.action === 'resend_payment_link'
      ? 'Link pronto para envio ao cliente e alerta resolvido.'
      : input.action === 'mark_waiting_customer'
        ? 'Caso marcado como aguardando cliente e alerta resolvido.'
        : 'Caso registrado para análise manual auditada.'

  return NextResponse.json({
    ok: true,
    action: input.action,
    open_url: openUrl,
    success_message: message,
    preview_message:
      input.action === 'resend_payment_link' ? buildRecoverablePaymentMessage(row) : null,
  })
}


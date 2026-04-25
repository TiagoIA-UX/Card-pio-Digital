import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { syncFinancialTruthForTenant } from '@/lib/domains/core/financial-truth'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const regularizeSchema = z.object({
  tenant_id: z.string().uuid(),
  action: z.enum(['start_trial', 'block_until_payment', 'register_manual_review']),
  days: z.number().int().min(1).max(30).optional(),
  note: z.string().min(8).max(500),
  alert_id: z.string().uuid().optional(),
})

async function resolveFreePlanId(admin: ReturnType<typeof createAdminClient>) {
  const { data: plan, error } = await admin
    .from('plans')
    .select('id')
    .eq('slug', 'gratis')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!plan?.id) throw new Error('Plano gratis não encontrado para regularização')
  return plan.id
}

export async function POST(req: NextRequest) {
  const actor = await requireAdmin(req, 'owner')
  if (!actor) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const raw = await req.json().catch(() => ({}))
  const parsed = regularizeSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const input = parsed.data

  const [
    { data: restaurant, error: restaurantError },
    { data: subscription, error: subscriptionError },
  ] = await Promise.all([
    admin
      .from('restaurants')
      .select('id, nome, slug, ativo, suspended, status_pagamento, valor_pago, data_pagamento')
      .eq('id', input.tenant_id)
      .maybeSingle(),
    admin
      .from('subscriptions')
      .select(
        'id, status, trial_ends_at, last_payment_date, mp_preapproval_id, restaurant_id, tenant_id'
      )
      .eq('restaurant_id', input.tenant_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (restaurantError) {
    return NextResponse.json({ error: restaurantError.message }, { status: 500 })
  }
  if (subscriptionError) {
    return NextResponse.json({ error: subscriptionError.message }, { status: 500 })
  }
  if (!restaurant) {
    return NextResponse.json({ error: 'Delivery não encontrado' }, { status: 404 })
  }

  const hasPaymentEvidence =
    Boolean(subscription?.last_payment_date) ||
    Boolean(subscription?.mp_preapproval_id) ||
    Number(restaurant.valor_pago ?? 0) > 0 ||
    Boolean(restaurant.data_pagamento)

  if (hasPaymentEvidence) {
    return NextResponse.json(
      { error: 'O delivery já possui sinal econômico. Regularização manual direta foi bloqueada.' },
      { status: 409 }
    )
  }

  const actionLog: Record<string, unknown> = {
    action: input.action,
    tenant_id: input.tenant_id,
    tenant_nome: restaurant.nome,
    tenant_slug: restaurant.slug,
    note: input.note,
    actor_id: actor.id,
    actor_role: actor.role,
  }

  try {
    if (input.action === 'start_trial') {
      const freePlanId = await resolveFreePlanId(admin)
      const trialEndsAt = new Date(
        Date.now() + (input.days ?? 7) * 24 * 60 * 60 * 1000
      ).toISOString()

      if (subscription?.id) {
        const { error } = await admin
          .from('subscriptions')
          .update({
            status: 'trial',
            plan_id: freePlanId,
            trial_ends_at: trialEndsAt,
            canceled_at: null,
          })
          .eq('id', subscription.id)

        if (error) throw new Error(error.message)
      } else {
        const { error } = await admin.from('subscriptions').insert({
          tenant_id: input.tenant_id,
          restaurant_id: input.tenant_id,
          plan_id: freePlanId,
          status: 'trial',
          trial_ends_at: trialEndsAt,
        })

        if (error) throw new Error(error.message)
      }

      const { error: restaurantUpdateError } = await admin
        .from('restaurants')
        .update({ ativo: true, suspended: false })
        .eq('id', input.tenant_id)

      if (restaurantUpdateError) throw new Error(restaurantUpdateError.message)

      actionLog.trial_ends_at = trialEndsAt
    }

    if (input.action === 'block_until_payment') {
      const { error } = await admin
        .from('restaurants')
        .update({ suspended: true, status_pagamento: 'pendente' })
        .eq('id', input.tenant_id)

      if (error) throw new Error(error.message)

      actionLog.blocked = true
    }

    if (input.action === 'register_manual_review') {
      actionLog.manual_review = true
    }

    const financialTruth = await syncFinancialTruthForTenant(admin, {
      tenantId: input.tenant_id,
      source: 'reconciliation',
      sourceId: `operational-ghost-regularize:${input.action}`,
      lastEventAt: new Date().toISOString(),
      rawSnapshot: {
        regularization_action: input.action,
        regularization_note: input.note,
        regularized_by: actor.id,
      },
    })

    await admin.from('system_logs').insert({
      action: 'operational_ghost_regularization',
      details: JSON.stringify({
        ...actionLog,
        financial_truth: financialTruth,
        timestamp: new Date().toISOString(),
      }),
      created_by: actor.id,
    })

    if (input.alert_id) {
      await admin
        .from('system_alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString(), read: true })
        .eq('id', input.alert_id)
    }

    return NextResponse.json({ ok: true, action: input.action, financial_truth: financialTruth })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao regularizar operational ghost' },
      { status: 500 }
    )
  }
}


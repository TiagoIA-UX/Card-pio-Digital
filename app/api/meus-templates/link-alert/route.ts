import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { createClient as createServerClient } from '@/lib/shared/supabase/server'
import { notify } from '@/lib/shared/notifications'
import { getRateLimitIdentifier, withRateLimit } from '@/lib/shared/rate-limit'

const ALERT_DEDUP_WINDOW_MS = 12 * 60 * 60 * 1000

function isRecentLog(createdAt?: string | null) {
  if (!createdAt) return false

  const createdAtMs = new Date(createdAt).getTime()
  if (Number.isNaN(createdAtMs)) return false

  return Date.now() - createdAtMs < ALERT_DEDUP_WINDOW_MS
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(request), {
      limit: 10,
      windowMs: 60000,
    })

    if (rateLimit.limited) {
      return rateLimit.response
    }

    const authSupabase = await createServerClient()
    const {
      data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const purchaseId = typeof body?.purchaseId === 'string' ? body.purchaseId.trim() : ''
    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : ''
    const templateSlug = typeof body?.templateSlug === 'string' ? body.templateSlug.trim() : ''
    const templateName = typeof body?.templateName === 'string' ? body.templateName.trim() : ''

    if (!purchaseId || !templateSlug) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: purchase, error: purchaseError } = await admin
      .from('user_purchases')
      .select('id, user_id, order_id, status')
      .eq('id', purchaseId)
      .single()

    if (purchaseError || !purchase || purchase.user_id !== user.id) {
      return NextResponse.json({ error: 'Compra não encontrada' }, { status: 404 })
    }

    const { data: existingLog } = await admin
      .from('system_logs')
      .select('id, created_at')
      .eq('actor_id', user.id)
      .eq('actor_type', 'customer')
      .eq('entity', 'template_purchase')
      .eq('entity_id', purchase.id)
      .eq('action', 'purchase.link_unresolved')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingLog?.id && isRecentLog(existingLog.created_at)) {
      return NextResponse.json(
        { success: true, deduplicated: true },
        { headers: rateLimit.headers }
      )
    }

    const { error: insertError } = await admin.from('system_logs').insert({
      actor_id: user.id,
      actor_type: 'customer',
      action: 'purchase.link_unresolved',
      entity: 'template_purchase',
      entity_id: purchase.id,
      metadata: {
        order_id: orderId || purchase.order_id || null,
        template_slug: templateSlug,
        template_name: templateName || null,
        purchase_status: purchase.status,
        reported_at: new Date().toISOString(),
      },
    })

    if (insertError) {
      console.error('Erro ao registrar alerta de vínculo do template:', insertError)
      return NextResponse.json({ error: 'Falha ao registrar alerta' }, { status: 500 })
    }

    await notify({
      severity: 'warning',
      channel: 'onboarding',
      title: 'Meus Cardápios com vínculo inconsistente',
      body: [
        `Cliente: ${user.id}`,
        `Template: ${templateName || templateSlug}`,
        `Compra: ${purchase.id}`,
        `Pedido: ${orderId || purchase.order_id || 'sem order_id'}`,
        'Acesso bloqueado para evitar abrir delivery errado. Revisar vínculo da compra antes de liberar navegação.',
      ].join('\n'),
      metadata: {
        user_id: user.id,
        purchase_id: purchase.id,
        order_id: orderId || purchase.order_id || null,
        template_slug: templateSlug,
        template_name: templateName || null,
        purchase_status: purchase.status,
      },
      emailAdmin: true,
    })

    return NextResponse.json({ success: true }, { headers: rateLimit.headers })
  } catch (error) {
    console.error('Erro em /api/meus-templates/link-alert:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}


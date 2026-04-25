import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'

// GET: Listar alertas (com filtro por severidade/channel/read)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, 'admin')
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const url = new URL(req.url)
  const severity = url.searchParams.get('severity')
  const channel = url.searchParams.get('channel')
  const unreadOnly = url.searchParams.get('unread') === 'true'
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 200)

  let query = admin
    .from('system_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (severity) query = query.eq('severity', severity)
  if (channel) query = query.eq('channel', channel)
  if (unreadOnly) query = query.eq('read', false)

  const [alertsRes, summaryRes] = await Promise.all([
    query,
    admin.from('alerts_summary').select('*').single(),
  ])

  return NextResponse.json({
    alerts: alertsRes.data ?? [],
    summary: summaryRes.data ?? {
      unread_total: 0,
      unread_critical: 0,
      unread_warning: 0,
      unread_info: 0,
      last_24h: 0,
      last_7d: 0,
    },
  })
}

// POST: Ações (marcar como lido, resolver, marcar todos como lidos)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, 'admin')
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const body = await req.json()
  const { action } = body

  if (action === 'mark_read') {
    const { alert_id } = body
    if (!alert_id) return NextResponse.json({ error: 'alert_id required' }, { status: 400 })
    await admin.from('system_alerts').update({ read: true }).eq('id', alert_id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'mark_all_read') {
    await admin.from('system_alerts').update({ read: true }).eq('read', false)
    return NextResponse.json({ ok: true })
  }

  if (action === 'resolve') {
    const { alert_id } = body
    if (!alert_id) return NextResponse.json({ error: 'alert_id required' }, { status: 400 })
    await admin
      .from('system_alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString(), read: true })
      .eq('id', alert_id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}


/**
 * API: /api/admin/logs
 * Consulta de system_logs (auditoria completa)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'

// GET /api/admin/logs?entity=support_ticket&action=ticket.escalated&limit=100
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, 'admin')
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const db = createAdminClient()

  let query = db
    .from('system_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  const entity = url.searchParams.get('entity')
  const entityId = url.searchParams.get('entity_id')
  const action = url.searchParams.get('action')
  const actorId = url.searchParams.get('actor_id')
  const actorType = url.searchParams.get('actor_type')

  if (entity) query = query.eq('entity', entity)
  if (entityId) query = query.eq('entity_id', entityId)
  if (action) query = query.eq('action', action)
  if (actorId) query = query.eq('actor_id', actorId)
  if (actorType) query = query.eq('actor_type', actorType)

  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500)
  const offset = Number(url.searchParams.get('offset')) || 0
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], total: count ?? 0 })
}

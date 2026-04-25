import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, 'admin')
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_alert_stats')

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar estatísticas' }, { status: 500 })
  }

  return NextResponse.json(data)
}


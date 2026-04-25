import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { getReadinessStatus, getScriptsReadinessReport } from '@/lib/domains/ops/scripts-readiness'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, 'admin')
  if (!admin) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }
  const report = await getScriptsReadinessReport()

  return NextResponse.json({
    generatedAt: report.generatedAt,
    actor: { id: admin.id, role: admin.role },
    summary: report.summary,
    status: getReadinessStatus(report),
    categories: report.categories,
  })
}


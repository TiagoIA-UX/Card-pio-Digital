import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import {
  buildOperationalGhostFingerprint,
  getOperationalGhostReport,
  getOperationalGhostSeverity,
  runOperationalGhostScan,
} from '@/lib/domains/ops/operational-ghosts'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const cronSecret = process.env.CRON_SECRET

const requestSchema = z.object({
  hours: z
    .number()
    .int()
    .positive()
    .max(24 * 30)
    .optional(),
  forceNotify: z.boolean().optional(),
})

async function authorizeRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return {
      actorId: 'cron',
      actorRole: 'owner',
      source: 'cron',
    }
  }

  const admin = await requireAdmin(request, 'admin')
  if (!admin) {
    return null
  }

  return {
    actorId: admin.id,
    actorRole: admin.role,
    source: 'admin',
  }
}

export async function GET(request: NextRequest) {
  const auth = await authorizeRequest(request)
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const hoursParam = Number(new URL(request.url).searchParams.get('hours') ?? '24')
  const hours = Number.isFinite(hoursParam) && hoursParam > 0 ? hoursParam : 24
  const report = await getOperationalGhostReport(createAdminClient(), {
    hours,
  })

  return NextResponse.json({
    success: true,
    actorRole: auth.actorRole,
    severity: getOperationalGhostSeverity(report.flagged_count),
    fingerprint: buildOperationalGhostFingerprint(report),
    report,
    notified: false,
    suppressedDuplicate: false,
  })
}

export async function POST(request: NextRequest) {
  const auth = await authorizeRequest(request)
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const raw = await request.json().catch(() => ({}))
  const parsed = requestSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const result = await runOperationalGhostScan({
    hours: parsed.data.hours,
    forceNotify: parsed.data.forceNotify,
    source: auth.source,
    actorId: auth.actorId,
  })

  return NextResponse.json({
    success: true,
    actorRole: auth.actorRole,
    severity: result.severity,
    fingerprint: result.fingerprint,
    notified: result.notified,
    suppressedDuplicate: result.suppressedDuplicate,
    report: result.report,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import {
  buildRecoverablePaymentFingerprint,
  getRecoverablePaymentReport,
  getRecoverablePaymentSeverity,
  runRecoverablePaymentScan,
} from '@/lib/domains/ops/payment-recovery'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const cronSecret = process.env.CRON_SECRET

const requestSchema = z.object({
  lookbackDays: z.number().int().positive().max(30).optional(),
  cooldownHours: z
    .number()
    .int()
    .positive()
    .max(24 * 7)
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

  const url = new URL(request.url)
  const lookbackDays = Number(url.searchParams.get('lookbackDays') ?? '7')
  const cooldownHours = Number(url.searchParams.get('cooldownHours') ?? '24')
  const report = await getRecoverablePaymentReport(createAdminClient(), {
    lookbackDays: Number.isFinite(lookbackDays) && lookbackDays > 0 ? lookbackDays : 7,
    cooldownHours: Number.isFinite(cooldownHours) && cooldownHours > 0 ? cooldownHours : 24,
  })

  return NextResponse.json({
    success: true,
    actorRole: auth.actorRole,
    severity: getRecoverablePaymentSeverity(report.flagged_count),
    fingerprint: buildRecoverablePaymentFingerprint(report),
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

  const result = await runRecoverablePaymentScan({
    lookbackDays: parsed.data.lookbackDays,
    cooldownHours: parsed.data.cooldownHours,
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

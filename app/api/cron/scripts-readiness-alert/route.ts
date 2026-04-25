import { NextRequest, NextResponse } from 'next/server'
import { notify } from '@/lib/shared/notifications'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import {
  buildReadinessFingerprint,
  buildReadinessAlertBody,
  countRecentAttentionSnapshots,
  getActionableAttentionItems,
  getScriptsReadinessReport,
  getReadinessStatus,
  getReadinessSeverity,
  saveReadinessSnapshot,
} from '@/lib/domains/ops/scripts-readiness'

const CRON_SECRET = process.env.CRON_SECRET

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) return false
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${CRON_SECRET}`
}

async function hasRecentIdenticalAlert(fingerprint: string, hours = 12): Promise<boolean> {
  const db = createAdminClient()
  const since = new Date(Date.now() - hours * 3600_000).toISOString()

  const { data, error } = await db
    .from('system_alerts')
    .select('metadata,created_at')
    .eq('channel', 'system')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(80)

  if (error || !data) return false

  return data.some((row) => {
    const metadata = (row.metadata || {}) as Record<string, unknown>
    return (
      metadata.source === 'cron/scripts-readiness-alert' && metadata.fingerprint === fingerprint
    )
  })
}

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET nao configurado' }, { status: 500 })
  }

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const report = await getScriptsReadinessReport()
  const recentAttentionSnapshots = await countRecentAttentionSnapshots(72)
  const status = getReadinessStatus(report)
  const severity = getReadinessSeverity(report, recentAttentionSnapshots)
  const fingerprint = buildReadinessFingerprint(report)
  const actionableAttention = getActionableAttentionItems(report)

  await saveReadinessSnapshot({
    report,
    severity,
    fingerprint,
    source: 'cron',
  })

  if (actionableAttention.length === 0) {
    return NextResponse.json({
      ok: true,
      notified: false,
      reason:
        report.summary.attention === 0
          ? 'Todos os scripts essenciais estao saudaveis'
          : 'Apenas pendencias opcionais detectadas; alerta operacional suprimido',
      summary: report.summary,
      status,
      severity,
    })
  }

  const isDuplicate = await hasRecentIdenticalAlert(fingerprint, 12)
  if (isDuplicate) {
    return NextResponse.json({
      ok: true,
      notified: false,
      reason: 'Alerta duplicado suprimido nas ultimas 12h',
      summary: report.summary,
      status,
      severity,
      fingerprint,
    })
  }

  await notify({
    severity,
    channel: 'system',
    title: 'ForgeOps: pendencias nos scripts essenciais',
    body: buildReadinessAlertBody(report),
    metadata: {
      source: 'cron/scripts-readiness-alert',
      summary: report.summary,
      status,
      severity,
      fingerprint,
      recentAttentionSnapshots,
      actionableAttention: actionableAttention.map((item) => item.id),
    },
    emailAdmin: true,
  })

  return NextResponse.json({
    ok: true,
    notified: true,
    summary: report.summary,
    status,
    severity,
    fingerprint,
  })
}


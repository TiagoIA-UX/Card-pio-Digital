import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { notify } from '@/lib/shared/notifications'
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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, 'admin')
  if (!admin) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const report = await getScriptsReadinessReport()
  const recentAttentionSnapshots = await countRecentAttentionSnapshots(72)
  const status = getReadinessStatus(report)
  const severity = getReadinessSeverity(report, recentAttentionSnapshots)
  const fingerprint = buildReadinessFingerprint(report)
  const actionableAttention = getActionableAttentionItems(report)
  const shouldNotify = actionableAttention.length > 0

  await saveReadinessSnapshot({
    report,
    severity,
    fingerprint,
    source: 'admin',
  })

  if (!shouldNotify) {
    return NextResponse.json({
      success: true,
      sentToForgeOps: false,
      summary: report.summary,
      status,
      severity,
      fingerprint,
      reason:
        report.summary.attention === 0
          ? 'Sem pendencias'
          : 'Apenas pendencias opcionais detectadas; notificação externa suprimida',
    })
  }

  await notify({
    severity,
    channel: 'system',
    title: 'Scripts essenciais com pendencias operacionais',
    body: buildReadinessAlertBody(report),
    metadata: {
      source: 'admin/scripts/readiness/notify',
      actorId: admin.id,
      actorRole: admin.role,
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
    success: true,
    sentToForgeOps: true,
    summary: report.summary,
    status,
    severity,
    fingerprint,
  })
}

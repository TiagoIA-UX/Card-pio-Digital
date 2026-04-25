import { NextRequest, NextResponse } from 'next/server'
import { processDeliveryPaymentPostCommitQueue } from '@/lib/domains/payments/delivery-payment-post-commit'
import { createDomainLogger, flushDomainLogs } from '@/lib/shared/domain-logger'
import { notifyCronFailure } from '@/lib/shared/notifications'

const CRON_SECRET = process.env.CRON_SECRET
const log = createDomainLogger('core')

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) return false

  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }

  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const startedAt = new Date().toISOString()
  const startTime = Date.now()
  const executionId = crypto.randomUUID()

  try {
    const limitParam = Number(request.nextUrl.searchParams.get('limit') || '50')
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50

    log.info('Iniciando cron de retry pós-commit de pagamentos delivery', {
      cron_name: 'retry-delivery-payment-post-commit',
      execution_id: executionId,
      started_at: startedAt,
      limit,
    })

    const result = await processDeliveryPaymentPostCommitQueue({ limit })
    const finishedAt = new Date().toISOString()
    const durationMs = Date.now() - startTime
    const status = result.failed > 0 || result.escalated > 0 ? 'partial' : 'success'

    log.info('Cron de retry pós-commit de pagamentos delivery concluído', {
      cron_name: 'retry-delivery-payment-post-commit',
      execution_id: executionId,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: durationMs,
      status,
      total_processados: result.checked,
      total_concluidos: result.completed,
      total_falhas: result.failed,
      total_escalados: result.escalated,
    })

    await flushDomainLogs()

    return NextResponse.json({
      success: true,
      execution_id: executionId,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: durationMs,
      status,
      ...result,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro ao reprocessar efeitos pós-commit'

    log.error('Falha no cron de retry pós-commit de pagamentos delivery', error, {
      cron_name: 'retry-delivery-payment-post-commit',
      execution_id: executionId,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      status: 'fail',
    })

    await flushDomainLogs()

    await notifyCronFailure({
      cronName: 'retry-delivery-payment-post-commit',
      error: message,
      details: {
        execution_id: executionId,
        started_at: startedAt,
        duration_ms: Date.now() - startTime,
      },
    }).catch(() => {})

    return NextResponse.json(
      {
        error: message,
        execution_id: executionId,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        status: 'fail',
      },
      { status: 500 }
    )
  }
}


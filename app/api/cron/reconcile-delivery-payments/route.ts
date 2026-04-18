import { NextRequest, NextResponse } from 'next/server'
import { reconcilePendingDeliveryPayments } from '@/lib/domains/payments/finalize-delivery-payment'
import { createDomainLogger, flushDomainLogs } from '@/lib/shared/domain-logger'
import { notifyCronFailure } from '@/lib/shared/notifications'
import { getSiteUrl } from '@/lib/shared/site-url'

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

    log.info('Iniciando cron de reconciliação de pagamentos delivery', {
      cron_name: 'reconcile-delivery-payments',
      execution_id: executionId,
      started_at: startedAt,
      limit,
    })

    const result = await reconcilePendingDeliveryPayments({
      limit,
      siteUrl: getSiteUrl(),
    })

    const finishedAt = new Date().toISOString()
    const durationMs = Date.now() - startTime
    const status = result.failed > 0 ? 'partial' : 'success'

    log.info('Cron de reconciliação de pagamentos delivery concluído', {
      cron_name: 'reconcile-delivery-payments',
      execution_id: executionId,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: durationMs,
      status,
      total_processados: result.checked,
      total_finalizados: result.finalized,
      total_pendentes: result.stillPending,
      total_nao_encontrados: result.notFound,
      total_erros: result.failed,
    })

    await flushDomainLogs()

    return NextResponse.json({
      success: true,
      execution_id: executionId,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: durationMs,
      status,
      total_processados: result.checked,
      total_erros: result.failed,
      ...result,
      executed_at: finishedAt,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao reconciliar pagamentos'

    log.error('Falha no cron de reconciliação de pagamentos delivery', error, {
      cron_name: 'reconcile-delivery-payments',
      execution_id: executionId,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startTime,
      status: 'fail',
    })

    await flushDomainLogs()

    await notifyCronFailure({
      cronName: 'reconcile-delivery-payments',
      error: message,
      details: {
        execution_id: executionId,
        started_at: startedAt,
        duration_ms: Date.now() - startTime,
      },
    }).catch(() => {})

    console.error('Erro no cron reconcile-delivery-payments:', error)
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

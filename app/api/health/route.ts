import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/health
 *
 * Health check leve e REAL — valida:
 *  1. API Next.js respondendo (sempre true se este handler executar)
 *  2. Conexão com Supabase (query rápida em `restaurants`)
 *
 * Contrato de resposta:
 *  - 200 OK   → tudo saudável
 *  - 503 Unavailable → algum serviço crítico falhou (ex: banco)
 *
 * Regras:
 *  - Nunca retorna 200 se o banco cair (requisito do projeto)
 *  - Timeout curto (3s) para não segurar o endpoint quando o Supabase está lento
 *  - Payload previsível para ser consumido por monitores (UptimeRobot, BetterStack, cron do Render)
 *
 * Para checagem profunda (mais domínios), usar /api/health/domains.
 */

type ServiceStatus = 'ok' | 'error'

interface HealthPayload {
  status: ServiceStatus
  timestamp: string
  responseTime: string
  service: string
  services: {
    api: ServiceStatus
    database: ServiceStatus
  }
  error: string | null
}

const DB_TIMEOUT_MS = 3000

async function checkDatabase(): Promise<{ status: ServiceStatus; error: string | null }> {
  try {
    const supabase = createAdminClient()

    const query = supabase.from('restaurants').select('id').limit(1)

    const timeout = new Promise<{ error: { message: string } }>((_, reject) =>
      setTimeout(() => reject(new Error(`database timeout after ${DB_TIMEOUT_MS}ms`)), DB_TIMEOUT_MS)
    )

    const { error } = (await Promise.race([query, timeout])) as Awaited<typeof query>

    if (error) {
      return { status: 'error', error: error.message }
    }

    return { status: 'ok', error: null }
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'unknown database error',
    }
  }
}

export async function GET() {
  const start = Date.now()

  const db = await checkDatabase()

  const responseTimeMs = Date.now() - start
  const overall: ServiceStatus = db.status === 'ok' ? 'ok' : 'error'

  const payload: HealthPayload = {
    status: overall,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTimeMs}ms`,
    service: 'zairyx-platform',
    services: {
      api: 'ok',
      database: db.status,
    },
    error: db.error,
  }

  return NextResponse.json(payload, {
    status: overall === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

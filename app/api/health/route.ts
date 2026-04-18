import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/health
 *
 * Health check leve e REAL — valida ponta-a-ponta os serviços críticos:
 *  1. API Next.js respondendo (implícito: se este handler executar, a API está up)
 *  2. Conexão com Supabase (query rápida em `restaurants`)
 *  3. Backend Python no Render (GET em PYTHON_BACKEND_URL)
 *
 * Contrato de resposta:
 *  - 200 OK             → todas as dependências críticas saudáveis
 *  - 503 Unavailable    → qualquer dependência crítica falhou (banco OU backend)
 *
 * Observabilidade:
 *  - `errors.{database,backend}` → diagnóstico direto por serviço (sem caçar log)
 *  - `timings.{database,backend}` → latência por dependência (detecta lentidão antes de cair)
 *  - `version` (commit SHA) → rastreabilidade de deploy
 *
 * Regras (produção):
 *  - Nunca retorna 200 se uma dependência crítica estiver fora
 *  - Timeout curto por serviço (3s) para não segurar o endpoint
 *  - Checks rodam em paralelo (Promise.all) para manter latência baixa
 *  - Payload previsível para monitores externos (UptimeRobot, BetterStack, cron do Render)
 *
 * Para checagem profunda (múltiplas tabelas/domínios), usar /api/health/domains.
 */

type ServiceStatus = 'ok' | 'error'

interface CheckResult {
  status: ServiceStatus
  error: string | null
  durationMs: number
}

interface HealthPayload {
  status: ServiceStatus
  timestamp: string
  responseTime: string
  service: string
  version: string
  services: {
    api: ServiceStatus
    database: ServiceStatus
    backend: ServiceStatus
  }
  timings: {
    database: string
    backend: string
  }
  errors: {
    database: string | null
    backend: string | null
  }
}

const CHECK_TIMEOUT_MS = 3000

const BACKEND_URL =
  process.env.PYTHON_BACKEND_URL || 'https://mergeforge-backend.onrender.com'

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    const query = supabase.from('restaurants').select('id').limit(1)

    const { error } = await withTimeout(
      Promise.resolve(query) as unknown as Promise<{ error: { message: string } | null }>,
      CHECK_TIMEOUT_MS,
      'database',
    )

    const durationMs = Date.now() - start

    if (error) {
      return { status: 'error', error: error.message, durationMs }
    }
    return { status: 'ok', error: null, durationMs }
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'unknown database error',
      durationMs: Date.now() - start,
    }
  }
}

async function checkBackend(): Promise<CheckResult> {
  const start = Date.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      // Qualquer 2xx/3xx indica que o processo do backend está vivo.
      // 4xx/5xx é tratado como indisponibilidade.
    })

    const durationMs = Date.now() - start

    if (!res.ok) {
      return {
        status: 'error',
        error: `backend responded with HTTP ${res.status}`,
        durationMs,
      }
    }
    return { status: 'ok', error: null, durationMs }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? `backend timeout after ${CHECK_TIMEOUT_MS}ms`
          : err.message
        : 'unknown backend error'
    return { status: 'error', error: message, durationMs: Date.now() - start }
  } finally {
    clearTimeout(timer)
  }
}

export async function GET() {
  const start = Date.now()

  const [db, backend] = await Promise.all([checkDatabase(), checkBackend()])

  const responseTimeMs = Date.now() - start
  const overall: ServiceStatus =
    db.status === 'ok' && backend.status === 'ok' ? 'ok' : 'error'

  const payload: HealthPayload = {
    status: overall,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTimeMs}ms`,
    service: 'zairyx-platform',
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    services: {
      api: 'ok',
      database: db.status,
      backend: backend.status,
    },
    timings: {
      database: `${db.durationMs}ms`,
      backend: `${backend.durationMs}ms`,
    },
    errors: {
      database: db.error,
      backend: backend.error,
    },
  }

  return NextResponse.json(payload, {
    status: overall === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

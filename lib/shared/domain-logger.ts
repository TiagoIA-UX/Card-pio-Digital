/**
 * lib/shared/domain-logger.ts
 * Logger estruturado por domínio — grava na tabela domain_logs do Supabase.
 *
 * Uso:
 *   import { createDomainLogger } from '@/lib/shared/domain-logger'
 *   const log = createDomainLogger('core')
 *   log.error('Falha no checkout', error, { orderId: '123' })
 *
 * Em ambientes sem Supabase (testes, scripts), faz fallback para console.
 */

export type DomainName = 'core' | 'image' | 'affiliate' | 'zaea' | 'auth' | 'marketing' | 'shared'
export type LogLevel = 'info' | 'warn' | 'error'

export interface DomainLogger {
  info:  (message: string, metadata?: Record<string, unknown>) => void
  warn:  (message: string, metadata?: Record<string, unknown>) => void
  error: (message: string, err?: unknown, metadata?: Record<string, unknown>) => void
}

// ── Buffer para batch insert (evita N queries por request) ───────────────
interface LogEntry {
  domain: DomainName
  level: LogLevel
  message: string
  stack?: string
  metadata: Record<string, unknown>
}

const buffer: LogEntry[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
const FLUSH_INTERVAL_MS = 2_000
const FLUSH_MAX_SIZE = 20

function enqueue(entry: LogEntry) {
  buffer.push(entry)

  // Flush imediato se buffer cheio
  if (buffer.length >= FLUSH_MAX_SIZE) {
    void flush()
    return
  }

  // Flush com timer (debounce)
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      void flush()
    }, FLUSH_INTERVAL_MS)
  }
}

async function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer)
    flushTimer = null
  }

  if (buffer.length === 0) return

  const batch = buffer.splice(0, buffer.length)

  try {
    // Dynamic import para evitar erro em contextos sem Supabase (testes, scripts)
    const { createAdminClient } = await import('@/lib/shared/supabase/admin')
    const supabase = createAdminClient()

    const { error } = await supabase.from('domain_logs').insert(
      batch.map(entry => ({
        domain: entry.domain,
        level: entry.level,
        message: entry.message,
        stack: entry.stack ?? null,
        metadata: entry.metadata,
      }))
    )

    if (error) {
      // Fallback: loga no console se DB falhar (sem recursão)
      console.error('[domain-logger] flush failed:', error.message)
      for (const entry of batch) {
        consoleFallback(entry)
      }
    }
  } catch {
    // Sem Supabase (testes, local sem .env) → fallback console
    for (const entry of batch) {
      consoleFallback(entry)
    }
  }
}

function consoleFallback(entry: LogEntry) {
  const prefix = `[${entry.domain}]`
  const method = entry.level === 'error' ? console.error
    : entry.level === 'warn' ? console.warn
    : console.log
  method(prefix, entry.message, entry.metadata)
}

function extractStack(err: unknown): string | undefined {
  if (err instanceof Error) return err.stack
  if (typeof err === 'string') return err
  return undefined
}

// ── Factory ──────────────────────────────────────────────────────────────
export function createDomainLogger(domain: DomainName): DomainLogger {
  return {
    info(message, metadata = {}) {
      enqueue({ domain, level: 'info', message, metadata })
    },
    warn(message, metadata = {}) {
      enqueue({ domain, level: 'warn', message, metadata })
    },
    error(message, err, metadata = {}) {
      const stack = extractStack(err)
      enqueue({ domain, level: 'error', message, stack, metadata })
      // Erros também vão pro console para visibilidade imediata em dev/Vercel
      console.error(`[${domain}]`, message, err ?? '')
    },
  }
}

// ── Flush manual (para testes ou shutdown) ───────────────────────────────
export async function flushDomainLogs() {
  await flush()
}

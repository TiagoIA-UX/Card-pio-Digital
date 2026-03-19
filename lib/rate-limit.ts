/**
 * Rate Limiter dual-mode:
 *   - Upstash Redis (produção): quando UPSTASH_REDIS_REST_URL está configurado
 *   - In-memory (dev/fallback): quando não há Redis disponível
 *
 * A interface pública (checkRateLimit / RATE_LIMITS) permanece idêntica.
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Tipos ──────────────────────────────────────────────────────────────────

interface RateLimitConfig {
  /** Número máximo de requests permitidos */
  limit: number
  /** Janela de tempo em milissegundos */
  windowMs: number
}

interface RateLimitResult {
  /** Se o request foi permitido */
  success: boolean
  /** Requests restantes na janela */
  remaining: number
  /** Tempo em ms até reset da janela */
  resetIn: number
  /** Headers para incluir na resposta */
  headers: Record<string, string>
}

// ── Upstash (produção) ────────────────────────────────────────────────────

const useUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

let redis: Redis | null = null
const upstashLimiters = new Map<string, Ratelimit>()

function getUpstashLimiter(config: RateLimitConfig): Ratelimit {
  const key = `${config.limit}:${config.windowMs}`
  let limiter = upstashLimiters.get(key)
  if (!limiter) {
    if (!redis) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      })
    }
    const windowSec = Math.ceil(config.windowMs / 1000)
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${windowSec} s`),
      prefix: 'rl',
    })
    upstashLimiters.set(key, limiter)
  }
  return limiter
}

// ── In-memory (dev / fallback) ─────────────────────────────────────────────

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, e] of rateLimitMap) {
      if (e.resetTime < now) rateLimitMap.delete(k)
    }
  }, 60_000)
}

function checkInMemory(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const key = `ratelimit:${identifier}`

  let entry = rateLimitMap.get(key)
  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + config.windowMs }
  }

  entry.count++
  rateLimitMap.set(key, entry)

  const remaining = Math.max(0, config.limit - entry.count)
  const resetIn = Math.max(0, entry.resetTime - now)

  return {
    success: entry.count <= config.limit,
    remaining,
    resetIn,
    headers: {
      'X-RateLimit-Limit': config.limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString(),
    },
  }
}

// ── API pública ────────────────────────────────────────────────────────────

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, windowMs: 60_000 }
): Promise<RateLimitResult> {
  if (useUpstash) {
    const limiter = getUpstashLimiter(config)
    const res = await limiter.limit(identifier)
    return {
      success: res.success,
      remaining: res.remaining,
      resetIn: Math.max(0, res.reset - Date.now()),
      headers: {
        'X-RateLimit-Limit': config.limit.toString(),
        'X-RateLimit-Remaining': res.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(res.reset / 1000).toString(),
      },
    }
  }
  return checkInMemory(identifier, config)
}

/**
 * Configurações predefinidas de rate limit
 */
export const RATE_LIMITS = {
  /** API pública - 100 req/min */
  public: { limit: 100, windowMs: 60_000 },

  /** Autenticação - 5 req/min */
  auth: { limit: 5, windowMs: 60_000 },

  /** Checkout - 10 req/min */
  checkout: { limit: 10, windowMs: 60_000 },

  /** Webhook - 1000 req/min */
  webhook: { limit: 1000, windowMs: 60_000 },

  /** Carrinho - 30 req/min */
  cart: { limit: 30, windowMs: 60_000 },

  /** Chat AI - 10 req/min (protege créditos Groq) */
  chat: { limit: 10, windowMs: 60_000 },
}

/**
 * Gerar identificador para rate limit
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  // Preferir userId se disponível
  if (userId) {
    return `user:${userId}`
  }

  // Fallback para IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'

  return `ip:${ip}`
}

/**
 * Middleware helper para aplicar rate limit em API routes
 */
export async function withRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.public
) {
  const result = await checkRateLimit(identifier, config)

  if (!result.success) {
    return {
      limited: true,
      response: new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(result.resetIn / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
            ...result.headers,
          },
        }
      ),
    }
  }

  return {
    limited: false,
    headers: result.headers,
  }
}

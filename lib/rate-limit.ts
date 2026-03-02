/**
 * Rate Limiter Simples para APIs
 * 
 * Em produção, use @upstash/ratelimit com Redis para rate limiting distribuído.
 * Este é um rate limiter in-memory para desenvolvimento.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (entry.resetTime < now) {
      rateLimitMap.delete(key)
    }
  }
}, 60000) // Limpar a cada minuto

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

/**
 * Verifica rate limit para um identificador
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 100, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now()
  const key = `ratelimit:${identifier}`
  
  let entry = rateLimitMap.get(key)
  
  // Criar nova entrada se não existe ou expirou
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs
    }
  }
  
  // Incrementar contador
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
      'X-RateLimit-Reset': Math.ceil(entry.resetTime / 1000).toString()
    }
  }
}

/**
 * Configurações predefinidas de rate limit
 */
export const RATE_LIMITS = {
  /** API pública - 100 req/min */
  public: { limit: 100, windowMs: 60000 },
  
  /** Autenticação - 5 req/min */
  auth: { limit: 5, windowMs: 60000 },
  
  /** Checkout - 10 req/min */
  checkout: { limit: 10, windowMs: 60000 },
  
  /** Webhook - 1000 req/min */
  webhook: { limit: 1000, windowMs: 60000 },
  
  /** Carrinho - 30 req/min */
  cart: { limit: 30, windowMs: 60000 }
}

/**
 * Gerar identificador para rate limit
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string
): string {
  // Preferir userId se disponível
  if (userId) {
    return `user:${userId}`
  }
  
  // Fallback para IP
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return `ip:${ip}`
}

/**
 * Middleware helper para aplicar rate limit em API routes
 */
export function withRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.public
) {
  const result = checkRateLimit(identifier, config)
  
  if (!result.success) {
    return {
      limited: true,
      response: new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil(result.resetIn / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
            ...result.headers
          }
        }
      )
    }
  }
  
  return {
    limited: false,
    headers: result.headers
  }
}

/**
 * Sentry Error Tracking Configuration
 *
 * Para ativar o Sentry:
 * 1. Crie uma conta em https://sentry.io
 * 2. Crie um projeto Next.js
 * 3. Copie o DSN e adicione em .env.local:
 *    NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
 *    SENTRY_AUTH_TOKEN=xxx (para sourcemaps em produção)
 *
 * 4. Execute: npm install @sentry/nextjs
 * 5. Execute: npx @sentry/wizard@latest -i nextjs
 */

// Níveis de severidade
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal'

// Interface do erro estruturado
export interface StructuredError {
  message: string
  level: LogLevel
  tags?: Record<string, string>
  extra?: Record<string, unknown>
  user?: {
    id?: string
    email?: string
    tenant_id?: string
  }
}

// Buffer de erros para quando Sentry não está disponível
const errorBuffer: StructuredError[] = []
const MAX_BUFFER_SIZE = 100

/**
 * Captura erro de forma estruturada
 * Funciona com ou sem Sentry configurado
 */
export function captureError(error: Error | string, context?: Partial<StructuredError>) {
  const structuredError: StructuredError = {
    message: error instanceof Error ? error.message : error,
    level: context?.level || 'error',
    tags: context?.tags,
    extra: {
      ...(context?.extra || {}),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
    user: context?.user,
  }

  // Log no console sempre (para debug)
  const logFn =
    structuredError.level === 'error' || structuredError.level === 'fatal'
      ? console.error
      : console.warn

  logFn(`[${structuredError.level.toUpperCase()}]`, structuredError.message, {
    tags: structuredError.tags,
    extra: structuredError.extra,
  })

  // Se Sentry estiver disponível, enviar para lá
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    const Sentry = (window as any).Sentry
    Sentry.withScope((scope: any) => {
      if (structuredError.tags) {
        Object.entries(structuredError.tags).forEach(([key, value]) => {
          scope.setTag(key, value)
        })
      }
      if (structuredError.extra) {
        scope.setExtras(structuredError.extra)
      }
      if (structuredError.user) {
        scope.setUser(structuredError.user)
      }
      scope.setLevel(structuredError.level)

      if (error instanceof Error) {
        Sentry.captureException(error)
      } else {
        Sentry.captureMessage(structuredError.message)
      }
    })
    return
  }

  // Fallback: adicionar ao buffer local
  errorBuffer.push(structuredError)
  if (errorBuffer.length > MAX_BUFFER_SIZE) {
    errorBuffer.shift() // Remove o mais antigo
  }
}

/**
 * Captura mensagem informativa
 */
export function captureMessage(
  message: string,
  level: LogLevel = 'info',
  context?: Partial<StructuredError>
) {
  captureError(message, { ...context, level })
}

/**
 * Define contexto do usuário atual
 */
export function setUserContext(user: StructuredError['user']) {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    ;(window as any).Sentry.setUser(user)
  }
}

/**
 * Limpa contexto do usuário (logout)
 */
export function clearUserContext() {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    ;(window as any).Sentry.setUser(null)
  }
}

/**
 * Adiciona breadcrumb para rastrear ações do usuário
 */
export function addBreadcrumb(
  message: string,
  category: string = 'user',
  data?: Record<string, unknown>
) {
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    ;(window as any).Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    })
  }
}

/**
 * Wrapper para capturar erros em funções async
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: Partial<StructuredError>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      captureError(error as Error, context)
      throw error
    }
  }) as T
}

/**
 * Obter erros do buffer local (para debug)
 */
export function getLocalErrors(): StructuredError[] {
  return [...errorBuffer]
}

/**
 * Limpar buffer local
 */
export function clearLocalErrors(): void {
  errorBuffer.length = 0
}

// Exportar tipos para uso externo
export type { StructuredError as SentryError }

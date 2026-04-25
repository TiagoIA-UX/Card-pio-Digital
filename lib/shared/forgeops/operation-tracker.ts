import { createDomainLogger } from '@/lib/shared/domain-logger'

export type OperationStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface OperationContext {
  operationId: string
  correlationId: string
  flowName: string
  entityType: string
  entityId?: string | null
  actorId?: string | null
  status: OperationStatus
  startedAt: string
  finishedAt?: string
  retryCount: number
  metadata: Record<string, unknown>
}

interface CreateOperationTrackerInput {
  flowName: string
  entityType: string
  entityId?: string | null
  actorId?: string | null
  operationId?: string | null
  correlationId?: string | null
  metadata?: Record<string, unknown>
}

const log = createDomainLogger('shared')

const ALLOWED_TRANSITIONS: Record<OperationStatus, OperationStatus[]> = {
  pending: ['processing', 'failed'],
  processing: ['completed', 'failed'],
  completed: [],
  failed: [],
}

function generateOperationId() {
  return crypto.randomUUID()
}

function toSafeErrorCode(error: unknown) {
  if (error instanceof Error && error.name) return error.name
  return 'OperationError'
}

function toSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message.slice(0, 300)
  return 'unknown_error'
}

export function isValidOperationTransition(from: OperationStatus, to: OperationStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

function sanitizeIncomingId(value?: string | null) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : null
}

export function createOperationTracker(input: CreateOperationTrackerInput) {
  const startedAt = new Date().toISOString()
  const operationId = sanitizeIncomingId(input.operationId) ?? generateOperationId()
  const correlationId = sanitizeIncomingId(input.correlationId) ?? operationId

  let context: OperationContext = {
    operationId,
    correlationId,
    flowName: input.flowName,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    actorId: input.actorId ?? null,
    status: 'pending',
    startedAt,
    retryCount: 0,
    metadata: input.metadata ?? {},
  }

  log.info(`${context.flowName}.pending`, {
    operationId: context.operationId,
    correlationId: context.correlationId,
    entityType: context.entityType,
    entityId: context.entityId,
    actorId: context.actorId,
    status: context.status,
    startedAt: context.startedAt,
    retryCount: context.retryCount,
    ...context.metadata,
  })

  function transition(to: OperationStatus, metadata?: Record<string, unknown>) {
    if (!isValidOperationTransition(context.status, to)) {
      throw new Error(`Transição inválida de operação: ${context.status} -> ${to}`)
    }

    const now = new Date().toISOString()
    context = {
      ...context,
      status: to,
      finishedAt: to === 'processing' ? undefined : now,
      metadata: {
        ...context.metadata,
        ...(metadata ?? {}),
      },
    }

    log.info(`${context.flowName}.${to}`, {
      operationId: context.operationId,
      correlationId: context.correlationId,
      entityType: context.entityType,
      entityId: context.entityId,
      actorId: context.actorId,
      status: context.status,
      startedAt: context.startedAt,
      finishedAt: context.finishedAt,
      retryCount: context.retryCount,
      ...context.metadata,
    })

    return context
  }

  function fail(error: unknown, metadata?: Record<string, unknown>) {
    if (context.status === 'failed') return context
    if (context.status !== 'pending' && context.status !== 'processing') {
      throw new Error(`Não é possível falhar operação no estado ${context.status}`)
    }

    const now = new Date().toISOString()
    context = {
      ...context,
      status: 'failed',
      finishedAt: now,
      metadata: {
        ...context.metadata,
        ...(metadata ?? {}),
      },
    }

    log.error(`${context.flowName}.failed`, error, {
      operationId: context.operationId,
      correlationId: context.correlationId,
      entityType: context.entityType,
      entityId: context.entityId,
      actorId: context.actorId,
      status: context.status,
      startedAt: context.startedAt,
      finishedAt: context.finishedAt,
      retryCount: context.retryCount,
      errorCode: toSafeErrorCode(error),
      errorMessage: toSafeErrorMessage(error),
      ...context.metadata,
    })

    return context
  }

  return {
    getContext: () => context,
    toProcessing: (metadata?: Record<string, unknown>) => transition('processing', metadata),
    toCompleted: (metadata?: Record<string, unknown>) => transition('completed', metadata),
    fail,
  }
}


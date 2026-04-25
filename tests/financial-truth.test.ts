import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildFinancialTruthReason,
  buildFinancialTruthSyncNextRetryAt,
  deriveFinancialTruthStatus,
  FINANCIAL_TRUTH_SYNC_MAX_ATTEMPTS,
  shouldRetryFinancialTruthSyncJob,
  syncFinancialTruthForTenant,
} from '@/lib/domains/core/financial-truth'

function createFinancialTruthAdminMock(options?: {
  financialTruthUpsertError?: Error | null
  existingRetryAttempts?: number
  existingMaxAttempts?: number
  existingEscalatedAt?: string | null
}) {
  const queueUpserts: Array<Record<string, unknown>> = []
  const alerts: Array<Record<string, unknown>> = []

  const admin = {
    from(table: string) {
      if (table === 'restaurants') {
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    return {
                      data: {
                        id: 'tenant-1',
                        status_pagamento: 'ativo',
                        updated_at: '2026-04-16T00:00:00.000Z',
                      },
                      error: null,
                    }
                  },
                }
              },
            }
          },
        }
      }

      if (table === 'subscriptions') {
        return {
          select() {
            return {
              eq() {
                return {
                  order() {
                    return {
                      limit() {
                        return {
                          async maybeSingle() {
                            return {
                              data: {
                                id: 'sub-1',
                                status: 'active',
                                mp_preapproval_id: 'pre-1',
                                mp_subscription_status: 'authorized',
                                last_payment_date: '2026-04-15T00:00:00.000Z',
                                canceled_at: null,
                                updated_at: '2026-04-16T00:00:00.000Z',
                                created_at: '2026-04-01T00:00:00.000Z',
                              },
                              error: null,
                            }
                          },
                        }
                      },
                    }
                  },
                }
              },
            }
          },
        }
      }

      if (table === 'financial_truth') {
        return {
          async upsert() {
            return { error: options?.financialTruthUpsertError ?? null }
          },
        }
      }

      if (table === 'financial_truth_sync_queue') {
        return {
          select() {
            return {
              eq() {
                return {
                  async maybeSingle() {
                    if (typeof options?.existingRetryAttempts === 'number') {
                      return {
                        data: {
                          tenant_id: 'tenant-1',
                          status: 'pending_sync',
                          retry_attempts: options.existingRetryAttempts,
                          max_attempts:
                            options?.existingMaxAttempts ?? FINANCIAL_TRUTH_SYNC_MAX_ATTEMPTS,
                          next_retry_at: '2026-04-16T00:15:00.000Z',
                          escalated_at: options?.existingEscalatedAt ?? null,
                        },
                        error: null,
                      }
                    }

                    return { data: null, error: null }
                  },
                }
              },
            }
          },
          async upsert(payload: Record<string, unknown>) {
            queueUpserts.push(payload)
            return { error: null }
          },
        }
      }

      if (table === 'system_alerts') {
        return {
          async insert(payload: Record<string, unknown>) {
            alerts.push(payload)
            return { error: null }
          },
        }
      }

      throw new Error(`Tabela inesperada no mock: ${table}`)
    },
  }

  return { admin, queueUpserts, alerts }
}

test('verdade financeira prioriza chargeback acima de sinais aprovados', () => {
  assert.equal(
    deriveFinancialTruthStatus({
      paymentStatus: 'charged_back',
      subscriptionStatus: 'active',
      restaurantPaymentStatus: 'ativo',
    }),
    'chargeback'
  )
})

test('verdade financeira prioriza refund acima de cancelamento e aprovação', () => {
  assert.equal(
    deriveFinancialTruthStatus({
      paymentStatus: 'refunded',
      subscriptionStatus: 'canceled',
      restaurantPaymentStatus: 'ativo',
    }),
    'refunded'
  )
})

test('verdade financeira trata cancelamento como mais forte que aprovação indireta', () => {
  assert.equal(
    deriveFinancialTruthStatus({
      subscriptionStatus: 'canceled',
      restaurantPaymentStatus: 'ativo',
    }),
    'canceled'
  )
})

test('verdade financeira aprova quando subscription ou pagamento aprovado sustentam o tenant', () => {
  assert.equal(
    deriveFinancialTruthStatus({
      subscriptionStatus: 'active',
      restaurantPaymentStatus: 'ativo',
    }),
    'approved'
  )

  assert.equal(
    deriveFinancialTruthStatus({
      paymentStatus: 'approved',
      restaurantPaymentStatus: 'aguardando',
    }),
    'approved'
  )
})

test('verdade financeira permanece pendente sem sinal econômico conclusivo', () => {
  assert.equal(
    deriveFinancialTruthStatus({
      subscriptionStatus: 'pending',
      restaurantPaymentStatus: 'aguardando',
    }),
    'pending'
  )
})

test('reason financeira agrega sinais auditáveis', () => {
  assert.equal(
    buildFinancialTruthReason({
      paymentStatus: 'approved',
      subscriptionStatus: 'active',
      restaurantPaymentStatus: 'ativo',
    }),
    'payment=approved | subscription=active | restaurant=ativo'
  )
})

test('retry de financial truth respeita backoff apenas para pending_sync elegível', () => {
  const nextRetryAt = buildFinancialTruthSyncNextRetryAt(1, new Date('2026-04-16T10:00:00.000Z'))

  assert.equal(
    shouldRetryFinancialTruthSyncJob({
      status: 'pending_sync',
      retryAttempts: 1,
      nextRetryAt,
      now: '2026-04-16T10:14:59.000Z',
    }),
    false
  )

  assert.equal(
    shouldRetryFinancialTruthSyncJob({
      status: 'pending_sync',
      retryAttempts: 1,
      nextRetryAt,
      now: '2026-04-16T10:15:00.000Z',
    }),
    true
  )

  assert.equal(
    shouldRetryFinancialTruthSyncJob({
      status: 'failed',
      retryAttempts: FINANCIAL_TRUTH_SYNC_MAX_ATTEMPTS,
      nextRetryAt,
      now: '2026-04-16T10:30:00.000Z',
    }),
    false
  )
})

test('syncFinancialTruthForTenant registra pending_sync persistido quando upsert falha', async () => {
  const { admin, queueUpserts, alerts } = createFinancialTruthAdminMock({
    financialTruthUpsertError: new Error('db down'),
  })

  const result = await syncFinancialTruthForTenant(admin as never, {
    tenantId: 'tenant-1',
    source: 'payment',
    sourceId: 'pay-1',
    lastEventAt: '2026-04-16T10:00:00.000Z',
    rawSnapshot: {
      payment_status: 'approved',
    },
  })

  assert.equal(result?.syncState, 'pending_sync')
  assert.equal(result?.status, 'approved')
  assert.equal(result?.retryAttempts, 1)
  assert.equal(result?.manualReviewRequired, false)
  assert.equal(queueUpserts.length, 1)
  assert.equal(queueUpserts[0].status, 'pending_sync')
  assert.equal(queueUpserts[0].retry_attempts, 1)
  assert.equal(alerts.length, 0)
})

test('syncFinancialTruthForTenant escala alerta manual ao esgotar retries', async () => {
  const { admin, queueUpserts, alerts } = createFinancialTruthAdminMock({
    financialTruthUpsertError: new Error('db still down'),
    existingRetryAttempts: 2,
    existingMaxAttempts: 3,
  })

  const result = await syncFinancialTruthForTenant(admin as never, {
    tenantId: 'tenant-1',
    source: 'reconciliation',
    sourceId: 'recon-1',
    lastEventAt: '2026-04-16T10:00:00.000Z',
    rawSnapshot: {
      flow: 'affiliate_auto_approval',
    },
  })

  assert.equal(result?.syncState, 'pending_sync')
  assert.equal(result?.retryAttempts, 3)
  assert.equal(result?.manualReviewRequired, true)
  assert.equal(queueUpserts.length, 1)
  assert.equal(queueUpserts[0].status, 'failed')
  assert.equal(alerts.length, 1)
  assert.equal(alerts[0].channel, 'financial_truth_sync')
})


import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatAccessUntilLabel,
  formatAlreadyCancelledRenewalMessage,
  formatCancelledRenewalSuccessMessage,
  getDaysUntilDate,
  getPaymentStatusLabel,
  getPlanLabel,
  getProviderLabel,
  isFutureScheduledCancellation,
  resolveSubscriptionAccessUntil,
} from '@/lib/domains/core/subscription/account-subscription'

test('labels de conta traduzem provedores, plano e status de cobrança', () => {
  assert.equal(getProviderLabel('google'), 'Google')
  assert.equal(getProviderLabel('email'), 'E-mail')
  assert.equal(getProviderLabel('github'), 'github')

  assert.equal(getPlanLabel('premium'), 'Premium')
  assert.equal(getPlanLabel('basico'), 'Básico')
  assert.equal(getPlanLabel(null), 'Não definido')

  assert.equal(getPaymentStatusLabel('ativo'), 'Pagamento ativo')
  assert.equal(getPaymentStatusLabel('cancelado'), 'Assinatura cancelada')
  assert.equal(getPaymentStatusLabel(undefined), 'Status indisponível')
})

test('janela de acesso prioriza cancel_at antes do restante do ciclo', () => {
  assert.equal(
    resolveSubscriptionAccessUntil({
      cancel_at: '2026-04-20T12:00:00.000Z',
      current_period_end: '2026-04-18T12:00:00.000Z',
      trial_ends_at: '2026-04-16T12:00:00.000Z',
      next_payment_date: '2026-04-14T12:00:00.000Z',
    }),
    '2026-04-20T12:00:00.000Z'
  )

  assert.equal(
    resolveSubscriptionAccessUntil({
      current_period_end: '2026-04-18T12:00:00.000Z',
      trial_ends_at: '2026-04-16T12:00:00.000Z',
      next_payment_date: '2026-04-14T12:00:00.000Z',
    }),
    '2026-04-18T12:00:00.000Z'
  )
})

test('cálculo de dias e sinalização de cancelamento futuro usam data fixa', () => {
  const now = new Date('2026-04-13T12:00:00.000Z')

  assert.equal(getDaysUntilDate('2026-04-16T12:00:00.000Z', now), 3)
  assert.equal(getDaysUntilDate(null, now), null)

  assert.equal(isFutureScheduledCancellation('2026-04-16T12:00:00.000Z', now.getTime()), true)
  assert.equal(isFutureScheduledCancellation('2026-04-10T12:00:00.000Z', now.getTime()), false)
})

test('mensagens de cancelamento preservam clareza sobre o fim do ciclo', () => {
  const accessUntil = '2026-04-20T12:00:00.000Z'

  assert.equal(formatAccessUntilLabel(accessUntil), '20/04/2026')
  assert.match(formatAlreadyCancelledRenewalMessage(accessUntil), /20\/04\/2026/)
  assert.match(formatCancelledRenewalSuccessMessage(accessUntil), /20\/04\/2026/)
  assert.equal(
    formatCancelledRenewalSuccessMessage(null),
    'Renovação automática cancelada com sucesso.'
  )
})


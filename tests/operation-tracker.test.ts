import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createOperationTracker,
  isValidOperationTransition,
} from '@/lib/shared/forgeops/operation-tracker'

test('operation tracker creates ids and starts in pending', () => {
  const tracker = createOperationTracker({
    flowName: 'onboarding.submit',
    entityType: 'onboarding_submission',
  })

  const context = tracker.getContext()
  assert.match(context.operationId, /^[0-9a-f-]{36}$/i)
  assert.equal(context.correlationId, context.operationId)
  assert.equal(context.status, 'pending')
})

test('operation tracker enforces valid transitions', () => {
  const tracker = createOperationTracker({
    flowName: 'onboarding.submit',
    entityType: 'onboarding_submission',
  })

  tracker.toProcessing({ checkpoint: 'validated' })
  tracker.toCompleted({ checkpoint: 'saved' })

  const context = tracker.getContext()
  assert.equal(context.status, 'completed')
  assert.equal(context.metadata.checkpoint, 'saved')
  assert.ok(context.finishedAt)
})

test('operation tracker captures failed transitions with explicit error', () => {
  const tracker = createOperationTracker({
    flowName: 'onboarding.submit',
    entityType: 'onboarding_submission',
  })

  assert.throws(() => {
    tracker.toCompleted()
  }, /Transição inválida de operação/)
})

test('transition matrix stays deterministic', () => {
  assert.equal(isValidOperationTransition('pending', 'processing'), true)
  assert.equal(isValidOperationTransition('processing', 'completed'), true)
  assert.equal(isValidOperationTransition('processing', 'failed'), true)
  assert.equal(isValidOperationTransition('completed', 'failed'), false)
  assert.equal(isValidOperationTransition('failed', 'processing'), false)
})


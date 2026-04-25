import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'

import {
  buildBatchImagePipelinePlan,
  requiresMapSync,
  resolveBatchImagePipelinePaths,
  runBatchImagePreflightChecks,
} from '@/lib/domains/image/batch-image-pipeline'

const PROJECT_ROOT = process.cwd()

test('pipeline usa caminhos atuais do dominio de imagens', () => {
  const paths = resolveBatchImagePipelinePaths(PROJECT_ROOT, 'pexels')

  assert.equal(
    paths.generatedMap,
    path.join(PROJECT_ROOT, 'lib', 'domains', 'image', 'generated-template-product-images.ts')
  )
  assert.equal(
    paths.templatesConfig,
    path.join(PROJECT_ROOT, 'lib', 'domains', 'marketing', 'templates-config.ts')
  )
})

test('sync-map so e obrigatorio para provedores com imagens locais', () => {
  assert.equal(requiresMapSync('pexels'), false)
  assert.equal(requiresMapSync('pollinations'), false)
  assert.equal(requiresMapSync('dalle'), true)
  assert.equal(requiresMapSync('gemini'), true)

  const pexelsPlan = buildBatchImagePipelinePlan({
    projectRoot: PROJECT_ROOT,
    provider: 'pexels',
  })
  const dallePlan = buildBatchImagePipelinePlan({
    projectRoot: PROJECT_ROOT,
    provider: 'dalle',
  })

  assert.equal(pexelsPlan.phases.find((phase) => phase.id === 'sync-map')?.required, false)
  assert.equal(dallePlan.phases.find((phase) => phase.id === 'sync-map')?.required, true)
})

test('preflight em dry-run nao bloqueia por segredo ausente', () => {
  const result = runBatchImagePreflightChecks({
    projectRoot: PROJECT_ROOT,
    provider: 'gemini',
    template: 'minimercado',
    dryRun: true,
    environment: { NODE_ENV: 'test' },
  })

  assert.equal(result.passed, true)
  assert.ok(result.alerts.some((alert) => alert.code === 'dry-run'))
  assert.ok(result.alerts.every((alert) => alert.code !== 'missing-env'))
})

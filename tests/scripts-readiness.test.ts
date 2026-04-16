import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildReadinessFingerprint,
  getReadinessStatus,
  getReadinessSeverity,
  type ScriptsReadinessReport,
} from '@/lib/domains/ops/scripts-readiness'

function buildReport(overrides?: Partial<ScriptsReadinessReport>): ScriptsReadinessReport {
  return {
    generatedAt: '2026-04-12T14:00:00.000Z',
    summary: {
      total: 3,
      healthy: 2,
      attention: 1,
      actionable: 1,
      critical: 0,
      operational: 1,
      optional: 0,
    },
    categories: [
      {
        key: 'seguranca',
        title: 'Seguranca e acesso',
        items: [
          {
            id: 'alert-webhook-url',
            label: 'ALERT_WEBHOOK_URL',
            ok: false,
            detail: 'Nao configurada',
            impact: 'operational',
          },
        ],
      },
    ],
    ...overrides,
  }
}

test('readiness status fica degraded para webhook operacional com fallback', () => {
  const report = buildReport()
  const status = getReadinessStatus(report)
  assert.equal(status, 'degraded')
})

test('readiness severity fica warning para webhook operacional com fallback', () => {
  const report = buildReport()
  const severity = getReadinessSeverity(report, 0)
  assert.equal(severity, 'warning')
})

test('readiness severidade opcional fica info e não escala por reincidencia', () => {
  const report = buildReport({
    summary: {
      total: 3,
      healthy: 2,
      attention: 1,
      actionable: 0,
      critical: 0,
      operational: 0,
      optional: 1,
    },
    categories: [
      {
        key: 'marketing',
        title: 'Marketing',
        items: [
          {
            id: 'resend-api-key',
            label: 'RESEND_API_KEY',
            ok: false,
            detail: 'Envio de email desabilitado',
            impact: 'optional',
          },
        ],
      },
    ],
  })

  const status = getReadinessStatus(report)
  const severity = getReadinessSeverity(report, 3)
  assert.equal(status, 'ok')
  assert.equal(severity, 'info')
})

test('readiness severity fica critical para item crítico', () => {
  const report = buildReport({
    categories: [
      {
        key: 'seguranca',
        title: 'Seguranca e acesso',
        items: [
          {
            id: 'cron-secret',
            label: 'CRON_SECRET',
            ok: false,
            detail: 'Nao configurada',
            impact: 'critical',
          },
        ],
      },
    ],
  })

  const status = getReadinessStatus(report)
  const severity = getReadinessSeverity(report, 0)
  assert.equal(status, 'critical')
  assert.equal(severity, 'critical')
})

test('fingerprint muda quando muda pendencia', () => {
  const reportA = buildReport()
  const reportB = buildReport({
    categories: [
      {
        key: 'seguranca',
        title: 'Seguranca e acesso',
        items: [
          {
            id: 'alert-webhook-url',
            label: 'ALERT_WEBHOOK_URL',
            ok: false,
            detail: 'Timeout na chamada',
            impact: 'operational',
          },
        ],
      },
    ],
  })

  const fpA = buildReadinessFingerprint(reportA)
  const fpB = buildReadinessFingerprint(reportB)
  assert.notEqual(fpA, fpB)
})

test('fingerprint ignora item opcional quando existe pendencia acionável', () => {
  const reportA = buildReport({
    summary: {
      total: 4,
      healthy: 2,
      attention: 2,
      actionable: 1,
      critical: 0,
      operational: 1,
      optional: 1,
    },
    categories: [
      {
        key: 'seguranca',
        title: 'Seguranca e acesso',
        items: [
          {
            id: 'alert-webhook-url',
            label: 'ALERT_WEBHOOK_URL',
            ok: false,
            detail: 'Nao configurada',
            impact: 'operational',
          },
        ],
      },
      {
        key: 'marketing',
        title: 'Marketing',
        items: [
          {
            id: 'resend-api-key',
            label: 'RESEND_API_KEY',
            ok: false,
            detail: 'Envio de email desabilitado',
            impact: 'optional',
          },
        ],
      },
    ],
  })
  const reportB = buildReport({
    summary: {
      total: 4,
      healthy: 2,
      attention: 2,
      actionable: 1,
      critical: 0,
      operational: 1,
      optional: 1,
    },
    categories: [
      {
        key: 'seguranca',
        title: 'Seguranca e acesso',
        items: [
          {
            id: 'alert-webhook-url',
            label: 'ALERT_WEBHOOK_URL',
            ok: false,
            detail: 'Nao configurada',
            impact: 'operational',
          },
        ],
      },
      {
        key: 'marketing',
        title: 'Marketing',
        items: [
          {
            id: 'resend-api-key',
            label: 'RESEND_API_KEY',
            ok: false,
            detail: 'Outro detalhe opcional',
            impact: 'optional',
          },
        ],
      },
    ],
  })

  assert.equal(buildReadinessFingerprint(reportA), buildReadinessFingerprint(reportB))
})

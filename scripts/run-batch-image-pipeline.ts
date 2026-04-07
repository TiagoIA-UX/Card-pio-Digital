import { spawnSync } from 'node:child_process'

import {
  buildBatchImagePipelinePlan,
  getPhaseCommand,
  runBatchImagePreflightChecks,
  type BatchImagePhaseId,
  type BatchImagePhaseStatus,
  type BatchImagePipelineAlert,
  type BatchImagePipelineOptions,
  type BatchImagePipelineReport,
  writeBatchImagePipelineReport,
} from '@/lib/domains/image/batch-image-pipeline'

type ParsedArgs = {
  provider: BatchImagePipelineOptions['provider']
  template?: string
  dryRun: boolean
  skipGenerate: boolean
  skipAudit: boolean
  integrateZaea: boolean
}

function parseArgs(): ParsedArgs {
  const args = Object.fromEntries(
    process.argv
      .slice(2)
      .filter((argument) => argument.startsWith('--'))
      .map((argument) => {
        const [rawKey, ...rest] = argument.slice(2).split('=')
        return [rawKey, rest.length ? rest.join('=') : 'true']
      })
  )

  const provider = (args.provider ?? 'pexels') as ParsedArgs['provider']
  if (!['pexels', 'dalle', 'gemini', 'pollinations'].includes(provider)) {
    throw new Error(`Provider invalido: ${provider}`)
  }

  return {
    provider,
    template: args.template,
    dryRun: args['dry-run'] === 'true',
    skipGenerate: args['skip-generate'] === 'true',
    skipAudit: args['skip-audit'] === 'true',
    integrateZaea: args['integrate-zaea'] === 'true',
  }
}

function excerptOutput(stdout: string, stderr: string): string {
  const combined = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n\n')
  if (!combined) {
    return ''
  }

  return combined.length > 4000 ? `${combined.slice(0, 4000)}\n...` : combined
}

async function tryCreateZaeaTask(options: BatchImagePipelineOptions): Promise<string | null> {
  if (!options.integrateZaea) {
    return null
  }

  try {
    const { dispatchTask } = await import('@/lib/domains/zaea/orchestrator')
    return await dispatchTask({
      agent: 'orchestrator',
      taskType: 'batch_image_pipeline',
      priority: 'p1',
      triggeredBy: 'manual',
      input: {
        provider: options.provider,
        template: options.template ?? null,
        dryRun: options.dryRun ?? false,
      },
    })
  } catch {
    return null
  }
}

async function tryRecordZaeaOutcome(
  taskId: string | null,
  report: BatchImagePipelineReport,
  alerts: BatchImagePipelineAlert[]
): Promise<void> {
  if (!taskId) {
    return
  }

  try {
    const { recordOutcome } = await import('@/lib/domains/zaea/orchestrator')
    await recordOutcome({
      taskId,
      status: report.status === 'passed' ? 'completed' : 'failed',
      output: {
        provider: report.provider,
        template: report.template ?? null,
        phases: report.phases.map((phase) => ({
          id: phase.id,
          status: phase.status,
          exitCode: phase.exitCode ?? null,
        })),
        alerts: alerts.map((alert) => ({
          severity: alert.severity,
          phaseId: alert.phaseId,
          code: alert.code,
        })),
      },
      errorMessage:
        report.status === 'failed'
          ? alerts
              .filter((alert) => alert.severity === 'error')
              .map((alert) => `${alert.phaseId}:${alert.code}:${alert.message}`)
              .join(' | ')
          : null,
      knowledge: {
        pattern: `batch-image-pipeline:${report.provider}`,
        rootCause:
          report.status === 'failed'
            ? 'Pipeline interrompido por gate de fase ou comando com falha.'
            : 'Pipeline concluido com gates satisfeitos.',
        solution: 'Executar o pipeline isolado com preflight, geracao, sync e auditoria por fase.',
        filesChanged: [
          'scripts/run-batch-image-pipeline.ts',
          'lib/domains/image/batch-image-pipeline.ts',
        ],
        confidence: report.status === 'passed' ? 88 : 71,
        outcome: report.status === 'passed' ? 'success' : 'partial',
      },
    })
  } catch {
    // O gancho ZAEA eh opcional; a execucao local permanece valida.
  }
}

async function main() {
  const args = parseArgs()
  const options: BatchImagePipelineOptions = {
    projectRoot: process.cwd(),
    provider: args.provider,
    template: args.template,
    dryRun: args.dryRun,
    skipGenerate: args.skipGenerate,
    skipAudit: args.skipAudit,
    integrateZaea: args.integrateZaea,
  }

  const startedAt = new Date().toISOString()
  const plan = buildBatchImagePipelinePlan(options)
  const alerts: BatchImagePipelineAlert[] = []
  const taskId = await tryCreateZaeaTask(options)

  const phases: BatchImagePipelineReport['phases'] = plan.phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    layer: phase.layer,
    protocol: phase.protocol,
    status: phase.required ? 'pending' : 'skipped',
  }))

  const preflight = runBatchImagePreflightChecks(options)
  alerts.push(...preflight.alerts)
  const preflightPhase = phases.find((phase) => phase.id === 'preflight')
  if (preflightPhase) {
    preflightPhase.startedAt = startedAt
    preflightPhase.completedAt = new Date().toISOString()
    preflightPhase.status = preflight.passed ? 'passed' : 'failed'
    preflightPhase.outputExcerpt = preflight.alerts
      .map((alert) => `[${alert.severity}] ${alert.code}: ${alert.message}`)
      .join('\n')
  }

  let pipelineStatus: BatchImagePipelineReport['status'] = preflight.passed ? 'passed' : 'failed'
  if (preflight.passed) {
    for (const phase of phases) {
      if (phase.id === 'preflight') {
        continue
      }

      const command = getPhaseCommand(phase.id as BatchImagePhaseId, options)
      if (!command) {
        phase.status = 'skipped'
        continue
      }

      phase.status = 'running'
      phase.command = [command.command, ...command.args].join(' ')
      phase.startedAt = new Date().toISOString()

      console.log(`\n[batch-image-pipeline] fase=${phase.id} comando=${phase.command}`)
      const result = spawnSync(command.command, command.args, {
        cwd: options.projectRoot,
        encoding: 'utf-8',
        shell: process.platform === 'win32',
      })

      phase.completedAt = new Date().toISOString()
      phase.exitCode = result.status
      phase.outputExcerpt = excerptOutput(result.stdout ?? '', result.stderr ?? '')

      if (result.stdout) {
        process.stdout.write(result.stdout)
      }
      if (result.stderr) {
        process.stderr.write(result.stderr)
      }

      if (result.status === 0) {
        phase.status = 'passed'
        alerts.push({
          severity: 'info',
          phaseId: phase.id,
          layer: phase.layer,
          code: 'phase-passed',
          message: `Fase ${phase.title} concluida com sucesso.`,
          timestamp: new Date().toISOString(),
        })
        continue
      }

      phase.status = 'failed'
      pipelineStatus = 'failed'
      alerts.push({
        severity: 'error',
        phaseId: phase.id,
        layer: phase.layer,
        code: 'phase-failed',
        message: `Fase ${phase.title} falhou e bloqueou a proxima etapa.`,
        details: {
          exitCode: result.status,
        },
        timestamp: new Date().toISOString(),
      })
      break
    }
  }

  const report: BatchImagePipelineReport = {
    startedAt,
    completedAt: new Date().toISOString(),
    provider: options.provider,
    template: options.template,
    dryRun: options.dryRun ?? false,
    integrateZaea: options.integrateZaea ?? false,
    status: pipelineStatus,
    layers: plan.layers,
    phases,
    alerts,
  }

  const reportFiles = writeBatchImagePipelineReport(report, plan.paths.reportDir)
  await tryRecordZaeaOutcome(taskId, report, alerts)

  console.log('\n[batch-image-pipeline] relatorio-json=' + reportFiles.jsonPath)
  console.log('[batch-image-pipeline] relatorio-md=' + reportFiles.markdownPath)

  if (report.status !== 'passed') {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('[batch-image-pipeline] erro fatal:', error)
  process.exit(1)
})
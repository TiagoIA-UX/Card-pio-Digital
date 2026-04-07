import fs from 'node:fs'
import path from 'node:path'

export type BatchImageProvider = 'pexels' | 'dalle' | 'gemini' | 'pollinations'
export type BatchImageLayer = 'network' | 'catalog' | 'providers' | 'quality' | 'alerts'
export type BatchImagePhaseId = 'preflight' | 'generate' | 'sync-map' | 'audit'
export type BatchImagePhaseStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
export type BatchImageAlertSeverity = 'info' | 'warning' | 'error'

export interface BatchImageLayerDefinition {
  id: BatchImageLayer
  title: string
  description: string
  protocols: string[]
}

export interface BatchImagePipelinePaths {
  catalogCsv: string
  generatedMap: string
  templatesConfig: string
  auditScript: string
  syncScript: string
  providerScript: string
  outputDir: string
  reportDir: string
}

export interface BatchImagePipelineOptions {
  projectRoot: string
  provider: BatchImageProvider
  template?: string
  dryRun?: boolean
  skipGenerate?: boolean
  skipAudit?: boolean
  integrateZaea?: boolean
  environment?: NodeJS.ProcessEnv
}

export interface BatchImagePipelinePhase {
  id: BatchImagePhaseId
  title: string
  layer: BatchImageLayer
  protocol: string
  required: boolean
}

export interface BatchImagePipelineAlert {
  severity: BatchImageAlertSeverity
  phaseId: BatchImagePhaseId
  layer: BatchImageLayer
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

export interface BatchImagePreflightResult {
  passed: boolean
  alerts: BatchImagePipelineAlert[]
}

export interface BatchImagePipelinePlan {
  layers: BatchImageLayerDefinition[]
  phases: BatchImagePipelinePhase[]
  paths: BatchImagePipelinePaths
}

const PROVIDER_ENV_KEYS: Record<BatchImageProvider, string[]> = {
  pexels: ['PEXELS_API_KEY'],
  dalle: ['OPENAI_API_KEY'],
  gemini: ['GEMINI_API_KEY'],
  pollinations: [],
}

const PROVIDER_SCRIPT_FILES: Record<BatchImageProvider, string> = {
  pexels: 'scripts/update-images-pexels-smart.mjs',
  dalle: 'scripts/generate-images-dalle.js',
  gemini: 'scripts/generate-images-gemini.js',
  pollinations: 'scripts/generate-images-pollinations.js',
}

const PROVIDER_SCRIPT_NAMES: Record<BatchImageProvider, string> = {
  pexels: 'generate:images:pexels',
  dalle: 'generate:images:dalle',
  gemini: 'generate:images:gemini',
  pollinations: 'generate:images:pollinations',
}

function createAlert(
  options: Pick<BatchImagePipelineOptions, 'projectRoot'>,
  phaseId: BatchImagePhaseId,
  layer: BatchImageLayer,
  severity: BatchImageAlertSeverity,
  code: string,
  message: string,
  details?: Record<string, unknown>
): BatchImagePipelineAlert {
  return {
    severity,
    phaseId,
    layer,
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
  }
}

export function resolveBatchImagePipelinePaths(projectRoot: string, provider: BatchImageProvider): BatchImagePipelinePaths {
  return {
    catalogCsv: path.join(projectRoot, 'scripts', 'image-prompts.csv'),
    generatedMap: path.join(projectRoot, 'lib', 'domains', 'image', 'generated-template-product-images.ts'),
    templatesConfig: path.join(projectRoot, 'lib', 'domains', 'marketing', 'templates-config.ts'),
    auditScript: path.join(projectRoot, 'scripts', 'audit-template-images.ts'),
    syncScript: path.join(projectRoot, 'scripts', 'update-image-map-local.js'),
    providerScript: path.join(projectRoot, ...PROVIDER_SCRIPT_FILES[provider].split('/')),
    outputDir: path.join(projectRoot, 'public', 'template-images'),
    reportDir: path.join(projectRoot, 'private', 'image-pipeline-reports'),
  }
}

export function getBatchImagePipelineLayers(): BatchImageLayerDefinition[] {
  return [
    {
      id: 'network',
      title: 'Camada de Rede',
      description: 'Conectividade de API, arquivos locais e chamadas de processo.',
      protocols: ['HTTPS', 'FS', 'Process'],
    },
    {
      id: 'catalog',
      title: 'Camada de Catálogo',
      description: 'Fonte única dos prompts, slugs, categorias e ordens.',
      protocols: ['CSV', 'TypeScript'],
    },
    {
      id: 'providers',
      title: 'Camada de Provedores',
      description: 'Execução controlada do gerador escolhido.',
      protocols: ['Pexels API', 'OpenAI Images', 'Gemini Imagen', 'Pollinations'],
    },
    {
      id: 'quality',
      title: 'Camada de Qualidade',
      description: 'Sincronização do mapa e auditoria antes de seguir para a próxima fase.',
      protocols: ['Map Sync', 'Audit'],
    },
    {
      id: 'alerts',
      title: 'Camada de Alertas',
      description: 'Registro local pass/fail com gancho opcional para o domínio ZAEA.',
      protocols: ['JSON Report', 'ZAEA Task'],
    },
  ]
}

export function requiresMapSync(provider: BatchImageProvider): boolean {
  return provider === 'dalle' || provider === 'gemini'
}

export function buildBatchImagePipelinePlan(
  options: BatchImagePipelineOptions
): BatchImagePipelinePlan {
  const phases: BatchImagePipelinePhase[] = [
    {
      id: 'preflight',
      title: 'Preflight',
      layer: 'network',
      protocol: 'FS/ENV',
      required: true,
    },
    {
      id: 'generate',
      title: 'Geração',
      layer: 'providers',
      protocol: PROVIDER_SCRIPT_NAMES[options.provider],
      required: !options.skipGenerate,
    },
    {
      id: 'sync-map',
      title: 'Sincronização do Mapa',
      layer: 'quality',
      protocol: 'update-image-map-local',
      required: requiresMapSync(options.provider),
    },
    {
      id: 'audit',
      title: 'Auditoria',
      layer: 'quality',
      protocol: 'audit-template-images',
      required: !options.skipAudit,
    },
  ]

  return {
    layers: getBatchImagePipelineLayers(),
    phases,
    paths: resolveBatchImagePipelinePaths(options.projectRoot, options.provider),
  }
}

export function getPhaseCommand(
  phaseId: BatchImagePhaseId,
  options: BatchImagePipelineOptions
): { command: string; args: string[] } | null {
  const templateArgs = options.template ? [`--template=${options.template}`] : []
  const dryRunArgs = options.dryRun ? ['--dry-run'] : []

  switch (phaseId) {
    case 'generate':
      if (options.skipGenerate) {
        return null
      }

      return {
        command: 'npm',
        args: ['run', PROVIDER_SCRIPT_NAMES[options.provider], '--', ...templateArgs, ...dryRunArgs],
      }

    case 'sync-map':
      if (!requiresMapSync(options.provider)) {
        return null
      }

      return {
        command: 'node',
        args: ['scripts/update-image-map-local.js'],
      }

    case 'audit':
      if (options.skipAudit) {
        return null
      }

      return {
        command: 'tsx',
        args: ['scripts/audit-template-images.ts', ...(options.template ? [`--template=${options.template}`] : [])],
      }

    default:
      return null
  }
}

export function runBatchImagePreflightChecks(
  options: BatchImagePipelineOptions
): BatchImagePreflightResult {
  const plan = buildBatchImagePipelinePlan(options)
  const alerts: BatchImagePipelineAlert[] = []
  const environment = options.environment ?? process.env

  const requiredFiles: Array<{ key: keyof BatchImagePipelinePaths; label: string }> = [
    { key: 'catalogCsv', label: 'CSV de prompts' },
    { key: 'generatedMap', label: 'Mapa de imagens geradas' },
    { key: 'templatesConfig', label: 'Configuração de templates' },
    { key: 'providerScript', label: 'Script do provedor' },
  ]

  for (const requiredFile of requiredFiles) {
    const filePath = plan.paths[requiredFile.key]
    if (!fs.existsSync(filePath)) {
      alerts.push(
        createAlert(
          options,
          'preflight',
          'network',
          'error',
          'missing-file',
          `${requiredFile.label} ausente`,
          { filePath }
        )
      )
    }
  }

  if (requiresMapSync(options.provider) && !fs.existsSync(plan.paths.syncScript)) {
    alerts.push(
      createAlert(
        options,
        'preflight',
        'quality',
        'error',
        'missing-sync-script',
        'Script de sincronização do mapa ausente',
        { filePath: plan.paths.syncScript }
      )
    )
  }

  if (!options.skipAudit && !fs.existsSync(plan.paths.auditScript)) {
    alerts.push(
      createAlert(
        options,
        'preflight',
        'quality',
        'error',
        'missing-audit-script',
        'Script de auditoria ausente',
        { filePath: plan.paths.auditScript }
      )
    )
  }

  const providerEnvKeys = PROVIDER_ENV_KEYS[options.provider]
  if (!options.dryRun) {
    for (const envKey of providerEnvKeys) {
      if (!environment[envKey]) {
        alerts.push(
          createAlert(
            options,
            'preflight',
            'providers',
            'error',
            'missing-env',
            `Segredo obrigatório ausente para o provedor ${options.provider}`,
            { envKey }
          )
        )
      }
    }
  } else {
    alerts.push(
      createAlert(
        options,
        'preflight',
        'providers',
        'info',
        'dry-run',
        'Dry-run ativo: validações de segredo foram flexibilizadas.'
      )
    )
  }

  if (!options.template && !options.skipAudit) {
    alerts.push(
      createAlert(
        options,
        'preflight',
        'quality',
        'warning',
        'audit-without-template',
        'Auditoria sem template específico pode gerar análise mais ampla do que o necessário.'
      )
    )
  }

  if (options.integrateZaea) {
    alerts.push(
      createAlert(
        options,
        'preflight',
        'alerts',
        'info',
        'zaea-hook-enabled',
        'Gancho de registro no ZAEA habilitado para esta execução.'
      )
    )
  }

  return {
    passed: !alerts.some((alert) => alert.severity === 'error'),
    alerts,
  }
}

export interface BatchImagePipelineReport {
  startedAt: string
  completedAt: string
  provider: BatchImageProvider
  template?: string
  dryRun: boolean
  integrateZaea: boolean
  status: 'passed' | 'failed'
  layers: BatchImageLayerDefinition[]
  phases: Array<{
    id: BatchImagePhaseId
    title: string
    layer: BatchImageLayer
    status: BatchImagePhaseStatus
    protocol: string
    command?: string
    exitCode?: number | null
    startedAt?: string
    completedAt?: string
    outputExcerpt?: string
  }>
  alerts: BatchImagePipelineAlert[]
}

export function writeBatchImagePipelineReport(
  report: BatchImagePipelineReport,
  reportDir: string
): { jsonPath: string; markdownPath: string } {
  fs.mkdirSync(reportDir, { recursive: true })

  const fileBase = [
    new Date(report.startedAt).toISOString().replace(/[:.]/g, '-'),
    report.provider,
    report.template ?? 'all',
  ].join('__')

  const jsonPath = path.join(reportDir, `${fileBase}.json`)
  const markdownPath = path.join(reportDir, `${fileBase}.md`)

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8')

  const markdown = [
    '# Batch Image Pipeline Report',
    '',
    `- Provider: ${report.provider}`,
    `- Template: ${report.template ?? 'todos'}`,
    `- Dry-run: ${report.dryRun ? 'sim' : 'nao'}`,
    `- ZAEA: ${report.integrateZaea ? 'habilitado' : 'desabilitado'}`,
    `- Status: ${report.status}`,
    `- Inicio: ${report.startedAt}`,
    `- Fim: ${report.completedAt}`,
    '',
    '## Camadas',
    '',
    ...report.layers.map(
      (layer) =>
        `- ${layer.title}: ${layer.description} [protocolos: ${layer.protocols.join(', ')}]`
    ),
    '',
    '## Fases',
    '',
    ...report.phases.map(
      (phase) =>
        `- ${phase.title}: ${phase.status} [camada=${phase.layer}; protocolo=${phase.protocol}; exitCode=${phase.exitCode ?? 'n/a'}]`
    ),
    '',
    '## Alertas',
    '',
    ...(report.alerts.length
      ? report.alerts.map(
          (alert) => `- ${alert.severity.toUpperCase()} ${alert.phaseId}/${alert.code}: ${alert.message}`
        )
      : ['- Nenhum alerta registrado.']),
    '',
  ].join('\n')

  fs.writeFileSync(markdownPath, markdown, 'utf-8')

  return { jsonPath, markdownPath }
}
#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

interface GoDailyConfig {
  pilot: {
    flowName: string
    flowReason: string
    ownerName: string
    monitorChannel: string
    escalationContact: string
    responseSlaMinutes: number
  }
  evidence: {
    recentIncidentIds: string[]
  }
}

interface GoDailyIncident {
  id: string
  flow: string
  detectedAt: string
  status: 'open' | 'mitigated' | 'resolved'
  summary: string
}

type CheckResult = {
  id: string
  label: string
  required: boolean
  passed: boolean
  details: string
}

const repoRoot = process.cwd()
const configPath = path.join(repoRoot, 'docs/ops/forgeops-go-daily.config.json')
const baselinePath = path.join(repoRoot, 'docs/ops/go-daily/baseline.json')
const incidentsPath = path.join(repoRoot, 'docs/ops/go-daily/incidents.json')
const reportsDir = path.join(repoRoot, 'docs/ops/go-daily')
const incidentTemplatePath = path.join(repoRoot, 'docs/ops/FORGEOPS_INCIDENT_TEMPLATE.md')
const runbookPath = path.join(repoRoot, 'docs/ops/FORGEOPS_GO_DAILY_RUNBOOK.md')

function isRealValue(value: string | undefined) {
  if (!value) {
    return false
  }

  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return false
  }

  return !normalized.startsWith('preencher_')
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function todayDateKey() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function parseJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
  } catch {
    return null
  }
}

function writeIfMissing(filePath: string, content: string) {
  if (fs.existsSync(filePath)) {
    return
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function createInitFiles() {
  writeIfMissing(
    configPath,
    JSON.stringify(
      {
        pilot: {
          flowName: 'preencher_fluxo_critico',
          flowReason: 'preencher_motivo_com_risco_e_impacto',
          ownerName: 'preencher_nome_responsavel',
          monitorChannel: 'preencher_canal_monitoramento',
          escalationContact: 'preencher_contato_escalacao',
          responseSlaMinutes: 10,
        },
        evidence: {
          recentIncidentIds: [],
        },
      },
      null,
      2
    ) + '\n'
  )

  writeIfMissing(
    baselinePath,
    JSON.stringify(
      {
        beforeDiagnosisMinutes: 120,
        targetDiagnosisMinutes: 48,
        notes: 'Ajustar com base real do piloto',
      },
      null,
      2
    ) + '\n'
  )

  writeIfMissing(incidentsPath, JSON.stringify([], null, 2) + '\n')

  writeIfMissing(
    incidentTemplatePath,
    [
      '# Template de Incidente ForgeOps',
      '',
      'Data/Hora:',
      'Fluxo:',
      'Responsavel:',
      '',
      '## O que',
      '',
      '## Onde',
      '',
      '## Impacto',
      '',
      '## Acao',
      '',
      '## Resultado',
      '',
      '## Evidencia',
      '',
    ].join('\n')
  )

  writeIfMissing(
    runbookPath,
    [
      '# Runbook GO Diario ForgeOps',
      '',
      '1. Confirmar fluxo critico e dono operacional.',
      '2. Rodar checklist automatico com npm run go:daily.',
      '3. Se NO-GO, tratar bloqueadores antes de iniciar janela.',
      '4. Registrar incidente com template apos estabilizacao.',
      '5. Publicar resumo do dia no relatorio de go-daily.',
      '',
    ].join('\n')
  )

  console.log('Arquivos base do GO diario criados/verificados com sucesso.')
}

function runForgeOpsContractCheck() {
  try {
    execSync('npm run -s enforce:forgeops', {
      cwd: repoRoot,
      stdio: 'pipe',
    })
    return {
      passed: true,
      details: 'Contrato ForgeOps validado pelo script enforce:forgeops.',
    }
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : 'Falha desconhecida no enforce:forgeops.'
    return {
      passed: false,
      details: `Contrato ForgeOps falhou: ${reason}`,
    }
  }
}

function buildChecks(config: GoDailyConfig | null) {
  const baseline = parseJsonFile<{
    beforeDiagnosisMinutes: number
    targetDiagnosisMinutes: number
  }>(baselinePath)
  const incidents = parseJsonFile<GoDailyIncident[]>(incidentsPath) ?? []
  const contractCheck = runForgeOpsContractCheck()

  const referencedIncidents =
    config?.evidence.recentIncidentIds
      .map((id) => incidents.find((incident) => incident.id === id))
      .filter((incident): incident is GoDailyIncident => Boolean(incident)) ?? []

  const hasIncidentForFlow =
    Boolean(config && isRealValue(config.pilot.flowName)) &&
    referencedIncidents.some((incident) => incident.flow === config?.pilot.flowName)

  const checks: CheckResult[] = [
    {
      id: 'config_exists',
      label: 'Config de piloto preenchida',
      required: true,
      passed: Boolean(config),
      details: config
        ? 'Config encontrada em docs/ops/forgeops-go-daily.config.json.'
        : 'Config ausente ou invalida.',
    },
    {
      id: 'flow_with_history',
      label: 'Fluxo critico com historico recente de incidente',
      required: true,
      passed: hasIncidentForFlow,
      details: hasIncidentForFlow
        ? `Fluxo: ${config?.pilot.flowName}. Incidentes validados: ${referencedIncidents.map((incident) => incident.id).join(', ')}`
        : 'Registre incidente real em docs/ops/go-daily/incidents.json e referencie o ID no config.',
    },
    {
      id: 'owner_defined',
      label: 'Dono operacional definido com canal e escalacao',
      required: true,
      passed: Boolean(
        config &&
        isRealValue(config.pilot.ownerName) &&
        isRealValue(config.pilot.monitorChannel) &&
        isRealValue(config.pilot.escalationContact) &&
        config.pilot.responseSlaMinutes > 0
      ),
      details:
        config &&
        isRealValue(config.pilot.ownerName) &&
        isRealValue(config.pilot.monitorChannel) &&
        isRealValue(config.pilot.escalationContact) &&
        config.pilot.responseSlaMinutes > 0
          ? `${config.pilot.ownerName} | SLA: ${config.pilot.responseSlaMinutes} min | Canal: ${config.pilot.monitorChannel}`
          : 'Preencha ownerName, monitorChannel, escalationContact e responseSlaMinutes na config.',
    },
    {
      id: 'baseline_ready',
      label: 'Baseline antes/depois registrada',
      required: true,
      passed: Boolean(
        baseline &&
        Number.isFinite(baseline.beforeDiagnosisMinutes) &&
        Number.isFinite(baseline.targetDiagnosisMinutes) &&
        baseline.beforeDiagnosisMinutes > baseline.targetDiagnosisMinutes
      ),
      details:
        baseline &&
        Number.isFinite(baseline.beforeDiagnosisMinutes) &&
        Number.isFinite(baseline.targetDiagnosisMinutes)
          ? `Antes: ${baseline.beforeDiagnosisMinutes} min | Meta: ${baseline.targetDiagnosisMinutes} min`
          : 'Crie e preencha docs/ops/go-daily/baseline.json com numeros reais.',
    },
    {
      id: 'runbook_exists',
      label: 'Runbook GO diario disponivel',
      required: true,
      passed: fs.existsSync(runbookPath),
      details: fs.existsSync(runbookPath)
        ? 'Runbook encontrado em docs/ops/FORGEOPS_GO_DAILY_RUNBOOK.md.'
        : 'Runbook ausente.',
    },
    {
      id: 'incident_template_exists',
      label: 'Template de incidente disponivel',
      required: false,
      passed: fs.existsSync(incidentTemplatePath),
      details: fs.existsSync(incidentTemplatePath)
        ? 'Template encontrado em docs/ops/FORGEOPS_INCIDENT_TEMPLATE.md.'
        : 'Template ausente (recomendado).',
    },
    {
      id: 'incident-registry-exists',
      label: 'Registro de incidentes operacionais disponivel',
      required: true,
      passed: fs.existsSync(incidentsPath),
      details: fs.existsSync(incidentsPath)
        ? 'Registro encontrado em docs/ops/go-daily/incidents.json.'
        : 'Registro de incidentes ausente.',
    },
    {
      id: 'incident-registry-consistency',
      label: 'IDs referenciados existem no registro',
      required: true,
      passed:
        config !== null &&
        config.evidence.recentIncidentIds.length > 0 &&
        referencedIncidents.length === config.evidence.recentIncidentIds.length,
      details:
        config !== null &&
        config.evidence.recentIncidentIds.length > 0 &&
        referencedIncidents.length === config.evidence.recentIncidentIds.length
          ? 'Todos os IDs do config existem no registro de incidentes.'
          : 'Um ou mais IDs do config não existem em docs/ops/go-daily/incidents.json.',
    },
    {
      id: 'contract_enforced',
      label: 'Contrato operacional ForgeOps valido',
      required: true,
      passed: contractCheck.passed,
      details: contractCheck.details,
    },
  ]

  return checks
}

function writeDailyReport(checks: CheckResult[]) {
  const dateKey = todayDateKey()
  const reportPath = path.join(reportsDir, `${dateKey}.md`)
  const go = checks.every((check) => !check.required || check.passed)

  const lines = [
    `# GO Diario ForgeOps - ${dateKey}`,
    '',
    `Status final: ${go ? 'GO' : 'NO-GO'}`,
    '',
    '## Resultado por criterio',
    ...checks.map((check) => {
      const status = check.passed ? 'OK' : 'FALHOU'
      const requirement = check.required ? 'obrigatorio' : 'opcional'
      return `- [${status}] ${check.label} (${requirement}) - ${check.details}`
    }),
    '',
    '## Proxima acao objetiva',
    go
      ? '- Iniciar janela do piloto e registrar qualquer incidente apos estabilizacao.'
      : '- Tratar os itens obrigatorios que falharam e rodar novamente npm run go:daily.',
    '',
  ]

  fs.mkdirSync(reportsDir, { recursive: true })
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8')

  return { go, reportPath }
}

function main() {
  const args = new Set(process.argv.slice(2))

  if (args.has('--init')) {
    createInitFiles()
  }

  const config = parseJsonFile<GoDailyConfig>(configPath)
  const checks = buildChecks(config)
  const result = writeDailyReport(checks)

  console.log(`Status GO diario: ${result.go ? 'GO' : 'NO-GO'}`)
  console.log(`Relatorio: ${path.relative(repoRoot, result.reportPath)}`)

  for (const check of checks) {
    const marker = check.passed ? 'OK' : 'FALHOU'
    console.log(`- [${marker}] ${check.label}`)
  }

  if (!result.go) {
    process.exit(1)
  }
}

main()


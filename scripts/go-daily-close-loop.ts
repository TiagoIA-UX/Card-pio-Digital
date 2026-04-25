#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

type IncidentStatus = 'open' | 'mitigated' | 'resolved'

interface GoDailyIncident {
  id: string
  flow: string
  detectedAt: string
  status: IncidentStatus
  summary: string
}

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

const repoRoot = process.cwd()
const configPath = path.join(repoRoot, 'docs/ops/forgeops-go-daily.config.json')
const incidentsPath = path.join(repoRoot, 'docs/ops/go-daily/incidents.json')

function getArg(name: string) {
  const prefix = `--${name}=`
  const arg = process.argv.find((value) => value.startsWith(prefix))
  return arg ? arg.slice(prefix.length).trim() : null
}

function hasFlag(name: string) {
  return process.argv.includes(`--${name}`)
}

function assertRequired(value: string | null, flag: string) {
  if (!value) {
    throw new Error(`Parâmetro obrigatório ausente: --${flag}=...`)
  }
  return value
}

function parseStatus(value: string | null): IncidentStatus {
  if (!value) return 'open'
  if (value === 'open' || value === 'mitigated' || value === 'resolved') {
    return value
  }
  throw new Error('Status inválido. Use open|mitigated|resolved.')
}

function parseSla(value: string | null) {
  if (!value) return 10
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('SLA inválido. Use --sla-minutes com número positivo.')
  }
  return parsed
}

function isPlaceholder(value: string) {
  return value.trim().toLowerCase().startsWith('preencher_')
}

function readJsonFile<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo obrigatório ausente: ${path.relative(repoRoot, filePath)}`)
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
  } catch {
    throw new Error(`JSON inválido em ${path.relative(repoRoot, filePath)}`)
  }
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

function printUsageAndExit() {
  console.log(
    [
      'Uso:',
      'npm run go:daily:close-loop -- --flow=onboarding_submit --flow-reason="falha com impacto real" --owner="Nome" --channel="telegram:#canal" --escalation="contato" --incident-id=INC-2026-04-18-001 --incident-summary="descricao objetiva" [--incident-status=open] [--detected-at=ISO] [--sla-minutes=10] [--dry-run]',
    ].join('\n')
  )
  process.exit(1)
}

function main() {
  if (hasFlag('help')) {
    printUsageAndExit()
  }

  const flow = assertRequired(getArg('flow'), 'flow')
  const flowReason = assertRequired(getArg('flow-reason'), 'flow-reason')
  const owner = assertRequired(getArg('owner'), 'owner')
  const channel = assertRequired(getArg('channel'), 'channel')
  const escalation = assertRequired(getArg('escalation'), 'escalation')
  const incidentId = assertRequired(getArg('incident-id'), 'incident-id')
  const incidentSummary = assertRequired(getArg('incident-summary'), 'incident-summary')
  const incidentStatus = parseStatus(getArg('incident-status'))
  const detectedAt = getArg('detected-at') || new Date().toISOString()
  const slaMinutes = parseSla(getArg('sla-minutes'))
  const dryRun = hasFlag('dry-run')

  const fieldEntries = [flow, flowReason, owner, channel, escalation, incidentId, incidentSummary]
  if (fieldEntries.some((value) => isPlaceholder(value))) {
    throw new Error('Valores de placeholder não são aceitos no close-loop do GO diário.')
  }

  const config = readJsonFile<GoDailyConfig>(configPath)
  const incidents = readJsonFile<GoDailyIncident[]>(incidentsPath)

  const existingIncident = incidents.find((incident) => incident.id === incidentId)
  if (!existingIncident) {
    incidents.push({
      id: incidentId,
      flow,
      detectedAt,
      status: incidentStatus,
      summary: incidentSummary,
    })
  }

  config.pilot.flowName = flow
  config.pilot.flowReason = flowReason
  config.pilot.ownerName = owner
  config.pilot.monitorChannel = channel
  config.pilot.escalationContact = escalation
  config.pilot.responseSlaMinutes = slaMinutes

  const incidentSet = new Set(config.evidence.recentIncidentIds)
  incidentSet.add(incidentId)
  config.evidence.recentIncidentIds = Array.from(incidentSet)

  if (dryRun) {
    console.log('Dry-run: alterações calculadas com sucesso.')
    console.log(`Flow: ${flow}`)
    console.log(`Owner: ${owner}`)
    console.log(`Incident: ${incidentId}`)
    return
  }

  writeJsonFile(incidentsPath, incidents)
  writeJsonFile(configPath, config)

  console.log('Contexto operacional aplicado. Executando GO diário...')
  execSync('npm run -s go:daily', { cwd: repoRoot, stdio: 'inherit' })
}

main()


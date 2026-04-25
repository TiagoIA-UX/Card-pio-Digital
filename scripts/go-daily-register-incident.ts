#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'

type IncidentStatus = 'open' | 'mitigated' | 'resolved'

interface GoDailyIncident {
  id: string
  flow: string
  detectedAt: string
  status: IncidentStatus
  summary: string
}

const repoRoot = process.cwd()
const incidentsPath = path.join(repoRoot, 'docs/ops/go-daily/incidents.json')

function getArg(name: string) {
  const prefix = `--${name}=`
  const arg = process.argv.find((value) => value.startsWith(prefix))
  return arg ? arg.slice(prefix.length).trim() : null
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

function main() {
  const id = assertRequired(getArg('id'), 'id')
  const flow = assertRequired(getArg('flow'), 'flow')
  const summary = assertRequired(getArg('summary'), 'summary')
  const status = parseStatus(getArg('status'))
  const detectedAt = getArg('detectedAt') || new Date().toISOString()

  if (id.toLowerCase().startsWith('preencher_')) {
    throw new Error('ID de incidente inválido: placeholder não é aceito.')
  }

  if (flow.toLowerCase().startsWith('preencher_')) {
    throw new Error('Flow inválido: placeholder não é aceito.')
  }

  if (!fs.existsSync(path.dirname(incidentsPath))) {
    fs.mkdirSync(path.dirname(incidentsPath), { recursive: true })
  }

  const current = fs.existsSync(incidentsPath)
    ? (JSON.parse(fs.readFileSync(incidentsPath, 'utf8')) as GoDailyIncident[])
    : []

  if (current.some((incident) => incident.id === id)) {
    throw new Error(`Incidente já registrado com id: ${id}`)
  }

  const next: GoDailyIncident[] = [
    ...current,
    {
      id,
      flow,
      detectedAt,
      status,
      summary,
    },
  ]

  fs.writeFileSync(incidentsPath, JSON.stringify(next, null, 2) + '\n', 'utf8')
  console.log(`Incidente registrado com sucesso: ${id}`)
}

main()


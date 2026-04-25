#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'

interface RuleViolation {
  file: string
  rule: string
  details: string
}

const repoRoot = process.cwd()

const MONITORED_OPERATION_FILES = [
  'app/api/onboarding/submit/route.ts',
  'app/api/onboarding/status/route.ts',
  'app/api/onboarding/semente/route.ts',
]

const FALLBACK_GUARD_FILES = ['app/api/pagamento/status/route.ts']

const FORBIDDEN_PATTERNS = [
  {
    rule: 'forbidden-template-fallback',
    pattern:
      /normalizeTemplateSlug\(String\(metadata\.template_slug\s*\|\|\s*['"]restaurante['"]\)\)/,
    details:
      'Fallback silencioso de template_slug para restaurante é proibido no status de pagamento.',
  },
]

function readFileSafe(relativePath: string) {
  const abs = path.join(repoRoot, relativePath)
  if (!fs.existsSync(abs)) {
    throw new Error(`Arquivo obrigatório não encontrado: ${relativePath}`)
  }
  return fs.readFileSync(abs, 'utf8')
}

function checkOperationContract(relativePath: string, content: string): RuleViolation[] {
  const violations: RuleViolation[] = []

  if (!content.includes('createOperationTracker(')) {
    violations.push({
      file: relativePath,
      rule: 'missing-operation-tracker',
      details: 'Fluxo monitorado deve criar operation tracker no entrypoint.',
    })
  }

  if (!content.includes('operationId')) {
    violations.push({
      file: relativePath,
      rule: 'missing-operation-id-response',
      details: 'Fluxo monitorado deve retornar operationId em respostas de sucesso/erro.',
    })
  }

  if (!content.includes('toProcessing(')) {
    violations.push({
      file: relativePath,
      rule: 'missing-processing-transition',
      details: 'Fluxo monitorado deve transicionar explicitamente para processing.',
    })
  }

  if (!content.includes('toCompleted(')) {
    violations.push({
      file: relativePath,
      rule: 'missing-completed-transition',
      details: 'Fluxo monitorado deve transicionar explicitamente para completed.',
    })
  }

  if (!content.includes('.fail(')) {
    violations.push({
      file: relativePath,
      rule: 'missing-failed-transition',
      details: 'Fluxo monitorado deve capturar falhas e registrar failed.',
    })
  }

  return violations
}

function checkForbiddenFallbacks(relativePath: string, content: string): RuleViolation[] {
  const violations: RuleViolation[] = []

  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (forbidden.pattern.test(content)) {
      violations.push({
        file: relativePath,
        rule: forbidden.rule,
        details: forbidden.details,
      })
    }
  }

  return violations
}

function main() {
  const violations: RuleViolation[] = []

  for (const relativePath of MONITORED_OPERATION_FILES) {
    const content = readFileSafe(relativePath)
    violations.push(...checkOperationContract(relativePath, content))
  }

  for (const relativePath of FALLBACK_GUARD_FILES) {
    const content = readFileSafe(relativePath)
    violations.push(...checkForbiddenFallbacks(relativePath, content))
  }

  if (violations.length > 0) {
    console.error('ForgeOps contract enforcement failed:')
    for (const violation of violations) {
      console.error(`- [${violation.rule}] ${violation.file}: ${violation.details}`)
    }
    process.exit(1)
  }

  console.log('ForgeOps contract enforcement passed.')
}

main()


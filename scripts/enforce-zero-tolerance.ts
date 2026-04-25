#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'

interface Violation {
  file: string
  rule: string
  details: string
}

const repoRoot = process.cwd()

const MONITORED_FLOWS = {
  strict: ['app/api/onboarding/submit/route.ts', 'app/api/onboarding/semente/route.ts'],
  stateAware: ['app/api/onboarding/status/route.ts'],
  fallbackOnly: ['app/api/pagamento/status/route.ts'],
}

const RUNTIME_DIRS = ['app/api/onboarding', 'lib/shared/forgeops']

const FORBIDDEN_RUNTIME_PATTERNS: Array<{ rule: string; pattern: RegExp; details: string }> = [
  {
    rule: 'no-silent-catch-block',
    pattern: /catch\s*(?:\(\w+\))?\s*\{\s*\}/m,
    details: 'Bloco catch vazio detectado. Todo erro deve ser tratado explicitamente.',
  },
  {
    rule: 'no-silent-promise-catch',
    pattern: /\.catch\(\s*\(?.*?\)?\s*=>\s*\{\s*\}\s*\)/m,
    details: 'Promise catch silencioso detectado. Não engolir erro em fluxo operacional.',
  },
  {
    rule: 'no-placeholder-runtime',
    pattern: /preencher_|__PLACEHOLDER__|TODO_PLACEHOLDER|lorem ipsum/i,
    details: 'Placeholder detectado em código de runtime.',
  },
]

const FORBIDDEN_FALLBACK_PATTERNS: Array<{ rule: string; pattern: RegExp; details: string }> = [
  {
    rule: 'no-template-slug-silent-fallback',
    pattern: /template_slug\s*\|\|\s*['"][^'"]+['"]/,
    details: 'Fallback silencioso para template_slug detectado em fluxo crítico.',
  },
  {
    rule: 'no-normalize-template-restaurante-fallback',
    pattern:
      /normalizeTemplateSlug\(String\(metadata\.template_slug\s*\|\|\s*['"]restaurante['"]\)\)/,
    details: 'Fallback silencioso de template_slug para restaurante é proibido.',
  },
]

function resolvePath(relativePath: string) {
  return path.join(repoRoot, relativePath)
}

function readFile(relativePath: string) {
  const filePath = resolvePath(relativePath)
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo obrigatório ausente: ${relativePath}`)
  }
  return fs.readFileSync(filePath, 'utf8')
}

function listTsFilesRecursively(relativeDir: string): string[] {
  const absDir = resolvePath(relativeDir)
  if (!fs.existsSync(absDir)) {
    return []
  }

  const files: string[] = []
  const stack = [absDir]

  while (stack.length > 0) {
    const current = stack.pop() as string
    const entries = fs.readdirSync(current, { withFileTypes: true })
    for (const entry of entries) {
      const absEntry = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(absEntry)
        continue
      }

      if (!entry.isFile()) {
        continue
      }

      if (!absEntry.endsWith('.ts') && !absEntry.endsWith('.tsx')) {
        continue
      }

      const rel = path.relative(repoRoot, absEntry).replace(/\\/g, '/')
      files.push(rel)
    }
  }

  return files
}

function validateStrictFlow(file: string, content: string): Violation[] {
  const violations: Violation[] = []

  if (!content.includes('operationId')) {
    violations.push({
      file,
      rule: 'missing-operation-id',
      details: 'Fluxo crítico sem operationId explícito na resposta.',
    })
  }

  if (!content.includes('createOperationTracker(')) {
    violations.push({
      file,
      rule: 'missing-operation-tracker',
      details: 'Fluxo crítico sem tracker operacional.',
    })
  }

  if (
    !content.includes('toProcessing(') ||
    !content.includes('toCompleted(') ||
    !content.includes('.fail(')
  ) {
    violations.push({
      file,
      rule: 'ambiguous-state-machine',
      details: 'Fluxo crítico sem máquina de estados completa (processing/completed/failed).',
    })
  }

  if (!content.includes('safeParse(') && !content.includes('.parse(')) {
    violations.push({
      file,
      rule: 'missing-input-validation',
      details: 'Fluxo crítico sem validação explícita de entrada.',
    })
  }

  for (const forbidden of FORBIDDEN_FALLBACK_PATTERNS) {
    if (forbidden.pattern.test(content)) {
      violations.push({
        file,
        rule: forbidden.rule,
        details: forbidden.details,
      })
    }
  }

  return violations
}

function validateStateAwareFlow(file: string, content: string): Violation[] {
  const violations: Violation[] = []

  if (!content.includes('createOperationTracker(')) {
    violations.push({
      file,
      rule: 'missing-operation-tracker',
      details: 'Fluxo crítico sem tracker operacional.',
    })
  }

  if (!content.includes('operationId')) {
    violations.push({
      file,
      rule: 'missing-operation-id',
      details: 'Fluxo crítico sem operationId explícito na resposta.',
    })
  }

  if (
    !content.includes('toProcessing(') ||
    !content.includes('toCompleted(') ||
    !content.includes('.fail(')
  ) {
    violations.push({
      file,
      rule: 'ambiguous-state-machine',
      details: 'Fluxo crítico sem máquina de estados completa (processing/completed/failed).',
    })
  }

  return violations
}

function validateFallbackOnlyFlow(file: string, content: string): Violation[] {
  const violations: Violation[] = []
  for (const forbidden of FORBIDDEN_FALLBACK_PATTERNS) {
    if (forbidden.pattern.test(content)) {
      violations.push({
        file,
        rule: forbidden.rule,
        details: forbidden.details,
      })
    }
  }
  return violations
}

function validateRuntimeFile(file: string, content: string): Violation[] {
  const violations: Violation[] = []

  for (const forbidden of FORBIDDEN_RUNTIME_PATTERNS) {
    if (forbidden.pattern.test(content)) {
      violations.push({
        file,
        rule: forbidden.rule,
        details: forbidden.details,
      })
    }
  }

  return violations
}

function main() {
  const violations: Violation[] = []

  for (const file of MONITORED_FLOWS.strict) {
    const content = readFile(file)
    violations.push(...validateStrictFlow(file, content))
  }

  for (const file of MONITORED_FLOWS.stateAware) {
    const content = readFile(file)
    violations.push(...validateStateAwareFlow(file, content))
  }

  for (const file of MONITORED_FLOWS.fallbackOnly) {
    const content = readFile(file)
    violations.push(...validateFallbackOnlyFlow(file, content))
  }

  const runtimeFiles = RUNTIME_DIRS.flatMap((dir) => listTsFilesRecursively(dir))
  for (const file of runtimeFiles) {
    const content = readFile(file)
    violations.push(...validateRuntimeFile(file, content))
  }

  if (violations.length > 0) {
    console.error('Zero tolerance enforcement failed:')
    for (const violation of violations) {
      console.error(`- [${violation.rule}] ${violation.file}: ${violation.details}`)
    }
    process.exit(1)
  }

  console.log('Zero tolerance enforcement passed.')
}

main()


#!/usr/bin/env node
// scripts/pre-merge-check.mjs
// Verificação pré-merge: build + lint + types
// Exit 0 = seguro para merge | Exit 1 = NÃO faça merge

import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const OK = '\x1b[32m✓\x1b[0m'
const FAIL = '\x1b[31m✗\x1b[0m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

const inicio = Date.now()
const resultados = []

function execCmd(cmd, descricao) {
  process.stdout.write(`  Verificando ${descricao}... `)
  try {
    execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' })
    console.log(`${OK}`)
    resultados.push({ ok: true, descricao })
  } catch (err) {
    console.log(`${FAIL}`)
    const output = (err.stdout ?? '') + (err.stderr ?? '')
    if (output.trim()) {
      console.log('\x1b[90m' + output.split('\n').slice(0, 15).join('\n') + '\x1b[0m')
    }
    resultados.push({ ok: false, descricao, erro: output })
  }
}

console.log(`\n${BOLD}╔══════════════════════════════════════════════════╗${RESET}`)
console.log(`${BOLD}║          PRÉ-MERGE CHECK — Cardápio Digital      ║${RESET}`)
console.log(`${BOLD}╚══════════════════════════════════════════════════╝${RESET}\n`)

execCmd('npx tsc --noEmit', 'TypeScript (tsc --noEmit)')
execCmd('npx eslint . --max-warnings=0', 'ESLint')
execCmd('npx next build', 'Build Next.js')

const duracao = ((Date.now() - inicio) / 1000).toFixed(1)
const falhas = resultados.filter((r) => !r.ok)

console.log(`\n${BOLD}═══════════════════════════════════════════════════${RESET}`)

if (falhas.length === 0) {
  console.log(`\n  ${OK} ${BOLD}SEGURO PARA MERGE${RESET} (${duracao}s)`)
  console.log('\n  Todos os checks passaram:\n')
  for (const r of resultados) {
    console.log(`    ${OK} ${r.descricao}`)
  }
  console.log()
  process.exit(0)
} else {
  console.log(`\n  ${FAIL} ${BOLD}NÃO FAÇA MERGE${RESET} — ${falhas.length} check(s) falharam (${duracao}s)`)
  console.log('\n  Falhas encontradas:\n')
  for (const r of falhas) {
    console.log(`    ${FAIL} ${r.descricao}`)
  }
  console.log()
  process.exit(1)
}

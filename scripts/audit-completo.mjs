#!/usr/bin/env node
// scripts/audit-completo.mjs
// Auditoria de qualidade de código

import { execSync } from 'child_process'
import { readdirSync, readFileSync, statSync } from 'fs'
import { resolve, join, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'
const WARN = '\x1b[33m⚠\x1b[0m'
const OK = '\x1b[32m✓\x1b[0m'
const FAIL = '\x1b[31m✗\x1b[0m'
const INFO = '\x1b[36mℹ\x1b[0m'

const EXTENSOES_TS = new Set(['.ts', '.tsx'])
const DIRS_IGNORADOS = new Set(['node_modules', '.next', '.git', 'dist', 'out', '.vercel'])

function listarArquivos(dir, exts = EXTENSOES_TS) {
  const arquivos = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (DIRS_IGNORADOS.has(entry.name)) continue
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      arquivos.push(...listarArquivos(fullPath, exts))
    } else if (exts.has(extname(entry.name))) {
      arquivos.push(fullPath)
    }
  }
  return arquivos
}

function secao(titulo) {
  console.log(`\n${BOLD}${titulo}${RESET}`)
  console.log('─'.repeat(50))
}

console.log(`\n${BOLD}╔══════════════════════════════════════════════════╗${RESET}`)
console.log(`${BOLD}║       AUDITORIA DE QUALIDADE — Cardápio Digital  ║${RESET}`)
console.log(`${BOLD}╚══════════════════════════════════════════════════╝${RESET}`)

const arquivosTS = listarArquivos(ROOT)
let totalProblemas = 0

// ── 1. Verificar uso de `any` ─────────────────────────────
secao('1. Uso de `any` (TypeScript)')

const arquivosComAny = []
for (const arquivo of arquivosTS) {
  const conteudo = readFileSync(arquivo, 'utf8')
  const linhas = conteudo.split('\n')
  const ocorrencias = []
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]
    if (/:\s*any\b/.test(linha) && !linha.includes('// eslint-disable') && !linha.includes('// any')) {
      ocorrencias.push({ linha: i + 1, conteudo: linha.trim() })
    }
  }
  if (ocorrencias.length > 0) {
    arquivosComAny.push({ arquivo: arquivo.replace(ROOT + '/', ''), ocorrencias })
  }
}

if (arquivosComAny.length === 0) {
  console.log(`  ${OK} Nenhum uso de \`any\` encontrado`)
} else {
  const total = arquivosComAny.reduce((acc, a) => acc + a.ocorrencias.length, 0)
  console.log(`  ${WARN} ${total} ocorrência(s) de \`any\` em ${arquivosComAny.length} arquivo(s):`)
  for (const { arquivo, ocorrencias } of arquivosComAny.slice(0, 10)) {
    console.log(`\n    \x1b[90m${arquivo}\x1b[0m`)
    for (const { linha, conteudo } of ocorrencias.slice(0, 3)) {
      console.log(`      Linha ${linha}: ${conteudo.slice(0, 80)}`)
    }
  }
  totalProblemas += total
}

// ── 2. console.log fora de scripts ────────────────────────
secao('2. console.log fora de scripts/')

const DIRS_PERMITIDOS = ['scripts/', 'tests/']
const arquivosComLog = []

for (const arquivo of arquivosTS) {
  const relativo = arquivo.replace(ROOT + '/', '')
  const emDirPermitido = DIRS_PERMITIDOS.some((d) => relativo.startsWith(d))
  if (emDirPermitido) continue

  const conteudo = readFileSync(arquivo, 'utf8')
  const linhas = conteudo.split('\n')
  const ocorrencias = []
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]
    if (/console\.log\(/.test(linha) && !linha.includes('// eslint-disable')) {
      ocorrencias.push({ linha: i + 1, conteudo: linha.trim() })
    }
  }
  if (ocorrencias.length > 0) {
    arquivosComLog.push({ arquivo: relativo, ocorrencias })
  }
}

if (arquivosComLog.length === 0) {
  console.log(`  ${OK} Nenhum console.log encontrado fora de scripts/`)
} else {
  const total = arquivosComLog.reduce((acc, a) => acc + a.ocorrencias.length, 0)
  console.log(`  ${WARN} ${total} console.log(s) em ${arquivosComLog.length} arquivo(s):`)
  for (const { arquivo, ocorrencias } of arquivosComLog.slice(0, 10)) {
    console.log(`\n    \x1b[90m${arquivo}\x1b[0m`)
    for (const { linha } of ocorrencias.slice(0, 3)) {
      console.log(`      Linha ${linha}`)
    }
  }
  totalProblemas += total
}

// ── 3. Arquivos > 500 linhas ──────────────────────────────
secao('3. Arquivos com mais de 500 linhas')

const arquivosGrandes = []
for (const arquivo of arquivosTS) {
  const conteudo = readFileSync(arquivo, 'utf8')
  const linhas = conteudo.split('\n').length
  if (linhas > 500) {
    arquivosGrandes.push({ arquivo: arquivo.replace(ROOT + '/', ''), linhas })
  }
}

arquivosGrandes.sort((a, b) => b.linhas - a.linhas)

if (arquivosGrandes.length === 0) {
  console.log(`  ${OK} Nenhum arquivo com mais de 500 linhas`)
} else {
  console.log(`  ${WARN} ${arquivosGrandes.length} arquivo(s) com mais de 500 linhas:`)
  for (const { arquivo, linhas } of arquivosGrandes.slice(0, 10)) {
    console.log(`    ${INFO} ${arquivo}: ${linhas} linhas`)
  }
  totalProblemas += arquivosGrandes.length
}

// ── 4. Imports não utilizados (via ESLint) ────────────────
secao('4. Imports não utilizados')

try {
  execSync(
    'npx eslint . --rule "no-unused-vars: error" --rule "@typescript-eslint/no-unused-vars: error" --format json 2>/dev/null',
    { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' }
  )
  console.log(`  ${OK} Nenhum import não utilizado detectado`)
} catch (err) {
  const output = err.stdout ?? ''
  let totalUnused = 0
  try {
    const results = JSON.parse(output)
    for (const result of results) {
      const unused = result.messages.filter(
        (m) => m.ruleId === 'no-unused-vars' || m.ruleId === '@typescript-eslint/no-unused-vars'
      )
      if (unused.length > 0) {
        totalUnused += unused.length
        const relativo = result.filePath.replace(ROOT + '/', '')
        console.log(`    ${WARN} ${relativo}: ${unused.length} não utilizado(s)`)
      }
    }
  } catch {
    console.log(`  ${INFO} Não foi possível analisar imports automaticamente`)
  }
  if (totalUnused > 0) {
    totalProblemas += totalUnused
  } else {
    console.log(`  ${OK} Nenhum import não utilizado`)
  }
}

// ── Relatório final ───────────────────────────────────────
console.log(`\n${BOLD}═══════════════════════════════════════════════════${RESET}`)
console.log(`${BOLD}RESULTADO DA AUDITORIA${RESET}\n`)

if (totalProblemas === 0) {
  console.log(`  ${OK} ${BOLD}Código passou na auditoria de qualidade!${RESET}`)
} else {
  console.log(`  ${WARN} ${totalProblemas} problema(s) encontrado(s) no total`)
  console.log('  Corrija os itens acima para manter a qualidade do código.')
}
console.log()
process.exit(totalProblemas > 0 ? 1 : 0)

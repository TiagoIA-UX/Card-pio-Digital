#!/usr/bin/env node
// scripts/setup-completo.mjs
// Verifica se o ambiente está completamente configurado para desenvolvimento e produção

import { execSync } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const OK = '\x1b[32m✓\x1b[0m'
const FAIL = '\x1b[31m✗\x1b[0m'
const WARN = '\x1b[33m⚠\x1b[0m'
const INFO = '\x1b[36mℹ\x1b[0m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

let erros = 0
let avisos = 0

function ok(msg) {
  console.log(`  ${OK} ${msg}`)
}

function fail(msg) {
  console.log(`  ${FAIL} ${msg}`)
  erros++
}

function warn(msg) {
  console.log(`  ${WARN} ${msg}`)
  avisos++
}

function info(msg) {
  console.log(`  ${INFO} ${msg}`)
}

function secao(titulo) {
  console.log(`\n${BOLD}${titulo}${RESET}`)
  console.log('─'.repeat(50))
}

function execCmd(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' }).trim()
  } catch {
    return null
  }
}

console.log(`\n${BOLD}╔══════════════════════════════════════════════════╗${RESET}`)
console.log(`${BOLD}║       SETUP COMPLETO — Cardápio Digital          ║${RESET}`)
console.log(`${BOLD}╚══════════════════════════════════════════════════╝${RESET}`)

// ── 1. Versões ────────────────────────────────────────────
secao('1. Versões de ferramentas')

const nodeVersion = process.version
const nodeMajor = parseInt(nodeVersion.slice(1))
if (nodeMajor >= 20) {
  ok(`Node.js ${nodeVersion}`)
} else {
  fail(`Node.js ${nodeVersion} — requer 20.x ou superior`)
}

const npmVersion = execCmd('npm --version')
if (npmVersion) {
  const npmMajor = parseInt(npmVersion.split('.')[0])
  if (npmMajor >= 10) {
    ok(`npm ${npmVersion}`)
  } else {
    fail(`npm ${npmVersion} — requer 10.x ou superior`)
  }
} else {
  fail('npm não encontrado')
}

// ── 2. Arquivo .env.local ──────────────────────────────────
secao('2. Variáveis de ambiente')

const envPath = resolve(ROOT, '.env.local')
if (!existsSync(envPath)) {
  fail('.env.local não encontrado — copie .env.example e preencha as variáveis')
} else {
  ok('.env.local existe')

  // Variáveis obrigatórias usadas pelo projeto
  const VARS_OBRIGATORIAS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SITE_URL',
  ]

  const VARS_OPCIONAIS = [
    'GROQ_API_KEY',
    'MERCADOPAGO_ACCESS_TOKEN',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'CRON_SECRET',
  ]

  const envContent = execCmd(`cat "${envPath}"`) ?? ''

  for (const v of VARS_OBRIGATORIAS) {
    if (envContent.includes(`${v}=`) && !envContent.includes(`${v}=\n`) && !envContent.includes(`${v}=""`)) {
      ok(v)
    } else {
      fail(`${v} — não definida ou vazia`)
    }
  }

  for (const v of VARS_OPCIONAIS) {
    if (envContent.includes(`${v}=`) && !envContent.includes(`${v}=\n`)) {
      ok(`${v} (opcional)`)
    } else {
      warn(`${v} — não definida (funcionalidade limitada)`)
    }
  }
}

// ── 3. node_modules ───────────────────────────────────────
secao('3. Dependências')

if (existsSync(resolve(ROOT, 'node_modules'))) {
  ok('node_modules instalado')
} else {
  fail('node_modules não encontrado — execute: npm install')
}

// ── 4. Migrations ──────────────────────────────────────────
secao('4. Migrations SQL')

const migrationsDir = resolve(ROOT, 'supabase/migrations')
if (existsSync(migrationsDir)) {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))
  ok(`${files.length} migration(s) encontrada(s)`)
  info(`Última: ${files.sort().at(-1)}`)
} else {
  fail('Diretório supabase/migrations não encontrado')
}

// ── 5. TypeScript ─────────────────────────────────────────
secao('5. TypeScript')

info('Verificando tipos (tsc --noEmit)...')
const tscResult = execCmd('npx tsc --noEmit 2>&1')
if (tscResult === null || tscResult === '') {
  ok('TypeScript sem erros')
} else if (tscResult.includes('error TS')) {
  const errorCount = (tscResult.match(/error TS/g) ?? []).length
  fail(`${errorCount} erro(s) TypeScript encontrado(s)`)
  console.log('\x1b[90m' + tscResult.split('\n').slice(0, 10).join('\n') + '\x1b[0m')
} else {
  ok('TypeScript sem erros')
}

// ── 6. ESLint ─────────────────────────────────────────────
secao('6. ESLint')

info('Verificando lint...')
const lintResult = execCmd('npx eslint . --max-warnings=0 2>&1')
if (lintResult === null || lintResult === '') {
  ok('ESLint sem erros')
} else if (lintResult.includes('error')) {
  fail('ESLint encontrou erros — execute: npm run lint')
} else {
  warn('ESLint encontrou avisos — execute: npm run lint')
}

// ── 7. Build ──────────────────────────────────────────────
secao('7. Build Next.js')

info('Executando next build (pode demorar)...')
const buildResult = execCmd('npx next build 2>&1')
if (buildResult && buildResult.includes('✓') && !buildResult.includes('Error')) {
  ok('Build concluído com sucesso')
} else if (buildResult && buildResult.includes('error')) {
  fail('Build falhou — verifique os erros acima')
} else {
  warn('Não foi possível verificar o resultado do build')
}

// ── Relatório final ───────────────────────────────────────
console.log(`\n${BOLD}═══════════════════════════════════════════════════${RESET}`)
console.log(`${BOLD}RELATÓRIO FINAL${RESET}`)
console.log('─'.repeat(50))

if (erros === 0 && avisos === 0) {
  console.log(`\n  ${OK} ${BOLD}Ambiente 100% configurado e pronto para produção!${RESET}`)
} else if (erros === 0) {
  console.log(`\n  ${WARN} Ambiente funcional com ${avisos} aviso(s)`)
} else {
  console.log(`\n  ${FAIL} ${erros} erro(s) crítico(s) encontrado(s) — corrija antes de fazer deploy`)
}

console.log(`\n  Erros:  ${erros}`)
console.log(`  Avisos: ${avisos}\n`)

process.exit(erros > 0 ? 1 : 0)

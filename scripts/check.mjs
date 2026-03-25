#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const cwd = process.cwd()
const envPath = path.join(cwd, '.env.local')
const isCi = process.env.CI === 'true'

const color = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
}

let okCount = 0
let warningCount = 0
let errorCount = 0

function printSection(title) {
  console.log(`\n${color.bold(title)}`)
  console.log('─'.repeat(58))
}

function pass(label) {
  console.log(`  ${color.green('OK')} ${label}`)
  okCount += 1
}

function fail(label, hint) {
  console.log(`  ${color.red('ERRO')} ${label}`)
  if (hint) console.log(`     ${color.gray(`-> ${hint}`)}`)
  errorCount += 1
}

function warn(label, hint) {
  console.log(`  ${color.yellow('AVISO')} ${label}`)
  if (hint) console.log(`     ${color.gray(`-> ${hint}`)}`)
  warningCount += 1
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}

  const content = fs.readFileSync(filePath, 'utf8')
  const values = {}

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) continue

    const key = line.slice(0, separatorIndex).trim()
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    values[key] = value
  }

  return values
}

function getCommandOutput(command) {
  return execSync(command, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf8',
    env: process.env,
  })
}

function runCommand(label, command, hint) {
  try {
    getCommandOutput(command)
    pass(label)
  } catch (error) {
    const stdout = error.stdout?.toString?.() ?? ''
    const stderr = error.stderr?.toString?.() ?? ''
    const firstRelevantLine = `${stdout}\n${stderr}`
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean)

    fail(label, firstRelevantLine || hint)
  }
}

function hasNonEmpty(env, keys) {
  return keys.some((key) => {
    const value = env[key]
    return typeof value === 'string' && value.trim() !== ''
  })
}

function hasPlaceholder(value) {
  if (!value) return false

  const normalized = value.trim().toLowerCase()
  return (
    normalized.includes('placeholder') ||
    normalized.includes('example') ||
    normalized === 'changeme' ||
    normalized === 'your_value_here'
  )
}

const env = {
  ...readEnvFile(envPath),
  ...process.env,
}

const paymentMode = (
  env.NEXT_PUBLIC_MERCADO_PAGO_ENV ||
  env.MERCADO_PAGO_ENV ||
  'sandbox'
).toLowerCase()
const siteUrl = (env.NEXT_PUBLIC_SITE_URL || '').trim().toLowerCase()
const isLocalSiteUrl =
  siteUrl === '' || siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')
const isProductionTarget =
  process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production' || isCi
const strictEnvValidation = isProductionTarget

console.log('')
console.log(color.bold('ZAIRYX - Diagnostico do Projeto'))
console.log(color.gray('Verificacao local antes de commit, push ou deploy.'))

printSection('1. Arquivos criticos')

const criticalFiles = [
  ['next.config.mjs', 'Configuracao do Next.js'],
  ['proxy.ts', 'Proxy de autenticacao e protecao de rotas'],
  ['tsconfig.json', 'Configuracao TypeScript'],
  ['eslint.config.mjs', 'Configuracao ESLint'],
  ['lib/supabase/client.ts', 'Cliente browser do Supabase'],
  ['lib/supabase/server.ts', 'Cliente server do Supabase'],
  ['lib/mercadopago.ts', 'Integracao Mercado Pago'],
  ['lib/mercadopago-webhook.ts', 'Validacao de assinatura do webhook'],
  ['app/api/webhook/mercadopago/route.ts', 'Webhook principal do Mercado Pago'],
  ['app/meus-templates/page.tsx', 'Area Meus Cardapios'],
  ['app/painel/layout.tsx', 'Layout autenticado do painel'],
]

for (const [file, description] of criticalFiles) {
  if (fs.existsSync(path.join(cwd, file))) {
    pass(`${description} (${file})`)
  } else {
    fail(`${description} (${file})`, `Arquivo ausente: ${file}`)
  }
}

printSection('2. Variaveis de ambiente')

if (!fs.existsSync(envPath) && !isCi) {
  warn(
    'Arquivo .env.local nao encontrado',
    'Execute npm run setup:local ou configure as variaveis no ambiente'
  )
}

const requiredAlways = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
]

const requiredSandbox = [
  ['MERCADO_PAGO_TEST_ACCESS_TOKEN'],
  ['NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY', 'MERCADO_PAGO_TEST_PUBLIC_KEY'],
]

const requiredProduction = [
  ['MERCADO_PAGO_ACCESS_TOKEN', 'MP_ACCESS_TOKEN'],
  ['NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY', 'MERCADO_PAGO_PUBLIC_KEY'],
  ['CRON_SECRET'],
  ['MP_WEBHOOK_SECRET'],
]

const requiredProductionCritical = ['GROQ_API_KEY']

const recommendedProduction = [
  ['ADMIN_SECRET_KEY'],
  ['OWNER_EMAIL'],
  ['INTERNAL_API_SECRET'],
  ['RESEND_API_KEY'],
  ['R2_ACCOUNT_ID'],
  ['R2_ACCESS_KEY_ID'],
  ['R2_SECRET_ACCESS_KEY'],
  ['R2_PUBLIC_URL'],
  ['NEXT_PUBLIC_COMPANY_CNPJ'],
]

for (const key of requiredAlways) {
  if (hasNonEmpty(env, [key])) {
    pass(`Variavel obrigatoria configurada (${key})`)
  } else {
    const message = `Defina ${key} no ambiente ou no .env.local`
    if (strictEnvValidation) {
      fail(`Variavel obrigatoria ausente (${key})`, message)
    } else {
      warn(`Variavel obrigatoria ausente (${key})`, `${message} (checagem local)`) 
    }
  }
}

for (const keys of paymentMode === 'production' ? requiredProduction : requiredSandbox) {
  const label = keys.join(' ou ')
  if (hasNonEmpty(env, keys)) {
    pass(`Credencial de ${paymentMode} configurada (${label})`)
  } else {
    const message = `Defina ${label}`
    if (strictEnvValidation) {
      fail(`Credencial de ${paymentMode} ausente (${label})`, message)
    } else {
      warn(`Credencial de ${paymentMode} ausente (${label})`, `${message} (checagem local)`) 
    }
  }
}

for (const key of requiredProductionCritical) {
  if (hasNonEmpty(env, [key])) {
    pass(`Variavel critica de producao configurada (${key})`)
  } else {
    const message = `Defina ${key} antes do deploy`
    if (strictEnvValidation) {
      fail(`Variavel critica de producao ausente (${key})`, message)
    } else {
      warn(`Variavel critica de producao ausente (${key})`, `${message} (checagem local)`)
    }
  }
}

if (paymentMode === 'sandbox' && !isLocalSiteUrl && isProductionTarget) {
  fail(
    'Mercado Pago em sandbox para ambiente publico',
    'Troque NEXT_PUBLIC_MERCADO_PAGO_ENV e MERCADO_PAGO_ENV para production antes do deploy'
  )
}

if (paymentMode === 'production') {
  for (const keys of recommendedProduction) {
    const label = keys.join(' ou ')
    if (hasNonEmpty(env, keys)) {
      pass(`Variavel recomendada configurada (${label})`)
    } else {
      warn(
        `Variavel recomendada nao configurada (${label})`,
        'Nao bloqueia deploy, mas reduz cobertura operacional'
      )
    }
  }
}

for (const [key, value] of Object.entries(env)) {
  if (typeof value !== 'string') continue
  if (
    !/^NEXT_PUBLIC_|SUPABASE_|MERCADO_PAGO_|MP_|CRON_SECRET|ADMIN_SECRET_KEY|OWNER_EMAIL|GROQ_API_KEY|INTERNAL_API_SECRET|RESEND_API_KEY|R2_|UPSTASH_|NEXT_PUBLIC_COMPANY_CNPJ/.test(
      key
    )
  ) {
    continue
  }
  if (hasPlaceholder(value)) {
    fail(`Valor placeholder detectado em ${key}`, 'Substitua por valor real antes de publicar')
  }
}

if ((env.NEXT_PUBLIC_SITE_URL || '').includes('localhost')) {
  warn(
    'NEXT_PUBLIC_SITE_URL aponta para localhost',
    'Troque para o dominio publico antes do deploy'
  )
}

printSection('3. Headers de seguranca')

if (fs.existsSync(path.join(cwd, 'next.config.mjs'))) {
  const nextConfig = fs.readFileSync(path.join(cwd, 'next.config.mjs'), 'utf8')
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'Permissions-Policy',
  ]

  for (const header of requiredHeaders) {
    if (nextConfig.includes(header)) {
      pass(`Header presente (${header})`)
    } else {
      fail(`Header ausente (${header})`, 'Atualize next.config.mjs')
    }
  }
}

printSection('4. TypeScript')
runCommand('TypeScript sem erros', 'npx tsc --noEmit', 'Execute npx tsc --noEmit para detalhes')

printSection('5. ESLint')
runCommand('ESLint sem erros', 'npm run lint', 'Execute npm run lint para detalhes')

printSection('6. Build de producao')
runCommand(
  'Build de producao concluido',
  'npm run build',
  'Revise as variaveis de ambiente e erros de compilacao'
)

printSection('7. Seguranca de dependencias')
runCommand(
  'Sem vulnerabilidades high/critical no npm audit',
  'npm audit --audit-level=high',
  'Execute npm audit para revisar as dependencias vulneraveis'
)

printSection('8. Estrutura e aliases')

const requiredPaths = [
  'app/api/webhook/mercadopago',
  'components/ui',
  'components/cart',
  'lib/supabase',
  'services',
  'store',
  'hooks',
  'types',
  'supabase',
  'scripts',
]

for (const target of requiredPaths) {
  if (fs.existsSync(path.join(cwd, target))) {
    pass(`Estrutura presente (${target})`)
  } else {
    fail(`Estrutura ausente (${target})`, `Crie ou restaure ${target}`)
  }
}

if (fs.existsSync(path.join(cwd, 'tsconfig.json'))) {
  const tsconfig = fs.readFileSync(path.join(cwd, 'tsconfig.json'), 'utf8')
  if (tsconfig.includes('"@/*"')) {
    pass('Alias @/* configurado no tsconfig.json')
  } else {
    fail('Alias @/* ausente no tsconfig.json', 'Adicione paths para @/*')
  }
}

console.log(`\n${'═'.repeat(58)}`)
console.log(color.bold('RESUMO'))
console.log('═'.repeat(58))
console.log(`  ${color.green('OK')}: ${okCount}`)
console.log(`  ${color.yellow('Avisos')}: ${warningCount}`)
console.log(`  ${color.red('Erros')}: ${errorCount}`)
console.log('═'.repeat(58))

if (errorCount > 0) {
  console.log(
    `\n${color.red(color.bold(`Corrija ${errorCount} erro(s) antes de seguir para deploy.`))}`
  )
  process.exit(1)
}

if (warningCount > 0) {
  console.log(
    `\n${color.yellow('Projeto verificavel, mas revise os avisos acima antes de publicar.')}`
  )
} else {
  console.log(`\n${color.green(color.bold('Tudo certo. Projeto pronto para avancar.'))}`)
}

console.log('')

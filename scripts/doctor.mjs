import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const envPath = path.join(rootDir, '.env.local')

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  const values = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) continue

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    values[key] = value
  }

  return values
}

const env = {
  ...readEnvFile(envPath),
  ...process.env,
}

const paymentMode = (env.NEXT_PUBLIC_MERCADO_PAGO_ENV || env.MERCADO_PAGO_ENV || 'sandbox').toLowerCase()

const requiredAlways = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
]

const requiredSandbox = [
  'MERCADO_PAGO_TEST_ACCESS_TOKEN',
  'NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY',
]

const requiredProduction = [
  'MERCADO_PAGO_ACCESS_TOKEN',
  'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY',
]

const missing = []

for (const key of requiredAlways) {
  if (!env[key]) missing.push(key)
}

for (const key of paymentMode === 'production' ? requiredProduction : requiredSandbox) {
  if (!env[key]) missing.push(key)
}

if (!fs.existsSync(envPath)) {
  console.log('Arquivo .env.local nao encontrado.')
}

console.log(`Modo de pagamento detectado: ${paymentMode}`)

if (missing.length > 0) {
  console.error('Variaveis ausentes:')
  for (const key of missing) {
    console.error(`- ${key}`)
  }
  process.exit(1)
}

console.log('Ambiente validado com sucesso.')

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

const paymentMode = (
  env.NEXT_PUBLIC_MERCADO_PAGO_ENV ||
  env.MERCADO_PAGO_ENV ||
  'sandbox'
).toLowerCase()
const siteUrl = (env.NEXT_PUBLIC_SITE_URL || '').trim().toLowerCase()
const isLocalSiteUrl =
  siteUrl === '' || siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')
const isProductionTarget =
  env.VERCEL_ENV === 'production' || env.NODE_ENV === 'production' || env.CI === 'true'

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
  'CRON_SECRET',
  'MP_WEBHOOK_SECRET',
]

const recommendedProduction = [
  'ADMIN_SECRET_KEY',
  'OWNER_EMAIL',
  'GROQ_API_KEY',
  'INTERNAL_API_SECRET',
  'RESEND_API_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_URL',
]

const missing = []
const warnings = []

for (const key of requiredAlways) {
  if (!env[key]) missing.push(key)
}

for (const key of paymentMode === 'production' ? requiredProduction : requiredSandbox) {
  if (!env[key]) missing.push(key)
}

if (paymentMode === 'production') {
  for (const key of recommendedProduction) {
    if (!env[key]) warnings.push(key)
  }
}

if (paymentMode === 'sandbox' && !isLocalSiteUrl && isProductionTarget) {
  console.error('Sandbox detectado em ambiente publico de producao.')
  console.error('- NEXT_PUBLIC_MERCADO_PAGO_ENV/MERCADO_PAGO_ENV devem estar como production')
  console.error('- Nao publique checkout real com Mercado Pago em sandbox')
  process.exit(1)
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

if (warnings.length > 0) {
  console.warn('Variaveis recomendadas para producao que nao estao configuradas:')
  for (const key of warnings) {
    console.warn(`- ${key}`)
  }
}

console.log('Ambiente validado com sucesso.')

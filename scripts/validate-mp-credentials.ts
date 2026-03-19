/**
 * scripts/validate-mp-credentials.ts
 *
 * Valida integridade das credenciais Mercado Pago (produção e sandbox).
 * Roda standalone: npx tsx scripts/validate-mp-credentials.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carrega .env.local (padrão Next.js)
config({ path: resolve(process.cwd(), '.env.local') })

interface CredentialCheck {
  name: string
  envVar: string
  value: string | undefined
  pattern: RegExp
  valid: boolean
  environment: 'production' | 'sandbox' | 'shared'
}

const CHECKS: Omit<CredentialCheck, 'value' | 'valid'>[] = [
  // Produção
  {
    name: 'Access Token (Produção)',
    envVar: 'MERCADO_PAGO_ACCESS_TOKEN',
    pattern: /^APP_USR-\d+-\d+-[a-f0-9]+-\d+$/,
    environment: 'production',
  },
  {
    name: 'Public Key (Produção)',
    envVar: 'NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY',
    pattern: /^APP_USR-[a-f0-9-]{36}$/,
    environment: 'production',
  },
  // Sandbox
  {
    name: 'Access Token (Sandbox)',
    envVar: 'MERCADO_PAGO_TEST_ACCESS_TOKEN',
    pattern: /^TEST-\d+-\d+-[a-f0-9]+-\d+$/,
    environment: 'sandbox',
  },
  {
    name: 'Public Key (Sandbox)',
    envVar: 'NEXT_PUBLIC_MERCADO_PAGO_TEST_PUBLIC_KEY',
    pattern: /^TEST-[a-f0-9-]{36}$/,
    environment: 'sandbox',
  },
  {
    name: 'Test Seller ID',
    envVar: 'MERCADO_PAGO_TEST_SELLER_ID',
    pattern: /^\d{8,12}$/,
    environment: 'sandbox',
  },
  {
    name: 'Test Buyer ID',
    envVar: 'MERCADO_PAGO_TEST_BUYER_ID',
    pattern: /^\d{8,12}$/,
    environment: 'sandbox',
  },
  // Shared
  {
    name: 'Webhook Secret',
    envVar: 'MP_WEBHOOK_SECRET',
    pattern: /^[a-f0-9]{64}$/,
    environment: 'shared',
  },
]

function validate(): CredentialCheck[] {
  return CHECKS.map((check) => {
    const value = process.env[check.envVar]?.trim()
    return {
      ...check,
      value,
      valid: !!value && check.pattern.test(value),
    }
  })
}

function printReport(results: CredentialCheck[]) {
  console.log('\n════════════════════════════════════════════════════════════')
  console.log('Mercado Pago — Validação de Credenciais')
  console.log('════════════════════════════════════════════════════════════\n')

  const env = process.env.MERCADO_PAGO_ENV || process.env.NEXT_PUBLIC_MERCADO_PAGO_ENV || '???'
  console.log(`Ambiente ativo: ${env.toUpperCase()}\n`)

  const groups = {
    production: results.filter((r) => r.environment === 'production'),
    sandbox: results.filter((r) => r.environment === 'sandbox'),
    shared: results.filter((r) => r.environment === 'shared'),
  }

  for (const [groupName, items] of Object.entries(groups)) {
    console.log(`── ${groupName.toUpperCase()} ──`)
    for (const item of items) {
      const icon = item.valid ? '✅' : '❌'
      const preview = item.value ? `${item.value.slice(0, 12)}...` : '(não definido)'
      console.log(`  ${icon} ${item.name}: ${preview}`)
    }
    console.log()
  }

  const total = results.length
  const passed = results.filter((r) => r.valid).length
  const failed = total - passed

  console.log('════════════════════════════════════════════════════════════')
  console.log(`Resultado: ${passed}/${total} válidas${failed > 0 ? ` — ${failed} FALHARAM` : ''}`)
  console.log('════════════════════════════════════════════════════════════\n')

  return failed === 0
}

const results = validate()
const allValid = printReport(results)
process.exit(allValid ? 0 : 1)

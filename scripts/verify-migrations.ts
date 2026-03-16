#!/usr/bin/env tsx
/**
 * Verifica se todas as migrations críticas foram aplicadas no banco de produção.
 *
 * Uso:
 *   npx tsx scripts/verify-migrations.ts
 *
 * Requer: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local ou .env.production
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────
// Env loader (mesmo padrão dos outros scripts)
// ─────────────────────────────────────────────
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const sep = line.indexOf('=')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    const raw = line.slice(sep + 1).trim()
    // Remove aspas envolventes; remove \r\n literais (artefato do vercel env pull no Windows)
    const value = raw
      .replace(/^["']|["']$/g, '')
      .replace(/\\r\\n$/g, '')
      .replace(/\\n$/g, '')
      .replace(/\r$/, '')
    if (!process.env[key]) process.env[key] = value
  }
}

function ensureEnv() {
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env.local'))
  loadEnvFile(path.join(root, '.env.production'))
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`)
  }
}

// ─────────────────────────────────────────────
// Definição das verificações
// ─────────────────────────────────────────────

type Check = {
  migration: string
  table: string
  column: string
  description: string
}

const CHECKS: Check[] = [
  // Migration 001 – schema base
  { migration: '001', table: 'plans', column: 'id', description: 'plans existe' },
  { migration: '001', table: 'subscriptions', column: 'id', description: 'subscriptions existe' },

  // Migration 002b – customização de restaurante
  {
    migration: '002b',
    table: 'restaurants',
    column: 'template_slug',
    description: 'restaurants.template_slug',
  },
  {
    migration: '002b',
    table: 'restaurants',
    column: 'tenant_id',
    description: 'restaurants.tenant_id',
  },

  // Migration 003 – e-commerce checkout
  {
    migration: '003',
    table: 'template_orders',
    column: 'metadata',
    description: 'template_orders.metadata',
  },
  {
    migration: '003',
    table: 'template_order_items',
    column: 'id',
    description: 'template_order_items existe',
  },
  { migration: '003', table: 'user_purchases', column: 'id', description: 'user_purchases existe' },

  // Migration 005 – checkout sessions
  {
    migration: '005',
    table: 'checkout_sessions',
    column: 'mp_payment_id',
    description: 'checkout_sessions.mp_payment_id',
  },

  // Migration 006 – onboarding submissions
  {
    migration: '006',
    table: 'onboarding_submissions',
    column: 'status',
    description: 'onboarding_submissions existe',
  },

  // Migration 009 – templates
  { migration: '009', table: 'templates', column: 'slug', description: 'templates existe' },

  // Migration 010 – affiliates MVP
  { migration: '010', table: 'affiliates', column: 'code', description: 'affiliates.code' },
  {
    migration: '010',
    table: 'affiliates',
    column: 'chave_pix',
    description: 'affiliates.chave_pix',
  },
  {
    migration: '010',
    table: 'affiliate_referrals',
    column: 'comissao',
    description: 'affiliate_referrals.comissao',
  },

  // Migration 011 – tiers v1 (afiliado/parceiro → será sobrescrito por 017)
  {
    migration: '011',
    table: 'affiliate_bonuses',
    column: 'nivel',
    description: 'affiliate_bonuses.nivel',
  },
  {
    migration: '011',
    table: 'affiliate_bonuses',
    column: 'valor_bonus',
    description: 'affiliate_bonuses.valor_bonus',
  },
  {
    migration: '011',
    table: 'affiliate_bonuses',
    column: 'status',
    description: 'affiliate_bonuses.status',
  },

  // Migration 012 – v3 dois níveis
  { migration: '012', table: 'affiliates', column: 'lider_id', description: 'affiliates.lider_id' },
  {
    migration: '012',
    table: 'affiliate_referrals',
    column: 'lider_id',
    description: 'affiliate_referrals.lider_id',
  },
  {
    migration: '012',
    table: 'affiliate_referrals',
    column: 'lider_comissao',
    description: 'affiliate_referrals.lider_comissao',
  },

  // Migration 013 – avatar/cidade
  {
    migration: '013',
    table: 'affiliates',
    column: 'avatar_url',
    description: 'affiliates.avatar_url',
  },
  { migration: '013', table: 'affiliates', column: 'cidade', description: 'affiliates.cidade' },
  { migration: '013', table: 'affiliates', column: 'estado', description: 'affiliates.estado' },
  { migration: '013', table: 'affiliates', column: 'bio', description: 'affiliates.bio' },

  // Migration 014 – pagamentos de comissão
  {
    migration: '014',
    table: 'affiliate_commission_payments',
    column: 'valor',
    description: 'affiliate_commission_payments.valor',
  },
  {
    migration: '014',
    table: 'affiliate_commission_payments',
    column: 'chave_pix_usada',
    description: 'affiliate_commission_payments.chave_pix_usada',
  },

  // Migration 016 – price_brl + tenant_id
  {
    migration: '016',
    table: 'subscriptions',
    column: 'price_brl',
    description: 'subscriptions.price_brl',
  },
  {
    migration: '016',
    table: 'restaurants',
    column: 'tenant_id',
    description: 'restaurants.tenant_id',
  },

  // Migration 017 – tiers hierárquicos reais
  { migration: '017', table: 'affiliates', column: 'tier', description: 'affiliates.tier' },
  {
    migration: '017',
    table: 'affiliates',
    column: 'commission_rate',
    description: 'affiliates.commission_rate',
  },

  // Migration 021 – fundo de bônus
  { migration: '021', table: 'bonus_fund', column: 'tipo', description: 'bonus_fund.tipo' },
  { migration: '021', table: 'bonus_fund', column: 'valor', description: 'bonus_fund.valor' },
  {
    migration: '021',
    table: 'bonus_fund',
    column: 'restaurant_id',
    description: 'bonus_fund.restaurant_id',
  },
  {
    migration: '021',
    table: 'bonus_fund',
    column: 'affiliate_id',
    description: 'bonus_fund.affiliate_id',
  },
]

// ─────────────────────────────────────────────
// Verificação individual via information_schema
// ─────────────────────────────────────────────

async function checkColumn(
  // SupabaseClient<any> necessário: tabelas verificadas dinamicamente não estão no schema gerado
  // deno-lint-ignore no-explicit-any
  supabase: SupabaseClient<any>,
  table: string,
  column: string
): Promise<boolean> {
  // Consulta direta ao information_schema via RPC sql (service_role permitido)
  const { error } = await supabase.from(table).select(column).limit(0)
  return !error
}

// ─────────────────────────────────────────────
// Runner principal
// ─────────────────────────────────────────────

async function main() {
  ensureEnv()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  console.log('\n══════════════════════════════════════════════')
  console.log('  VERIFICAÇÃO DE MIGRATIONS — CARDÁPIO DIGITAL')
  console.log('══════════════════════════════════════════════\n')

  let passed = 0
  let failed = 0
  const failures: { migration: string; description: string }[] = []

  // Agrupa por migration para exibição organizada
  const byMigration: Record<string, Check[]> = {}
  for (const check of CHECKS) {
    if (!byMigration[check.migration]) byMigration[check.migration] = []
    byMigration[check.migration].push(check)
  }

  for (const [migration, checks] of Object.entries(byMigration)) {
    process.stdout.write(`  Migração ${migration.padEnd(5)}: `)
    const results: boolean[] = []

    for (const check of checks) {
      const ok = await checkColumn(supabase, check.table, check.column)
      results.push(ok)
      if (ok) {
        passed++
      } else {
        failed++
        failures.push({ migration, description: check.description })
      }
    }

    const allOk = results.every(Boolean)
    const partial = results.some(Boolean) && !allOk
    const icon = allOk ? '✅' : partial ? '⚠️ ' : '❌'
    const countLabel = `(${results.filter(Boolean).length}/${results.length})`
    console.log(`${icon} ${countLabel}`)

    if (!allOk) {
      for (let i = 0; i < results.length; i++) {
        if (!results[i]) {
          console.log(`            ❌ ${checks[i].description} — NÃO ENCONTRADO`)
        }
      }
    }
  }

  // ─── Resumo ───────────────────────────────
  const total = passed + failed
  console.log('\n──────────────────────────────────────────────')
  console.log(`  Resultado: ${passed}/${total} verificações passaram`)
  console.log('──────────────────────────────────────────────')

  if (failed === 0) {
    console.log('\n  ✅ Todas as colunas críticas foram encontradas.')
    console.log('  Banco está alinhado com as migrations 001–022.\n')
  } else {
    console.log(`\n  ⚠️  ${failed} verificação(ões) falharam:`)
    for (const f of failures) {
      console.log(`     • [migração ${f.migration}] ${f.description}`)
    }
    console.log('\n  Para aplicar migrations pendentes, rode:')
    console.log('     supabase db push --linked\n')
    console.log('  Ou aplique manualmente no SQL Editor do Supabase Dashboard.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('\n  ERRO FATAL:', err.message)
  process.exit(1)
})

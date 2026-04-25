#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return
  }

  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function ensureEnvironment() {
  const rootDir = process.cwd()
  loadEnvFile(path.join(rootDir, '.env.local'))
  loadEnvFile(path.join(rootDir, '.env.production'))

  const missing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    !(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY)
      ? 'SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY'
      : null,
  ].filter(Boolean)

  if (missing.length > 0) {
    throw new Error(`Variáveis ausentes: ${missing.join(', ')}`)
  }
}

async function main() {
  ensureEnvironment()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error, count } = await admin
    .from('affiliate_referrals')
    .select('id, tenant_id, affiliate_id, referencia_mes, plano, status, created_at', {
      count: 'exact',
    })
    .limit(5000)

  if (error) {
    throw new Error(`Falha ao consultar affiliate_referrals: ${error.message}`)
  }

  const rows = data ?? []
  const keyCounts = new Map<string, number>()
  const duplicates: Array<{
    tenant_id: string
    referencia_mes: string
    plano: string
    total: number
  }> = []

  for (const row of rows) {
    if (!row.tenant_id) {
      continue
    }

    const referenciaMes = row.referencia_mes || row.created_at.slice(0, 7)
    const plano = row.plano || 'unknown_plan'
    const key = `${row.tenant_id}::${referenciaMes}::${plano}`
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1)
  }

  for (const [key, total] of keyCounts.entries()) {
    if (total <= 1) {
      continue
    }

    const [tenant_id, referencia_mes, plano] = key.split('::')
    duplicates.push({ tenant_id, referencia_mes, plano, total })
  }

  duplicates.sort((left, right) => right.total - left.total)

  const totals = rows.reduce(
    (accumulator, row) => {
      accumulator.total += 1
      accumulator[row.status] = (accumulator[row.status] ?? 0) + 1
      return accumulator
    },
    { total: 0 } as Record<string, number>
  )

  console.log(
    JSON.stringify(
      {
        total_count: count ?? rows.length,
        totals,
        duplicate_tenant_month_plan_pairs: duplicates,
        can_apply_idempotency_guard: duplicates.length === 0,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})


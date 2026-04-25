#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { createAdminClient } from '@/lib/shared/supabase/admin'

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
    const rawValue = line.slice(separatorIndex + 1).trim()
    const value = rawValue.replace(/^['"]|['"]$/g, '')

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
  const admin = createAdminClient()

  const [
    { count: restaurantCount, error: restaurantsError },
    { count: truthCount, error: truthError },
  ] = await Promise.all([
    admin.from('restaurants').select('id', { count: 'exact', head: true }),
    admin.from('financial_truth').select('tenant_id', { count: 'exact', head: true }),
  ])

  if (restaurantsError) {
    throw new Error(`Falha ao contar deliverys: ${restaurantsError.message}`)
  }

  if (truthError) {
    throw new Error(`Falha ao contar financial_truth: ${truthError.message}`)
  }

  const [
    { data: restaurantRows, error: restaurantRowsError },
    { data: truthTenantRows, error: truthTenantRowsError },
  ] = await Promise.all([
    admin.from('restaurants').select('id').order('created_at', { ascending: true }),
    admin.from('financial_truth').select('tenant_id').order('created_at', { ascending: true }),
  ])

  if (restaurantRowsError) {
    throw new Error(`Falha ao listar deliverys: ${restaurantRowsError.message}`)
  }

  if (truthTenantRowsError) {
    throw new Error(
      `Falha ao listar tenant_ids de financial_truth: ${truthTenantRowsError.message}`
    )
  }

  const truthIds = new Set((truthTenantRows ?? []).map((row) => row.tenant_id))
  const missingRows = (restaurantRows ?? [])
    .map((row) => row.id)
    .filter((tenantId) => !truthIds.has(tenantId))
    .slice(0, 20)

  const { data: truthRows, error: truthRowsError } = await admin
    .from('financial_truth')
    .select('tenant_id, status, source, last_event_at')
    .order('updated_at', { ascending: false })
    .limit(20)

  if (truthRowsError) {
    throw new Error(`Falha ao listar financial_truth: ${truthRowsError.message}`)
  }

  console.log(
    JSON.stringify(
      {
        restaurant_count: restaurantCount ?? 0,
        financial_truth_count: truthCount ?? 0,
        coverage_ok: (restaurantCount ?? 0) === (truthCount ?? 0),
        missing_preview: missingRows,
        recent_truth_rows: truthRows ?? [],
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2
    )
  )
  process.exit(1)
})


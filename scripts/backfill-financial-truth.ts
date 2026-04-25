#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import { createAdminClient } from '@/lib/shared/supabase/admin'
import {
  computeFinancialTruthForTenant,
  syncFinancialTruthForTenant,
} from '@/lib/domains/core/financial-truth'

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
  const dryRun = process.argv.includes('--dry-run')

  const { data: restaurants, error } = await admin
    .from('restaurants')
    .select('id, status_pagamento, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`Falha ao listar deliverys para backfill: ${error.message}`)
  }

  const rows = restaurants ?? []
  const summary = {
    total_restaurants: rows.length,
    processed: 0,
    approved: 0,
    pending: 0,
    canceled: 0,
    refunded: 0,
    chargeback: 0,
    null_results: 0,
    failed: 0,
    dry_run: dryRun,
  }

  const failures: Array<{ tenant_id: string; error: string }> = []

  for (const row of rows) {
    try {
      if (dryRun) {
        const syncResult = await computeFinancialTruthForTenant(admin, {
          tenantId: row.id,
          source: 'reconciliation',
          sourceId: 'financial-truth-backfill-dry-run',
          lastEventAt: new Date().toISOString(),
          rawSnapshot: {
            flow: 'financial_truth_backfill_dry_run',
            restaurant_status_pagamento_seed: row.status_pagamento ?? null,
          },
        })

        if (!syncResult) {
          summary.null_results += 1
          continue
        }

        summary.processed += 1
        summary[syncResult.status] += 1
        continue
      }

      const syncResult = await syncFinancialTruthForTenant(admin, {
        tenantId: row.id,
        source: 'reconciliation',
        sourceId: 'financial-truth-backfill',
        lastEventAt: new Date().toISOString(),
        rawSnapshot: {
          flow: 'financial_truth_backfill',
          restaurant_status_pagamento_seed: row.status_pagamento ?? null,
        },
      })

      if (!syncResult) {
        summary.null_results += 1
        continue
      }

      summary.processed += 1
      summary[syncResult.status] += 1
    } catch (backfillError) {
      summary.failed += 1
      failures.push({
        tenant_id: row.id,
        error: backfillError instanceof Error ? backfillError.message : String(backfillError),
      })
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: failures.length === 0,
        summary,
        failures,
      },
      null,
      2
    )
  )

  if (failures.length > 0) {
    process.exit(1)
  }
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


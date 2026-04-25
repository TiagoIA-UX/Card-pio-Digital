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
    const value = rawValue
      .replace(/^["']|["']$/g, '')
      .replace(/\\r\\n$/g, '')
      .replace(/\\n$/g, '')
      .replace(/\r$/, '')

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

async function resolveProbeTargets(admin: ReturnType<typeof createAdminClient>) {
  const { data: affiliate, error: affiliateError } = await admin
    .from('affiliates')
    .select('id')
    .eq('status', 'ativo')
    .limit(1)
    .single()

  if (affiliateError || !affiliate) {
    throw new Error(`Falha ao resolver affiliate ativo: ${affiliateError?.message}`)
  }

  const { data: restaurant, error: restaurantError } = await admin
    .from('restaurants')
    .select('id, slug')
    .eq('ativo', true)
    .ilike('slug', 'ship-mode-%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (restaurantError || !restaurant) {
    throw new Error(`Falha ao resolver delivery ship-mode: ${restaurantError?.message}`)
  }

  return { affiliate, restaurant }
}

async function main() {
  ensureEnvironment()
  const admin = createAdminClient()
  const referenciaMes = '2099-12'
  const plano = '__probe_migration_084_a__'
  const planoAlternativo = '__probe_migration_084_b__'
  const { affiliate, restaurant } = await resolveProbeTargets(admin)
  let probeResult: Record<string, unknown> | null = null

  const payload = {
    affiliate_id: affiliate.id,
    tenant_id: restaurant.id,
    plano,
    valor_assinatura: 1,
    comissao: 0.3,
    referencia_mes: referenciaMes,
    status: 'pendente',
    lider_id: null,
    lider_comissao: null,
    lider_status: null,
  }

  const payloadPlanoAlternativo = {
    ...payload,
    plano: planoAlternativo,
  }

  let firstInsertId: string | null = null
  let thirdInsertId: string | null = null
  let secondInsertError: { code: string | null; message: string; details: string | null } | null =
    null

  try {
    const firstInsert = await admin
      .from('affiliate_referrals')
      .insert(payload)
      .select('id')
      .single()

    if (firstInsert.error || !firstInsert.data) {
      throw new Error(`Falha no primeiro insert: ${firstInsert.error?.message}`)
    }

    firstInsertId = firstInsert.data.id

    const secondInsert = await admin
      .from('affiliate_referrals')
      .insert(payload)
      .select('id')
      .single()

    if (secondInsert.error) {
      secondInsertError = {
        code: secondInsert.error.code ?? null,
        message: secondInsert.error.message,
        details: secondInsert.error.details ?? null,
      }
    }

    const thirdInsert = await admin
      .from('affiliate_referrals')
      .insert(payloadPlanoAlternativo)
      .select('id')
      .single()

    if (thirdInsert.error || !thirdInsert.data) {
      throw new Error(`Falha no insert com plano alternativo: ${thirdInsert.error?.message}`)
    }

    thirdInsertId = thirdInsert.data.id

    const { count, error: countError } = await admin
      .from('affiliate_referrals')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', restaurant.id)
      .eq('referencia_mes', referenciaMes)
      .in('plano', [plano, planoAlternativo])

    if (countError) {
      throw new Error(`Falha ao contar linhas de probe: ${countError.message}`)
    }

    probeResult = {
      migration_084_probe: 'completed',
      restaurant_slug: restaurant.slug,
      tenant_id: restaurant.id,
      affiliate_id: affiliate.id,
      first_insert_id: firstInsertId,
      third_insert_id: thirdInsertId,
      second_insert_error: secondInsertError,
      rows_for_month_with_distinct_plans: count ?? null,
      migration_084_effective: secondInsertError?.code === '23505' && count === 2,
    }
  } finally {
    const { error: cleanupError } = await admin
      .from('affiliate_referrals')
      .delete()
      .eq('tenant_id', restaurant.id)
      .eq('referencia_mes', referenciaMes)
      .in('plano', [plano, planoAlternativo])

    if (cleanupError) {
      throw new Error(`Falha no cleanup do probe 084: ${cleanupError.message}`)
    }

    const { count: postCleanupCount, error: postCleanupError } = await admin
      .from('affiliate_referrals')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', restaurant.id)
      .eq('referencia_mes', referenciaMes)
      .in('plano', [plano, planoAlternativo])

    if (postCleanupError) {
      throw new Error(`Falha ao validar cleanup do probe 084: ${postCleanupError.message}`)
    }

    console.log(
      JSON.stringify(
        {
          ...(probeResult ?? { migration_084_probe: 'failed_before_result' }),
          cleanup_rows_remaining: postCleanupCount ?? null,
        },
        null,
        2
      )
    )
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


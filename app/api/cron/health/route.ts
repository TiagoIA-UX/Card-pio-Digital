import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const CRON_SECRET = process.env.CRON_SECRET

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) return false
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${CRON_SECRET}`
}

/**
 * CRON: Health Check — roda a cada 30 min
 * Vercel Cron: /api/cron/health
 *
 * Verifica:
 * 1. Supabase respondendo (select 1)
 * 2. Auth funcionando (count users)
 * 3. Restaurantes ativos recentes
 * 4. Latência de resposta
 *
 * Salva em health_checks table e alerta se degraded/down.
 */

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

interface HealthCheck {
  name: string
  status: 'ok' | 'degraded' | 'down'
  duration_ms: number
  detail?: string
}

async function checkDatabase(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1)
    const duration_ms = Date.now() - start
    if (error) {
      return { name: 'database', status: 'down', duration_ms, detail: error.message }
    }
    return {
      name: 'database',
      status: duration_ms > 3000 ? 'degraded' : 'ok',
      duration_ms,
    }
  } catch (e) {
    return { name: 'database', status: 'down', duration_ms: Date.now() - start, detail: String(e) }
  }
}

async function checkAuth(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    const duration_ms = Date.now() - start
    if (error) {
      return { name: 'auth', status: 'down', duration_ms, detail: error.message }
    }
    return {
      name: 'auth',
      status: duration_ms > 3000 ? 'degraded' : 'ok',
      duration_ms,
      detail: `total_users: ${data?.users?.length ?? 0}`,
    }
  } catch (e) {
    return { name: 'auth', status: 'down', duration_ms: Date.now() - start, detail: String(e) }
  }
}

async function checkRestaurants(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const { count, error } = await supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true)
    const duration_ms = Date.now() - start
    if (error) {
      return { name: 'restaurants', status: 'degraded', duration_ms, detail: error.message }
    }
    return {
      name: 'restaurants',
      status: 'ok',
      duration_ms,
      detail: `active: ${count ?? 0}`,
    }
  } catch (e) {
    return {
      name: 'restaurants',
      status: 'down',
      duration_ms: Date.now() - start,
      detail: String(e),
    }
  }
}

async function checkStorage(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<HealthCheck> {
  const start = Date.now()
  try {
    const { error } = await supabase.storage.listBuckets()
    const duration_ms = Date.now() - start
    if (error) {
      return { name: 'storage', status: 'degraded', duration_ms, detail: error.message }
    }
    return { name: 'storage', status: 'ok', duration_ms }
  } catch (e) {
    return { name: 'storage', status: 'down', duration_ms: Date.now() - start, detail: String(e) }
  }
}

export async function GET(request: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const totalStart = Date.now()

  const checks = await Promise.all([
    checkDatabase(supabase),
    checkAuth(supabase),
    checkRestaurants(supabase),
    checkStorage(supabase),
  ])

  const totalDuration = Date.now() - totalStart

  // Determine overall status
  const hasDown = checks.some((c) => c.status === 'down')
  const hasDegraded = checks.some((c) => c.status === 'degraded')
  const overallStatus = hasDown ? 'down' : hasDegraded ? 'degraded' : 'ok'

  // Save to health_checks table
  await supabase.from('health_checks').insert({
    status: overallStatus,
    checks,
    duration_ms: totalDuration,
  })

  // Clean old records (keep last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  await supabase.from('health_checks').delete().lt('created_at', sevenDaysAgo)

  return NextResponse.json({
    ok: overallStatus === 'ok',
    status: overallStatus,
    duration_ms: totalDuration,
    checks,
  })
}

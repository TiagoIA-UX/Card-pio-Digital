import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const CRON_SECRET = process.env.CRON_SECRET

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) return false
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${CRON_SECRET}`
}

/**
 * CRON: Audit — roda diariamente às 06:00 UTC (03:00 BRT)
 * Vercel Cron: /api/cron/audit
 *
 * Verifica:
 * 1. Supabase conectividade
 * 2. Credenciais Mercado Pago
 * 3. Admin owner cadastrado
 * 4. Tickets abertos (SLA)
 * 5. Assinaturas vencidas não processadas
 * 6. Templates sem sales_count sincronizado
 */

function getSupabaseAdmin() {
  return createAdminClient()
}

interface AuditCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  detail: string
}

async function checkSupabase(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<AuditCheck> {
  try {
    const { count, error } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
    if (error) return { name: 'supabase_connectivity', status: 'fail', detail: error.message }
    return { name: 'supabase_connectivity', status: 'pass', detail: `${count ?? 0} restaurants` }
  } catch (e) {
    return { name: 'supabase_connectivity', status: 'fail', detail: String(e) }
  }
}

function checkMercadoPago(): AuditCheck {
  const token = process.env.MP_ACCESS_TOKEN
  if (!token)
    return { name: 'mp_credentials', status: 'fail', detail: 'MP_ACCESS_TOKEN não definido' }
  if (token.startsWith('TEST-'))
    return { name: 'mp_credentials', status: 'warn', detail: 'Token de SANDBOX — não é produção' }
  return { name: 'mp_credentials', status: 'pass', detail: 'Token de produção configurado' }
}

async function checkAdminOwner(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<AuditCheck> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('email, role')
      .eq('role', 'owner')
      .limit(1)
    if (error) return { name: 'admin_owner', status: 'fail', detail: error.message }
    if (!data || data.length === 0)
      return { name: 'admin_owner', status: 'fail', detail: 'Nenhum owner cadastrado' }
    return { name: 'admin_owner', status: 'pass', detail: data[0].email }
  } catch (e) {
    return { name: 'admin_owner', status: 'fail', detail: String(e) }
  }
}

async function checkOpenTickets(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<AuditCheck> {
  try {
    const { count, error } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
    if (error) return { name: 'open_tickets', status: 'warn', detail: error.message }
    const total = count ?? 0
    return {
      name: 'open_tickets',
      status: total > 10 ? 'warn' : 'pass',
      detail: `${total} tickets abertos`,
    }
  } catch (e) {
    return { name: 'open_tickets', status: 'warn', detail: String(e) }
  }
}

async function checkExpiredSubscriptions(
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<AuditCheck> {
  try {
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
    if (error) return { name: 'expired_subscriptions', status: 'warn', detail: error.message }
    const total = count ?? 0
    return {
      name: 'expired_subscriptions',
      status: total > 0 ? 'warn' : 'pass',
      detail: total > 0 ? `${total} assinatura(s) vencida(s) ainda ativa(s)` : 'Nenhuma pendente',
    }
  } catch (e) {
    return { name: 'expired_subscriptions', status: 'warn', detail: String(e) }
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

  const checks = await Promise.all([
    checkSupabase(supabase),
    Promise.resolve(checkMercadoPago()),
    checkAdminOwner(supabase),
    checkOpenTickets(supabase),
    checkExpiredSubscriptions(supabase),
  ])

  const failed = checks.filter((c) => c.status === 'fail')
  const warned = checks.filter((c) => c.status === 'warn')

  // Salvar resultado no system_logs
  try {
    await supabase.from('system_logs').insert({
      action: 'cron_audit',
      details: JSON.stringify({
        timestamp: new Date().toISOString(),
        checks,
        summary: {
          total: checks.length,
          passed: checks.length - failed.length - warned.length,
          failed: failed.length,
          warned: warned.length,
        },
      }),
      created_by: 'system',
    })
  } catch {
    // Log silencioso se falhar
  }

  return NextResponse.json({
    ok: failed.length === 0,
    timestamp: new Date().toISOString(),
    summary: {
      total: checks.length,
      passed: checks.length - failed.length - warned.length,
      failed: failed.length,
      warned: warned.length,
    },
    checks,
  })
}

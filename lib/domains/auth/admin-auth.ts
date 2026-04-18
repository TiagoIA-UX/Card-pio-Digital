/**
 * lib/admin-auth.ts
 * Helper centralizado para verificar se o usuário autenticado é admin/owner.
 * Usado em todas as rotas /api/admin/*.
 *
 * Hierarquia de roles:
 *   owner   → todos os privilégios (dono da empresa)
 *   admin   → gerencia restaurantes, comissões, métricas
 *   support → leitura apenas
 */
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { createClient } from '@/lib/shared/supabase/server'
import { timingSafeEqual } from 'crypto'
import { createDomainLogger } from '@/lib/shared/domain-logger'

const log = createDomainLogger('auth')

export type AdminRole = 'owner' | 'admin' | 'support'

export interface AdminUser {
  id: string
  email: string
  role: AdminRole
}

const ROLE_WEIGHT: Record<AdminRole, number> = { support: 1, admin: 2, owner: 3 }

function isAdminRole(role: string): role is AdminRole {
  return role === 'support' || role === 'admin' || role === 'owner'
}

/**
 * Verifica se a request vem de um admin autenticado.
 * Aceita:
 *  1. Header Authorization: Bearer <ADMIN_SECRET_KEY>  (CI/cron jobs)
 *  2. Cookie de sessão Supabase (usuário logado via browser)
 *
 * @param minRole  Role mínimo exigido ('support' < 'admin' < 'owner')
 */
export async function requireAdmin(
  req: NextRequest,
  minRole: AdminRole = 'admin'
): Promise<AdminUser | null> {
  // ── Opção 1: ADMIN_SECRET_KEY no header (para chamadas automáticas) ──
  const secret = process.env.ADMIN_SECRET_KEY
  const authHeader = req.headers.get('authorization')

  if (secret && authHeader) {
    const expected = `Bearer ${secret}`
    const a = Buffer.from(authHeader)
    const b = Buffer.from(expected)
    if (a.length === b.length && timingSafeEqual(a, b)) {
      log.info('Service-account admin access granted', {
        path: req.nextUrl.pathname,
        method: req.method,
      })
      // Considera como owner quando usar o secret
      return {
        id: 'service-account',
        email: process.env.OWNER_EMAIL || 'service-account@internal',
        role: 'owner',
      }
    }
  }

  // ── Opção 2: Sessão de browser via cookie ──────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const db = createAdminClient()
  const { data: rec, error } = await db
    .from('admin_users')
    .select('role, email')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    log.warn(`Failed to load admin role for user ${user.id}`)
    return null
  }

  if (!rec) {
    log.warn(`No admin_users record for user ${user.id}`)
    return null
  }

  if (!isAdminRole(rec.role)) {
    log.warn(`Invalid admin role for user ${user.id}`)
    return null
  }

  const userWeight = ROLE_WEIGHT[rec.role]
  const minWeight = ROLE_WEIGHT[minRole]

  if (userWeight < minWeight) {
    log.warn(
      `Insufficient role: user ${user.id} has ${rec.role} (weight ${userWeight}), needs ${minRole} (weight ${minWeight})`
    )
    return null
  }

  return { id: user.id, email: user.email ?? rec.email, role: rec.role }
}

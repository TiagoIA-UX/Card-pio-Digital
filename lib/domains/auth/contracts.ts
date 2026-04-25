// ═══════════════════════════════════════════════════════════════
// CONTRACTS: AUTH — API pública do domínio de autenticação
// ═══════════════════════════════════════════════════════════════

import type { NextRequest } from 'next/server'

/** Roles de admin com peso hierárquico */
export type AdminRole = 'owner' | 'admin' | 'support'

/** Usuário admin autenticado */
export interface AdminUser {
  id: string
  email: string
  role: AdminRole
}

/** Tipo de fluxo no callback de auth */
export type AuthCallbackFlowType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email'

/** Planos que concedem acesso ao repo privado */
export type PrivateRepoAccessPlan = 'starter' | 'pro' | 'white-label'

/** Concessão de acesso ao repo privado */
export interface PrivateRepoAccessGrant {
  id: string
  user_id: string
  github_username: string
  plan: PrivateRepoAccessPlan
  license_type: string
  granted_at: string
  expires_at?: string
  revoked_at?: string
}

/** Registro de auditoria admin */
export interface AdminAuditRecord {
  admin_id: string
  action: string
  target_type?: string
  target_id?: string
  metadata?: Record<string, unknown>
}

/** Contrato público do serviço de autenticação */
export interface IAuthService {
  requireAdmin(req: NextRequest, minRole?: AdminRole): Promise<AdminUser | null>
  logAdminAction(record: AdminAuditRecord): Promise<void>
  getSafeAuthRedirect(next: string | null): string
  requiresPasswordSetup(metadata: Record<string, unknown>): boolean
  parseAuthCallbackFlowType(value: string | null): AuthCallbackFlowType | null
  isValidGithubUsername(username: string): boolean
  normalizeGithubUsername(username: string): string
}


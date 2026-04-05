import type { AdminUser } from '@/lib/domains/auth/admin-auth'
import type { PrivateRepoAccessGrant } from '@/lib/domains/auth/private-repo-access'

export interface PrivateRepoAccessLedgerRecord {
  repository: string
  github_username: string
  customer_name: string
  customer_email: string
  template_slug: string
  plan: string
  paid_amount_cents: number
  paid_currency: string
  permission: 'pull'
  visibility: 'private'
  license_model: string
  expires_at: string | null
  granted_by_admin_id: string
  granted_by_admin_email: string
  revoked_at?: string | null
  revoked_by_admin_id?: string | null
  revoked_by_admin_email?: string | null
  revoked_reason?: string | null
  metadata: Record<string, unknown>
}

export interface RevokePrivateRepoAccessInput {
  repository: string
  githubUsername: string
  templateSlug: string
  reason: string
}

function normalizeText(value: string) {
  return value.trim()
}

export function buildPrivateRepoAccessLedgerRecord(
  grant: PrivateRepoAccessGrant,
  admin: AdminUser
): PrivateRepoAccessLedgerRecord {
  return {
    repository: grant.repository,
    github_username: grant.githubUsername,
    customer_name: grant.customerName,
    customer_email: grant.customerEmail,
    template_slug: grant.templateSlug,
    plan: grant.plan,
    paid_amount_cents: grant.paidAmountCents,
    paid_currency: grant.paidCurrency,
    permission: grant.permission,
    visibility: grant.visibility,
    license_model: grant.licenseModel,
    expires_at: grant.expiresAt,
    granted_by_admin_id: admin.id,
    granted_by_admin_email: admin.email,
    metadata: {
      invite_command: grant.inviteCommand,
      revoke_command: grant.revokeCommand,
      checklist: grant.checklist,
      granted_by_label: grant.grantedBy,
    },
  }
}

export function buildPrivateRepoAccessRevokePatch(
  input: RevokePrivateRepoAccessInput,
  admin: AdminUser
) {
  const repository = normalizeText(input.repository)
  const githubUsername = normalizeText(input.githubUsername)
  const templateSlug = normalizeText(input.templateSlug)
  const reason = normalizeText(input.reason)

  if (!repository || !githubUsername || !templateSlug) {
    throw new Error('Repositório, usuário GitHub e template são obrigatórios para revogação.')
  }

  if (!reason) {
    throw new Error('Motivo da revogação é obrigatório.')
  }

  return {
    match: {
      repository,
      github_username: githubUsername,
      template_slug: templateSlug,
    },
    patch: {
      revoked_at: new Date().toISOString(),
      revoked_by_admin_id: admin.id,
      revoked_by_admin_email: admin.email,
      revoked_reason: reason,
    },
  }
}

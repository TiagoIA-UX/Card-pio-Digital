/**
 * lib/admin-audit.ts
 * Helper para registrar ações administrativas no admin_audit_log.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import type { AdminUser } from '@/lib/admin-auth'
import type { NextRequest } from 'next/server'

interface AuditEntry {
  admin: AdminUser
  action: string
  entityType: string
  entityId?: string
  details?: Record<string, unknown>
  req?: NextRequest
}

export async function logAdminAction({
  admin,
  action,
  entityType,
  entityId,
  details,
  req,
}: AuditEntry): Promise<void> {
  try {
    const db = createAdminClient()
    await db.from('admin_audit_log').insert({
      admin_id: admin.id,
      admin_email: admin.email,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      details: details ?? {},
      ip_address: req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
      user_agent: req?.headers.get('user-agent') ?? null,
    })
  } catch (err) {
    console.error('[AUDIT_LOG] Failed to write audit entry:', err)
  }
}

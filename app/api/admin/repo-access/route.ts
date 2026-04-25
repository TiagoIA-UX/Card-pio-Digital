import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { logAdminAction } from '@/lib/domains/auth/admin-audit'
import { PRIVATE_REPO_ACCESS_PLANS, buildPrivateRepoAccessGrant } from '@/lib/domains/auth/private-repo-access'
import {
  buildPrivateRepoAccessLedgerRecord,
  buildPrivateRepoAccessRevokePatch,
} from '@/lib/domains/auth/private-repo-access-ledger'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const grantSchema = z.object({
  action: z.literal('grant'),
  repository: z.string().min(3),
  githubUsername: z.string().min(1),
  customerName: z.string().min(3).max(160),
  customerEmail: z.string().email().max(254),
  templateSlug: z.string().min(1).max(120),
  plan: z.enum(PRIVATE_REPO_ACCESS_PLANS),
  paidAmountCents: z.number().int().positive(),
  paidCurrency: z.string().min(3).max(8).optional(),
  grantedBy: z.string().min(2).max(120),
  expiresAt: z.string().datetime().optional().nullable(),
})

const revokeSchema = z.object({
  action: z.literal('revoke'),
  repository: z.string().min(3),
  githubUsername: z.string().min(1),
  templateSlug: z.string().min(1).max(120),
  reason: z.string().min(5).max(500),
})

const postSchema = z.union([grantSchema, revokeSchema])

export async function GET(req: NextRequest) {
  const actor = await requireAdmin(req, 'admin')
  if (!actor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const repository = url.searchParams.get('repository')?.trim() || null
  const githubUsername = url.searchParams.get('githubUsername')?.trim() || null
  const activeOnly = url.searchParams.get('activeOnly') === 'true'
  const db = createAdminClient()

  let query = db
    .from('private_repo_access_grants')
    .select(
      'id, repository, github_username, customer_name, customer_email, template_slug, plan, paid_amount_cents, paid_currency, permission, visibility, license_model, expires_at, granted_at, granted_by_admin_email, revoked_at, revoked_by_admin_email, revoked_reason, metadata, created_at, updated_at'
    )
    .order('granted_at', { ascending: false })
    .limit(200)

  if (repository) query = query.eq('repository', repository)
  if (githubUsername) query = query.eq('github_username', githubUsername)
  if (activeOnly) query = query.is('revoked_at', null)

  const { data, error } = await query

  if (error) {
    console.error('[admin/repo-access] Erro ao listar ledger:', error)
    return NextResponse.json({ error: 'Erro ao carregar ledger de acesso' }, { status: 500 })
  }

  return NextResponse.json({ accessGrants: data ?? [] })
}

export async function POST(req: NextRequest) {
  const actor = await requireAdmin(req, 'admin')
  if (!actor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const rawBody = await req.json().catch(() => null)
  const parsed = postSchema.safeParse(rawBody)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const db = createAdminClient()

  if (parsed.data.action === 'grant') {
    try {
      const grant = buildPrivateRepoAccessGrant(parsed.data)
      const ledgerRecord = buildPrivateRepoAccessLedgerRecord(grant, actor)

      const { data, error } = await db
        .from('private_repo_access_grants')
        .upsert(ledgerRecord, { onConflict: 'repository,github_username,template_slug' })
        .select(
          'id, repository, github_username, customer_name, customer_email, template_slug, plan, paid_amount_cents, paid_currency, permission, visibility, license_model, expires_at, granted_at, granted_by_admin_email, revoked_at, revoked_reason, metadata'
        )
        .single()

      if (error || !data) {
        console.error('[admin/repo-access] Erro ao registrar grant:', error)
        return NextResponse.json({ error: 'Erro ao registrar grant de acesso' }, { status: 500 })
      }

      await logAdminAction({
        admin: actor,
        action: 'private_repo_access_granted',
        entityType: 'private_repo_access_grant',
        entityId: data.id,
        details: {
          repository: data.repository,
          github_username: data.github_username,
          template_slug: data.template_slug,
          plan: data.plan,
        },
        req,
      })

      return NextResponse.json({ success: true, grant: data })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao montar grant' },
        { status: 400 }
      )
    }
  }

  try {
    const revoke = buildPrivateRepoAccessRevokePatch(parsed.data, actor)
    const { data, error } = await db
      .from('private_repo_access_grants')
      .update(revoke.patch)
      .match(revoke.match)
      .is('revoked_at', null)
      .select(
        'id, repository, github_username, customer_name, customer_email, template_slug, revoked_at, revoked_by_admin_email, revoked_reason, metadata'
      )
      .single()

    if (error || !data) {
      console.error('[admin/repo-access] Erro ao revogar grant:', error)
      return NextResponse.json(
        { error: 'Grant ativo não encontrado para revogação' },
        { status: 404 }
      )
    }

    await logAdminAction({
      admin: actor,
      action: 'private_repo_access_revoked',
      entityType: 'private_repo_access_grant',
      entityId: data.id,
      details: {
        repository: data.repository,
        github_username: data.github_username,
        template_slug: data.template_slug,
        reason: data.revoked_reason,
      },
      req,
    })

    return NextResponse.json({ success: true, grant: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao revogar grant' },
      { status: 400 }
    )
  }
}


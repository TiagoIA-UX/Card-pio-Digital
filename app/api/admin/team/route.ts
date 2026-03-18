/**
 * GET  /api/admin/team  → lista todos os admins
 * POST /api/admin/team  → adiciona admin por email
 * DELETE /api/admin/team?id=<user_id> → remove admin
 *
 * Requer role 'owner'.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const addAdminSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(['owner', 'admin', 'support']).default('admin'),
})

const deleteAdminSchema = z.object({
  id: z.string().min(1),
})

// ── GET — lista admins ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const actor = await requireAdmin(req, 'owner')
  if (!actor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('admin_users')
    .select('id, user_id, email, role, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Erro interno' }, { status: 500 })

  return NextResponse.json({ team: data ?? [] })
}

// ── POST — adiciona admin ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const actor = await requireAdmin(req, 'owner')
  if (!actor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const raw = await req.json().catch(() => ({}))
  const parsed = addAdminSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { email, role } = parsed.data

  // Impede que alguém rebaixe o próprio email de owner
  if (email === actor.email && role !== 'owner') {
    return NextResponse.json({ error: 'Você não pode rebaixar a si mesmo' }, { status: 400 })
  }

  const db = createAdminClient()
  const { data: result, error } = await db.rpc('grant_admin_by_email', {
    p_email: email,
    p_role: role,
  })

  if (error || !result?.ok) {
    const msg = result?.error ?? error?.message ?? 'Erro ao conceder acesso'
    return NextResponse.json({ error: msg }, { status: result?.error ? 400 : 500 })
  }

  return NextResponse.json({ success: true, user_id: result.user_id, role })
}

// ── DELETE — remove admin ──────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const actor = await requireAdmin(req, 'owner')
  if (!actor) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const params = deleteAdminSchema.safeParse({ id: new URL(req.url).searchParams.get('id') })
  if (!params.success) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
  const userId = params.data.id

  const db = createAdminClient()

  // Impede remover o próprio owner
  const { data: target } = await db
    .from('admin_users')
    .select('email, role')
    .eq('user_id', userId)
    .single()

  if (target?.role === 'owner' && target.email === actor.email) {
    return NextResponse.json({ error: 'Não é possível remover o dono' }, { status: 400 })
  }

  const { error } = await db.from('admin_users').delete().eq('user_id', userId)
  if (error) return NextResponse.json({ error: 'Erro ao remover admin' }, { status: 500 })

  return NextResponse.json({ success: true })
}

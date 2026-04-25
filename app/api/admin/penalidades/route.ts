/**
 * API: /api/admin/penalidades
 * Gestão de penalidades de afiliados (apply, revert, list)
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { applyStrike, revertStrike, listPenalties } from '@/services/penalty.service'
import { z } from 'zod'

// GET /api/admin/penalidades?affiliate_id=xxx
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, 'support')
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const affiliateId = url.searchParams.get('affiliate_id') ?? undefined
  const data = await listPenalties(affiliateId)
  return NextResponse.json({ data })
}

const applySchema = z.object({
  action: z.literal('apply'),
  affiliate_id: z.string().uuid(),
  ticket_id: z.string().uuid().optional(),
  descricao: z.string().max(500).optional(),
})

const revertSchema = z.object({
  action: z.literal('revert'),
  penalty_id: z.string().uuid(),
})

// POST /api/admin/penalidades
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()

  if (body?.action === 'apply') {
    const parsed = applySchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const result = await applyStrike(
      parsed.data.affiliate_id,
      parsed.data.ticket_id,
      admin.id,
      parsed.data.descricao
    )
    return NextResponse.json(result)
  }

  if (body?.action === 'revert') {
    const parsed = revertSchema.safeParse(body)
    if (!parsed.success)
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    const result = await revertStrike(parsed.data.penalty_id, admin.id)
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}


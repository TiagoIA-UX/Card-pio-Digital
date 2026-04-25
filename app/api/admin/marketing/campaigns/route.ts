import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import {
  buildWeeklyNewsletterDraft,
  getIsoWeekKey,
} from '@/lib/domains/marketing/newsletter-automation'

const createCampaignSchema = z.object({
  focus: z.string().trim().min(3).max(120).optional(),
  scheduledFor: z.string().datetime().optional(),
})

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, 'admin')
  if (!admin) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select(
      'id, title, subject, status, scheduled_for, started_at, finished_at, stats, metadata, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ campaigns: data || [] })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, 'admin')
  if (!admin) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = createCampaignSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const weekKey = getIsoWeekKey()
  const draft = buildWeeklyNewsletterDraft(weekKey, parsed.data.focus || 'crescimento previsivel')
  const scheduledFor = parsed.data.scheduledFor || new Date().toISOString()

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('marketing_campaigns')
    .insert({
      title: draft.title,
      subject: draft.subject,
      body_html: draft.bodyHtml,
      body_text: draft.bodyText,
      status: 'scheduled',
      scheduled_for: scheduledFor,
      metadata: { week_key: weekKey, generated_by: 'weekly-ai-lite' },
      created_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .select('id, title, status, scheduled_for')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, campaign: data })
}


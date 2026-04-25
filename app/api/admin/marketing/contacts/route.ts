import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const createContactSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().max(120).optional(),
  source: z.string().trim().max(80).optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  consented: z.boolean().optional(),
})

const syncProfilesSchema = z.object({
  action: z.literal('sync_profiles'),
  limit: z.number().int().min(1).max(5000).optional(),
})

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, 'admin')
  if (!admin) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const subscribedOnly = searchParams.get('subscribed') === 'true'

  const supabase = createAdminClient()
  let query = supabase
    .from('marketing_contacts')
    .select('id, email, name, source, tags, consented_at, unsubscribed_at, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (subscribedOnly) {
    query = query.is('unsubscribed_at', null)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const filtered = (data || []).filter((item) => {
    if (!q) return true
    return item.email.toLowerCase().includes(q) || (item.name || '').toLowerCase().includes(q)
  })

  return NextResponse.json({ contacts: filtered })
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, 'admin')
  if (!admin) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Payload invalido' }, { status: 400 })

  const syncParsed = syncProfilesSchema.safeParse(body)
  if (syncParsed.success) {
    const supabase = createAdminClient()
    const limit = syncParsed.data.limit || 1000

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email, nome')
      .not('email', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    const rows = (profiles || [])
      .map((profile) => ({
        email: String(profile.email || '')
          .trim()
          .toLowerCase(),
        name: profile.nome || null,
        source: 'profiles_sync',
        consented_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      .filter((row) => row.email.includes('@'))

    if (rows.length === 0) {
      return NextResponse.json({ success: true, synced: 0 })
    }

    const { error: upsertError } = await supabase.from('marketing_contacts').upsert(rows, {
      onConflict: 'email',
      ignoreDuplicates: false,
    })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, synced: rows.length })
  }

  const parsed = createContactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados invalidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const supabase = createAdminClient()
  const { error } = await supabase.from('marketing_contacts').upsert(
    {
      email: parsed.data.email.trim().toLowerCase(),
      name: parsed.data.name || null,
      source: parsed.data.source || 'manual',
      tags: parsed.data.tags || [],
      consented_at: parsed.data.consented === false ? null : now,
      unsubscribed_at: null,
      updated_at: now,
    },
    { onConflict: 'email', ignoreDuplicates: false }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}


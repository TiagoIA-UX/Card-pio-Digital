import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'

export async function GET(request: NextRequest) {
  const db = createAdminClient()
  const cidade = request.nextUrl.searchParams.get('cidade')?.trim()

  let query = db.from('affiliate_ranking').select('*').limit(100)

  if (cidade) {
    query = query.ilike('city', cidade)
  }

  const { data, error } = await query

  if (error) {
    // Fallback seguro para não quebrar navegação pública caso o ranking esteja indisponível.
    return NextResponse.json(
      {
        ranking: [],
        warning: 'Ranking indisponível no momento. Tente novamente em instantes.',
      },
      { status: 200 }
    )
  }

  return NextResponse.json({ ranking: data ?? [] }, { status: 200 })
}


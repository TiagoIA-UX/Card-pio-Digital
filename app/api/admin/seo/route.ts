import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getRateLimitIdentifier, withRateLimit } from '@/lib/rate-limit'
import { fetchGSCOverview, isGSCConfigured, type DateRange } from '@/lib/google-search-console'

const VALID_RANGES = new Set(['7d', '28d', '3m'])

export async function GET(request: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(request), {
      limit: 20,
      windowMs: 60_000,
    })
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const admin = await requireAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401, headers: rateLimit.headers }
      )
    }

    if (!isGSCConfigured()) {
      return NextResponse.json(
        {
          error: 'Google Search Console não configurado',
          setup: {
            required: [
              'GOOGLE_SERVICE_ACCOUNT_EMAIL',
              'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY',
              'GOOGLE_SITE_URL',
            ],
            docs: 'https://developers.google.com/webmaster-tools/v1/how-tos/service_accounts',
          },
        },
        { status: 501, headers: rateLimit.headers }
      )
    }

    const range = request.nextUrl.searchParams.get('range') ?? '28d'
    if (!VALID_RANGES.has(range)) {
      return NextResponse.json(
        { error: 'Período inválido. Use: 7d, 28d ou 3m' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const overview = await fetchGSCOverview(range as DateRange)

    return NextResponse.json(
      { success: true, range, data: overview },
      {
        headers: {
          ...rateLimit.headers,
          'Cache-Control': 'private, max-age=300', // 5min cache
        },
      }
    )
  } catch (error) {
    console.error('[admin/seo] Erro ao buscar dados GSC:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * GET /api/templates
 * Lista todos os templates ativos
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitId = getRateLimitIdentifier(request)
    const rateLimit = withRateLimit(rateLimitId, RATE_LIMITS.public)
    
    if (rateLimit.limited) {
      return rateLimit.response
    }

    // Parâmetros de busca
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const sort = searchParams.get('sort') || 'sales_count'
    const order = searchParams.get('order') || 'desc'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Query base
    let query = supabase
      .from('templates')
      .select('*')
      .eq('status', 'active')

    // Filtros
    if (category) {
      query = query.eq('category', category)
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    // Ordenação
    const validSortFields = ['sales_count', 'rating_avg', 'price', 'created_at', 'name']
    const sortField = validSortFields.includes(sort) ? sort : 'sales_count'
    query = query.order(sortField, { ascending: order === 'asc' })

    // Limite
    query = query.limit(limit)

    const { data: templates, error } = await query

    if (error) {
      console.error('Erro ao buscar templates:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar templates' },
        { status: 500, headers: rateLimit.headers }
      )
    }

    return NextResponse.json(
      { templates, count: templates?.length || 0 },
      { 
        headers: {
          ...rateLimit.headers,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
        }
      }
    )

  } catch (error) {
    console.error('Erro na API de templates:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

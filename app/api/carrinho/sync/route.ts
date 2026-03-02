import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { withRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Schema de validação
const syncSchema = z.object({
  userId: z.string().uuid(),
  items: z.array(z.object({
    templateId: z.string().uuid(),
    quantity: z.number().int().positive().default(1)
  }))
})

/**
 * POST /api/carrinho/sync
 * Sincroniza o carrinho local com o servidor
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitId = getRateLimitIdentifier(request)
    const rateLimit = withRateLimit(rateLimitId, RATE_LIMITS.cart)
    
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const body = await request.json()
    
    // Validar input
    const validation = syncSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten() },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const { userId, items } = validation.data

    // Limpar carrinho atual do usuário
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', userId)

    // Se não há itens, retornar sucesso
    if (items.length === 0) {
      return NextResponse.json(
        { success: true, itemCount: 0 },
        { headers: rateLimit.headers }
      )
    }

    // Inserir novos itens
    const cartItems = items.map(item => ({
      user_id: userId,
      template_id: item.templateId,
      quantity: item.quantity
    }))

    const { error } = await supabaseAdmin
      .from('cart_items')
      .insert(cartItems)

    if (error) {
      console.error('Erro ao sincronizar carrinho:', error)
      return NextResponse.json(
        { error: 'Erro ao sincronizar carrinho' },
        { status: 500, headers: rateLimit.headers }
      )
    }

    return NextResponse.json(
      { success: true, itemCount: items.length },
      { headers: rateLimit.headers }
    )

  } catch (error) {
    console.error('Erro na sync do carrinho:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/carrinho/sync?userId=xxx
 * Carrega o carrinho do servidor
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitId = getRateLimitIdentifier(request)
    const rateLimit = withRateLimit(rateLimitId, RATE_LIMITS.cart)
    
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const userId = request.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    // Buscar itens do carrinho com dados do template
    const { data: cartItems, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        id,
        quantity,
        template:templates (
          id,
          slug,
          name,
          price,
          original_price,
          image_url,
          category
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Erro ao carregar carrinho:', error)
      return NextResponse.json(
        { error: 'Erro ao carregar carrinho' },
        { status: 500, headers: rateLimit.headers }
      )
    }

    // Transformar para formato do frontend
    const items = cartItems?.map(item => ({
      id: item.id,
      templateId: (item.template as Record<string, unknown>)?.id,
      quantity: item.quantity,
      template: item.template
    })) || []

    return NextResponse.json(
      { items },
      { headers: rateLimit.headers }
    )

  } catch (error) {
    console.error('Erro ao carregar carrinho:', error)
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export interface OnboardingFormData {
  // Informações do negócio
  nome_negocio: string
  tipo_negocio: string
  cidade: string
  estado: string
  whatsapp: string
  instagram?: string

  // Informações do delivery
  horario_funcionamento?: string
  taxa_entrega?: string
  area_entrega?: string
  tempo_preparo?: string

  // Cardápio
  categorias: Array<{
    nome: string
    produtos: Array<{
      nome: string
      descricao?: string
      preco: string
      adicionais?: string
    }>
  }>

  // URLs de arquivos (após upload)
  logo_url?: string
  fotos_produtos?: string[]
}

export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerClient()
    const {
      data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Faça login para continuar' }, { status: 401 })
    }

    const body = await request.json()
    const { checkout, restaurant_id, data } = body as {
      checkout?: string
      restaurant_id?: string
      data: OnboardingFormData
    }

    if (!data || !data.nome_negocio || !data.whatsapp) {
      return NextResponse.json({ error: 'Preencha nome do negócio e WhatsApp' }, { status: 400 })
    }

    const admin = createAdminClient()

    let orderId: string | null = null
    let restaurantId: string | null = restaurant_id || null

    if (checkout) {
      const { data: order } = await admin
        .from('template_orders')
        .select('id, user_id, payment_status, metadata')
        .eq('order_number', checkout)
        .single()

      if (!order) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
      }

      if (!order.user_id || order.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const metadata = (order.metadata || {}) as Record<string, unknown>
      if (metadata.checkout_type !== 'restaurant_onboarding') {
        return NextResponse.json({ error: 'Pedido inválido para onboarding' }, { status: 400 })
      }

      if (metadata.plan_slug !== 'feito-pra-voce') {
        return NextResponse.json(
          { error: 'O onboarding manual é exclusivo do plano Feito Pra Você' },
          { status: 400 }
        )
      }

      if (order.payment_status !== 'approved') {
        return NextResponse.json({ error: 'Pagamento ainda não confirmado' }, { status: 409 })
      }

      const provRestaurantId = metadata.provisioned_restaurant_id as string | undefined
      if (!provRestaurantId) {
        return NextResponse.json(
          { error: 'Aguarde a confirmação do webhook antes de enviar o onboarding' },
          { status: 409 }
        )
      }

      if (provRestaurantId) {
        restaurantId = provRestaurantId
      }
      orderId = order.id
    }

    if (restaurantId) {
      const { data: restaurant } = await admin
        .from('restaurants')
        .select('id, user_id')
        .eq('id', restaurantId)
        .single()

      if (!restaurant) {
        return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
      }

      if (!restaurant.user_id || restaurant.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (!orderId && !restaurantId) {
      return NextResponse.json({ error: 'Informe checkout ou restaurant_id' }, { status: 400 })
    }

    let existing: { id: string } | null = null
    if (orderId) {
      const { data: byOrder } = await admin
        .from('onboarding_submissions')
        .select('id')
        .eq('order_id', orderId)
        .single()
      existing = byOrder
    }
    if (!existing && restaurantId) {
      const { data: byRestaurant } = await admin
        .from('onboarding_submissions')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .single()
      existing = byRestaurant
    }

    const payload = {
      order_id: orderId,
      restaurant_id: restaurantId,
      user_id: user.id,
      status: 'pending',
      data,
      updated_at: new Date().toISOString(),
    }

    const { error } = existing
      ? await admin.from('onboarding_submissions').update(payload).eq('id', existing.id)
      : await admin.from('onboarding_submissions').insert(payload)

    if (error) {
      console.error('Erro ao salvar onboarding:', error)
      return NextResponse.json({ error: 'Erro ao salvar formulário' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro no submit onboarding:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

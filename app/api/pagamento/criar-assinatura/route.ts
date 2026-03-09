import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createMercadoPagoPreApprovalClient } from '@/lib/mercadopago'
import { getRequestSiteUrl } from '@/lib/site-url'

// Preços dos planos (em centavos para o MP)
const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  basico: { amount: 49, name: 'Plano Básico' },
  pro: { amount: 99, name: 'Plano Profissional' },
  premium: { amount: 199, name: 'Plano Premium' },
}

export async function POST(request: NextRequest) {
  try {
    const preApproval = createMercadoPagoPreApprovalClient(10000)
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { plan_slug, restaurant_id } = body

    if (!plan_slug || !restaurant_id) {
      return NextResponse.json(
        { error: 'plan_slug e restaurant_id são obrigatórios' },
        { status: 400 }
      )
    }

    const planConfig = PLAN_PRICES[plan_slug]
    if (!planConfig) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('slug', plan_slug)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Verificar se restaurante pertence ao usuário
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, nome, slug')
      .eq('id', restaurant_id)
      .eq('user_id', session.user.id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante não encontrado' }, { status: 404 })
    }

    // Verificar assinatura existente
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('restaurant_id', restaurant_id)
      .eq('status', 'active')
      .single()

    const baseUrl = getRequestSiteUrl(request)

    // Criar assinatura no Mercado Pago
    // Note: notification_url pode não estar no tipo, mas é aceito pela API
    const preApprovalBody = {
      reason: `${planConfig.name} - Cardápio Digital - ${restaurant.nome}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months' as const,
        transaction_amount: planConfig.amount,
        currency_id: 'BRL' as const,
      },
      back_url: `${baseUrl}/painel/planos?status=success`,
      payer_email: session.user.email!,
      external_reference: JSON.stringify({
        restaurant_id,
        user_id: session.user.id,
        plan_slug,
      }),
      notification_url: `${baseUrl}/api/webhook/subscriptions`,
    }

    const preApprovalData = await preApproval.create({
      body: preApprovalBody as Parameters<typeof preApproval.create>[0]['body'],
    })

    if (!preApprovalData.id || !preApprovalData.init_point) {
      return NextResponse.json(
        { error: 'Erro ao criar assinatura no Mercado Pago' },
        { status: 500 }
      )
    }

    // Salvar/atualizar assinatura no banco
    if (existingSubscription) {
      // Atualizar assinatura existente
      await supabase
        .from('subscriptions')
        .update({
          plan_id: plan.id,
          mp_preapproval_id: preApprovalData.id,
          mp_subscription_status: 'pending',
          status: 'pending',
        })
        .eq('id', existingSubscription.id)
    } else {
      // Criar nova assinatura
      await supabase.from('subscriptions').insert({
        user_id: session.user.id,
        restaurant_id,
        plan_id: plan.id,
        mp_preapproval_id: preApprovalData.id,
        mp_subscription_status: 'pending',
        status: 'pending',
        payment_gateway: 'mercadopago',
      })
    }

    return NextResponse.json({
      success: true,
      redirect_url: preApprovalData.init_point,
      preapproval_id: preApprovalData.id,
    })
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return NextResponse.json({ error: 'Erro interno ao processar assinatura' }, { status: 500 })
  }
}

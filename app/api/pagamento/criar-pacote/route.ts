import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

const PACOTES = {
  'pacote': {
    nome: 'Pacote 3 Templates',
    precoCartao: 597,
    precoPix: 497,
    parcelas: 6,
    templates: 3
  },
  'ilimitado': {
    nome: 'Acesso Ilimitado',
    precoCartao: 997,
    precoPix: 797,
    parcelas: 12,
    templates: -1 // -1 = ilimitado
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pacote, metodo, userId, email } = body

    // Validações
    if (!pacote || !metodo || !userId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const pacoteConfig = PACOTES[pacote as keyof typeof PACOTES]
    if (!pacoteConfig) {
      return NextResponse.json(
        { error: 'Pacote inválido' },
        { status: 400 }
      )
    }

    const preco = metodo === 'pix' ? pacoteConfig.precoPix : pacoteConfig.precoCartao
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://card-pio-digital-seven.vercel.app'

    // Verificar se usuário já tem uma assinatura de pacote
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single()

    let subscriptionId: string

    if (existingSubscription) {
      // Atualizar assinatura existente
      await supabase
        .from('subscriptions')
        .update({
          pacote,
          status: 'awaiting_payment'
        })
        .eq('id', existingSubscription.id)
      subscriptionId = existingSubscription.id
    } else {
      // Criar nova assinatura pendente
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          pacote,
          templates_limit: pacoteConfig.templates,
          status: 'awaiting_payment'
        })
        .select('id')
        .single()

      if (createError) {
        // Se a tabela não existe, criar restaurante direto como fallback
        console.log('Tabela subscriptions não existe, usando restaurants')
        
        const { data: restaurant, error: restError } = await supabase
          .from('restaurants')
          .insert({
            user_id: userId,
            nome: `Pacote ${pacoteConfig.nome}`,
            slug: `pacote-${Date.now()}`,
            template: 'restaurante',
            plano: pacote,
            status_pagamento: 'aguardando',
            ativo: false
          })
          .select('id')
          .single()

        if (restError || !restaurant) {
          console.error('Erro ao criar restaurante:', restError)
          return NextResponse.json(
            { error: 'Erro ao criar registro' },
            { status: 500 }
          )
        }
        subscriptionId = restaurant.id
      } else {
        subscriptionId = newSub?.id || `sub-${Date.now()}`
      }
    }

    // Criar preferência do Mercado Pago
    const preference = new Preference(mercadopago)
    
    const preferenceData = await preference.create({
      body: {
        items: [{
          id: subscriptionId,
          title: pacoteConfig.nome,
          quantity: 1,
          unit_price: preco,
          currency_id: 'BRL'
        }],
        payer: {
          email: email || 'cliente@email.com'
        },
        external_reference: `pacote:${subscriptionId}`,
        back_urls: {
          success: `${baseUrl}/pagamento/sucesso`,
          failure: `${baseUrl}/pagamento/erro`,
          pending: `${baseUrl}/pagamento/pendente`
        },
        auto_return: 'approved',
        payment_methods: metodo === 'pix' ? {
          excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }]
        } : {
          installments: pacoteConfig.parcelas,
          excluded_payment_types: [{ id: 'ticket' }]
        },
        notification_url: `${baseUrl}/api/webhook/mercadopago`
      }
    })

    return NextResponse.json({
      preferenceId: preferenceData.id,
      init_point: preferenceData.init_point,
      sandbox_init_point: preferenceData.sandbox_init_point
    })

  } catch (error) {
    console.error('Erro ao criar preferência:', error)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}

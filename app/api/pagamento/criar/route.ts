import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
})

const PRECOS = {
  'self-service': {
    pix: 247,
    card: 297,
    parcelas: 3,
    nome: 'Cardápio Digital - Faça Você Mesmo'
  },
  'feito-pra-voce': {
    pix: 497,
    card: 597,
    parcelas: 3,
    nome: 'Cardápio Digital - Feito Pra Você'
  }
}

const TEMPLATE_NOMES: Record<string, string> = {
  restaurante: 'Restaurante',
  pizzaria: 'Pizzaria',
  lanchonete: 'Hamburgueria/Lanchonete',
  bar: 'Bar/Pub',
  cafeteria: 'Cafeteria',
  acai: 'Açaíteria',
  sushi: 'Japonês/Sushi'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { template, plano, metodo, userId, email } = body

    // Validações
    if (!template || !plano || !metodo || !userId) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const planoConfig = PRECOS[plano as keyof typeof PRECOS]
    if (!planoConfig) {
      return NextResponse.json(
        { error: 'Plano inválido' },
        { status: 400 }
      )
    }

    const templateNome = TEMPLATE_NOMES[template]
    if (!templateNome) {
      return NextResponse.json(
        { error: 'Template inválido' },
        { status: 400 }
      )
    }

    const preco = metodo === 'pix' ? planoConfig.pix : planoConfig.card
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://card-pio-digital-seven.vercel.app'

    // Criar restaurante pendente (ou atualizar se já existe)
    const { data: existingRestaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', userId)
      .eq('status_pagamento', 'pendente')
      .single()

    let restaurantId: string

    if (existingRestaurant) {
      // Atualizar restaurante existente
      await supabase
        .from('restaurants')
        .update({
          template,
          plano,
          status_pagamento: 'aguardando'
        })
        .eq('id', existingRestaurant.id)
      restaurantId = existingRestaurant.id
    } else {
      // Criar novo restaurante pendente
      const { data: newRestaurant, error: createError } = await supabase
        .from('restaurants')
        .insert({
          user_id: userId,
          nome: `Meu ${templateNome}`,
          slug: `${template}-${Date.now()}`,
          template,
          plano,
          status_pagamento: 'aguardando',
          ativo: false
        })
        .select('id')
        .single()

      if (createError || !newRestaurant) {
        console.error('Erro ao criar restaurante:', createError)
        return NextResponse.json(
          { error: 'Erro ao criar restaurante' },
          { status: 500 }
        )
      }
      restaurantId = newRestaurant.id
    }

    // Criar preferência do Mercado Pago
    const preference = new Preference(mercadopago)
    
    const preferenceData = await preference.create({
      body: {
        items: [{
          id: restaurantId,
          title: `${planoConfig.nome} - Template ${templateNome}`,
          quantity: 1,
          unit_price: preco,
          currency_id: 'BRL'
        }],
        payer: {
          email: email || 'cliente@email.com'
        },
        external_reference: restaurantId,
        back_urls: {
          success: `${baseUrl}/pagamento/sucesso`,
          failure: `${baseUrl}/pagamento/erro`,
          pending: `${baseUrl}/pagamento/pendente`
        },
        auto_return: 'approved',
        payment_methods: metodo === 'pix' ? {
          excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }]
        } : {
          installments: planoConfig.parcelas,
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

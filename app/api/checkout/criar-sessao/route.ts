import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { withRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const mercadopago = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
})

const checkoutSchema = z.object({
  items: z.array(z.object({
    templateId: z.string(),
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive()
  })).min(1),
  couponId: z.string().optional(),
  paymentMethod: z.enum(['pix', 'card']),
  userId: z.string().uuid(),
  email: z.string().email()
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitId = getRateLimitIdentifier(request)
    const rateLimit = withRateLimit(rateLimitId, RATE_LIMITS.checkout)
    
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const body = await request.json()
    
    // Validar input
    const result = checkoutSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: result.error.flatten() },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const { items, couponId, paymentMethod, userId, email } = result.data
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://card-pio-digital-seven.vercel.app'

    // Calcular subtotal
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    // Aplicar desconto do cupom se houver
    let discount = 0
    let couponData = null
    if (couponId) {
      const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('id', couponId)
        .single()

      if (coupon) {
        couponData = coupon
        if (coupon.discount_type === 'percentage') {
          discount = Math.round(subtotal * (coupon.discount_value / 100))
        } else {
          discount = Math.min(coupon.discount_value, subtotal)
        }
      }
    }

    // Aplicar desconto PIX (15%)
    const pixDiscount = paymentMethod === 'pix' ? Math.round(subtotal * 0.15) : 0
    const totalDiscount = discount + pixDiscount
    const total = Math.max(subtotal - totalDiscount, 0)

    // Gerar número do pedido
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Criar pedido no banco (template_orders)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('template_orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: 'pending',
        subtotal,
        discount: totalDiscount,
        total,
        coupon_id: couponId || null,
        payment_method: paymentMethod,
        payment_status: 'pending',
        metadata: { 
          items,
          email,
          pix_discount: pixDiscount,
          coupon_discount: discount
        }
      })
      .select('id')
      .single()

    if (orderError) {
      console.error('Erro ao criar pedido:', orderError)
      // Continuar sem salvar pedido localmente
    }

    const orderId = order?.id || `temp-${Date.now()}`

    // Criar itens do pedido
    if (order?.id) {
      const orderItems = items.map(item => ({
        order_id: order.id,
        template_id: item.templateId,
        template_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))

      await supabaseAdmin
        .from('template_order_items')
        .insert(orderItems)
    }

    // Criar preferência do Mercado Pago
    const preference = new Preference(mercadopago)
    
    const preferenceItems = items.map((item) => ({
      id: item.templateId,
      title: item.name,
      quantity: item.quantity,
      unit_price: Math.round((total / items.length) * 100) / 100,
      currency_id: 'BRL' as const
    }))

    const preferenceData = await preference.create({
      body: {
        items: preferenceItems,
        payer: {
          email
        },
        external_reference: orderId,
        back_urls: {
          success: `${baseUrl}/pagamento/sucesso?order=${orderNumber}`,
          failure: `${baseUrl}/pagamento/erro?order=${orderNumber}`,
          pending: `${baseUrl}/pagamento/pendente?order=${orderNumber}`
        },
        auto_return: 'approved',
        payment_methods: paymentMethod === 'pix' ? {
          excluded_payment_types: [{ id: 'credit_card' }, { id: 'debit_card' }]
        } : {
          installments: 6,
          excluded_payment_types: [{ id: 'ticket' }]
        },
        notification_url: `${baseUrl}/api/webhook/templates`
      }
    })

    // Incrementar uso do cupom
    if (couponId && couponData) {
      await supabaseAdmin.rpc('increment_coupon_usage', { p_coupon_id: couponId })
    }

    return NextResponse.json({
      orderId,
      orderNumber,
      preferenceId: preferenceData.id,
      init_point: preferenceData.init_point,
      sandbox_init_point: preferenceData.sandbox_init_point,
      total,
      discount: totalDiscount
    }, { headers: rateLimit.headers })

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error)
    return NextResponse.json(
      { error: 'Erro ao processar checkout' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { getRateLimitIdentifier, withRateLimit } from '@/lib/shared/rate-limit'
import { z } from 'zod'

const StatusSchema = z.object({
  orderId: z.string().uuid(),
})

export async function GET(request: NextRequest) {
  // Rate limit
  const rateLimit = await withRateLimit(getRateLimitIdentifier(request), {
    limit: 60,
    windowMs: 60000,
  })
  if (rateLimit.limited) {
    return rateLimit.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    const validation = StatusSchema.safeParse({ orderId })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'orderId é obrigatório e deve ser UUID válido' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const admin = createAdminClient()

    const { data: payment, error } = await admin
      .from('delivery_payments')
      .select(
        'id, status, amount, payment_method_used, paid_at, whatsapp_sent, whatsapp_link, checkout_url, sandbox_checkout_url, created_at'
      )
      .eq('order_id', validation.data.orderId)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar status do pagamento' },
        { status: 500, headers: rateLimit.headers }
      )
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado para este pedido' },
        { status: 404, headers: rateLimit.headers }
      )
    }

    // Buscar status do pedido também
    const { data: order } = await admin
      .from('orders')
      .select('id, status, numero_pedido')
      .eq('id', validation.data.orderId)
      .maybeSingle()

    return NextResponse.json(
      {
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          paymentMethod: payment.payment_method_used,
          paidAt: payment.paid_at,
          whatsappSent: payment.whatsapp_sent,
          whatsappLink: payment.whatsapp_link,
          checkoutUrl: payment.checkout_url,
          sandboxCheckoutUrl: payment.sandbox_checkout_url,
          createdAt: payment.created_at,
        },
        order: order
          ? {
              id: order.id,
              status: order.status,
              numeroPedido: order.numero_pedido,
            }
          : null,
      },
      { headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('Erro ao consultar status delivery payment:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

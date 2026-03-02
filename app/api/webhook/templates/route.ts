import { NextRequest, NextResponse } from 'next/server'
import { mercadopago } from '@/lib/mercadopago'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Cliente Supabase com service role para operações administrativas
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Validar assinatura do webhook do Mercado Pago
function validateWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature || !xRequestId || !secret) {
    console.warn('⚠️ Assinatura ou headers ausentes')
    return false
  }

  // Parse x-signature header
  const parts = xSignature.split(',')
  let ts = ''
  let v1 = ''

  parts.forEach(part => {
    const [key, value] = part.split('=')
    if (key.trim() === 'ts') ts = value.trim()
    if (key.trim() === 'v1') v1 = value.trim()
  })

  if (!ts || !v1) {
    console.warn('⚠️ ts ou v1 não encontrados na assinatura')
    return false
  }

  // Criar manifest
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  
  // Calcular HMAC
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')

  return hmac === v1
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Headers do Mercado Pago
    const xSignature = request.headers.get('x-signature')
    const xRequestId = request.headers.get('x-request-id')
    
    const body = await request.json()
    
    console.log('🔔 Webhook E-commerce recebido:', {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      timestamp: new Date().toISOString()
    })

    // Validar assinatura (em produção)
    const webhookSecret = process.env.MP_WEBHOOK_SECRET
    if (webhookSecret && body.data?.id) {
      const isValid = validateWebhookSignature(
        xSignature,
        xRequestId,
        body.data.id.toString(),
        webhookSecret
      )
      
      if (!isValid) {
        console.error('❌ Assinatura inválida do webhook')
        // Em produção, retornar erro
        // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    // Processar notificação de pagamento
    if (body.type === 'payment' && body.data?.id) {
      await processPayment(body.data.id)
    }

    const duration = Date.now() - startTime
    console.log(`✅ Webhook processado em ${duration}ms`)

    return NextResponse.json({ received: true, duration })

  } catch (error) {
    console.error('❌ Erro no webhook:', error)
    // Sempre retornar 200 para evitar reenvios
    return NextResponse.json({ received: true, error: 'Internal error' })
  }
}

async function processPayment(paymentId: string | number) {
  try {
    // Buscar detalhes do pagamento
    const payment = await mercadopago.payment.get({ id: Number(paymentId) })
    
    console.log('💳 Pagamento:', {
      id: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      externalReference: payment.external_reference,
      amount: payment.transaction_amount
    })

    const orderId = payment.external_reference
    const status = payment.status

    if (!orderId) {
      console.log('⚠️ Sem external_reference - ignorando')
      return
    }

    // Buscar pedido
    const { data: order, error: orderError } = await supabaseAdmin
      .from('template_orders')
      .select('*, user_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('❌ Pedido não encontrado:', orderId)
      return
    }

    // Mapear status
    let paymentStatus = 'pending'
    let orderStatus = 'pending'

    switch (status) {
      case 'approved':
        paymentStatus = 'approved'
        orderStatus = 'completed'
        break
      case 'pending':
      case 'in_process':
      case 'authorized':
        paymentStatus = 'pending'
        orderStatus = 'processing'
        break
      case 'rejected':
      case 'cancelled':
      case 'refunded':
      case 'charged_back':
        paymentStatus = 'rejected'
        orderStatus = 'cancelled'
        break
    }

    // Atualizar pedido
    const { error: updateError } = await supabaseAdmin
      .from('template_orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        payment_id: paymentId.toString(),
        payment_method: payment.payment_method_id,
        updated_at: new Date().toISOString(),
        metadata: {
          ...order.metadata,
          mp_status: status,
          mp_status_detail: payment.status_detail,
          mp_payment_type: payment.payment_type_id,
          processed_at: new Date().toISOString()
        }
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('❌ Erro ao atualizar pedido:', updateError)
      return
    }

    console.log(`📝 Pedido ${orderId} atualizado: ${orderStatus}`)

    // Se pagamento aprovado, liberar templates
    if (status === 'approved') {
      await releaseTemplates(orderId, order.user_id)
    }

  } catch (error) {
    console.error('❌ Erro ao processar pagamento:', error)
    throw error
  }
}

async function releaseTemplates(orderId: string, userId: string) {
  try {
    // Buscar itens do pedido
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('template_order_items')
      .select('template_id, template_name')
      .eq('order_id', orderId)

    if (itemsError || !orderItems?.length) {
      console.error('❌ Itens do pedido não encontrados')
      return
    }

    console.log(`🎁 Liberando ${orderItems.length} templates para usuário ${userId}`)

    // Criar licenças para cada template
    const purchases = orderItems.map(item => ({
      user_id: userId,
      template_id: item.template_id,
      order_id: orderId,
      status: 'active',
      purchased_at: new Date().toISOString()
    }))

    // Insert com upsert para evitar duplicatas
    const { error: purchaseError } = await supabaseAdmin
      .from('user_purchases')
      .upsert(purchases, {
        onConflict: 'user_id,template_id',
        ignoreDuplicates: true
      })

    if (purchaseError) {
      console.error('❌ Erro ao criar licenças:', purchaseError)
      return
    }

    // Limpar carrinho do usuário
    await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('user_id', userId)

    // Atualizar contador de vendas dos templates
    for (const item of orderItems) {
      await supabaseAdmin.rpc('increment_template_sales', {
        template_id: item.template_id
      })
    }

    console.log(`✅ ${orderItems.length} templates liberados com sucesso`)

  } catch (error) {
    console.error('❌ Erro ao liberar templates:', error)
  }
}

// GET para verificação de saúde
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    endpoint: 'templates-webhook',
    timestamp: new Date().toISOString()
  })
}

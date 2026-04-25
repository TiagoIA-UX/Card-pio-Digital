import { createAdminClient } from '@/lib/shared/supabase/admin'
import { createDomainLogger } from '@/lib/shared/domain-logger'
import { formatarPedidoWhatsApp, gerarLinkWhatsApp } from '@/modules/whatsapp'

const log = createDomainLogger('core')

export interface DeliveryCheckoutInput {
  orderId: string
  restaurantSlug: string
  siteUrl: string
}

export interface DeliveryCheckoutResult {
  paymentId: string
  checkoutUrl: string
  sandboxCheckoutUrl: string | null
  amount: number
  mpPreferenceId: string
}

export async function createDeliveryCheckout(
  _admin: ReturnType<typeof createAdminClient>,
  _input: DeliveryCheckoutInput
): Promise<DeliveryCheckoutResult> {
  throw new Error(
    'Checkout de delivery temporariamente indisponível — gateway em migração para Stripe.'
  )
}

export async function processDeliveryPayment(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  payment: {
    id?: number | null
    status?: string | null
    status_detail?: string | null
    transaction_amount?: number | null
    payment_method_id?: string | null
    payment_type_id?: string | null
    date_approved?: string | null
    payer?: { email?: string | null } | null
  },
  _siteUrl: string
) {
  const { data: deliveryPayment, error: dpError } = await admin
    .from('delivery_payments')
    .select('id, restaurant_id, order_id, status, amount, metadata')
    .eq('order_id', orderId)
    .single()

  if (dpError || !deliveryPayment) {
    throw new Error(`Pagamento de delivery não encontrado para pedido ${orderId}`)
  }

  if (deliveryPayment.status === 'approved') {
    return { alreadyProcessed: true, whatsappLink: null }
  }

  const isApproved = payment.status === 'approved'
  const isRejected = payment.status === 'rejected' || payment.status === 'cancelled'
  const newStatus = isApproved ? 'approved' : isRejected ? 'rejected' : 'pending'

  const updateData: Record<string, unknown> = {
    status: newStatus,
    payment_method_used: payment.payment_method_id || null,
    metadata: {
      ...(typeof deliveryPayment.metadata === 'object' ? deliveryPayment.metadata : {}),
      payment_status: payment.status,
      payment_status_detail: payment.status_detail,
      payment_type: payment.payment_type_id,
      payer_email: payment.payer?.email,
    },
  }

  if (isApproved) {
    updateData.paid_at = payment.date_approved || new Date().toISOString()
  }

  await admin.from('delivery_payments').update(updateData).eq('id', deliveryPayment.id)

  if (isApproved) {
    await admin
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId)
      .eq('status', 'pending')
  }

  if (isRejected) {
    await admin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)
      .eq('status', 'pending')
  }

  let whatsappLink: string | null = null

  if (isApproved) {
    whatsappLink = await generateWhatsAppAfterPayment(admin, orderId, deliveryPayment.restaurant_id)
    if (whatsappLink) {
      await admin
        .from('delivery_payments')
        .update({
          whatsapp_sent: true,
          whatsapp_link: whatsappLink,
          whatsapp_sent_at: new Date().toISOString(),
        })
        .eq('id', deliveryPayment.id)
    }
  }

  await admin.from('audit_logs').insert({
    actor: 'webhook',
    action: `delivery_payment_${newStatus}`,
    resource_type: 'delivery_payments',
    resource_id: deliveryPayment.id,
    restaurant_id: deliveryPayment.restaurant_id,
    metadata: {
      payment_id: payment.id,
      amount: payment.transaction_amount,
      order_id: orderId,
      payment_method: payment.payment_method_id,
    },
  })

  return { alreadyProcessed: false, whatsappLink }
}

async function generateWhatsAppAfterPayment(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  restaurantId: string
): Promise<string | null> {
  try {
    const { data: restaurant } = await admin
      .from('restaurants')
      .select('id, nome, telefone, slug, template_slug')
      .eq('id', restaurantId)
      .single()

    if (!restaurant?.telefone) return null

    const { data: order } = await admin
      .from('orders')
      .select(
        `id, numero_pedido, cliente_nome, cliente_telefone, cliente_email,
        tipo_entrega, endereco_rua, endereco_bairro, endereco_complemento,
        forma_pagamento, troco_para, observacoes, total, created_at, status`
      )
      .eq('id', orderId)
      .single()

    if (!order) return null

    const { data: items } = await admin
      .from('order_items')
      .select('id, nome_snapshot, preco_snapshot, quantidade, observacao')
      .eq('order_id', orderId)

    if (!items || items.length === 0) return null

    const dadosPedido = {
      store: {
        nome: restaurant.nome,
        whatsapp: restaurant.telefone,
        template_slug: restaurant.template_slug || 'restaurante',
      },
      pedido: {
        numero: order.numero_pedido,
        cliente_nome: order.cliente_nome || 'Cliente',
        cliente_telefone: order.cliente_telefone || '',
        cliente_email: order.cliente_email || null,
        tipo_entrega: order.tipo_entrega === 'retirada' ? 'retirada' : 'delivery',
        cliente_endereco: order.endereco_rua
          ? {
              logradouro: order.endereco_rua,
              bairro: order.endereco_bairro || undefined,
              complemento: order.endereco_complemento || undefined,
            }
          : null,
        forma_pagamento: 'online',
        troco_para: null,
        observacoes: order.observacoes || null,
        total: Number(order.total),
        subtotal: Number(order.total),
        taxa_entrega: 0,
        desconto: 0,
        cupom_codigo: null,
        tempo_estimado: null,
        created_at: order.created_at,
      },
      itens: items.map((item) => ({
        nome_produto: item.nome_snapshot,
        quantidade: item.quantidade,
        preco_total: Number(item.preco_snapshot) * item.quantidade,
        personalizacao: null,
        observacoes: item.observacao || null,
      })),
    }

    const mensagem = formatarPedidoWhatsApp(dadosPedido as never)
    const mensagemComPagamento = mensagem.replace(
      '💳 *PAGAMENTO*\n',
      '💳 *PAGAMENTO*\n✅ *PAGO ONLINE*\n'
    )
    return gerarLinkWhatsApp(restaurant.telefone, mensagemComPagamento)
  } catch (error) {
    log.error('Erro ao gerar WhatsApp pós-pagamento', error)
    return null
  }
}

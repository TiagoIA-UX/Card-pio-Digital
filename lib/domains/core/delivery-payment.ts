// =====================================================
// DELIVERY PAYMENT — Pagamento real de pedidos via MP
// =====================================================
// Lógica de negócio para criar checkout e processar
// pagamentos de pedidos de delivery usando a Preference
// API do Mercado Pago.
// =====================================================

import { createAdminClient } from '@/lib/shared/supabase/admin'
import { createDomainLogger } from '@/lib/shared/domain-logger'
import {
  createMercadoPagoPreferenceClient,
  getMercadoPagoAccessToken,
} from '@/lib/domains/core/mercadopago'
import { isServerSandboxMode } from '@/lib/domains/core/payment-mode'
import { BRAND_SHORT, COMPANY_PAYMENT_DESCRIPTOR } from '@/lib/shared/brand'
import { formatarPedidoWhatsApp, gerarLinkWhatsApp } from '@/modules/whatsapp'

const log = createDomainLogger('core')

// ── Tipos ─────────────────────────────────────────────────────────

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

interface OrderForPayment {
  id: string
  restaurant_id: string
  total: number
  status: string
  numero_pedido: number
  cliente_nome: string | null
  cliente_telefone: string | null
}

interface RestaurantForPayment {
  id: string
  nome: string
  slug: string
  telefone: string | null
  whatsapp?: string | null
  ativo: boolean
  status_pagamento: string
  suspended: boolean
  delivery_mode: string | null
  customizacao: Record<string, unknown> | null
  mp_delivery_enabled: boolean
  template_slug?: string | null
}

// ── Criação de Checkout ───────────────────────────────────────────

export async function createDeliveryCheckout(
  admin: ReturnType<typeof createAdminClient>,
  input: DeliveryCheckoutInput
): Promise<DeliveryCheckoutResult> {
  // 1. Buscar restaurante
  const { data: restaurant, error: rError } = await admin
    .from('restaurants')
    .select('id, nome, slug, telefone, ativo, status_pagamento, suspended, delivery_mode, customizacao, mp_delivery_enabled, template_slug')
    .eq('slug', input.restaurantSlug)
    .single()

  if (rError || !restaurant) {
    throw new Error('Delivery não encontrado')
  }

  const rest = restaurant as unknown as RestaurantForPayment

  if (!rest.ativo || rest.status_pagamento !== 'ativo' || rest.suspended) {
    throw new Error('Este delivery não está ativo para receber pagamentos')
  }

  if (!rest.mp_delivery_enabled) {
    throw new Error('Pagamento online não habilitado para este delivery')
  }

  // 2. Buscar pedido
  const { data: order, error: oError } = await admin
    .from('orders')
    .select('id, restaurant_id, total, status, numero_pedido, cliente_nome, cliente_telefone')
    .eq('id', input.orderId)
    .eq('restaurant_id', rest.id)
    .single()

  if (oError || !order) {
    throw new Error('Pedido não encontrado ou não pertence a este delivery')
  }

  const ord = order as unknown as OrderForPayment

  if (ord.status !== 'pending') {
    throw new Error('Pedido não está pendente de pagamento')
  }

  if (!Number.isFinite(ord.total) || ord.total <= 0) {
    throw new Error('Valor do pedido inválido')
  }

  // 3. Verificar se já existe pagamento aprovado
  const { data: existingPayment } = await admin
    .from('delivery_payments')
    .select('id, status')
    .eq('order_id', ord.id)
    .maybeSingle()

  if (existingPayment?.status === 'approved') {
    throw new Error('Este pedido já possui pagamento aprovado')
  }

  // 4. Criar Preference no Mercado Pago
  const isSandbox = isServerSandboxMode()
  const preference = createMercadoPagoPreferenceClient()

  const externalReference = `delivery:${ord.id}`
  const backUrls = {
    success: `${input.siteUrl}/${rest.slug}/pedido/${ord.id}?status=aprovado`,
    failure: `${input.siteUrl}/${rest.slug}/pedido/${ord.id}?status=erro`,
    pending: `${input.siteUrl}/${rest.slug}/pedido/${ord.id}?status=pendente`,
  }

  const preferenceBody: Record<string, unknown> = {
    items: [
      {
        id: ord.id,
        title: `Pedido #${ord.numero_pedido} — ${rest.nome}`,
        description: `Pedido de delivery via ${BRAND_SHORT}`,
        quantity: 1,
        currency_id: 'BRL',
        unit_price: ord.total,
      },
    ],
    external_reference: externalReference,
    back_urls: backUrls,
    statement_descriptor: COMPANY_PAYMENT_DESCRIPTOR,
  }

  // Em produção: configurar webhook e auto_return
  if (!isSandbox) {
    Object.assign(preferenceBody, {
      notification_url: `${input.siteUrl}/api/webhook/mercadopago`,
      auto_return: 'approved',
    })
  }

  const mpPreference = await preference.create({ body: preferenceBody as never })

  if (!mpPreference.id || !mpPreference.init_point) {
    throw new Error('Falha ao criar checkout no Mercado Pago')
  }

  // 5. Salvar delivery_payment (upsert para retry)
  const paymentData = {
    restaurant_id: rest.id,
    order_id: ord.id,
    mp_preference_id: mpPreference.id,
    checkout_url: mpPreference.init_point,
    sandbox_checkout_url: mpPreference.sandbox_init_point || null,
    amount: ord.total,
    status: 'pending' as const,
    metadata: {
      external_reference: externalReference,
      restaurant_slug: rest.slug,
      restaurant_name: rest.nome,
      order_number: ord.numero_pedido,
      customer_name: ord.cliente_nome,
      customer_phone: ord.cliente_telefone,
      sandbox: isSandbox,
    },
  }

  if (existingPayment) {
    // Update existing pending payment
    const { error: uError } = await admin
      .from('delivery_payments')
      .update(paymentData)
      .eq('id', existingPayment.id)

    if (uError) {
      throw new Error('Falha ao atualizar registro de pagamento')
    }
  } else {
    const { error: iError } = await admin
      .from('delivery_payments')
      .insert(paymentData)

    if (iError) {
      throw new Error('Falha ao registrar pagamento')
    }
  }

  // 6. Audit log
  await admin.from('audit_logs').insert({
    actor: 'system',
    action: 'delivery_checkout_criado',
    resource_type: 'delivery_payments',
    resource_id: ord.id,
    restaurant_id: rest.id,
    metadata: {
      mp_preference_id: mpPreference.id,
      amount: ord.total,
      order_number: ord.numero_pedido,
    },
  })

  return {
    paymentId: ord.id,
    checkoutUrl: mpPreference.init_point,
    sandboxCheckoutUrl: mpPreference.sandbox_init_point || null,
    amount: ord.total,
    mpPreferenceId: mpPreference.id,
  }
}

// ── Processamento de Pagamento Confirmado pelo Webhook ────────────

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
  siteUrl: string
) {
  // 1. Buscar delivery_payment
  const { data: deliveryPayment, error: dpError } = await admin
    .from('delivery_payments')
    .select('id, restaurant_id, order_id, status, amount, metadata')
    .eq('order_id', orderId)
    .single()

  if (dpError || !deliveryPayment) {
    throw new Error(`Pagamento de delivery não encontrado para pedido ${orderId}`)
  }

  const alreadyApproved = deliveryPayment.status === 'approved'
  if (alreadyApproved) {
    return { alreadyProcessed: true, whatsappLink: null }
  }

  // 2. Mapear status
  const isApproved = payment.status === 'approved'
  const isRejected = payment.status === 'rejected' || payment.status === 'cancelled'
  const newStatus = isApproved ? 'approved' : isRejected ? 'rejected' : 'pending'

  // 3. Atualizar delivery_payment
  const updateData: Record<string, unknown> = {
    status: newStatus,
    mp_payment_id: payment.id?.toString() || null,
    payment_method_used: payment.payment_method_id || null,
    metadata: {
      ...(typeof deliveryPayment.metadata === 'object' ? deliveryPayment.metadata : {}),
      mp_status: payment.status,
      mp_status_detail: payment.status_detail,
      mp_payment_type: payment.payment_type_id,
      mp_payer_email: payment.payer?.email,
    },
  }

  if (isApproved) {
    updateData.paid_at = payment.date_approved || new Date().toISOString()
  }

  await admin
    .from('delivery_payments')
    .update(updateData)
    .eq('id', deliveryPayment.id)

  // 4. Atualizar status do pedido
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

  // 5. Se aprovado: gerar mensagem WhatsApp
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

  // 6. Audit log
  await admin.from('audit_logs').insert({
    actor: 'webhook',
    action: `delivery_payment_${newStatus}`,
    resource_type: 'delivery_payments',
    resource_id: deliveryPayment.id,
    restaurant_id: deliveryPayment.restaurant_id,
    metadata: {
      mp_payment_id: payment.id,
      amount: payment.transaction_amount,
      order_id: orderId,
      payment_method: payment.payment_method_id,
    },
  })

  return { alreadyProcessed: false, whatsappLink }
}

// ── WhatsApp pós-pagamento ────────────────────────────────────────

async function generateWhatsAppAfterPayment(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string,
  restaurantId: string
): Promise<string | null> {
  try {
    // Buscar restaurante
    const { data: restaurant } = await admin
      .from('restaurants')
      .select('id, nome, telefone, slug, template_slug')
      .eq('id', restaurantId)
      .single()

    if (!restaurant?.telefone) {
      return null
    }

    // Buscar pedido
    const { data: order } = await admin
      .from('orders')
      .select(`
        id, numero_pedido, cliente_nome, cliente_telefone, cliente_email,
        tipo_entrega, endereco_rua, endereco_bairro, endereco_complemento,
        forma_pagamento, troco_para, observacoes, total, created_at, status
      `)
      .eq('id', orderId)
      .single()

    if (!order) {
      return null
    }

    // Buscar itens do pedido
    const { data: items } = await admin
      .from('order_items')
      .select('id, nome_snapshot, preco_snapshot, quantidade, observacao')
      .eq('order_id', orderId)

    if (!items || items.length === 0) {
      return null
    }

    // Formatar dados para o módulo WhatsApp
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

    // Gerar mensagem formatada
    const mensagem = formatarPedidoWhatsApp(dadosPedido as never)

    // Adicionar nota de pagamento confirmado
    const mensagemComPagamento =
      mensagem.replace(
        '💳 *PAGAMENTO*\n',
        '💳 *PAGAMENTO*\n✅ *PAGO ONLINE via Mercado Pago*\n'
      )

    // Gerar link WhatsApp
    const link = gerarLinkWhatsApp(restaurant.telefone, mensagemComPagamento)

    return link
  } catch (error) {
    log.error('Erro ao gerar WhatsApp pós-pagamento', error)
    return null
  }
}

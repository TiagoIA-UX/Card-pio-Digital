import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { createClient as createServerClient } from '@/lib/shared/supabase/server'
import { z } from 'zod'
import { createOperationTracker } from '@/lib/shared/forgeops/operation-tracker'

const produtoSchema = z.object({
  nome: z.string().min(1).max(150),
  descricao: z.string().max(500).optional(),
  preco: z.string().min(1).max(20),
  adicionais: z.string().max(500).optional(),
})

const categoriaSchema = z.object({
  nome: z.string().min(1).max(100),
  produtos: z.array(produtoSchema).max(200),
})

const onboardingDataSchema = z.object({
  nome_negocio: z.string().min(2).max(120),
  tipo_negocio: z.string().max(60).default(''),
  cidade: z.string().max(100).default(''),
  estado: z.string().max(2).default(''),
  whatsapp: z.string().min(10).max(20),
  instagram: z.string().max(100).optional(),
  horario_funcionamento: z.string().max(200).optional(),
  taxa_entrega: z.string().max(100).optional(),
  area_entrega: z.string().max(200).optional(),
  tempo_preparo: z.string().max(100).optional(),
  categorias: z.array(categoriaSchema).max(50),
  logo_url: z.string().url().max(500).optional(),
  fotos_produtos: z.array(z.string().url().max(500)).max(100).optional(),
})

const bodySchema = z.object({
  checkout: z.string().max(100).optional(),
  restaurant_id: z.string().uuid().optional(),
  data: onboardingDataSchema,
})

export type OnboardingFormData = z.infer<typeof onboardingDataSchema>

export async function POST(request: NextRequest) {
  // Auth check before tracking — 401 is an expected security gate, not an operation failure
  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Faça login para continuar' }, { status: 401 })
  }

  const tracker = createOperationTracker({
    flowName: 'onboarding.submit',
    entityType: 'onboarding_submission',
    operationId: request.headers.get('x-operation-id'),
    correlationId: request.headers.get('x-correlation-id') || request.headers.get('x-request-id'),
  })

  try {
    tracker.toProcessing({ actorId: user.id })

    const raw = await request.json()
    const parsed = bodySchema.safeParse(raw)
    if (!parsed.success) {
      tracker.fail(new Error('onboarding.submit.invalid_payload'), {
        statusCode: 400,
        details: parsed.error.flatten().fieldErrors,
      })
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          details: parsed.error.flatten().fieldErrors,
          operationId: tracker.getContext().operationId,
        },
        { status: 400 }
      )
    }
    const { checkout, restaurant_id, data } = parsed.data

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
        tracker.fail(new Error('onboarding.submit.order_not_found'), { statusCode: 404 })
        return NextResponse.json(
          { error: 'Pedido não encontrado', operationId: tracker.getContext().operationId },
          { status: 404 }
        )
      }

      if (!order.user_id || order.user_id !== user.id) {
        tracker.fail(new Error('onboarding.submit.forbidden_order_owner'), { statusCode: 403 })
        return NextResponse.json(
          { error: 'Forbidden', operationId: tracker.getContext().operationId },
          { status: 403 }
        )
      }

      const metadata = (order.metadata || {}) as Record<string, unknown>
      if (metadata.checkout_type !== 'restaurant_onboarding') {
        tracker.fail(new Error('onboarding.submit.invalid_checkout_type'), { statusCode: 400 })
        return NextResponse.json(
          {
            error: 'Pedido inválido para onboarding',
            operationId: tracker.getContext().operationId,
          },
          { status: 400 }
        )
      }

      if (metadata.plan_slug !== 'feito-pra-voce') {
        tracker.fail(new Error('onboarding.submit.plan_not_allowed'), { statusCode: 400 })
        return NextResponse.json(
          {
            error: 'O onboarding manual é exclusivo do plano Feito Pra Você',
            operationId: tracker.getContext().operationId,
          },
          { status: 400 }
        )
      }

      if (order.payment_status !== 'approved') {
        tracker.fail(new Error('onboarding.submit.payment_not_approved'), { statusCode: 409 })
        return NextResponse.json(
          {
            error: 'Pagamento ainda não confirmado',
            operationId: tracker.getContext().operationId,
          },
          { status: 409 }
        )
      }

      const provRestaurantId = metadata.provisioned_restaurant_id as string | undefined
      if (!provRestaurantId) {
        tracker.fail(new Error('onboarding.submit.provisioning_not_ready'), { statusCode: 409 })
        return NextResponse.json(
          {
            error: 'Aguarde a confirmação do webhook antes de enviar o onboarding',
            operationId: tracker.getContext().operationId,
          },
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
        tracker.fail(new Error('onboarding.submit.restaurant_not_found'), { statusCode: 404 })
        return NextResponse.json(
          { error: 'Delivery não encontrado', operationId: tracker.getContext().operationId },
          { status: 404 }
        )
      }

      if (!restaurant.user_id || restaurant.user_id !== user.id) {
        tracker.fail(new Error('onboarding.submit.forbidden_restaurant_owner'), {
          statusCode: 403,
        })
        return NextResponse.json(
          { error: 'Forbidden', operationId: tracker.getContext().operationId },
          { status: 403 }
        )
      }
    }

    if (!orderId && !restaurantId) {
      tracker.fail(new Error('onboarding.submit.missing_targets'), { statusCode: 400 })
      return NextResponse.json(
        {
          error: 'Informe checkout ou restaurant_id',
          operationId: tracker.getContext().operationId,
        },
        { status: 400 }
      )
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
      tracker.fail(error, { statusCode: 500 })
      return NextResponse.json(
        { error: 'Erro ao salvar formulário', operationId: tracker.getContext().operationId },
        { status: 500 }
      )
    }

    // Notificar admin via system_alerts → Sentinel Python envia ao Telegram
    const nomePedido = data.nome_negocio
    const alertTitle = `📋 Briefing Feito Pra Você — ${nomePedido}`
    const alertBody = [
      `Novo briefing recebido de ${nomePedido} (${data.tipo_negocio || 'delivery'} · ${data.cidade || '?'}/${data.estado || '?'}).`,
      `WhatsApp: ${data.whatsapp}`,
      restaurantId ? `Delivery: /admin/cardapios (ID ${restaurantId.slice(0, 8)}…)` : '',
      orderId ? `Pedido: ${checkout || orderId.slice(0, 8)}` : '',
      `Categorias enviadas: ${data.categorias.length}`,
    ]
      .filter(Boolean)
      .join('\n')

    await admin
      .from('system_alerts')
      .insert({
        severity: 'info',
        source: 'onboarding-briefing',
        title: alertTitle,
        body: alertBody,
        notified_python: false,
      })
      .then(({ error: alertErr }) => {
        if (alertErr)
          console.warn('Aviso: não foi possível criar system_alert do briefing:', alertErr.message)
      })

    tracker.toCompleted({ orderId, restaurantId, actorId: user.id })
    return NextResponse.json({ success: true, operationId: tracker.getContext().operationId })
  } catch (err) {
    console.error('Erro no submit onboarding:', err)
    tracker.fail(err, { statusCode: 500 })
    return NextResponse.json(
      { error: 'Erro interno', operationId: tracker.getContext().operationId },
      { status: 500 }
    )
  }
}


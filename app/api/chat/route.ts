import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRateLimitIdentifier, RATE_LIMITS, withRateLimit } from '@/lib/rate-limit'
import { getRestaurantAiAssistantSettings } from '@/lib/restaurant-customization'
import { buildDeliveryAssistantSystemPrompt } from '@/lib/delivery-assistant'

const CHAT_HISTORY_LIMIT = 20
const CHAT_TIMEOUT_MS = 8_000
const CHAT_MAX_PRODUCTS = 40

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ChatRequestBody = {
  messages?: unknown
  context?: {
    restaurantId?: string
    restaurantSlug?: string
  }
}

type ChatRestaurantRow = {
  id: string
  slug: string
  nome: string
  template_slug?: string | null
  ativo: boolean
  status_pagamento: string
  suspended?: boolean | null
  customizacao?: Record<string, unknown> | null
  horario_funcionamento?: Record<
    string,
    {
      aberto?: boolean
      abre?: string
      fecha?: string
    }
  > | null
  tempo_entrega_min?: number | null
  pedido_minimo?: number | null
  raio_entrega_km?: number | null
}

type ChatProductRow = {
  id: string
  nome: string
  descricao?: string | null
  preco?: number | null
  categoria?: string | null
  ativo?: boolean | null
  ordem?: number | null
  destaque?: boolean | null
}

function toFiniteNumber(value: unknown): number | null {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function formatOpeningHoursSummary(
  horario?: ChatRestaurantRow['horario_funcionamento'] | null
): string | null {
  if (!horario || typeof horario !== 'object') {
    return null
  }

  const days: Array<[string, string]> = [
    ['segunda', 'Seg'],
    ['terca', 'Ter'],
    ['quarta', 'Qua'],
    ['quinta', 'Qui'],
    ['sexta', 'Sex'],
    ['sabado', 'Sáb'],
    ['domingo', 'Dom'],
  ]

  const entries = days.flatMap(([key, label]) => {
    const day = horario[key]
    if (!day?.aberto || !day.abre || !day.fecha) {
      return []
    }

    return [`${label} ${day.abre}-${day.fecha}`]
  })

  return entries.length > 0 ? entries.join(' · ') : null
}

function resolveIsOpenNow(
  horario?: ChatRestaurantRow['horario_funcionamento'] | null
): boolean | null {
  if (!horario || typeof horario !== 'object') {
    return null
  }

  const now = new Date()
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] as const
  const currentDay = days[now.getDay()]
  const day = horario[currentDay]

  if (!day?.aberto || !day.abre || !day.fecha) {
    return false
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const [openHours, openMinutes] = day.abre.split(':').map(Number)
  const [closeHours, closeMinutes] = day.fecha.split(':').map(Number)

  const openMinutesTotal = openHours * 60 + openMinutes
  let closeMinutesTotal = closeHours * 60 + closeMinutes

  if (closeMinutesTotal < openMinutesTotal) {
    closeMinutesTotal += 24 * 60
  }

  return currentMinutes >= openMinutesTotal && currentMinutes <= closeMinutesTotal
}

function buildFallbackReply(restaurantName?: string | null) {
  const prefix = restaurantName ? `Posso te ajudar com ${restaurantName}` : 'Posso te ajudar'
  return `${prefix} com cardápio, preços, horários e entrega. Se quiser, me diga o que você está procurando.`
}

function buildCompletionTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('CHAT_TIMEOUT'))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
    }
  }) as Promise<T>
}

async function loadRestaurantContext(
  restaurant: ChatRestaurantRow,
  db: ReturnType<typeof createAdminClient>
) {
  const { data: products } = await db
    .from('products')
    .select('id, nome, descricao, preco, categoria, ativo, ordem, destaque')
    .eq('restaurant_id', restaurant.id)
    .eq('ativo', true)
    .order('ordem')
    .limit(CHAT_MAX_PRODUCTS)

  const activeProducts = ((products || []) as ChatProductRow[]).filter((product) => product.ativo !== false)
  const categories = [
    ...new Set(
      activeProducts
        .map((product) => product.categoria)
        .filter((category): category is string => typeof category === 'string' && category.trim().length > 0)
    ),
  ]

  const topProducts = [...activeProducts]
    .sort((left, right) => {
      const leftFeatured = left.destaque ? 1 : 0
      const rightFeatured = right.destaque ? 1 : 0

      if (leftFeatured !== rightFeatured) {
        return rightFeatured - leftFeatured
      }

      return (left.ordem ?? 0) - (right.ordem ?? 0)
    })
    .slice(0, 6)
    .map((product) => ({
      name: product.nome,
      category: product.categoria,
      price: toFiniteNumber(product.preco),
    }))

  return {
    categories,
    topProducts,
    productCount: activeProducts.length,
    deliveryTimeMin: toFiniteNumber(restaurant.tempo_entrega_min),
    minimumOrder: toFiniteNumber(restaurant.pedido_minimo),
    deliveryRadiusKm: toFiniteNumber(restaurant.raio_entrega_km),
    openingHours: formatOpeningHoursSummary(restaurant.horario_funcionamento),
    isOpenNow: resolveIsOpenNow(restaurant.horario_funcionamento),
  }
}

function getGroq() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada')
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(req), RATE_LIMITS.chat)
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const requestId = crypto.randomUUID()
    const startedAt = Date.now()

    const body = (await req.json()) as ChatRequestBody
    const { messages, context } = body

    console.log(
      '[CHAT_START]',
      JSON.stringify({
        requestId,
        restaurantId: context?.restaurantId ?? null,
        restaurantSlug: context?.restaurantSlug ?? null,
        messageCount: Array.isArray(messages) ? messages.length : 0,
      })
    )

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages inválido' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    if (messages.length > CHAT_HISTORY_LIMIT) {
      return NextResponse.json(
        { error: `Limite de ${CHAT_HISTORY_LIMIT} mensagens por conversa.` },
        { status: 400, headers: rateLimit.headers }
      )
    }

    // Valida que cada mensagem tem role e content string (evita injeção)
    const safeMessages = (messages as unknown[])
      .filter((message): message is ChatMessage => {
        if (!message || typeof message !== 'object') {
          return false
        }

        const candidate = message as Record<string, unknown>
        return (
          (candidate.role === 'user' || candidate.role === 'assistant') &&
          typeof candidate.content === 'string' &&
          candidate.content.trim().length > 0
        )
      })
      .slice(-CHAT_HISTORY_LIMIT) // limita histórico para não exceder tokens
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) })) // limita tamanho por mensagem

    if (safeMessages.length === 0 || !safeMessages.some((message) => message.role === 'user')) {
      return NextResponse.json(
        { error: 'Envie pelo menos uma mensagem do cliente.' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    if (context?.restaurantId || context?.restaurantSlug) {
      const db = createAdminClient()
      const query = db
        .from('restaurants')
        .select(
          'id, slug, nome, template_slug, ativo, status_pagamento, suspended, customizacao, horario_funcionamento, tempo_entrega_min, pedido_minimo, raio_entrega_km'
        )

      const restaurantResult = context.restaurantId
        ? await query.eq('id', context.restaurantId).maybeSingle()
        : await query.eq('slug', context.restaurantSlug || '').maybeSingle()

      const restaurant = restaurantResult.data as ChatRestaurantRow | null

      if (!restaurant) {
        return NextResponse.json(
          { error: 'Delivery não encontrado para este atendimento de IA.' },
          { status: 404, headers: rateLimit.headers }
        )
      }

      const aiSettings = getRestaurantAiAssistantSettings(restaurant.customizacao)
      const isActive =
        restaurant.ativo !== false &&
        restaurant.status_pagamento === 'ativo' &&
        !restaurant.suspended

      if (!isActive || !aiSettings.enabled) {
        return NextResponse.json(
          { error: 'Atendimento por IA desativado para este delivery.' },
          { status: 403, headers: rateLimit.headers }
        )
      }

      const restaurantContext = await loadRestaurantContext(restaurant, db)

      const systemPrompt = buildDeliveryAssistantSystemPrompt({
        restaurantName: restaurant.nome,
        templateSlug: restaurant.template_slug,
        mode: aiSettings.scope === 'sales' ? 'sales' : 'support',
        scope: aiSettings.scope,
        dailyMessageLimit: aiSettings.dailyMessageLimit,
        context: {
          restaurantName: restaurant.nome,
          categories: restaurantContext.categories,
          topProducts: restaurantContext.topProducts,
          deliveryTimeMin: restaurantContext.deliveryTimeMin,
          minimumOrder: restaurantContext.minimumOrder,
          deliveryRadiusKm: restaurantContext.deliveryRadiusKm,
          openingHours: restaurantContext.openingHours,
          productCount: restaurantContext.productCount,
          isOpenNow: restaurantContext.isOpenNow,
        },
      })

      try {
        const completion = await buildCompletionTimeout(
          getGroq().chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: systemPrompt }, ...safeMessages],
            max_tokens: 220,
            temperature: 0.55,
          }),
          CHAT_TIMEOUT_MS
        )

        const reply =
          completion.choices[0]?.message?.content?.trim() || buildFallbackReply(restaurant.nome)

        console.log(
          '[CHAT_OK]',
          JSON.stringify({
            requestId,
            restaurantId: restaurant.id,
            restaurantSlug: restaurant.slug,
            mode: aiSettings.scope,
            messageCount: safeMessages.length,
            categories: restaurantContext.categories.length,
            topProducts: restaurantContext.topProducts.length,
            latencyMs: Date.now() - startedAt,
          })
        )

        return NextResponse.json({ reply, fallback: false }, { headers: rateLimit.headers })
      } catch (error) {
        const timeout = error instanceof Error && error.message === 'CHAT_TIMEOUT'

        console.error(
          '[CHAT_ERROR]',
          JSON.stringify({
            requestId,
            restaurantId: restaurant.id,
            restaurantSlug: restaurant.slug,
            mode: aiSettings.scope,
            messageCount: safeMessages.length,
            timeout,
            latencyMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : 'unknown',
          })
        )

        return NextResponse.json(
          {
            reply: buildFallbackReply(restaurant.nome),
            fallback: true,
          },
          { headers: rateLimit.headers }
        )
      }
    }

    const fallbackPrompt = buildDeliveryAssistantSystemPrompt({
      restaurantName: 'atendimento geral da Zairyx',
      mode: 'support',
      scope: 'support',
      context: {
        categories: [],
        topProducts: [],
        productCount: 0,
        isOpenNow: null,
      },
    })

    try {
      const completion = await buildCompletionTimeout(
        getGroq().chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: fallbackPrompt }, ...safeMessages],
          max_tokens: 220,
          temperature: 0.55,
        }),
        CHAT_TIMEOUT_MS
      )

      const reply = completion.choices[0]?.message?.content?.trim() || buildFallbackReply(null)

      console.log(
        '[CHAT_OK]',
        JSON.stringify({
          requestId,
          restaurantId: null,
          restaurantSlug: null,
          mode: 'support',
          messageCount: safeMessages.length,
          categories: 0,
          topProducts: 0,
          latencyMs: Date.now() - startedAt,
        })
      )

      return NextResponse.json({ reply, fallback: false }, { headers: rateLimit.headers })
    } catch (error) {
      const timeout = error instanceof Error && error.message === 'CHAT_TIMEOUT'

      console.error(
        '[CHAT_ERROR]',
        JSON.stringify({
          requestId,
          restaurantId: null,
          restaurantSlug: null,
          mode: 'support',
          messageCount: safeMessages.length,
          timeout,
          latencyMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : 'unknown',
        })
      )

      return NextResponse.json(
        {
          reply: buildFallbackReply(null),
          fallback: true,
        },
        { headers: rateLimit.headers }
      )
    }
  } catch (err) {
    console.error('[chat/route] erro:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

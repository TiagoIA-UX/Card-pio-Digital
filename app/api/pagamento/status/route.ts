import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getRateLimitIdentifier, withRateLimit } from '@/lib/rate-limit'
import { TEMPLATE_PRESETS, normalizeTemplateSlug } from '@/lib/restaurant-customization'

function getMetadata(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {} as Record<string, unknown>
  }

  return value as Record<string, unknown>
}

function formatTemplateNameFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

async function ensureTemplateIdForPurchase(
  admin: ReturnType<typeof createAdminClient>,
  templateSlug: string
) {
  const { data: existingTemplate } = await admin
    .from('templates')
    .select('id')
    .eq('slug', templateSlug)
    .maybeSingle()

  if (existingTemplate?.id) {
    return existingTemplate.id
  }

  const preset = TEMPLATE_PRESETS[templateSlug as keyof typeof TEMPLATE_PRESETS]
  const name =
    preset?.label || formatTemplateNameFromSlug(templateSlug) || 'Template Cardápio Digital'

  const { data: createdTemplate, error } = await admin
    .from('templates')
    .upsert(
      {
        slug: templateSlug,
        name,
        description: preset?.heroDescription || `Template ${name} para Cardápio Digital`,
        short_description: preset?.badge || null,
        category: templateSlug,
        status: 'active',
      },
      { onConflict: 'slug' }
    )
    .select('id')
    .single()

  if (error) {
    console.error('Falha ao criar template fallback no status:', error)
  }

  return createdTemplate?.id || existingTemplate?.id || null
}

async function ensurePurchaseRecord(
  admin: ReturnType<typeof createAdminClient>,
  payload: {
    userId: string
    orderId: string
    templateSlug: string
  }
) {
  const templateId = await ensureTemplateIdForPurchase(admin, payload.templateSlug)
  if (!templateId) return

  await admin.from('user_purchases').upsert(
    {
      user_id: payload.userId,
      template_id: templateId,
      order_id: payload.orderId,
      status: 'active',
      purchased_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,template_id', ignoreDuplicates: true }
  )
}

export async function GET(request: NextRequest) {
  const checkout = request.nextUrl.searchParams.get('checkout')?.trim()

  const rateLimit = await withRateLimit(getRateLimitIdentifier(request), {
    limit: 20,
    windowMs: 60000,
  })
  if (rateLimit.limited) {
    return rateLimit.response
  }

  if (!checkout) {
    return NextResponse.json(
      { error: 'Checkout não informado' },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Faça login para consultar este pedido' },
      { status: 401, headers: rateLimit.headers }
    )
  }

  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from('template_orders')
    .select('id, user_id, order_number, status, payment_status, metadata, updated_at')
    .eq('order_number', checkout)
    .single()

  if (error || !order) {
    return NextResponse.json(
      { error: 'Checkout não encontrado' },
      { status: 404, headers: rateLimit.headers }
    )
  }

  if (!order.user_id || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: rateLimit.headers })
  }

  const metadata = getMetadata(order.metadata)

  if (metadata.checkout_type !== 'restaurant_onboarding') {
    return NextResponse.json({ error: 'Checkout inválido para onboarding' }, { status: 400 })
  }

  if (order.payment_status === 'approved' && metadata.onboarding_status === 'ready') {
    const templateSlug = normalizeTemplateSlug(String(metadata.template_slug || 'restaurante'))
    await ensurePurchaseRecord(admin, {
      userId: user.id,
      orderId: order.id,
      templateSlug,
    })
  }

  return NextResponse.json(
    {
      checkout: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      plan_slug: metadata.plan_slug ?? null,
      onboarding_status: metadata.onboarding_status ?? 'awaiting_payment',
      restaurant_slug: metadata.provisioned_restaurant_slug ?? null,
      restaurant_id: metadata.provisioned_restaurant_id ?? null,
      updated_at: order.updated_at,
    },
    { headers: rateLimit.headers }
  )
}

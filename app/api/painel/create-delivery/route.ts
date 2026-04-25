import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createAdminClient } from '@/lib/shared/supabase/admin'
import { createClient as createServerClient } from '@/lib/shared/supabase/server'
import { buildRestaurantInstallation } from '@/lib/domains/core/restaurant-onboarding'
import { normalizeTemplateSlug } from '@/lib/domains/core/restaurant-customization'
import { resolveRestaurantCreationEntitlements } from '@/lib/domains/core/commercial-entitlements'
import { syncFinancialTruthForTenant } from '@/lib/domains/core/financial-truth'

const createDeliverySchema = z.object({
  nome: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  telefone: z.string().min(10).max(20),
  templateSlug: z.string().min(1).max(80).optional(),
})

export function buildExplicitRestaurantFinancialPayload() {
  return {
    ativo: true,
    suspended: false,
    status_pagamento: 'ativo' as const,
    plano: 'self-service' as const,
    plan_slug: 'basico' as const,
    origin_sale: 'organic' as const,
  }
}

export async function POST(request: NextRequest) {
  try {
    const authSupabase = await createServerClient()
    const {
      data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const raw = await request.json().catch(() => ({}))
    const parsed = createDeliverySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const body = parsed.data
    const admin = createAdminClient()

    const [{ count: activePurchases }, { data: approvedOrders }, { count: restaurantsCount }] =
      await Promise.all([
        admin
          .from('user_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'active'),
        admin
          .from('template_orders')
          .select('metadata')
          .eq('user_id', user.id)
          .eq('payment_status', 'approved'),
        admin
          .from('restaurants')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ])

    const entitlements = resolveRestaurantCreationEntitlements({
      activePurchasesCount: activePurchases || 0,
      approvedOrderRows: (approvedOrders || []) as Array<{
        metadata?: Record<string, unknown> | null
      }>,
      restaurantsCount: restaurantsCount || 0,
    })

    if (entitlements.totalCredits <= 0) {
      return NextResponse.json(
        {
          error:
            'Seu acesso ao painel ainda não foi liberado. Conclua a compra antes de criar um canal digital.',
        },
        { status: 403 }
      )
    }

    if (!entitlements.canCreateRestaurant) {
      return NextResponse.json(
        {
          error:
            'Você já usou todos os canais digitais liberados pela sua compra atual. Compre outra implantação ou solicite um plano de rede para adicionar mais unidades.',
        },
        { status: 409 }
      )
    }

    const { data: existingSlug } = await admin
      .from('restaurants')
      .select('id')
      .eq('slug', body.slug)
      .maybeSingle()

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Este endereço já está em uso. Escolha outro nome.' },
        { status: 409 }
      )
    }

    const templateSlug = normalizeTemplateSlug(
      (body.templateSlug || 'restaurante').trim().toLowerCase()
    )
    const installation = buildRestaurantInstallation(templateSlug, body.nome)
    const financialPayload = buildExplicitRestaurantFinancialPayload()

    const { data: inserted, error: insertError } = await admin
      .from('restaurants')
      .insert({
        user_id: user.id,
        nome: body.nome,
        slug: body.slug,
        telefone: body.telefone.replace(/\D/g, ''),
        template_slug: installation.templateSlug,
        banner_url: installation.restaurantUpdate.banner_url,
        slogan: installation.restaurantUpdate.slogan ?? null,
        cor_primaria: installation.restaurantUpdate.cor_primaria ?? '#f97316',
        cor_secundaria: installation.restaurantUpdate.cor_secundaria ?? '#ea580c',
        customizacao: installation.restaurantUpdate.customizacao ?? {},
        ...financialPayload,
      })
      .select('id')
      .single()

    if (insertError || !inserted?.id) {
      return NextResponse.json(
        { error: insertError?.message || 'Erro ao criar canal digital' },
        { status: 500 }
      )
    }

    try {
      await syncFinancialTruthForTenant(admin, {
        tenantId: inserted.id,
        source: 'reconciliation',
        sourceId: `create-delivery:${user.id}`,
        lastEventAt: new Date().toISOString(),
        rawSnapshot: {
          flow: 'painel_criar_delivery',
          active_purchases_count: activePurchases || 0,
          approved_order_count: (approvedOrders || []).length,
          network_extra_units: entitlements.networkExtraUnits,
        },
      })
    } catch (financialTruthError) {
      await admin.from('restaurants').delete().eq('id', inserted.id)
      return NextResponse.json(
        {
          error: 'Falha ao consolidar estado financeiro do canal digital criado.',
          detail:
            financialTruthError instanceof Error
              ? financialTruthError.message
              : 'financial_truth_sync_failed',
        },
        { status: 500 }
      )
    }

    if (installation.sampleProducts.length > 0) {
      const products = installation.sampleProducts.map((product) => ({
        restaurant_id: inserted.id,
        nome: product.nome,
        descricao: product.descricao,
        preco: product.preco,
        categoria: product.categoria,
        imagem_url: product.imagem_url ?? null,
        ordem: product.ordem ?? 0,
        ativo: true,
      }))

      const { error: productsError } = await admin.from('products').insert(products)
      if (productsError) {
        await admin.from('restaurants').delete().eq('id', inserted.id)
        return NextResponse.json(
          { error: productsError.message || 'Erro ao criar produtos iniciais' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      restaurantId: inserted.id,
      remainingCredits: entitlements.remainingCredits - 1,
      networkExtraUnits: entitlements.networkExtraUnits,
    })
  } catch (error) {
    console.error('Erro ao criar delivery pelo painel:', error)
    return NextResponse.json({ error: 'Erro interno ao criar canal digital' }, { status: 500 })
  }
}


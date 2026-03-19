/**
 * POST /api/admin/venda-direta
 *
 * Cria restaurante + assinatura diretamente pelo admin.
 * 100% da receita fica com o admin — zero comissão de afiliado.
 *
 * Marca origin_sale = 'admin_direct' no metadata para que o webhook
 * de renovação de assinatura PULE a lógica de comissão.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildRestaurantInstallation,
  normalizePhone,
  slugifyRestaurantName,
} from '@/lib/restaurant-onboarding'
import { normalizeTemplateSlug } from '@/lib/restaurant-customization'

const vendaDiretaSchema = z.object({
  restaurantName: z.string().min(3).max(120),
  customerName: z.string().min(3).max(120),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  templateSlug: z.string().min(1),
  planSlug: z.enum(['basico', 'pro', 'premium']).default('basico'),
  valorPago: z.number().min(0).default(0),
  observacao: z.string().max(500).optional(),
})

async function createUniqueRestaurantSlug(
  admin: ReturnType<typeof createAdminClient>,
  restaurantName: string
) {
  const base = slugifyRestaurantName(restaurantName) || 'cardapio-digital'

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`
    const { data } = await admin
      .from('restaurants')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (!data) return candidate
  }

  return `${base}-${Date.now().toString(36)}`
}

export async function POST(req: NextRequest) {
  // ── Auth: exige admin ──
  const adminUser = await requireAdmin(req)
  if (!adminUser) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const rawBody = await req.json()
    const body = vendaDiretaSchema.parse(rawBody)
    const supabaseAdmin = createAdminClient()
    const templateSlug = normalizeTemplateSlug(body.templateSlug)
    const phone = normalizePhone(body.phone)
    const email = body.email.trim().toLowerCase()

    // ── 1. Criar ou encontrar o usuário (dono do restaurante) ──
    let ownerUserId: string | null = null

    // Procurar usuário existente por email
    let page = 1
    while (page <= 10) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      })
      if (error) break

      const found = data.users.find((u) => u.email?.toLowerCase() === email)
      if (found) {
        ownerUserId = found.id
        break
      }
      if (data.users.length < 200) break
      page += 1
    }

    // Se não existe, criar
    if (!ownerUserId) {
      const { data: newUser, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: {
            name: body.customerName.trim(),
            phone,
          },
        })

      if (createErr || !newUser.user) {
        return NextResponse.json(
          { error: `Erro ao criar usuário: ${createErr?.message}` },
          { status: 500 }
        )
      }
      ownerUserId = newUser.user.id
    }

    // ── 2. Garantir admin_users record ──
    await supabaseAdmin
      .from('admin_users')
      .upsert({ user_id: ownerUserId, role: 'admin' }, { onConflict: 'user_id' })

    // ── 3. Criar restaurante ──
    const installation = buildRestaurantInstallation(templateSlug, body.restaurantName)
    const slug = await createUniqueRestaurantSlug(supabaseAdmin, body.restaurantName)

    const baseCustomizacao = installation.restaurantUpdate.customizacao || {}

    const { data: newRestaurant, error: restaurantError } = await supabaseAdmin
      .from('restaurants')
      .insert({
        user_id: ownerUserId,
        nome: body.restaurantName.trim(),
        slug,
        telefone: phone || '11999999999',
        ativo: true,
        status_pagamento: 'ativo',
        plano: 'self-service',
        plan_slug: body.planSlug,
        valor_pago: body.valorPago,
        data_pagamento: new Date().toISOString(),
        origin_sale: 'admin_direct',
        ...installation.restaurantUpdate,
        customizacao: typeof baseCustomizacao === 'object' ? baseCustomizacao : {},
      })
      .select('id, slug')
      .single()

    if (restaurantError || !newRestaurant) {
      return NextResponse.json(
        { error: `Erro ao criar restaurante: ${restaurantError?.message}` },
        { status: 500 }
      )
    }

    // ── 4. Inserir produtos de amostra ──
    const sampleProducts = installation.sampleProducts.map((product) => ({
      restaurant_id: newRestaurant.id,
      nome: product.nome,
      descricao: product.descricao,
      preco: product.preco,
      categoria: product.categoria,
      imagem_url: product.imagem_url || null,
      ordem: product.ordem,
      ativo: true,
    }))

    await supabaseAdmin.from('products').insert(sampleProducts)

    // ── 5. Ativar assinatura ──
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('slug', body.planSlug)
      .maybeSingle()

    if (plan?.id) {
      const periodStart = new Date()
      const periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + 30)

      await supabaseAdmin.from('subscriptions').insert({
        user_id: ownerUserId,
        restaurant_id: newRestaurant.id,
        plan_id: plan.id,
        status: 'active',
        payment_gateway: 'admin_direct',
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
      })
    }

    // ── 6. Registrar template em user_purchases ──
    const { data: templateRow } = await supabaseAdmin
      .from('templates')
      .select('id')
      .eq('slug', templateSlug)
      .maybeSingle()

    if (templateRow?.id) {
      await supabaseAdmin.from('user_purchases').upsert(
        {
          user_id: ownerUserId,
          template_id: templateRow.id,
          status: 'active',
          purchased_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,template_id', ignoreDuplicates: false }
      )
    }

    // ── 7. Log da operação ──
    console.log(
      `[venda-direta] Admin ${adminUser.email} criou restaurante "${body.restaurantName}" (${slug}) para ${email} — R$ ${body.valorPago} — origin_sale=admin_direct`
    )

    return NextResponse.json({
      success: true,
      restaurant: {
        id: newRestaurant.id,
        slug: newRestaurant.slug,
        nome: body.restaurantName,
        url: `/r/${newRestaurant.slug}`,
      },
      owner: {
        id: ownerUserId,
        email,
      },
      message: `Restaurante "${body.restaurantName}" criado com sucesso! 100% da receita é sua.`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[venda-direta] Erro:', error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}

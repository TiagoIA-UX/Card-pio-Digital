// =====================================================
// TENANT SERVICE
// Gerenciamento de pizzarias (tenants)
// =====================================================

import { createClient } from '@/lib/supabase/client'
import type {
  Tenant,
  TenantInsert,
  TenantUpdate,
  ApiResponse,
  CardapioPublico,
  ProductSize,
  ProductCrust,
  ProductFlavor,
  AddOn,
  Promotion,
  Category,
  Product,
} from '@/types/database'

/**
 * Busca tenant por slug (para cardápio público)
 */
export async function getTenantBySlug(slug: string): Promise<ApiResponse<Tenant>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Busca tenant por ID
 */
export async function getTenantById(id: string): Promise<ApiResponse<Tenant>> {
  const supabase = createClient()

  const { data, error } = await supabase.from('tenants').select('*').eq('id', id).single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Cria novo tenant (pizzaria)
 */
export async function createTenant(tenant: TenantInsert): Promise<ApiResponse<Tenant>> {
  const supabase = createClient()

  const { data, error } = await supabase.from('tenants').insert(tenant).select().single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Atualiza tenant
 */
export async function updateTenant(
  id: string,
  updates: TenantUpdate
): Promise<ApiResponse<Tenant>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

/**
 * Verifica se slug está disponível
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const supabase = createClient()

  const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single()

  return !data
}

/**
 * Busca cardápio completo público de um tenant
 */
export async function getCardapioPublico(slug: string): Promise<ApiResponse<CardapioPublico>> {
  const supabase = createClient()

  // Buscar tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select(
      `
      id, slug, nome, nome_fantasia, logo_url, banner_url, 
      cores, horario_funcionamento, taxa_entrega, pedido_minimo,
      aceita_retirada, aceita_entrega, whatsapp, config_pizza
    `
    )
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (tenantError || !tenant) {
    return { data: null, error: tenantError?.message || 'Pizzaria não encontrada', success: false }
  }

  // Buscar dados em paralelo
  const [
    categoriesResult,
    sizesResult,
    crustsResult,
    flavorsResult,
    addOnsResult,
    promotionsResult,
  ] = await Promise.all([
    supabase
      .from('categories')
      .select('*, products(*)')
      .eq('tenant_id', tenant.id)
      .eq('ativo', true)
      .order('ordem'),

    supabase
      .from('product_sizes')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('ativo', true)
      .order('ordem'),

    supabase
      .from('product_crusts')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('disponivel', true)
      .order('ordem'),

    supabase
      .from('product_flavors')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('disponivel', true)
      .order('ordem'),

    supabase
      .from('add_ons')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('disponivel', true)
      .order('ordem'),

    supabase
      .from('promotions')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('ativo', true)
      .or('data_fim.is.null,data_fim.gt.now()'),
  ])

  // Filtrar produtos disponíveis nas categorias
  const categories = (categoriesResult.data || []).map(
    (cat: Category & { products?: Product[] }) => ({
      ...cat,
      products: (cat.products || []).filter((p: Product) => p.disponivel),
    })
  )

  return {
    data: {
      tenant: tenant as CardapioPublico['tenant'],
      categories: categories as CardapioPublico['categories'],
      sizes: (sizesResult.data || []) as ProductSize[],
      crusts: (crustsResult.data || []) as ProductCrust[],
      flavors: (flavorsResult.data || []) as ProductFlavor[],
      addOns: (addOnsResult.data || []) as AddOn[],
      promotions: (promotionsResult.data || []) as Promotion[],
    },
    error: null,
    success: true,
  }
}

/**
 * Verifica se pizzaria está aberta agora
 */
export function isOpenNow(horario: Tenant['horario_funcionamento']): boolean {
  const now = new Date()
  const dias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
  const diaAtual = dias[now.getDay()] as keyof typeof horario

  const horarioDia = horario[diaAtual]
  if (!horarioDia?.aberto) return false

  const horaAtual = now.getHours() * 60 + now.getMinutes()
  const [abreH, abreM] = horarioDia.abre.split(':').map(Number)
  const [fechaH, fechaM] = horarioDia.fecha.split(':').map(Number)

  const abre = abreH * 60 + abreM
  let fecha = fechaH * 60 + fechaM

  // Se fecha for menor que abre, assume que fecha no dia seguinte (ex: 23:00 - 02:00)
  if (fecha < abre) fecha += 24 * 60

  return horaAtual >= abre && horaAtual <= fecha
}

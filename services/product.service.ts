// =====================================================
// PRODUCT SERVICE
// Gerenciamento de produtos, sabores, tamanhos, bordas
// =====================================================

import { createClient } from '@/lib/supabase/client'
import type {
  Product,
  ProductInsert,
  ProductUpdate,
  Category,
  CategoryInsert,
  CategoryUpdate,
  ProductSize,
  ProductSizeInsert,
  ProductCrust,
  ProductCrustInsert,
  ProductFlavor,
  ProductFlavorInsert,
  ProductFlavorUpdate,
  AddOn,
  AddOnInsert,
  ApiResponse,
  PaginatedResponse,
} from '@/types/database'

// =====================================================
// CATEGORIAS
// =====================================================

export async function getCategories(tenantId: string): Promise<ApiResponse<Category[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('ordem')

  return {
    data: data || [],
    error: error?.message || null,
    success: !error,
  }
}

export async function createCategory(category: CategoryInsert): Promise<ApiResponse<Category>> {
  const supabase = createClient()

  const { data, error } = await supabase.from('categories').insert(category).select().single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

export async function updateCategory(
  id: string,
  updates: CategoryUpdate
): Promise<ApiResponse<Category>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('categories')
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

export async function deleteCategory(id: string): Promise<ApiResponse<null>> {
  const supabase = createClient()

  const { error } = await supabase.from('categories').delete().eq('id', id)

  return {
    data: null,
    error: error?.message || null,
    success: !error,
  }
}

export async function reorderCategories(
  tenantId: string,
  orderedIds: string[]
): Promise<ApiResponse<null>> {
  const supabase = createClient()

  const updates = orderedIds.map((id, index) =>
    supabase.from('categories').update({ ordem: index }).eq('id', id)
  )

  const results = await Promise.all(updates)
  const hasError = results.some((r) => r.error)

  return {
    data: null,
    error: hasError ? 'Erro ao reordenar categorias' : null,
    success: !hasError,
  }
}

// =====================================================
// PRODUTOS
// =====================================================

export async function getProducts(
  tenantId: string,
  options?: {
    categoryId?: string
    tipo?: string
    disponivel?: boolean
    page?: number
    perPage?: number
  }
): Promise<PaginatedResponse<Product>> {
  const supabase = createClient()
  const { categoryId, tipo, disponivel, page = 1, perPage = 20 } = options || {}

  let query = supabase
    .from('products')
    .select('*, category:categories(nome)', { count: 'exact' })
    .eq('tenant_id', tenantId)

  if (categoryId) query = query.eq('categoria_id', categoryId)
  if (tipo) query = query.eq('tipo', tipo)
  if (disponivel !== undefined) query = query.eq('disponivel', disponivel)

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, error, count } = await query.order('ordem').range(from, to)

  return {
    data: data || [],
    total: count || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage),
  }
}

export async function getProductById(id: string): Promise<ApiResponse<Product>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*, category:categories(nome)')
    .eq('id', id)
    .single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

export async function createProduct(product: ProductInsert): Promise<ApiResponse<Product>> {
  const supabase = createClient()

  const { data, error } = await supabase.from('products').insert(product).select().single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

export async function updateProduct(
  id: string,
  updates: ProductUpdate
): Promise<ApiResponse<Product>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
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

export async function deleteProduct(id: string): Promise<ApiResponse<null>> {
  const supabase = createClient()

  const { error } = await supabase.from('products').delete().eq('id', id)

  return {
    data: null,
    error: error?.message || null,
    success: !error,
  }
}

export async function toggleProductAvailability(
  id: string,
  disponivel: boolean
): Promise<ApiResponse<Product>> {
  return updateProduct(id, { disponivel })
}

export async function toggleProductDestaque(
  id: string,
  destaque: boolean
): Promise<ApiResponse<Product>> {
  return updateProduct(id, { destaque })
}

// =====================================================
// TAMANHOS DE PIZZA
// =====================================================

export async function getProductSizes(tenantId: string): Promise<ApiResponse<ProductSize[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_sizes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('ordem')

  return {
    data: data || [],
    error: error?.message || null,
    success: !error,
  }
}

export async function createProductSize(
  size: ProductSizeInsert
): Promise<ApiResponse<ProductSize>> {
  const supabase = createClient()

  const { data, error } = await supabase.from('product_sizes').insert(size).select().single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

export async function updateProductSize(
  id: string,
  updates: Partial<ProductSizeInsert>
): Promise<ApiResponse<ProductSize>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_sizes')
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

export async function deleteProductSize(id: string): Promise<ApiResponse<null>> {
  const supabase = createClient()

  const { error } = await supabase.from('product_sizes').delete().eq('id', id)

  return {
    data: null,
    error: error?.message || null,
    success: !error,
  }
}

// =====================================================
// BORDAS DE PIZZA
// =====================================================

export async function getProductCrusts(tenantId: string): Promise<ApiResponse<ProductCrust[]>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_crusts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('ordem')

  return {
    data: data || [],
    error: error?.message || null,
    success: !error,
  }
}

export async function createProductCrust(
  crust: ProductCrustInsert
): Promise<ApiResponse<ProductCrust>> {
  const supabase = createClient()

  const { data, error } = await supabase.from('product_crusts').insert(crust).select().single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

export async function updateProductCrust(
  id: string,
  updates: Partial<ProductCrustInsert>
): Promise<ApiResponse<ProductCrust>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_crusts')
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

export async function deleteProductCrust(id: string): Promise<ApiResponse<null>> {
  const supabase = createClient()

  const { error } = await supabase.from('product_crusts').delete().eq('id', id)

  return {
    data: null,
    error: error?.message || null,
    success: !error,
  }
}

// =====================================================
// SABORES DE PIZZA
// =====================================================

export async function getProductFlavors(
  tenantId: string,
  categoria?: string
): Promise<ApiResponse<ProductFlavor[]>> {
  const supabase = createClient()

  let query = supabase.from('product_flavors').select('*').eq('tenant_id', tenantId)

  if (categoria) query = query.eq('categoria', categoria)

  const { data, error } = await query.order('ordem')

  return {
    data: data || [],
    error: error?.message || null,
    success: !error,
  }
}

export async function createProductFlavor(
  flavor: ProductFlavorInsert
): Promise<ApiResponse<ProductFlavor>> {
  const supabase = createClient()

  const { data, error } = await supabase.from('product_flavors').insert(flavor).select().single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

export async function updateProductFlavor(
  id: string,
  updates: ProductFlavorUpdate
): Promise<ApiResponse<ProductFlavor>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('product_flavors')
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

export async function deleteProductFlavor(id: string): Promise<ApiResponse<null>> {
  const supabase = createClient()

  const { error } = await supabase.from('product_flavors').delete().eq('id', id)

  return {
    data: null,
    error: error?.message || null,
    success: !error,
  }
}

// =====================================================
// ADICIONAIS
// =====================================================

export async function getAddOns(
  tenantId: string,
  categoria?: string
): Promise<ApiResponse<AddOn[]>> {
  const supabase = createClient()

  let query = supabase.from('add_ons').select('*').eq('tenant_id', tenantId)

  if (categoria) query = query.eq('categoria', categoria)

  const { data, error } = await query.order('ordem')

  return {
    data: data || [],
    error: error?.message || null,
    success: !error,
  }
}

export async function createAddOn(addOn: AddOnInsert): Promise<ApiResponse<AddOn>> {
  const supabase = createClient()

  const { data, error } = await supabase.from('add_ons').insert(addOn).select().single()

  return {
    data,
    error: error?.message || null,
    success: !error,
  }
}

export async function updateAddOn(
  id: string,
  updates: Partial<AddOnInsert>
): Promise<ApiResponse<AddOn>> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('add_ons')
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

export async function deleteAddOn(id: string): Promise<ApiResponse<null>> {
  const supabase = createClient()

  const { error } = await supabase.from('add_ons').delete().eq('id', id)

  return {
    data: null,
    error: error?.message || null,
    success: !error,
  }
}

// =====================================================
// CONTAGEM PARA LIMITES DE PLANO
// =====================================================

export async function countProducts(tenantId: string): Promise<number> {
  const supabase = createClient()

  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  return count || 0
}

export async function countFlavors(tenantId: string): Promise<number> {
  const supabase = createClient()

  const { count } = await supabase
    .from('product_flavors')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  return count || 0
}

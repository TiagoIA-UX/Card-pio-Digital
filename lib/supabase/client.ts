import { createBrowserClient } from '@supabase/ssr'
import type { Tenant as DatabaseTenant } from '@/types/database'

// =====================================================
// SUPABASE BROWSER CLIENT
// Para uso em Client Components
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton para evitar múltiplas instâncias
let browserClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Cria ou retorna cliente Supabase para browser
 */
export function createClient() {
  if (browserClient) return browserClient
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return browserClient
}

/**
 * Destroi o singleton do browser client.
 * DEVE ser chamado antes de qualquer redirecionamento pós-logout
 * para evitar que sessões antigas fiquem em memória.
 */
export function resetBrowserClient() {
  browserClient = null
}

/**
 * Verifica se o Supabase está configurado corretamente
 */
export function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

/**
 * Obtém a sessão atual do usuário
 */
export async function getSession() {
  const supabase = createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()
  return { session, error }
}

/**
 * Obtém o usuário autenticado atual
 */
export async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  return { user, error }
}

/**
 * Faz logout do usuário.
 * Usa scope 'global' para revogar refresh tokens no servidor
 * e reseta o singleton para evitar sessão stale.
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut({ scope: 'global' })
  resetBrowserClient()
  return { error }
}

// =====================================================
// Re-export tipos do novo schema
// =====================================================
export type {
  Tenant,
  User,
  Plan,
  Subscription,
  Category,
  Product,
  ProductSize,
  ProductCrust,
  ProductFlavor,
  AddOn,
  Promotion,
  Order,
  OrderItem,
  MetricsDaily,
  CartItem,
  CardapioPublico,
  DashboardStats,
} from '@/types/database'

// Alias tipado para compatibilidade com o schema legado de restaurants
export interface Restaurant {
  id: string
  user_id: string
  organization_id?: string | null
  unit_type?: 'headquarters' | 'branch' | null
  parent_restaurant_id?: string | null
  unit_label?: string | null
  inheritance_settings?: Record<string, unknown> | null
  local_overrides?: Record<string, unknown> | null
  nome: string
  slug: string
  telefone: string
  logo_url: string | null
  banner_url: string | null
  slogan: string | null
  cor_primaria: string
  cor_secundaria: string
  template_slug?: string | null
  google_maps_url?: string | null
  endereco_texto?: string | null
  customizacao?: Record<string, unknown> | null
  ativo: boolean
  status_pagamento: 'pendente' | 'aguardando' | 'ativo' | 'expirado' | 'cancelado'
  plano: 'free' | 'self-service' | 'feito-pra-voce'
  plan_slug?: 'basico' | 'pro' | 'premium' | null
  valor_pago: number | null
  data_pagamento: string | null
  comprovante_url: string | null
  created_at: string
  updated_at: string
  suspended?: boolean | null
}

export type TenantRecord = DatabaseTenant

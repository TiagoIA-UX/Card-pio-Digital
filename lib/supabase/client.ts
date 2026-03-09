import { createBrowserClient } from '@supabase/ssr'

// =====================================================
// SUPABASE BROWSER CLIENT
// Para uso em Client Components
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

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
 * Verifica se o Supabase está configurado corretamente
 */
export function isSupabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
  )
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
 * Faz logout do usuário
 */
export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
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

// Alias para compatibilidade com código antigo
import type { Tenant } from '@/types/database'
export type Restaurant = Tenant

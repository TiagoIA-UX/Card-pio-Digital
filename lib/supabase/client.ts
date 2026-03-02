import { createBrowserClient } from '@supabase/ssr'

// Valores padrão para build (serão substituídos em runtime)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export function isSupabaseConfigured() {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
}

// Tipos do banco de dados
export interface Restaurant {
  id: string
  user_id: string
  nome: string
  slug: string
  telefone: string
  logo_url: string | null
  banner_url: string | null
  slogan: string | null
  cor_primaria: string
  cor_secundaria: string
  ativo: boolean
  status_pagamento: 'pendente' | 'aguardando' | 'ativo' | 'expirado' | 'cancelado'
  plano: 'free' | 'basico' | 'profissional' | 'self-service' | 'feito-pra-voce'
  plan_slug?: 'basico' | 'pro' | 'premium' | null
  valor_pago: number | null
  data_pagamento: string | null
  comprovante_url: string | null
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  name: string
  slug: 'basico' | 'pro' | 'premium'
  price_month: number
  features_json: any
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  restaurant_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due'
  current_period_start: string | null
  current_period_end: string | null
  payment_gateway: string | null
  created_at: string
}

export interface Product {
  id: string
  restaurant_id: string
  nome: string
  descricao: string | null
  preco: number
  imagem_url: string | null
  categoria: string
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  restaurant_id: string
  numero_pedido: number
  cliente_nome: string | null
  cliente_telefone: string | null
  tipo_entrega: 'entrega' | 'retirada'
  endereco_rua: string | null
  endereco_bairro: string | null
  endereco_complemento: string | null
  forma_pagamento: string | null
  observacoes: string | null
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  nome_snapshot: string
  preco_snapshot: number
  quantidade: number
  observacao: string | null
  created_at: string
}

export interface CartItem {
  product_id: string
  nome: string
  preco: number
  quantidade: number
  imagem_url: string | null
}

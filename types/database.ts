// =====================================================
// PIZZADIGITAL SAAS - TIPOS DO BANCO DE DADOS
// Gerado a partir do schema SQL
// =====================================================

// =====================================================
// TIPOS BASE
// =====================================================

export type UUID = string
export type Timestamp = string

// =====================================================
// ENUMS
// =====================================================

export type UserRole = 'owner' | 'admin' | 'manager' | 'staff'

export type ProductType = 'simples' | 'pizza' | 'combo' | 'bebida' | 'sobremesa'

export type FlavorCategory = 'salgada' | 'doce' | 'especial' | 'vegana'

export type AddOnCategory = 'ingrediente' | 'bebida' | 'acompanhamento' | 'molho'

export type PromotionType = 'percentual' | 'valor_fixo' | 'leve_pague' | 'combo' | 'frete_gratis'

export type DeliveryType = 'delivery' | 'retirada'

export type OrderStatus =
  | 'novo'
  | 'confirmado'
  | 'em_preparo'
  | 'saiu_entrega'
  | 'entregue'
  | 'finalizado'
  | 'cancelado'

export type PaymentMethod =
  | 'dinheiro'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'pix'
  | 'vale_refeicao'

export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'expired'

// =====================================================
// JSONB TYPES
// =====================================================

export interface Endereco {
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  referencia?: string
}

export interface Cores {
  primary: string
  secondary: string
  accent: string
}

export interface HorarioFuncionamento {
  segunda: { abre: string; fecha: string; aberto: boolean }
  terca: { abre: string; fecha: string; aberto: boolean }
  quarta: { abre: string; fecha: string; aberto: boolean }
  quinta: { abre: string; fecha: string; aberto: boolean }
  sexta: { abre: string; fecha: string; aberto: boolean }
  sabado: { abre: string; fecha: string; aberto: boolean }
  domingo: { abre: string; fecha: string; aberto: boolean }
}

export interface ConfigPizza {
  calculo_sabor: 'maior_preco' | 'media_preco'
  permitir_repetir_sabor: boolean
  borda_obrigatoria: boolean
}

export interface CondicoesPromocao {
  valor_minimo?: number
  dias_semana?: string[]
  horario_inicio?: string
  horario_fim?: string
  primeira_compra?: boolean
  limite_uso?: number
  uso_por_cliente?: number
}

export interface PersonalizacaoPizza {
  tamanho?: { id: UUID; nome: string; multiplicador?: number }
  sabores?: Array<{ id: UUID; nome: string; preco: number }>
  borda?: { id: UUID; nome: string; preco: number }
  adicionais?: Array<{ id: UUID; nome: string; preco: number }>
}

export interface PlanLimites {
  max_produtos: number
  max_sabores: number
  max_promocoes: number
  tem_relatorios: boolean
  tem_inteligencia: boolean
  tem_multi_usuarios: boolean
  marca_dagua: boolean
}

// =====================================================
// ENTIDADES DO BANCO
// =====================================================

export interface Plan {
  id: UUID
  nome: string
  slug: string
  descricao?: string
  preco_mensal: number
  preco_anual?: number
  features: string[]
  limites: PlanLimites
  destaque: boolean
  ativo: boolean
  ordem: number
  created_at: Timestamp
  updated_at: Timestamp
}

export interface Tenant {
  id: UUID
  slug: string
  nome: string
  nome_fantasia?: string
  cnpj?: string
  email: string
  telefone?: string
  whatsapp: string
  template_slug?: string
  google_maps_url?: string
  endereco_texto?: string
  customizacao?: Record<string, unknown>
  endereco: Endereco
  logo_url?: string
  banner_url?: string
  cores: Cores
  horario_funcionamento: HorarioFuncionamento
  taxa_entrega: number
  pedido_minimo: number
  raio_entrega_km: number
  tempo_entrega_min: number
  aceita_retirada: boolean
  aceita_entrega: boolean
  config_pizza: ConfigPizza
  ativo: boolean
  verificado: boolean
  plan_slug?: string // Populated from subscription join
  created_at: Timestamp
  updated_at: Timestamp
}

export interface Subscription {
  id: UUID
  tenant_id: UUID
  plan_id: UUID
  status: SubscriptionStatus
  trial_ends_at?: Timestamp
  current_period_start?: Timestamp
  current_period_end?: Timestamp
  cancel_at?: Timestamp
  canceled_at?: Timestamp
  payment_method?: string
  external_id?: string
  created_at: Timestamp
  updated_at: Timestamp
  // Relations
  plan?: Plan
}

export interface User {
  id: UUID
  tenant_id?: UUID
  email: string
  nome?: string
  telefone?: string
  avatar_url?: string
  role: UserRole
  permissoes: string[]
  ultimo_acesso?: Timestamp
  email_verificado: boolean
  created_at: Timestamp
  updated_at: Timestamp
  // Relations
  tenant?: Tenant
}

export interface Category {
  id: UUID
  tenant_id: UUID
  nome: string
  descricao?: string
  icone: string
  imagem_url?: string
  ordem: number
  ativo: boolean
  created_at: Timestamp
  updated_at: Timestamp
  // Relations
  products?: Product[]
}

export interface Product {
  id: UUID
  tenant_id: UUID
  categoria_id?: UUID
  nome: string
  descricao?: string
  imagem_url?: string
  preco_base: number
  preco_promocional?: number
  tipo: ProductType
  permite_personalizar: boolean
  destaque: boolean
  disponivel: boolean
  tags: string[]
  ordem: number
  visualizacoes: number
  total_vendido: number
  created_at: Timestamp
  updated_at: Timestamp
  // Legacy aliases for backwards compatibility
  preco?: number // Alias for preco_base
  categoria?: string // Alias for categoria_id/category name
  ativo?: boolean // Alias for disponivel
  // Relations
  category?: Category
}

export interface ProductSize {
  id: UUID
  tenant_id: UUID
  nome: string
  descricao?: string
  multiplicador_preco: number
  max_sabores: number
  ordem: number
  ativo: boolean
  created_at: Timestamp
}

export interface ProductCrust {
  id: UUID
  tenant_id: UUID
  nome: string
  descricao?: string
  preco_adicional: number
  ordem: number
  disponivel: boolean
  created_at: Timestamp
}

export interface ProductFlavor {
  id: UUID
  tenant_id: UUID
  categoria: FlavorCategory
  nome: string
  descricao?: string
  ingredientes: string[]
  preco: number
  imagem_url?: string
  disponivel: boolean
  destaque: boolean
  ordem: number
  total_vendido: number
  created_at: Timestamp
  updated_at: Timestamp
}

export interface AddOn {
  id: UUID
  tenant_id: UUID
  nome: string
  descricao?: string
  preco: number
  categoria: AddOnCategory
  disponivel: boolean
  ordem: number
  created_at: Timestamp
}

export interface Promotion {
  id: UUID
  tenant_id: UUID
  nome: string
  descricao?: string
  tipo: PromotionType
  valor?: number
  codigo?: string
  condicoes: CondicoesPromocao
  produtos_aplicaveis: UUID[]
  categorias_aplicaveis: UUID[]
  data_inicio?: Timestamp
  data_fim?: Timestamp
  uso_atual: number
  limite_uso?: number
  ativo: boolean
  created_at: Timestamp
  updated_at: Timestamp
}

export interface Order {
  id: UUID
  tenant_id: UUID
  numero: number
  numero_pedido?: number
  cliente_nome: string
  cliente_telefone: string
  cliente_email?: string
  cliente_endereco?: Endereco
  tipo_entrega: DeliveryType
  origem_pedido?: 'online' | 'mesa'
  mesa_numero?: string
  status: OrderStatus
  subtotal: number
  taxa_entrega: number
  desconto: number
  total: number
  forma_pagamento?: PaymentMethod
  troco_para?: number
  promocao_id?: UUID
  cupom_codigo?: string
  observacoes?: string
  tempo_estimado?: number
  horario_previsao?: Timestamp
  horario_confirmacao?: Timestamp
  horario_preparo?: Timestamp
  horario_saiu?: Timestamp
  horario_entrega?: Timestamp
  enviado_whatsapp: boolean
  whatsapp_enviado_at?: Timestamp
  created_at: Timestamp
  updated_at: Timestamp
  // Relations
  items?: OrderItem[]
  promotion?: Promotion
}

export interface OrderItem {
  id: UUID
  tenant_id: UUID
  order_id: UUID
  produto_id?: UUID
  sabor_id?: UUID
  nome_produto: string
  nome_snapshot?: string
  quantidade: number
  preco_unitario: number
  preco_snapshot?: number
  preco_total: number
  personalizacao: PersonalizacaoPizza
  observacoes?: string
  observacao?: string
  created_at: Timestamp
  // Relations
  product?: Product
  flavor?: ProductFlavor
}

export interface MetricsDaily {
  id: UUID
  tenant_id: UUID
  data: string
  total_pedidos: number
  total_faturamento: number
  ticket_medio: number
  pedidos_delivery: number
  pedidos_retirada: number
  pedidos_cancelados: number
  produto_mais_vendido?: UUID
  sabor_mais_vendido?: UUID
  horario_pico?: string
  novos_clientes: number
  created_at: Timestamp
  updated_at: Timestamp
}

export interface AuditLog {
  id: UUID
  tenant_id?: UUID
  user_id?: UUID
  acao: string
  entidade: string
  entidade_id?: UUID
  dados_anteriores?: Record<string, unknown>
  dados_novos?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  created_at: Timestamp
}

// =====================================================
// TIPOS PARA FORMULÁRIOS / INPUT
// =====================================================

export type TenantInsert = Omit<Tenant, 'id' | 'created_at' | 'updated_at' | 'verificado'>
export type TenantUpdate = Partial<TenantInsert>

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>
export type UserUpdate = Partial<Omit<UserInsert, 'tenant_id'>>

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>
export type CategoryUpdate = Partial<Omit<CategoryInsert, 'tenant_id'>>

export type ProductInsert = Omit<
  Product,
  'id' | 'created_at' | 'updated_at' | 'visualizacoes' | 'total_vendido'
>
export type ProductUpdate = Partial<Omit<ProductInsert, 'tenant_id'>>

export type ProductSizeInsert = Omit<ProductSize, 'id' | 'created_at'>
export type ProductSizeUpdate = Partial<Omit<ProductSizeInsert, 'tenant_id'>>

export type ProductCrustInsert = Omit<ProductCrust, 'id' | 'created_at'>
export type ProductCrustUpdate = Partial<Omit<ProductCrustInsert, 'tenant_id'>>

export type ProductFlavorInsert = Omit<
  ProductFlavor,
  'id' | 'created_at' | 'updated_at' | 'total_vendido'
>
export type ProductFlavorUpdate = Partial<Omit<ProductFlavorInsert, 'tenant_id'>>

export type AddOnInsert = Omit<AddOn, 'id' | 'created_at'>
export type AddOnUpdate = Partial<Omit<AddOnInsert, 'tenant_id'>>

export type PromotionInsert = Omit<Promotion, 'id' | 'created_at' | 'updated_at' | 'uso_atual'>
export type PromotionUpdate = Partial<Omit<PromotionInsert, 'tenant_id'>>

export type OrderInsert = Omit<Order, 'id' | 'numero' | 'created_at' | 'updated_at'>
export type OrderUpdate = Partial<
  Pick<
    Order,
    | 'status'
    | 'tempo_estimado'
    | 'observacoes'
    | 'horario_confirmacao'
    | 'horario_preparo'
    | 'horario_saiu'
    | 'horario_entrega'
  >
>

export type OrderItemInsert = Omit<OrderItem, 'id' | 'created_at'>

// =====================================================
// TIPOS PARA API RESPONSES
// =====================================================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

// =====================================================
// TIPOS PARA CARDÁPIO PÚBLICO
// =====================================================

export interface CardapioPublico {
  tenant: Pick<
    Tenant,
    | 'id'
    | 'slug'
    | 'nome'
    | 'nome_fantasia'
    | 'logo_url'
    | 'banner_url'
    | 'cores'
    | 'horario_funcionamento'
    | 'taxa_entrega'
    | 'pedido_minimo'
    | 'aceita_retirada'
    | 'aceita_entrega'
    | 'whatsapp'
    | 'config_pizza'
  >
  categories: Array<Category & { products: Product[] }>
  sizes: ProductSize[]
  crusts: ProductCrust[]
  flavors: ProductFlavor[]
  addOns: AddOn[]
  promotions: Promotion[]
}

// =====================================================
// TIPOS PARA CARRINHO
// =====================================================

export interface CartItem {
  id: string // UUID local
  produto?: Product
  sabor?: ProductFlavor
  quantidade: number
  preco_unitario: number
  personalizacao?: PersonalizacaoPizza
  observacoes?: string
}

export interface CartState {
  tenant_id?: UUID
  items: CartItem[]
  tipo_entrega: DeliveryType
  cupom?: string
  desconto: number
}

// =====================================================
// TIPOS PARA MONTE SUA PIZZA
// =====================================================

export interface PizzaBuilder {
  tamanho?: ProductSize
  sabores: ProductFlavor[]
  borda?: ProductCrust
  adicionais: AddOn[]
  observacoes?: string
}

export interface PizzaPreco {
  base: number
  sabores: number
  borda: number
  adicionais: number
  total: number
}

// =====================================================
// TIPOS PARA DASHBOARD
// =====================================================

export interface DashboardStats {
  pedidos_hoje: number
  faturamento_hoje: number
  ticket_medio: number
  produto_mais_vendido?: Product
  variacao_pedidos: number // % comparado a ontem
  variacao_faturamento: number // % comparado a ontem
}

export interface PedidosPorHora {
  hora: string
  quantidade: number
  valor: number
}

export interface RankingProdutos {
  produto: Product | ProductFlavor
  quantidade: number
  faturamento: number
}

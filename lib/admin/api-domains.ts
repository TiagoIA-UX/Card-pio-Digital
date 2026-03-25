/**
 * Registry declarativo de domínios das APIs admin.
 *
 * Cada rota admin é classificada em um domínio, com a role mínima esperada
 * e a política de rate-limiting definida. Serve como fonte de verdade para
 * auditoria, testes e validação de postura de segurança.
 */

// ── Domínios ────────────────────────────────────────────────────────────

export const API_DOMAINS = [
  'tenant-context',
  'template-lifecycle',
  'commercial',
  'team',
  'observability',
  'support',
] as const

export type ApiDomain = (typeof API_DOMAINS)[number]

// ── Roles ───────────────────────────────────────────────────────────────

export type AdminRole = 'support' | 'admin' | 'owner'

// ── Route definition ────────────────────────────────────────────────────

export interface AdminRouteDefinition {
  /** Caminho relativo a partir de app/api/admin/ */
  path: string
  domain: ApiDomain
  methods: readonly ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[]
  minRole: AdminRole
  rateLimited: boolean
  description: string
}

// ── Registry ────────────────────────────────────────────────────────────

export const ADMIN_ROUTE_REGISTRY: readonly AdminRouteDefinition[] = [
  // ── tenant-context ──
  {
    path: 'clientes',
    domain: 'tenant-context',
    methods: ['GET', 'POST'],
    minRole: 'admin',
    rateLimited: false,
    description: 'CRUD de deliverys: listar, suspender, reativar, trocar plano.',
  },

  // ── template-lifecycle ──
  {
    path: 'provisionar-pendentes',
    domain: 'template-lifecycle',
    methods: ['POST'],
    minRole: 'admin',
    rateLimited: false,
    description: 'Provisionar manualmente pedidos de onboarding pendentes.',
  },
  {
    path: 'trials',
    domain: 'template-lifecycle',
    methods: ['GET'],
    minRole: 'admin',
    rateLimited: false,
    description: 'Verificar trials ativos e gerar eventos temporais.',
  },

  // ── commercial ──
  {
    path: 'venda-direta',
    domain: 'commercial',
    methods: ['POST'],
    minRole: 'admin',
    rateLimited: false,
    description: 'Criar restaurante via venda presencial (admin_direct).',
  },
  {
    path: 'bonus-fund',
    domain: 'commercial',
    methods: ['GET', 'POST'],
    minRole: 'admin',
    rateLimited: false,
    description: 'Saldo do fundo de bônus, movimentações, creditar rendimento.',
  },
  {
    path: 'financeiro',
    domain: 'commercial',
    methods: ['GET', 'POST'],
    minRole: 'admin',
    rateLimited: false,
    description: 'Resumo financeiro, aprovar batch, marcar pago.',
  },
  {
    path: 'financeiro/export',
    domain: 'commercial',
    methods: ['GET'],
    minRole: 'admin',
    rateLimited: false,
    description: 'Exportar batches financeiros em CSV ou JSON.',
  },
  {
    path: 'penalidades',
    domain: 'commercial',
    methods: ['GET', 'POST'],
    minRole: 'support',
    rateLimited: false,
    description: 'Gestão de penalidades (strikes) de afiliados.',
  },
  {
    path: 'afiliados/comissoes',
    domain: 'commercial',
    methods: ['GET', 'POST'],
    minRole: 'admin',
    rateLimited: false,
    description: 'Gestão de comissões de afiliados.',
  },

  // ── team ──
  {
    path: 'team',
    domain: 'team',
    methods: ['GET', 'POST', 'DELETE'],
    minRole: 'owner',
    rateLimited: false,
    description: 'CRUD de admin_users: listar equipe, adicionar/remover.',
  },
  {
    path: 'usuarios',
    domain: 'team',
    methods: ['GET', 'POST'],
    minRole: 'admin',
    rateLimited: false,
    description: 'Listar todos os users, estender/revogar trial, impersonar.',
  },

  // ── observability ──
  {
    path: 'metrics',
    domain: 'observability',
    methods: ['GET'],
    minRole: 'admin',
    rateLimited: true,
    description: 'Dashboard de métricas do negócio.',
  },
  {
    path: 'logs',
    domain: 'observability',
    methods: ['GET'],
    minRole: 'admin',
    rateLimited: false,
    description: 'Consulta de system_logs.',
  },
  {
    path: 'alertas',
    domain: 'observability',
    methods: ['GET', 'POST'],
    minRole: 'admin',
    rateLimited: false,
    description: 'Listagem e gestão de system_alerts.',
  },

  // ── support ──
  {
    path: 'suporte',
    domain: 'support',
    methods: ['GET', 'POST'],
    minRole: 'support',
    rateLimited: false,
    description: 'CRUD de tickets de suporte.',
  },
] as const

// ── Lookups derivados ───────────────────────────────────────────────────

export const ROUTES_BY_DOMAIN: Record<ApiDomain, AdminRouteDefinition[]> = Object.fromEntries(
  API_DOMAINS.map((d) => [d, ADMIN_ROUTE_REGISTRY.filter((r) => r.domain === d)])
) as Record<ApiDomain, AdminRouteDefinition[]>

export function getRouteDefinition(path: string): AdminRouteDefinition | undefined {
  return ADMIN_ROUTE_REGISTRY.find((r) => r.path === path)
}

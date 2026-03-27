import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  CreditCard,
  FolderOpen,
  GitBranchPlus,
  LayoutTemplate,
  Link2,
  Package,
  QrCode,
  Settings,
  ShoppingBag,
  Store,
  Users,
  BarChart3,
} from 'lucide-react'
import { getRestaurantScopedHref } from '@/lib/active-restaurant'
import type { PanelCapabilities, PanelCapabilityKey } from '@/lib/panel/capabilities'

// ── Types ──────────────────────────────────────────────────────────────────

export interface PanelNavigationItem {
  id: string
  href: string
  icon: LucideIcon
  label: string
  matchPrefixes: string[]
  requires: PanelCapabilityKey[]
  groupId: NavigationGroupId
  badge?: 'new' | 'beta' | null
}

export type NavigationGroupId = 'overview' | 'cardapio' | 'canais' | 'rede' | 'conta'

export interface NavigationGroup {
  id: NavigationGroupId
  label: string
  items: PanelNavigationItem[]
}

// ── Registry ───────────────────────────────────────────────────────────────

const PANEL_NAVIGATION_REGISTRY: PanelNavigationItem[] = [
  // ── Overview
  {
    id: 'dashboard',
    href: '/painel',
    icon: Store,
    label: 'Dashboard',
    matchPrefixes: ['/painel'],
    requires: ['canAccessDashboard'],
    groupId: 'overview',
  },
  {
    id: 'pedidos',
    href: '/painel/pedidos',
    icon: ClipboardList,
    label: 'Pedidos',
    matchPrefixes: ['/painel/pedidos'],
    requires: ['canViewOrders'],
    groupId: 'overview',
  },

  // ── Cardápio
  {
    id: 'editor',
    href: '/painel/editor',
    icon: LayoutTemplate,
    label: 'Editor Visual',
    matchPrefixes: ['/painel/editor'],
    requires: ['canAccessVisualEditor'],
    groupId: 'cardapio',
  },
  {
    id: 'produtos',
    href: '/painel/produtos',
    icon: Package,
    label: 'Produtos',
    matchPrefixes: ['/painel/produtos'],
    requires: ['canManageCatalog'],
    groupId: 'cardapio',
  },
  {
    id: 'categorias',
    href: '/painel/categorias',
    icon: FolderOpen,
    label: 'Categorias',
    matchPrefixes: ['/painel/categorias'],
    requires: ['canManageCatalog'],
    groupId: 'cardapio',
  },

  // ── Canais
  {
    id: 'meu-link',
    href: '/painel/meu-link',
    icon: Link2,
    label: 'Meu Link',
    matchPrefixes: ['/painel/meu-link', '/painel/qrcode'],
    requires: ['canViewPublicLink'],
    groupId: 'canais',
  },
  {
    id: 'qrcode',
    href: '/painel/qrcode',
    icon: QrCode,
    label: 'QR Code',
    matchPrefixes: ['/painel/qrcode'],
    requires: ['canManageQrCode'],
    groupId: 'canais',
  },
  {
    id: 'templates',
    href: '/meus-templates',
    icon: ShoppingBag,
    label: 'Meus Canais Digitais',
    matchPrefixes: ['/meus-templates'],
    requires: ['canViewTemplates'],
    groupId: 'canais',
  },

  // ── Rede
  {
    id: 'rede-expansao',
    href: '/painel/planos',
    icon: GitBranchPlus,
    label: 'Expansão de Rede',
    matchPrefixes: ['/painel/planos'],
    requires: ['canViewPlans'],
    groupId: 'rede',
    badge: 'new',
  },
  {
    id: 'metricas',
    href: '/painel/metricas',
    icon: BarChart3,
    label: 'Métricas',
    matchPrefixes: ['/painel/metricas'],
    requires: ['canAccessDashboard'],
    groupId: 'rede',
    badge: 'beta',
  },

  // ── Conta
  {
    id: 'planos',
    href: '/painel/planos',
    icon: CreditCard,
    label: 'Plano',
    matchPrefixes: ['/painel/planos'],
    requires: ['canViewPlans'],
    groupId: 'conta',
  },
  {
    id: 'afiliados',
    href: '/painel/afiliados',
    icon: Users,
    label: 'Afiliados',
    matchPrefixes: ['/painel/afiliados'],
    requires: ['canManageAffiliates'],
    groupId: 'conta',
  },
  {
    id: 'configuracoes',
    href: '/painel/configuracoes',
    icon: Settings,
    label: 'Configurações',
    matchPrefixes: ['/painel/configuracoes'],
    requires: ['canManageSettings'],
    groupId: 'conta',
  },
]

const GROUP_LABELS: Record<NavigationGroupId, string> = {
  overview: 'Visão geral',
  cardapio: 'Cardápio',
  canais: 'Canais',
  rede: 'Rede',
  conta: 'Conta',
}

const GROUP_ORDER: NavigationGroupId[] = ['overview', 'cardapio', 'canais', 'rede', 'conta']

// ── Helpers ────────────────────────────────────────────────────────────────

function hasRequiredCapabilities(capabilities: PanelCapabilities, requires: PanelCapabilityKey[]) {
  return requires.every((capability) => capabilities[capability])
}

export function isNavigationItemActive(item: PanelNavigationItem, pathname: string): boolean {
  if (item.id === 'dashboard') {
    return pathname === '/painel' || pathname === '/painel/'
  }
  return item.matchPrefixes.some((prefix) => pathname.startsWith(prefix))
}

// ── Public API (backward compatible) ───────────────────────────────────────

export function getPanelNavigationItems(
  capabilities: PanelCapabilities,
  restaurantId?: string | null
): PanelNavigationItem[] {
  return PANEL_NAVIGATION_REGISTRY.filter((item) =>
    hasRequiredCapabilities(capabilities, item.requires)
  ).map((item) => ({
    ...item,
    href: getRestaurantScopedHref(item.href, restaurantId),
  }))
}

export function getGroupedNavigationItems(
  capabilities: PanelCapabilities,
  restaurantId?: string | null
): NavigationGroup[] {
  const filteredItems = getPanelNavigationItems(capabilities, restaurantId)

  return GROUP_ORDER.map((groupId) => ({
    id: groupId,
    label: GROUP_LABELS[groupId],
    items: filteredItems.filter((item) => item.groupId === groupId),
  })).filter((group) => group.items.length > 0)
}

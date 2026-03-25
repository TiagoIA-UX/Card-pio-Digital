import type { LucideIcon } from 'lucide-react'
import {
  ClipboardList,
  FolderOpen,
  LayoutTemplate,
  Link2,
  Package,
  CreditCard,
  QrCode,
  Settings,
  ShoppingBag,
  Store,
  Users,
} from 'lucide-react'
import { getRestaurantScopedHref } from '@/lib/active-restaurant'
import type { PanelCapabilities, PanelCapabilityKey } from '@/lib/panel/capabilities'

export interface PanelNavigationItem {
  id: string
  href: string
  icon: LucideIcon
  label: string
  matchPrefixes: string[]
  requires: PanelCapabilityKey[]
}

const PANEL_NAVIGATION_REGISTRY: PanelNavigationItem[] = [
  {
    id: 'dashboard',
    href: '/painel',
    icon: Store,
    label: 'Dashboard',
    matchPrefixes: ['/painel'],
    requires: ['canAccessDashboard'],
  },
  {
    id: 'editor',
    href: '/painel/editor',
    icon: LayoutTemplate,
    label: 'Editor Visual',
    matchPrefixes: ['/painel/editor'],
    requires: ['canAccessVisualEditor'],
  },
  {
    id: 'produtos',
    href: '/painel/produtos',
    icon: Package,
    label: 'Produtos',
    matchPrefixes: ['/painel/produtos'],
    requires: ['canManageCatalog'],
  },
  {
    id: 'categorias',
    href: '/painel/categorias',
    icon: FolderOpen,
    label: 'Categorias',
    matchPrefixes: ['/painel/categorias'],
    requires: ['canManageCatalog'],
  },
  {
    id: 'pedidos',
    href: '/painel/pedidos',
    icon: ClipboardList,
    label: 'Pedidos',
    matchPrefixes: ['/painel/pedidos'],
    requires: ['canViewOrders'],
  },
  {
    id: 'meu-link',
    href: '/painel/meu-link',
    icon: Link2,
    label: 'Meu Link',
    matchPrefixes: ['/painel/meu-link', '/painel/qrcode'],
    requires: ['canViewPublicLink'],
  },
  {
    id: 'templates',
    href: '/meus-templates',
    icon: ShoppingBag,
    label: 'Meus Canais Digitais',
    matchPrefixes: ['/meus-templates'],
    requires: ['canViewTemplates'],
  },
  {
    id: 'planos',
    href: '/painel/planos',
    icon: CreditCard,
    label: 'Plano',
    matchPrefixes: ['/painel/planos'],
    requires: ['canViewPlans'],
  },
  {
    id: 'afiliados',
    href: '/painel/afiliados',
    icon: Users,
    label: 'Afiliados',
    matchPrefixes: ['/painel/afiliados'],
    requires: ['canManageAffiliates'],
  },
  {
    id: 'qrcode',
    href: '/painel/qrcode',
    icon: QrCode,
    label: 'QR Code',
    matchPrefixes: ['/painel/qrcode'],
    requires: ['canManageQrCode'],
  },
  {
    id: 'configuracoes',
    href: '/painel/configuracoes',
    icon: Settings,
    label: 'Configurações',
    matchPrefixes: ['/painel/configuracoes'],
    requires: ['canManageSettings'],
  },
]

function hasRequiredCapabilities(capabilities: PanelCapabilities, requires: PanelCapabilityKey[]) {
  return requires.every((capability) => capabilities[capability])
}

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

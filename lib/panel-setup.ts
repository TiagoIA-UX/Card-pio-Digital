export interface DashboardSetupChecklistInput {
  hasRestaurant: boolean
  totalProducts: number
  recentOrdersCount: number
  activationEvents: string[]
}

export interface DashboardSetupStep {
  key: 'created_restaurant' | 'added_products' | 'test_order' | 'received_first_order'
  label: string
  description: string
  done: boolean
  href: '/painel/editor' | '/painel/produtos' | '/painel/qrcode' | '/painel/pedidos'
}

export function getDashboardSetupChecklist({
  hasRestaurant,
  totalProducts,
  recentOrdersCount,
  activationEvents,
}: DashboardSetupChecklistInput): DashboardSetupStep[] {
  const hasFiveProducts = totalProducts >= 5
  const hasAnyOrder = recentOrdersCount > 0
  const hasFirstOrderEvent = activationEvents.includes('received_first_order')

  return [
    {
      key: 'created_restaurant',
      label: 'Delivery criado',
      description: 'Confirme nome, banner, cores e informações principais do canal digital.',
      done: hasRestaurant,
      href: '/painel/editor',
    },
    {
      key: 'added_products',
      label: 'Adicionar 5 produtos',
      description: 'Cadastre categorias, preços e fotos para publicar um canal digital completo.',
      done: hasFiveProducts,
      href: '/painel/produtos',
    },
    {
      key: 'test_order',
      label: 'Fazer pedido de teste',
      description: 'Gere o QR ou abra o link público para validar o fluxo do cliente.',
      done: hasAnyOrder,
      href: '/painel/qrcode',
    },
    {
      key: 'received_first_order',
      label: 'Receber 1 pedido real',
      description: 'Acompanhe os primeiros pedidos e confirme que a operação está rodando bem.',
      done: hasFirstOrderEvent,
      href: '/painel/pedidos',
    },
  ]
}

export function getDashboardSetupProgress(steps: DashboardSetupStep[]) {
  if (steps.length === 0) return 0
  const done = steps.filter((step) => step.done).length
  return Math.round((done / steps.length) * 100)
}

export function getNextDashboardSetupStep(steps: DashboardSetupStep[]) {
  return steps.find((step) => !step.done) || null
}

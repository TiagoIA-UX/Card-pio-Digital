// =====================================================
// TIPOS — Analytics do Operador
// Corresponde à vw_analytics_operador e functions (migration 039)
// =====================================================

export interface AnalyticsResumo {
  restaurant_id: string
  pedidos_30d: number
  faturamento_30d: number
  pedidos_hoje: number
  faturamento_hoje: number
  ticket_medio_30d: number
  pedidos_pendentes: number
}

export interface ProdutoMaisVendido {
  produto_nome: string
  total_vendido: number
  receita_total: number
}

export interface PedidoPorHora {
  hora: number
  total: number
  faturamento: number
}

export interface AnalyticsDashboard {
  resumo: AnalyticsResumo | null
  produtosMaisVendidos: ProdutoMaisVendido[]
  pedidosPorHora: PedidoPorHora[]
}

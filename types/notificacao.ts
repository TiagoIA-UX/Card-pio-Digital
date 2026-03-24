// =====================================================
// TIPOS — Notificações
// Configuração e tipos de notificações do sistema
// =====================================================

export type TipoNotificacao =
  | 'novo_pedido'
  | 'pedido_cancelado'
  | 'nova_avaliacao'
  | 'avaliacao_negativa'
  | 'saldo_fidelidade'
  | 'cupom_esgotado'
  | 'cupom_expirado'

export interface NotificacaoConfig {
  tipo: TipoNotificacao
  ativo: boolean
  canal: 'email' | 'whatsapp' | 'push'
  descricao: string
}

export interface Notificacao {
  id: string
  restaurant_id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  lida: boolean
  created_at: string
}

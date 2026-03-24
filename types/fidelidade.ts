// =====================================================
// TIPOS — Sistema de Fidelidade
// Corresponde às tabelas fidelidade_* (migration 040)
// =====================================================

import type { UUID, Timestamp } from './database'

export interface FidelidadeConfig {
  id: UUID
  restaurant_id: UUID
  ativo: boolean
  pontos_por_real: number
  valor_por_ponto: number
  resgate_minimo: number
  validade_dias: number | null
  nome_programa: string
  descricao: string | null
  created_at: Timestamp
  updated_at: Timestamp
}

export interface CriarFidelidadeConfigInput {
  pontos_por_real?: number
  valor_por_ponto?: number
  resgate_minimo?: number
  validade_dias?: number | null
  nome_programa?: string
  descricao?: string | null
  ativo?: boolean
}

export type TipoTransacao = 'credito' | 'debito' | 'expiracao'

export interface FidelidadeCliente {
  id: UUID
  restaurant_id: UUID
  cliente_telefone: string
  cliente_nome: string | null
  pontos_acumulados: number
  pontos_resgatados: number
  pontos_expirados: number
  pontos_disponiveis: number
  ultima_compra_at: Timestamp | null
  created_at: Timestamp
  updated_at: Timestamp
}

export interface FidelidadeTransacao {
  id: UUID
  restaurant_id: UUID
  cliente_id: UUID
  order_id: UUID | null
  tipo: TipoTransacao
  pontos: number
  descricao: string
  created_at: Timestamp
}

export interface ResgatarPontosInput {
  cliente_telefone: string
  pontos: number
}

export interface SaldoFidelidadeResponse {
  cliente: FidelidadeCliente | null
  config: Pick<FidelidadeConfig, 'pontos_por_real' | 'valor_por_ponto' | 'resgate_minimo' | 'nome_programa'> | null
  pontos_disponiveis: number
}

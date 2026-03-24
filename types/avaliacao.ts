// =====================================================
// TIPOS — Avaliações de Restaurantes
// Corresponde à tabela avaliacoes (migration 041)
// =====================================================

import type { UUID, Timestamp } from './database'

export type NotaAvaliacao = 1 | 2 | 3 | 4 | 5

export interface Avaliacao {
  id: UUID
  restaurant_id: UUID
  order_id: UUID | null
  cliente_nome: string
  cliente_telefone: string | null
  nota: NotaAvaliacao
  comentario: string | null
  resposta: string | null
  respondido_at: Timestamp | null
  publicada: boolean
  created_at: Timestamp
  updated_at: Timestamp
}

export interface CriarAvaliacaoInput {
  restaurant_id: UUID
  order_id?: UUID | null
  cliente_nome: string
  cliente_telefone?: string | null
  nota: NotaAvaliacao
  comentario?: string | null
}

export interface RespostaAvaliacaoInput {
  resposta: string
}

import { z } from 'zod'

export const criarAvaliacaoSchema = z.object({
  restaurant_id: z.string().uuid(),
  order_id: z.string().uuid().nullable().optional(),
  cliente_nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100).trim(),
  cliente_telefone: z.string().max(15).nullable().optional(),
  nota: z.number().int().min(1).max(5) as z.ZodType<1 | 2 | 3 | 4 | 5>,
  comentario: z.string().max(1000).nullable().optional(),
})

export const respostaAvaliacaoSchema = z.object({
  resposta: z.string().min(1, 'Resposta não pode ser vazia').max(1000).trim(),
})

export type CriarAvaliacaoSchema = z.infer<typeof criarAvaliacaoSchema>
export type RespostaAvaliacaoSchema = z.infer<typeof respostaAvaliacaoSchema>

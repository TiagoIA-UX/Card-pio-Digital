import { z } from 'zod'

export const criarCupomSchema = z.object({
  code: z
    .string()
    .min(3, 'Código deve ter pelo menos 3 caracteres')
    .max(30, 'Código deve ter no máximo 30 caracteres')
    .toUpperCase()
    .trim(),
  description: z.string().max(200).optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().positive('Valor de desconto deve ser positivo'),
  min_purchase: z.number().min(0).default(0),
  max_uses: z.number().int().positive().nullable().optional(),
  expires_at: z.string().datetime({ offset: true }).nullable().optional(),
  is_active: z.boolean().default(true),
})

export const atualizarCupomSchema = z.object({
  description: z.string().max(200).optional(),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_value: z.number().positive().optional(),
  min_purchase: z.number().min(0).optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  expires_at: z.string().datetime({ offset: true }).nullable().optional(),
  is_active: z.boolean().optional(),
})

export const validarCupomSchema = z.object({
  code: z.string().min(1).trim().toUpperCase(),
  restaurant_id: z.string().uuid(),
  valor_pedido: z.number().min(0),
})

export type CriarCupomSchema = z.infer<typeof criarCupomSchema>
export type AtualizarCupomSchema = z.infer<typeof atualizarCupomSchema>
export type ValidarCupomSchema = z.infer<typeof validarCupomSchema>

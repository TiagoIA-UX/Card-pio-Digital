import { z } from 'zod'

export const criarFidelidadeConfigSchema = z.object({
  pontos_por_real: z.number().positive().default(1),
  valor_por_ponto: z.number().positive().default(0.01),
  resgate_minimo: z.number().int().positive().default(100),
  validade_dias: z.number().int().positive().nullable().optional(),
  nome_programa: z.string().min(1).max(100).default('Programa de Fidelidade'),
  descricao: z.string().max(500).nullable().optional(),
  ativo: z.boolean().default(true),
})

export const resgatarPontosSchema = z.object({
  cliente_telefone: z
    .string()
    .min(10, 'Telefone inválido')
    .max(15)
    .regex(/^\d+$/, 'Telefone deve conter apenas dígitos'),
  pontos: z.number().int().positive('Pontos devem ser positivos'),
})

export type CriarFidelidadeConfigSchema = z.infer<typeof criarFidelidadeConfigSchema>
export type ResgatarPontosSchema = z.infer<typeof resgatarPontosSchema>

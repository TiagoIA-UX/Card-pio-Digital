// ═══════════════════════════════════════════════════════════════
// SCHEMAS: CORE — Validação Zod nas fronteiras do domínio
// ═══════════════════════════════════════════════════════════════
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { isRestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'

// ─── Orders ──────────────────────────────────────────────────

const MAX_ITEMS_PER_ORDER = 50
const MAX_ITEM_QUANTITY = 50

export const OrderItemSchema = z.object({
  product_id: z.string().uuid('product_id deve ser UUID válido'),
  quantidade: z
    .number()
    .int('quantidade deve ser inteiro')
    .positive('quantidade deve ser positivo')
    .max(MAX_ITEM_QUANTITY, `quantidade máxima por item é ${MAX_ITEM_QUANTITY}`),
  observacao: z.string().max(500).optional(),
})

export const CreateOrderSchema = z.object({
  restaurant_id: z.string().uuid('restaurant_id é obrigatório'),
  items: z
    .array(OrderItemSchema)
    .min(1, 'items não pode estar vazio')
    .max(MAX_ITEMS_PER_ORDER, `Pedido excede o limite de ${MAX_ITEMS_PER_ORDER} itens`),
  cliente_nome: z.string().max(200).optional(),
  cliente_telefone: z.string().max(30).optional(),
  tipo_entrega: z.enum(['delivery', 'entrega', 'retirada'], {
    errorMap: () => ({ message: 'tipo_entrega deve ser delivery, entrega ou retirada' }),
  }),
  order_origin: z.enum(['online', 'mesa']).optional(),
  table_number: z.string().max(10).optional(),
  endereco_rua: z.string().max(300).optional(),
  endereco_bairro: z.string().max(200).optional(),
  endereco_complemento: z.string().max(300).optional(),
  forma_pagamento: z.string().max(100).optional(),
  troco_para: z.number().nonnegative().optional(),
  comprovante_url: z.string().url().optional(),
  comprovante_key: z.string().max(500).optional(),
  observacoes: z.string().max(1000).optional(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

// ─── Provisioning (Sandbox only) ─────────────────────────────

export const ProvisionarSchema = z.object({
  checkout: z.string().min(1, 'checkout obrigatório').max(200),
})

export type ProvisionarInput = z.infer<typeof ProvisionarSchema>

// ─── Onboarding Checkout ────────────────────────────────────

export const OnboardingCheckoutSchema = z.object({
  templateSlug: z
    .string()
    .min(1)
    .refine((value) => isRestaurantTemplateSlug(value), {
      message: 'template inválido',
    }),
  capacityPlanSlug: z.enum(['semente', 'basico', 'pro', 'premium']),
  onboardingPlan: z.enum(['self-service', 'feito-pra-voce']),
  paymentMethod: z.enum(['card']),
  customerData: z.object({
    restaurantName: z.string().min(3).max(120),
    customerName: z.string().min(3).max(120),
    phone: z.string().min(10).max(20),
    customerDocument: z.string().max(18).optional(),
  }),
  couponCode: z.string().optional(),
  acceptedTerms: z.literal(true),
  acceptedTermsVersion: z.string().min(1),
})

export type OnboardingCheckoutInput = z.infer<typeof OnboardingCheckoutSchema>

// ─── Webhook Subscription ────────────────────────────────────

const SubscriptionWebhookIdentifierSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value))

export const SubscriptionWebhookSchema = z.object({
  id: SubscriptionWebhookIdentifierSchema.optional(),
  type: z.string().min(1),
  action: z.string().optional(),
  live_mode: z.boolean().optional(),
  date_created: z.string().optional(),
  resource: z.string().optional(),
  resource_id: SubscriptionWebhookIdentifierSchema.optional(),
  data: z
    .object({
      id: SubscriptionWebhookIdentifierSchema.optional(),
    })
    .optional(),
})

export type SubscriptionWebhookInput = z.infer<typeof SubscriptionWebhookSchema>

// ─── Chat ────────────────────────────────────────────────────

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(1000),
})

const ChatCartItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  qty: z.number().int().positive(),
  obs: z.string().max(500).optional(),
})

export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, 'Envie pelo menos uma mensagem.').max(20),
  cart: z.array(ChatCartItemSchema).max(100).optional(),
  context: z
    .object({
      restaurantId: z.string().optional(),
      restaurantSlug: z.string().optional(),
      templateSlug: z
        .string()
        .refine((value) => isRestaurantTemplateSlug(value), {
          message: 'templateSlug inválido',
        })
        .optional(),
      pageType: z
        .enum(['marketing', 'panel', 'demo', 'delivery', 'template-preview', 'checkout'])
        .optional(),
      pathname: z.string().max(500).optional(),
    })
    .optional(),
})

export type ChatRequestInput = z.infer<typeof ChatRequestSchema>

// ─── Feedback ────────────────────────────────────────────────

export const FeedbackSchema = z.object({
  order_id: z.string().uuid('order_id deve ser UUID válido'),
  rating: z
    .number()
    .int()
    .min(1, 'rating deve ser entre 1 e 5')
    .max(5, 'rating deve ser entre 1 e 5'),
  comment: z.string().max(2000).optional().default(''),
})

export type FeedbackInput = z.infer<typeof FeedbackSchema>

// ─── Helpers ─────────────────────────────────────────────────

/** Gera resposta 400 estruturada a partir de um ZodError */
export function zodErrorResponse(error: z.ZodError) {
  const firstIssue = error.issues[0]
  return NextResponse.json(
    {
      error: firstIssue?.message ?? 'Dados inválidos',
      issues: error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    },
    { status: 400 }
  )
}

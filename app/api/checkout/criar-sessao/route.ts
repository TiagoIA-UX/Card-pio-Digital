import { NextResponse } from 'next/server'
import { Preference } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

import { withRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'
import { createMercadoPagoClient } from '@/lib/mercadopago'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function getMercadoPago() {
  return createMercadoPagoClient()
}

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        templateId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
  couponId: z.string().optional(),
  paymentMethod: z.enum(['pix', 'card']),
  email: z.string().email().optional(),
})

type TemplateRecord = {
  id: string
  name: string
  price: number
  status: string
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Checkout unitário legado desativado. Use o onboarding SaaS em /templates e /finalizar-compra.',
    },
    { status: 410 }
  )
}

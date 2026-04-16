import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getRateLimitIdentifier, RATE_LIMITS, withRateLimit } from '@/lib/shared/rate-limit'
import { createClient } from '@/lib/shared/supabase/server'
import { publishDeliveryVersion, PublishServiceError } from '@/lib/domains/publish/publish.service'

const PublishDeliverySchema = z.object({
  deliveryId: z.string().uuid('deliveryId inválido'),
  draftVersionId: z.string().uuid('draftVersionId inválido'),
})

export async function POST(req: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(req), RATE_LIMITS.auth)
    if (rateLimit.limited) return rateLimit.response

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401, headers: rateLimit.headers }
      )
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = PublishDeliverySchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten().fieldErrors },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const result = await publishDeliveryVersion({
      deliveryId: parsed.data.deliveryId,
      draftVersionId: parsed.data.draftVersionId,
      userId: user.id,
    })

    return NextResponse.json(result, { headers: rateLimit.headers })
  } catch (error) {
    if (error instanceof PublishServiceError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
        },
        { status: error.statusCode }
      )
    }

    console.error('[delivery/publish] erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

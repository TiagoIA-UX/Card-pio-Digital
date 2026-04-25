import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { saveEscalation } from '@/lib/domains/zaea/ai-learning'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/shared/rate-limit'

const escalationSchema = z.object({
  restaurantId: z.string().uuid(),
  sessionId: z.string().min(1).max(100),
  userMessage: z.string().min(1).max(2000),
  aiResponse: z.string().min(1).max(5000),
  reason: z.enum(['keyword', 'repeated_failure', 'user_request', 'message_threshold']),
  metadata: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  const identifier = getRateLimitIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, { limit: 10, windowMs: 60_000 })

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: Math.ceil(rateLimit.resetIn / 1000) },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(),
          ...rateLimit.headers,
        },
      }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = escalationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const escalation = await saveEscalation(parsed.data)

  if (!escalation) {
    return NextResponse.json({ error: 'Failed to save escalation' }, { status: 500 })
  }

  return NextResponse.json(
    { success: true, data: { id: escalation.id } },
    { status: 201, headers: rateLimit.headers }
  )
}


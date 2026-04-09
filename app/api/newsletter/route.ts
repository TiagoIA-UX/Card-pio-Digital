import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { notify } from '@/lib/shared/notifications'
import { getRateLimitIdentifier, RATE_LIMITS, withRateLimit } from '@/lib/shared/rate-limit'

const NewsletterSchema = z.object({
  email: z.string().trim().email().max(320),
})

export async function POST(req: NextRequest) {
  const rateLimit = await withRateLimit(getRateLimitIdentifier(req), RATE_LIMITS.public)
  if (rateLimit.limited) {
    return rateLimit.response
  }

  try {
    const body = await req.json()
    const parsed = NewsletterSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'E-mail inválido' },
        { status: 400, headers: rateLimit.headers }
      )
    }

    const email = parsed.data.email.toLowerCase()

    await notify({
      severity: 'info',
      channel: 'system',
      title: 'Novo lead da newsletter',
      body: `Novo e-mail inscrito na newsletter do site: ${email}`,
      metadata: {
        email,
        source: 'footer-newsletter',
        userAgent: req.headers.get('user-agent') || 'unknown',
        forwardedFor: req.headers.get('x-forwarded-for') || 'unknown',
      },
      emailAdmin: true,
    })

    return NextResponse.json({ success: true }, { headers: rateLimit.headers })
  } catch (error) {
    console.error('Erro ao processar newsletter:', error)

    await notify({
      severity: 'warning',
      channel: 'system',
      title: 'Falha ao processar inscrição da newsletter',
      body: 'A rota /api/newsletter recebeu uma submissão, mas falhou antes de concluir o processamento.',
      metadata: {
        source: 'footer-newsletter',
        error: error instanceof Error ? error.message : 'unknown_error',
      },
    })

    return NextResponse.json(
      { error: 'Erro ao inscrever. Tente novamente.' },
      { status: 500, headers: rateLimit.headers }
    )
  }
}

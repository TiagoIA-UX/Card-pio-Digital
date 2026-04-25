import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { notify } from '@/lib/shared/notifications'

const devAlertSchema = z.object({
  restaurantId: z.string().uuid().optional(),
  restaurantSlug: z.string().min(1).max(120).optional(),
  source: z.string().min(1).max(80),
  error: z.string().min(1).max(2000),
  context: z.record(z.unknown()).optional(),
})

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = devAlertSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload inválido.', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const payload = parsed.data

  await notify({
    severity: 'warning',
    channel: 'system',
    title: 'Falha da Zai no atendimento',
    body: [
      `Origem: ${payload.source}`,
      payload.restaurantSlug ? `Slug: ${payload.restaurantSlug}` : '',
      payload.restaurantId ? `Restaurant ID: ${payload.restaurantId}` : '',
      `Erro: ${payload.error}`,
    ]
      .filter(Boolean)
      .join('\n'),
    metadata: payload.context,
    emailAdmin: true,
  })

  return NextResponse.json({ success: true, message: 'Alerta técnico registrado.' })
}


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createMercadoPagoPreferenceClient } from '@/lib/domains/core/mercadopago'
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/shared/rate-limit'
import { getRequestSiteUrl } from '@/lib/shared/site-url'
import { COMPANY_NAME, COMPANY_PAYMENT_DESCRIPTOR } from '@/lib/shared/brand'

const ebookCheckoutSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
})

const EBOOK_PRICE = 197
const EBOOK_TITLE = 'E-book: Google Meu Negócio — Guia Completo'

export async function POST(request: NextRequest) {
  const identifier = getRateLimitIdentifier(request)
  const rateLimit = await checkRateLimit(identifier, { limit: 5, windowMs: 60_000 })

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

  const parsed = ebookCheckoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, email } = parsed.data
  const mercadopago = createMercadoPagoPreferenceClient(10_000)
  const baseUrl = getRequestSiteUrl(request)
  const externalReference = `ebook_gmb:${email.toLowerCase()}`

  try {
    const preference = await mercadopago.create({
      body: {
        items: [
          {
            id: 'ebook-gmb-avulso',
            title: `${COMPANY_NAME} — ${EBOOK_TITLE}`,
            description:
              'Compra avulsa do guia profissional de Google Meu Negócio da Zairyx / Litoral Conecta.',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: EBOOK_PRICE,
          },
        ],
        payer: {
          name,
          email,
        },
        back_urls: {
          success: `${baseUrl}/ebook-google-meu-negocio/pagamento/sucesso`,
          failure: `${baseUrl}/ebook-google-meu-negocio/pagamento/erro`,
          pending: `${baseUrl}/ebook-google-meu-negocio/pagamento/pendente`,
        },
        auto_return: 'approved',
        external_reference: externalReference,
        statement_descriptor: COMPANY_PAYMENT_DESCRIPTOR,
        metadata: {
          product_type: 'ebook_google_meu_negocio',
          buyer_email: email.toLowerCase(),
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          preferenceId: preference.id,
          initPoint: preference.init_point,
          sandboxInitPoint: preference.sandbox_init_point,
          title: EBOOK_TITLE,
          price: EBOOK_PRICE,
        },
      },
      { status: 200, headers: rateLimit.headers }
    )
  } catch (error) {
    console.error('[ebook-gmb-checkout] Mercado Pago error:', error)
    return NextResponse.json({ error: 'Payment provider error' }, { status: 502 })
  }
}

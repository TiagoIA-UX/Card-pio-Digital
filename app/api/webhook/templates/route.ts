import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Webhook legado de templates avulsos desativado. O sistema opera apenas com onboarding SaaS recorrente.',
    },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'deprecated',
      message:
        'Endpoint legado de templates avulsos desativado. Use /api/webhooks/mercadopago para onboarding SaaS.',
    },
    { status: 410 }
  )
}

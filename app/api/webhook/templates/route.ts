import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Webhook legado de templates avulsos desativado. O fluxo público atual usa compra por template com onboarding em /comprar/[template].',
    },
    { status: 410 }
  )
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'deprecated',
      message:
        'Endpoint legado de templates avulsos desativado. Use /api/webhook/mercadopago com o fluxo oficial iniciado em /comprar/[template].',
    },
    { status: 410 }
  )
}

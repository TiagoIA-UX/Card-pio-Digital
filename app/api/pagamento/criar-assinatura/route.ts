import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Assinaturas recorrentes estão indisponíveis no modelo comercial público atual. Use o checkout por template em /comprar/[template].',
    },
    { status: 410 }
  )
}

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Fluxo de pacotes desativado. Use o onboarding SaaS recorrente em /templates e /finalizar-compra.',
    },
    { status: 410 }
  )
}

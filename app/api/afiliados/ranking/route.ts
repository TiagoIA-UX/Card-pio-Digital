import { NextResponse } from 'next/server'

function disabledResponse() {
  return NextResponse.json(
    { error: 'Programa de afiliados desativado neste ciclo do produto.' },
    { status: 410 }
  )
}

export async function GET() {
  return disabledResponse()
}

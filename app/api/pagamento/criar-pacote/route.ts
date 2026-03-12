import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Fluxo de pacotes desativado. Use o fluxo oficial em /comprar/[template].',
    },
    { status: 410 }
  )
}

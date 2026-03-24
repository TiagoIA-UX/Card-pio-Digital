import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Checkout antigo desativado. Use o fluxo oficial em /comprar/[template].',
    },
    { status: 410 }
  )
}

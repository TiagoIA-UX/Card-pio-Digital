import { NextResponse } from 'next/server'
import { Preference } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'
import { createMercadoPagoClient } from '@/lib/mercadopago'
import { createClient as createServerClient } from '@/lib/supabase/server'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function getMercadoPago() {
  return createMercadoPagoClient()
}

const PRECOS = {
  'self-service': {
    pix: 247,
    card: 297,
    parcelas: 3,
    nome: 'Cardápio Digital - Faça Você Mesmo',
  },
  'feito-pra-voce': {
    pix: 497,
    card: 597,
    parcelas: 3,
    nome: 'Cardápio Digital - Feito Pra Você',
  },
}

const ORDER_BUMP_PRECOS = {
  pix: 97,
  card: 117,
  nome: 'Configuração Expressa',
}

const TEMPLATE_NOMES: Record<string, string> = {
  restaurante: 'Restaurante',
  pizzaria: 'Pizzaria',
  lanchonete: 'Hamburgueria/Lanchonete',
  bar: 'Bar/Pub',
  cafeteria: 'Cafeteria',
  acai: 'Açaíteria',
  sushi: 'Japonês/Sushi',
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        'Checkout antigo desativado. Use o fluxo público em /comprar/[template] e /finalizar-compra.',
    },
    { status: 410 }
  )
}

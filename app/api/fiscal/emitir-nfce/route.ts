// =====================================================
// API Route: /api/fiscal/emitir-nfce
// Bridge Next.js → Python backend (NFC-e direto Sefaz)
// Custo: R$0 — sem intermediário fiscal
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/shared/supabase/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { buildNfcePayload } from '@/lib/domains/core/nfce-payload'

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    // 1) Auth: verificar que usuário está logado
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { order_id } = await request.json()

    if (!order_id || typeof order_id !== 'string') {
      return NextResponse.json({ error: 'order_id é obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()

    // 2) Buscar pedido com itens
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select(
        'id, restaurant_id, numero_pedido, total, forma_pagamento, cliente_nome, cliente_telefone'
      )
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // 3) Verificar que o usuário é dono do restaurante
    const { data: restaurant } = await admin
      .from('restaurants')
      .select('id, user_id')
      .eq('id', order.restaurant_id)
      .single()

    if (!restaurant || restaurant.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // 4) Buscar config fiscal do delivery
    const { data: fiscal, error: fiscalError } = await admin
      .from('fiscal_config')
      .select('*')
      .eq('restaurant_id', order.restaurant_id)
      .eq('ativo', true)
      .single()

    if (fiscalError || !fiscal) {
      return NextResponse.json(
        { error: 'Configuração fiscal não encontrada. Configure em Painel > Fiscal.' },
        { status: 400 }
      )
    }

    // 5) Buscar itens do pedido
    const { data: items } = await admin
      .from('order_items')
      .select('nome_snapshot, preco_snapshot, quantidade')
      .eq('order_id', order_id)

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Pedido sem itens' }, { status: 400 })
    }

    // 6) Reservar número NFC-e (atômico via RPC)
    const { data: numeroNfce, error: rpcError } = await admin.rpc('get_next_nfce_number', {
      p_restaurant_id: order.restaurant_id,
    })

    if (rpcError || !numeroNfce) {
      return NextResponse.json({ error: 'Erro ao reservar número da NFC-e' }, { status: 500 })
    }

    // 7) Buscar certificado do Storage
    const { data: certData, error: certError } = await admin.storage
      .from('fiscal-certificates')
      .download(fiscal.certificado_storage_path)

    if (certError || !certData) {
      return NextResponse.json(
        { error: 'Certificado A1 não encontrado. Faça upload em Painel > Fiscal.' },
        { status: 400 }
      )
    }

    const certArrayBuffer = await certData.arrayBuffer()
    const certBase64 = Buffer.from(certArrayBuffer).toString('base64')

    // 8) Montar payload para o Python
    const payload = buildNfcePayload(order, items, fiscal, certBase64, numeroNfce)

    // 9) Chamar Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/fiscal/emitir-nfce`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(INTERNAL_API_SECRET ? { Authorization: `Bearer ${INTERNAL_API_SECRET}` } : {}),
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    // 10) Registrar nota emitida no banco
    await admin.from('fiscal_notas_emitidas').insert({
      restaurant_id: order.restaurant_id,
      order_id: order.id,
      numero_nfce: numeroNfce,
      serie: fiscal.serie_nfce || 1,
      chave_acesso: result.chave_acesso || null,
      protocolo: result.protocolo || null,
      codigo_status: result.codigo_status || null,
      motivo: result.motivo || null,
      valor_total: order.total,
      ambiente: fiscal.ambiente || 'homologacao',
      status: result.success ? 'autorizada' : 'rejeitada',
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro na emissão da NFC-e', details: result },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      protocolo: result.protocolo,
      chave_acesso: result.chave_acesso,
      numero_nfce: numeroNfce,
      motivo: result.motivo,
    })
  } catch (error) {
    console.error('[fiscal] Erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

/**
 * Admin API — Gerenciamento de comissões de afiliados
 *
 * GET  /api/admin/afiliados/comissoes
 *   → lista afiliados com saldo aprovado pendente de pagamento
 *
 * POST /api/admin/afiliados/comissoes
 *   → marca comissões de um afiliado como pagas e registra pagamento
 *   Body: { affiliate_id, valor, referencia_mes?, observacao? }
 *
 * Observabilidade:
 *   - Todos os eventos financeiros são logados como JSON estruturado
 *   - Idempotência: bloqueia (409) pagamento duplicado (mesmo affiliate_id + referencia_mes)
 *   - Alerta automático quando FIFO não cobre o valor informado (saldo_restante > 0)
 *   - Compatível com Vercel Logs, Datadog, stdout de qualquer provider
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-auth'
import { z } from 'zod'

const paymentBodySchema = z.object({
  affiliate_id: z.string().uuid(),
  valor: z.number().positive(),
  referencia_mes: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  observacao: z.string().max(500).optional(),
  bonus_id: z.string().uuid().optional(),
  bonus_marco: z.string().max(100).optional(),
})

// ── Log estruturado (JSON → stdout) ───────────────────────────────────────
// Cada linha é um objeto JSON independente — fácil de filtrar com:
//   vercel logs | grep commission_payment
type LogLevel = 'info' | 'warn' | 'error'
type CommissionEvent =
  | 'commission_payment_started'
  | 'commission_duplicate_blocked'
  | 'commission_payment_processed'
  | 'commission_fifo_incomplete'
  | 'commission_bonus_fund_low'
  | 'commission_payment_failed'

function logEvent(level: LogLevel, event: CommissionEvent, data: Record<string, unknown>) {
  const entry = JSON.stringify({
    level,
    event,
    ...data,
    timestamp: new Date().toISOString(),
    service: 'admin/afiliados/comissoes',
  })
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else console.log(entry)
}

// ── GET — lista saldos ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data, error } = await admin
    .from('affiliate_balances')
    .select('*')
    .gt('saldo_aprovado', 0)
    .order('saldo_aprovado', { ascending: false })

  if (error) {
    logEvent('error', 'commission_payment_failed', { step: 'list_balances', error: error.message })
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }

  return NextResponse.json({ balances: data ?? [] })
}

// ── POST — registrar pagamento ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await requireAdmin(req)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const raw = await req.json().catch(() => ({}))
  const parsed = paymentBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { affiliate_id, valor, referencia_mes, observacao, bonus_id, bonus_marco } = parsed.data

  const admin = createAdminClient()
  const refMes = referencia_mes ?? new Date().toISOString().slice(0, 7)

  logEvent('info', 'commission_payment_started', {
    affiliate_id,
    valor: Number(valor),
    referencia_mes: refMes,
    pago_por: user.id,
    is_bonus: !!bonus_id,
  })

  // ── Guard de idempotência — bloqueia pagamento duplicado ─────────────────
  // Um mesmo afiliado não pode receber dois pagamentos no mesmo mês de referência.
  const { data: pagamentoExistente } = await admin
    .from('affiliate_commission_payments')
    .select('id, valor, created_at')
    .eq('affiliate_id', affiliate_id)
    .eq('referencia_mes', refMes)
    .maybeSingle()

  if (pagamentoExistente) {
    logEvent('warn', 'commission_duplicate_blocked', {
      affiliate_id,
      referencia_mes: refMes,
      existing_payment_id: pagamentoExistente.id,
      existing_valor: pagamentoExistente.valor,
      existing_created_at: pagamentoExistente.created_at,
      pago_por: user.id,
    })
    return NextResponse.json(
      {
        error: 'Pagamento duplicado',
        detail: `Já existe um pagamento para este afiliado em ${refMes}.`,
        existing_payment_id: pagamentoExistente.id,
      },
      { status: 409 }
    )
  }

  // 1. Busca afiliado para obter chave PIX
  const { data: affiliateData, error: affErr } = await admin
    .from('affiliates')
    .select('id, nome, chave_pix, status')
    .eq('id', affiliate_id)
    .single()

  if (affErr || !affiliateData) {
    return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 })
  }

  // ── Bônus de marco: verificar e sacar do bonus_fund ───────────────────────
  // Se bonus_id está presente, este pagamento é um bônus de marco.
  // Tenta sacar do fundo; se insuficiente, paga do caixa operacional (log de aviso).
  let fundoSuficiente = false
  if (bonus_id) {
    try {
      const { data: fundo } = await admin.from('bonus_fund_saldo').select('saldo_atual').single()
      const saldoFundo = Number(fundo?.saldo_atual ?? 0)
      const bonusValor = Number(valor)
      fundoSuficiente = saldoFundo >= bonusValor

      if (!fundoSuficiente) {
        logEvent('warn', 'commission_bonus_fund_low', {
          affiliate_id,
          bonus_id,
          bonus_marco,
          saldo_fundo: saldoFundo,
          bonus_valor: bonusValor,
          action: 'paid_from_operating_cash',
        })
      } else {
        await admin.from('bonus_fund').insert({
          tipo: 'bonus',
          valor: bonusValor,
          affiliate_id,
          descricao: `Bônus marco ${bonus_marco ?? '?'} restaurantes — ${affiliateData.nome}`,
        })
      }
    } catch (fundErr) {
      logEvent('error', 'commission_payment_failed', {
        step: 'bonus_fund_debit',
        bonus_id,
        error: String(fundErr),
      })
    }
  }

  // 2. Registra o pagamento
  const { data: payment, error: payErr } = await admin
    .from('affiliate_commission_payments')
    .insert({
      affiliate_id,
      valor: Number(valor),
      referencia_mes: refMes,
      metodo: 'pix',
      chave_pix_usada: affiliateData.chave_pix ?? null,
      observacao: observacao ?? null,
      pago_por: user.id,
    })
    .select()
    .single()

  if (payErr || !payment) {
    logEvent('error', 'commission_payment_failed', {
      step: 'insert_payment',
      affiliate_id,
      valor: Number(valor),
      referencia_mes: refMes,
      pago_por: user.id,
      error: payErr?.message,
    })
    return NextResponse.json({ error: 'Erro ao registrar pagamento' }, { status: 500 })
  }

  // 3. FIFO: busca comissões aprovadas ordenadas por data de criação (mais antigas primeiro)
  const [vendorRefs, liderRefs] = await Promise.all([
    admin
      .from('affiliate_referrals')
      .select('id, comissao')
      .eq('affiliate_id', affiliate_id)
      .eq('status', 'aprovado')
      .not('comissao', 'is', null)
      .order('created_at', { ascending: true }),
    admin
      .from('affiliate_referrals')
      .select('id, lider_comissao')
      .eq('lider_id', affiliate_id)
      .eq('lider_status', 'aprovado')
      .not('lider_comissao', 'is', null)
      .order('created_at', { ascending: true }),
  ])

  // Acumula FIFO: marca apenas as comissões que cabem no valor pago
  let saldoRestante = Number(valor)
  const idsVendedorPagar: string[] = []
  for (const ref of vendorRefs.data ?? []) {
    const comissao = Number(ref.comissao ?? 0)
    if (comissao > 0 && comissao <= saldoRestante) {
      idsVendedorPagar.push(ref.id)
      saldoRestante -= comissao
    }
  }

  const idsLiderPagar: string[] = []
  for (const ref of liderRefs.data ?? []) {
    const comissao = Number(ref.lider_comissao ?? 0)
    if (comissao > 0 && comissao <= saldoRestante) {
      idsLiderPagar.push(ref.id)
      saldoRestante -= comissao
    }
  }

  // Atualiza apenas IDs selecionados (não marca todas)
  if (idsVendedorPagar.length > 0) {
    await admin.from('affiliate_referrals').update({ status: 'pago' }).in('id', idsVendedorPagar)
  }
  if (idsLiderPagar.length > 0) {
    await admin.from('affiliate_referrals').update({ lider_status: 'pago' }).in('id', idsLiderPagar)
  }

  const valorPagoReal = Number(valor) - saldoRestante
  const pagas = idsVendedorPagar.length + idsLiderPagar.length

  // ── Log do resultado do FIFO ──────────────────────────────────────────────
  if (saldoRestante > 0.009) {
    // FIFO não cobriu o valor informado — valor enviado > saldo aprovado real
    logEvent('warn', 'commission_fifo_incomplete', {
      affiliate_id,
      payment_id: payment.id,
      valor_informado: Number(valor),
      valor_pago_real: valorPagoReal,
      saldo_restante: parseFloat(saldoRestante.toFixed(2)),
      comissoes_pagas: pagas,
      referencia_mes: refMes,
      pago_por: user.id,
    })
  } else {
    logEvent('info', 'commission_payment_processed', {
      affiliate_id,
      affiliate_nome: affiliateData.nome,
      payment_id: payment.id,
      valor_pago: valorPagoReal,
      comissoes_pagas: pagas,
      ids_vendedor: idsVendedorPagar,
      ids_lider: idsLiderPagar,
      referencia_mes: refMes,
      pago_por: user.id,
      is_bonus: !!bonus_id,
    })
  }

  // Se era pagamento de bônus de marco, marca o registro como pago
  if (bonus_id) {
    try {
      await admin
        .from('affiliate_bonuses')
        .update({
          status: 'pago',
          referencia_mes: referencia_mes ?? new Date().toISOString().slice(0, 7),
        })
        .eq('id', bonus_id)
    } catch (bonusErr) {
      logEvent('warn', 'commission_payment_failed', {
        step: 'mark_bonus_paid',
        bonus_id,
        error: String(bonusErr),
      })
    }
  }

  return NextResponse.json({
    success: true,
    payment_id: payment.id,
    affiliate: affiliateData.nome,
    valor_pago: valorPagoReal,
    chave_pix: affiliateData.chave_pix,
    pagas,
    saldo_restante: parseFloat(saldoRestante.toFixed(2)),
    ...(bonus_id ? { fundo_suficiente: fundoSuficiente } : {}),
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── GET: Resumo financeiro + batches recentes ────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, 'admin')
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const [summaryRes, batchesRes, recentLedger, cdiRes] = await Promise.all([
    admin.from('financial_summary').select('*').single(),
    admin.from('payout_batches').select('*').order('created_at', { ascending: false }).limit(10),
    admin.from('financial_ledger').select('*').order('created_at', { ascending: false }).limit(30),
    admin.from('cdi_config').select('taxa_anual').order('id', { ascending: false }).limit(1),
  ])

  // Reservas pendentes (reservado - já pago)
  const summary = summaryRes.data ?? {
    total_entradas: 0,
    total_reservado: 0,
    total_pago: 0,
    total_rendimento_cdi: 0,
    total_estornos: 0,
    saldo_total: 0,
    saldo_disponivel: 0,
  }

  return NextResponse.json({
    summary,
    batches: batchesRes.data ?? [],
    ledger: recentLedger.data ?? [],
    cdi_taxa: cdiRes.data?.[0]?.taxa_anual ?? 13.15,
  })
}

// ─── POST: Ações (aprovar batch, marcar pago, registrar CDI) ──────────────
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, 'owner')
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { action } = body
  const admin = createAdminClient()

  // ── Aprovar batch ──
  if (action === 'approve_batch') {
    const { batch_id } = body
    if (!batch_id) return NextResponse.json({ error: 'batch_id required' }, { status: 400 })

    const { error } = await admin
      .from('payout_batches')
      .update({ status: 'aprovado', approved_at: new Date().toISOString() })
      .eq('id', batch_id)
      .eq('status', 'pendente')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'Batch aprovado' })
  }

  // ── Marcar batch como pago ──
  if (action === 'mark_paid') {
    const { batch_id } = body
    if (!batch_id) return NextResponse.json({ error: 'batch_id required' }, { status: 400 })

    const paidAt = new Date().toISOString()

    const { data: batch, error: batchError } = await admin
      .from('payout_batches')
      .select('id, referencia, period_start, period_end')
      .eq('id', batch_id)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch não encontrado' }, { status: 404 })
    }

    // Marcar batch
    await admin
      .from('payout_batches')
      .update({ status: 'pago', paid_at: paidAt })
      .eq('id', batch_id)
      .eq('status', 'aprovado')

    // Marcar todos os items como pagos
    await admin
      .from('payout_items')
      .update({ status: 'pago', paid_at: paidAt })
      .eq('batch_id', batch_id)
      .eq('status', 'pendente')

    // Buscar items para registrar no ledger
    const { data: items } = await admin.from('payout_items').select('*').eq('batch_id', batch_id)

    const periodStartIso = `${batch.period_start}T00:00:00.000Z`
    const periodEndIso = `${batch.period_end}T23:59:59.999Z`

    if (items) {
      const vendedorIds = items
        .filter((item) => item.tipo === 'vendedor')
        .map((item) => item.affiliate_id)
      const liderIds = items
        .filter((item) => item.tipo === 'lider')
        .map((item) => item.affiliate_id)

      if (vendedorIds.length > 0) {
        await admin
          .from('affiliate_referrals')
          .update({ status: 'pago' })
          .in('affiliate_id', vendedorIds)
          .eq('status', 'aprovado')
          .gte('approved_at', periodStartIso)
          .lte('approved_at', periodEndIso)
      }

      if (liderIds.length > 0) {
        await admin
          .from('affiliate_referrals')
          .update({ lider_status: 'pago' })
          .in('lider_id', liderIds)
          .eq('lider_status', 'aprovado')
          .gte('lider_approved_at', periodStartIso)
          .lte('lider_approved_at', periodEndIso)
      }
    }

    // Registrar pagamentos individuais no ledger
    if (items) {
      const ledgerEntries = items.map((item) => ({
        tipo:
          item.tipo === 'lider'
            ? 'pagamento_lider'
            : item.tipo === 'bonus'
              ? 'bonus_afiliado'
              : 'pagamento_afiliado',
        valor: item.valor,
        referencia: batch?.referencia ?? '',
        affiliate_id: item.affiliate_id,
        payout_id: batch_id,
        descricao: `Pagamento ${item.tipo} - ${batch?.referencia}`,
      }))
      await admin.from('financial_ledger').insert(ledgerEntries)
    }

    return NextResponse.json({ ok: true, message: 'Batch marcado como pago' })
  }

  // ── Atualizar taxa CDI ──
  if (action === 'update_cdi') {
    const { taxa_anual } = body
    if (!taxa_anual || taxa_anual <= 0)
      return NextResponse.json({ error: 'taxa_anual required' }, { status: 400 })

    await admin
      .from('cdi_config')
      .update({ taxa_anual, updated_at: new Date().toISOString() })
      .gt('id', 0)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

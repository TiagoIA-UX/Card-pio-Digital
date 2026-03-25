import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildPayoutBatchValidationSummary,
  validatePayoutItemSnapshot,
  type PayoutValidationIssue,
} from '@/lib/payout-batches'

type BatchStatus = 'pendente' | 'aprovado' | 'pago' | 'cancelado'
type ValidationStatus = 'pendente' | 'pronto' | 'bloqueado'

type PayoutItemRow = {
  id: string
  affiliate_id: string
  affiliate_nome_snapshot: string | null
  tipo: 'vendedor' | 'lider' | 'bonus'
  valor: number
  chave_pix: string | null
  status: 'pendente' | 'pago' | 'ignorado'
  validation_status: ValidationStatus
  validation_errors: PayoutValidationIssue[] | null
}

type PayoutBatchRow = {
  id: string
  referencia: string
  period_start: string
  period_end: string
  status: BatchStatus
  validation_status: ValidationStatus
  validation_summary: Record<string, unknown> | null
}

async function validateBatch(admin: ReturnType<typeof createAdminClient>, batchId: string) {
  const { data: batch, error: batchError } = await admin
    .from('payout_batches')
    .select(
      'id, referencia, period_start, period_end, status, validation_status, validation_summary'
    )
    .eq('id', batchId)
    .single<PayoutBatchRow>()

  if (batchError || !batch) {
    throw new Error('Batch não encontrado')
  }

  const { data: items, error: itemsError } = await admin
    .from('payout_items')
    .select(
      'id, affiliate_id, affiliate_nome_snapshot, tipo, valor, chave_pix, status, validation_status, validation_errors'
    )
    .eq('batch_id', batchId)
    .order('created_at', { ascending: true })
    .returns<PayoutItemRow[]>()

  if (itemsError) {
    throw new Error(itemsError.message)
  }

  if (!items || items.length === 0) {
    const summary = buildPayoutBatchValidationSummary([], [])
    await admin
      .from('payout_batches')
      .update({ validation_status: summary.status, validation_summary: summary })
      .eq('id', batchId)

    return { batch, items: [], summary }
  }

  const affiliateIds = [...new Set(items.map((item) => item.affiliate_id))]
  const { data: affiliates } = await admin
    .from('affiliates')
    .select('id, nome, chave_pix')
    .in('id', affiliateIds)

  const affiliateMap = new Map(
    (affiliates ?? []).map((affiliate) => [
      affiliate.id,
      { nome: affiliate.nome ?? null, chave_pix: affiliate.chave_pix ?? null },
    ])
  )

  const updatedItems = []

  for (const item of items) {
    const affiliate = affiliateMap.get(item.affiliate_id)
    const affiliateName = affiliate?.nome ?? item.affiliate_nome_snapshot ?? null
    const pixKey = affiliate?.chave_pix ?? item.chave_pix ?? null
    const validation = validatePayoutItemSnapshot({
      affiliateId: item.affiliate_id,
      affiliateName,
      amount: Number(item.valor ?? 0),
      pixKey,
    })

    await admin
      .from('payout_items')
      .update({
        affiliate_nome_snapshot: affiliateName,
        chave_pix: validation.normalizedPixKey ?? pixKey,
        validation_status: validation.status,
        validation_errors: validation.issues,
      })
      .eq('id', item.id)

    updatedItems.push({
      ...item,
      affiliate_nome_snapshot: affiliateName,
      chave_pix: validation.normalizedPixKey ?? pixKey,
      validation_status: validation.status,
      validation_errors: validation.issues,
    })
  }

  const summary = buildPayoutBatchValidationSummary(
    updatedItems.map((item) => ({
      affiliateId: item.affiliate_id,
      affiliateName: item.affiliate_nome_snapshot,
      amount: Number(item.valor ?? 0),
      pixKey: item.chave_pix,
    })),
    updatedItems.map((item) => ({
      status: item.validation_status,
      normalizedPixKey: item.chave_pix,
      issues: item.validation_errors ?? [],
    }))
  )

  await admin
    .from('payout_batches')
    .update({ validation_status: summary.status, validation_summary: summary })
    .eq('id', batchId)

  return {
    batch: {
      ...batch,
      validation_status: summary.status,
      validation_summary: summary,
    },
    items: updatedItems,
    summary,
  }
}

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

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, 'owner')
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { action } = body
  const admin = createAdminClient()

  if (action === 'validate_batch') {
    const { batch_id } = body
    if (!batch_id) return NextResponse.json({ error: 'batch_id required' }, { status: 400 })

    try {
      const result = await validateBatch(admin, batch_id)
      return NextResponse.json({ ok: true, batch: result.batch, summary: result.summary })
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao validar batch' },
        { status: 500 }
      )
    }
  }

  if (action === 'approve_batch') {
    const { batch_id } = body
    if (!batch_id) return NextResponse.json({ error: 'batch_id required' }, { status: 400 })

    const result = await validateBatch(admin, batch_id)
    if (result.summary.status !== 'pronto') {
      return NextResponse.json(
        { error: 'Batch bloqueado. Corrija as inconsistências antes de aprovar.' },
        { status: 409 }
      )
    }

    const { error } = await admin
      .from('payout_batches')
      .update({ status: 'aprovado', approved_at: new Date().toISOString() })
      .eq('id', batch_id)
      .eq('status', 'pendente')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: 'Batch aprovado' })
  }

  if (action === 'mark_paid') {
    const { batch_id } = body
    if (!batch_id) return NextResponse.json({ error: 'batch_id required' }, { status: 400 })

    const { data: batch, error: batchError } = await admin
      .from('payout_batches')
      .select('id, referencia, status, validation_status')
      .eq('id', batch_id)
      .single<{
        id: string
        referencia: string
        status: BatchStatus
        validation_status: ValidationStatus
      }>()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch não encontrado' }, { status: 404 })
    }

    if (batch.status !== 'aprovado') {
      return NextResponse.json(
        { error: 'Batch precisa estar aprovado antes do pagamento' },
        { status: 409 }
      )
    }

    if (batch.validation_status !== 'pronto') {
      return NextResponse.json({ error: 'Batch não está validado para pagamento' }, { status: 409 })
    }

    const { data: items, error: itemsError } = await admin
      .from('payout_items')
      .select(
        'id, affiliate_id, affiliate_nome_snapshot, tipo, valor, chave_pix, status, validation_status, validation_errors'
      )
      .eq('batch_id', batch_id)
      .returns<PayoutItemRow[]>()

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    const blockedItem = (items ?? []).find(
      (item) => item.validation_status !== 'pronto' || item.status === 'ignorado'
    )
    if (blockedItem) {
      return NextResponse.json(
        { error: 'Há itens bloqueados ou ignorados neste batch. Revalide antes de pagar.' },
        { status: 409 }
      )
    }

    const paidAt = new Date().toISOString()

    await admin
      .from('payout_batches')
      .update({ status: 'pago', paid_at: paidAt })
      .eq('id', batch_id)
      .eq('status', 'aprovado')

    await admin
      .from('payout_items')
      .update({ status: 'pago', paid_at: paidAt })
      .eq('batch_id', batch_id)
      .eq('status', 'pendente')

    const itemIds = (items ?? []).map((item) => item.id)
    const { data: sources } = itemIds.length
      ? await admin
          .from('payout_item_sources')
          .select('payout_item_id, source_type, source_id')
          .in('payout_item_id', itemIds)
      : { data: [] as Array<{ payout_item_id: string; source_type: string; source_id: string }> }

    const directIds = (sources ?? [])
      .filter((source) => source.source_type === 'referral_direct')
      .map((source) => source.source_id)
    const leaderIds = (sources ?? [])
      .filter((source) => source.source_type === 'referral_leader')
      .map((source) => source.source_id)
    const bonusIds = (sources ?? [])
      .filter((source) => source.source_type === 'bonus')
      .map((source) => source.source_id)

    if (directIds.length > 0) {
      await admin
        .from('affiliate_referrals')
        .update({ status: 'pago' })
        .in('id', directIds)
        .eq('status', 'aprovado')
    }

    if (leaderIds.length > 0) {
      await admin
        .from('affiliate_referrals')
        .update({ lider_status: 'pago' })
        .in('id', leaderIds)
        .eq('lider_status', 'aprovado')
    }

    if (bonusIds.length > 0) {
      await admin.from('affiliate_bonuses').update({ status: 'pago' }).in('id', bonusIds)
    }

    if (items && items.length > 0) {
      const ledgerEntries = items.map((item) => ({
        tipo:
          item.tipo === 'lider'
            ? 'pagamento_lider'
            : item.tipo === 'bonus'
              ? 'bonus_afiliado'
              : 'pagamento_afiliado',
        valor: item.valor,
        referencia: batch.referencia,
        affiliate_id: item.affiliate_id,
        payout_id: batch_id,
        descricao: `Pagamento ${item.tipo} - ${batch.referencia}`,
      }))
      await admin.from('financial_ledger').insert(ledgerEntries)
    }

    return NextResponse.json({ ok: true, message: 'Batch marcado como pago' })
  }

  if (action === 'update_cdi') {
    const { taxa_anual } = body
    if (!taxa_anual || taxa_anual <= 0) {
      return NextResponse.json({ error: 'taxa_anual required' }, { status: 400 })
    }

    await admin
      .from('cdi_config')
      .update({ taxa_anual, updated_at: new Date().toISOString() })
      .gt('id', 0)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { buildPayoutCsv, formatValidationErrors, type PayoutExportRow } from '@/lib/domains/affiliate/payout-batches'

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, 'admin')
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const batchId = searchParams.get('batch_id')
  const format = searchParams.get('format') ?? 'csv'

  if (!batchId) {
    return NextResponse.json({ error: 'batch_id required' }, { status: 400 })
  }

  if (!['csv', 'json'].includes(format)) {
    return NextResponse.json({ error: 'format inválido' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: batch, error: batchError } = await admin
    .from('payout_batches')
    .select('id, referencia, validation_status')
    .eq('id', batchId)
    .single<{ id: string; referencia: string; validation_status: string }>()

  if (batchError || !batch) {
    return NextResponse.json({ error: 'Batch não encontrado' }, { status: 404 })
  }

  const { data: items, error: itemsError } = await admin
    .from('payout_items')
    .select(
      'affiliate_id, affiliate_nome_snapshot, tipo, valor, chave_pix, validation_status, validation_errors'
    )
    .eq('batch_id', batchId)
    .order('tipo', { ascending: true })

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  const rows: PayoutExportRow[] = (items ?? []).map((item) => ({
    affiliate_id: item.affiliate_id,
    affiliate_name: item.affiliate_nome_snapshot ?? 'Afiliado sem nome',
    tipo: item.tipo,
    valor: Number(item.valor ?? 0),
    chave_pix: item.chave_pix ?? '',
    referencia: batch.referencia,
    validation_status: item.validation_status,
    validation_errors: formatValidationErrors(item.validation_errors ?? []),
  }))

  if (format === 'json') {
    return NextResponse.json({
      batch,
      exported_at: new Date().toISOString(),
      rows,
    })
  }

  const csv = buildPayoutCsv(rows)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="payout-${batch.referencia}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}


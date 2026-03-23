import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyCronFailure, notify } from '@/lib/notifications'
import { getAffiliateApprovalThreshold, getAffiliatePayoutWindow } from '@/lib/affiliate-payout'

/**
 * Cron diário — roda às 8 UTC (5h BRT).
 * Todos os dias: aprova comissões elegíveis e calcula rendimento CDI diário.
 * Nos dias 1 e 15: gera batch quinzenal apenas com comissões já aprovadas.
 */
export async function GET(req: NextRequest) {
  // Auth via Bearer CRON_SECRET
  const authHeader = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET ?? ''
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const day = now.getUTCDate()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const nowIso = now.toISOString()

  const results: string[] = []

  // ═══════════════════════════════════════════════════════════════════════
  // 0) APROVAÇÃO AUTOMÁTICA — 30 dias completos desde o cadastro da indicação
  // ═══════════════════════════════════════════════════════════════════════
  try {
    const thresholdIso = getAffiliateApprovalThreshold(now).toISOString()

    const [vendorApproval, leaderApproval] = await Promise.all([
      admin
        .from('affiliate_referrals')
        .update({ status: 'aprovado', approved_at: nowIso })
        .eq('status', 'pendente')
        .is('approved_at', null)
        .lte('created_at', thresholdIso)
        .select('id'),
      admin
        .from('affiliate_referrals')
        .update({ lider_status: 'aprovado', lider_approved_at: nowIso })
        .not('lider_id', 'is', null)
        .eq('lider_status', 'pendente')
        .is('lider_approved_at', null)
        .lte('created_at', thresholdIso)
        .select('id'),
    ])

    const approvedVendorCount = vendorApproval.data?.length ?? 0
    const approvedLeaderCount = leaderApproval.data?.length ?? 0

    if (approvedVendorCount > 0 || approvedLeaderCount > 0) {
      results.push(
        `Aprovação automática: ${approvedVendorCount} diretas e ${approvedLeaderCount} de líder liberadas`
      )
    }
  } catch (e) {
    results.push(`Approval error: ${e instanceof Error ? e.message : 'unknown'}`)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 1) CDI DIÁRIO — calcula rendimento sobre saldo total parado
  // ═══════════════════════════════════════════════════════════════════════
  try {
    // Buscar taxa CDI atual
    const { data: cdiRow } = await admin
      .from('cdi_config')
      .select('taxa_anual')
      .order('id', { ascending: false })
      .limit(1)
      .single()

    const taxaAnual = cdiRow?.taxa_anual ?? 13.15

    // Buscar saldo total (entradas - saídas)
    const { data: summary } = await admin.from('financial_summary').select('saldo_total').single()

    const saldoTotal = Number(summary?.saldo_total ?? 0)

    if (saldoTotal > 0) {
      // CDI diário = saldo * ((1 + taxa/100)^(1/365) - 1)
      const taxaDiaria = Math.pow(1 + taxaAnual / 100, 1 / 365) - 1
      const rendimento = Math.round(saldoTotal * taxaDiaria * 100) / 100

      if (rendimento >= 0.01) {
        await admin.from('financial_ledger').insert({
          tipo: 'rendimento_cdi',
          valor: rendimento,
          referencia: `CDI-${year}-${month}-${String(day).padStart(2, '0')}`,
          descricao: `Rendimento CDI diário (${taxaAnual}% a.a.) sobre R$ ${saldoTotal.toFixed(2)}`,
        })
        results.push(`CDI: +R$ ${rendimento.toFixed(2)} sobre saldo R$ ${saldoTotal.toFixed(2)}`)
      }
    }
  } catch (e) {
    results.push(`CDI error: ${e instanceof Error ? e.message : 'unknown'}`)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 2) BATCH DE PAGAMENTO — apenas nos dias 1 e 15
  // ═══════════════════════════════════════════════════════════════════════
  const payoutWindow = getAffiliatePayoutWindow(now)

  if (payoutWindow) {
    try {
      const referencia = payoutWindow.referencia
      const periodStart = payoutWindow.periodStart.toISOString().split('T')[0]
      const periodEnd = payoutWindow.periodEnd.toISOString().split('T')[0]

      // Verificar se batch já existe
      const { data: existing } = await admin
        .from('payout_batches')
        .select('id')
        .eq('referencia', referencia)
        .maybeSingle()

      if (existing) {
        results.push(`Batch ${referencia} já existe`)
      } else {
        const [vendorRefsResult, leaderRefsResult] = await Promise.all([
          admin
            .from('affiliate_referrals')
            .select('affiliate_id, comissao')
            .eq('status', 'aprovado')
            .not('affiliate_id', 'is', null)
            .gte('approved_at', payoutWindow.periodStart.toISOString())
            .lte('approved_at', payoutWindow.periodEnd.toISOString()),
          admin
            .from('affiliate_referrals')
            .select('lider_id, lider_comissao')
            .eq('lider_status', 'aprovado')
            .not('lider_id', 'is', null)
            .gte('lider_approved_at', payoutWindow.periodStart.toISOString())
            .lte('lider_approved_at', payoutWindow.periodEnd.toISOString()),
        ])

        const vendorRefs = vendorRefsResult.data ?? []
        const leaderRefs = leaderRefsResult.data ?? []

        if (vendorRefs.length > 0 || leaderRefs.length > 0) {
          // Agrupar por afiliado
          const vendedorTotals: Record<string, number> = {}
          const liderTotals: Record<string, number> = {}

          for (const r of vendorRefs) {
            if (r.affiliate_id && r.comissao) {
              vendedorTotals[r.affiliate_id] =
                (vendedorTotals[r.affiliate_id] || 0) + Number(r.comissao)
            }
          }

          for (const r of leaderRefs) {
            if (r.lider_id && r.lider_comissao) {
              liderTotals[r.lider_id] = (liderTotals[r.lider_id] || 0) + Number(r.lider_comissao)
            }
          }

          // Buscar chaves PIX dos afiliados envolvidos
          const allAffIds = [
            ...new Set([...Object.keys(vendedorTotals), ...Object.keys(liderTotals)]),
          ]
          const { data: affData } = await admin
            .from('affiliates')
            .select('id, nome, chave_pix')
            .in('id', allAffIds)

          const pixMap: Record<string, string | null> = {}
          for (const a of affData ?? []) {
            pixMap[a.id] = a.chave_pix
          }

          // Calcular total
          const totalVendedor = Object.values(vendedorTotals).reduce((s, v) => s + v, 0)
          const totalLider = Object.values(liderTotals).reduce((s, v) => s + v, 0)
          const totalAmount = totalVendedor + totalLider

          // Criar batch
          const { data: batch } = await admin
            .from('payout_batches')
            .insert({
              referencia,
              period_start: periodStart,
              period_end: periodEnd,
              total_amount: totalAmount,
              items_count: Object.keys(vendedorTotals).length + Object.keys(liderTotals).length,
            })
            .select('id')
            .single()

          if (batch) {
            // Inserir itens de vendedores
            const items = [
              ...Object.entries(vendedorTotals).map(([affId, valor]) => ({
                batch_id: batch.id,
                affiliate_id: affId,
                tipo: 'vendedor' as const,
                valor,
                chave_pix: pixMap[affId] ?? null,
              })),
              ...Object.entries(liderTotals).map(([affId, valor]) => ({
                batch_id: batch.id,
                affiliate_id: affId,
                tipo: 'lider' as const,
                valor,
                chave_pix: pixMap[affId] ?? null,
              })),
            ]

            await admin.from('payout_items').insert(items)

            // Registrar reservas no ledger
            for (const item of items) {
              await admin.from('financial_ledger').insert({
                tipo: item.tipo === 'lider' ? 'reserva_lider' : 'reserva_afiliado',
                valor: item.valor,
                referencia,
                affiliate_id: item.affiliate_id,
                payout_id: batch.id,
                descricao: `Reserva ${item.tipo} - ${referencia}`,
              })
            }

            results.push(
              `Batch ${referencia}: ${items.length} itens, total R$ ${totalAmount.toFixed(2)}`
            )
          }
        } else {
          // Criar batch vazio
          await admin.from('payout_batches').insert({
            referencia,
            period_start: periodStart,
            period_end: periodEnd,
            total_amount: 0,
            items_count: 0,
          })
          results.push(`Batch ${referencia}: sem comissões no período`)
        }
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'unknown'
      results.push(`Batch error: ${errMsg}`)
      await notifyCronFailure({
        cronName: 'payout',
        error: errMsg,
        details: { day, phase: 'batch_generation' },
      }).catch(() => {})
    }
  }

  // Notificar admin quando batch é gerado com valores
  if ((day === 1 || day === 15) && results.some((r) => r.includes('itens'))) {
    await notify({
      severity: 'info',
      channel: 'affiliate',
      title: 'Batch de Pagamento Gerado',
      body: results.join('\n'),
      emailAdmin: true,
    }).catch(() => {})
  }

  return NextResponse.json({
    ok: true,
    day,
    is_payout_day: day === 1 || day === 15,
    results,
    timestamp: now.toISOString(),
  })
}

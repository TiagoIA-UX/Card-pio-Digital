import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import { notifyCronFailure, notify } from '@/lib/shared/notifications'
import {
  getAffiliateApprovalThreshold,
  getAffiliatePayoutWindow,
} from '@/lib/domains/affiliate/affiliate-payout'
import { getTierByRestaurantes, getComissaoDireta } from '@/lib/domains/affiliate/affiliate-tiers'
import {
  buildPayoutBatchValidationSummary,
  validatePayoutItemSnapshot,
  type PayoutValidationStatus,
} from '@/lib/domains/affiliate/payout-batches'
import {
  hasValidEconomicStateForAffiliateApproval,
  resolveAffiliateApprovalGate,
} from '@/lib/domains/core/affiliate-approval-gate'
import { syncFinancialTruthForTenant } from '@/lib/domains/core/financial-truth'

type PayoutSourceType = 'referral_direct' | 'referral_leader' | 'bonus'

interface PayoutSourceRow {
  sourceType: PayoutSourceType
  sourceId: string
  amount: number
}

interface GroupedPayoutItem {
  affiliateId: string
  tipo: 'vendedor' | 'lider' | 'bonus'
  amount: number
  affiliateName: string | null
  pixKey: string | null
  validationStatus: PayoutValidationStatus
  validationErrors: Array<{ code: string; message: string }>
  sources: PayoutSourceRow[]
}

function appendGroupedSource(
  groups: Map<string, GroupedPayoutItem>,
  params: {
    affiliateId: string
    tipo: 'vendedor' | 'lider' | 'bonus'
    affiliateName: string | null
    pixKey: string | null
    source: PayoutSourceRow
  }
) {
  const key = `${params.affiliateId}:${params.tipo}`
  const current = groups.get(key)

  if (current) {
    current.amount += params.source.amount
    current.sources.push(params.source)
    return
  }

  groups.set(key, {
    affiliateId: params.affiliateId,
    tipo: params.tipo,
    amount: params.source.amount,
    affiliateName: params.affiliateName,
    pixKey: params.pixKey,
    validationStatus: 'pendente',
    validationErrors: [],
    sources: [params.source],
  })
}

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

    const [vendorCandidates, leaderCandidates] = await Promise.all([
      admin
        .from('affiliate_referrals')
        .select('tenant_id')
        .eq('status', 'pendente')
        .is('approved_at', null)
        .lte('created_at', thresholdIso),
      admin
        .from('affiliate_referrals')
        .select('tenant_id')
        .not('lider_id', 'is', null)
        .eq('lider_status', 'pendente')
        .is('lider_approved_at', null)
        .lte('created_at', thresholdIso),
    ])

    const candidateTenantIds = Array.from(
      new Set(
        [...(vendorCandidates.data ?? []), ...(leaderCandidates.data ?? [])]
          .map((row) => row.tenant_id)
          .filter((tenantId): tenantId is string => Boolean(tenantId))
      )
    )

    if (candidateTenantIds.length === 0) {
      results.push('Aprovação automática: nenhuma indicação pendente elegível para reconciliação')
    } else {
      const syncResults = await Promise.all(
        candidateTenantIds.map((tenantId) =>
          syncFinancialTruthForTenant(admin, {
            tenantId,
            source: 'reconciliation',
            sourceId: `affiliate-auto-approval:${nowIso}`,
            lastEventAt: nowIso,
            rawSnapshot: {
              threshold_iso: thresholdIso,
              flow: 'affiliate_auto_approval',
            },
          }).catch((error) => ({ tenantId, error }))
        )
      )

      const syncErrors = syncResults.filter(
        (result): result is { tenantId: string; error: unknown } =>
          Boolean(result && 'error' in result)
      )

      if (syncErrors.length > 0) {
        results.push(
          `Aprovação automática: ${syncErrors.length} falhas na reconciliação financeira`
        )
      }

      const [restaurantsResult, subscriptionsResult, truthResult, queueResult] = await Promise.all([
        admin
          .from('restaurants')
          .select('id, status_pagamento')
          .in('id', candidateTenantIds),
        admin
          .from('subscriptions')
          .select('restaurant_id, status, created_at')
          .in('restaurant_id', candidateTenantIds)
          .order('created_at', { ascending: false }),
        admin
          .from('financial_truth')
          .select('tenant_id, status')
          .in('tenant_id', candidateTenantIds),
        admin
          .from('financial_truth_sync_queue')
          .select('tenant_id, status')
          .in('tenant_id', candidateTenantIds),
      ])

      if (restaurantsResult.error) {
        throw restaurantsResult.error
      }

      if (subscriptionsResult.error) {
        throw subscriptionsResult.error
      }

      if (truthResult.error) {
        throw truthResult.error
      }

      if (queueResult.error) {
        throw queueResult.error
      }

      const restaurantStatusByTenantId = new Map(
        (restaurantsResult.data ?? []).map((row) => [row.id, row.status_pagamento])
      )
      const subscriptionStatusByTenantId = new Map<string, string | null>()
      for (const row of subscriptionsResult.data ?? []) {
        if (!row.restaurant_id || subscriptionStatusByTenantId.has(row.restaurant_id)) {
          continue
        }

        subscriptionStatusByTenantId.set(row.restaurant_id, row.status ?? null)
      }

      const financialTruthStatusByTenantId = new Map(
        (truthResult.data ?? []).map((row) => [row.tenant_id, row.status])
      )
      const financialTruthSyncStateByTenantId = new Map(
        (queueResult.data ?? []).map((row) => [row.tenant_id, row.status])
      )

      const gateDecisions = candidateTenantIds.map((tenantId) => ({
        tenantId,
        decision: resolveAffiliateApprovalGate({
          restaurantPaymentStatus: restaurantStatusByTenantId.get(tenantId),
          subscriptionStatus: subscriptionStatusByTenantId.get(tenantId),
          financialTruthStatus: financialTruthStatusByTenantId.get(tenantId),
          financialTruthSyncState: financialTruthSyncStateByTenantId.get(tenantId),
        }),
      }))

      const eligibleTenantIds = gateDecisions
        .filter((row) => row.decision === 'eligible')
        .map((row) => row.tenantId)

      const blockedTenantCount = gateDecisions.filter((row) => row.decision === 'blocked').length
      const pendingSyncTenantCount = gateDecisions.filter(
        (row) => row.decision === 'pending_sync'
      ).length

      if (blockedTenantCount > 0) {
        results.push(
          `Aprovação automática: ${blockedTenantCount} tenants bloqueados pela regra econômica canônica`
        )
      }

      if (pendingSyncTenantCount > 0) {
        results.push(
          `Aprovação automática: ${pendingSyncTenantCount} tenants aguardando conclusão do financial_truth sync`
        )
      }

      if (eligibleTenantIds.length === 0) {
        results.push('Aprovação automática: nenhum tenant elegível pela regra econômica canônica')
        console.log('[cron/payout] aprovação bloqueada por estado financeiro', {
          blockedTenantCount,
          pendingSyncTenantCount,
          candidateTenantCount: candidateTenantIds.length,
        })
        return NextResponse.json({ ok: true, now: nowIso, results })
      }

      const [vendorApproval, leaderApproval] = await Promise.all([
        admin
          .from('affiliate_referrals')
          .update({ status: 'aprovado', approved_at: nowIso })
          .eq('status', 'pendente')
          .is('approved_at', null)
          .lte('created_at', thresholdIso)
          .in('tenant_id', eligibleTenantIds)
          .select('id'),
        admin
          .from('affiliate_referrals')
          .update({ lider_status: 'aprovado', lider_approved_at: nowIso })
          .not('lider_id', 'is', null)
          .eq('lider_status', 'pendente')
          .is('lider_approved_at', null)
          .lte('created_at', thresholdIso)
          .in('tenant_id', eligibleTenantIds)
          .select('id'),
      ])

      const approvedVendorCount = vendorApproval.data?.length ?? 0
      const approvedLeaderCount = leaderApproval.data?.length ?? 0

      if (approvedVendorCount > 0 || approvedLeaderCount > 0) {
        results.push(
          `Aprovação automática: ${approvedVendorCount} diretas e ${approvedLeaderCount} de líder liberadas`
        )
      }
    }
  } catch (e) {
    results.push(`Approval error: ${e instanceof Error ? e.message : 'unknown'}`)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 0.5) PROMOÇÃO AUTOMÁTICA DE TIER — atualiza tier e commission_rate
  // ═══════════════════════════════════════════════════════════════════════
  try {
    const { data: affiliates } = await admin
      .from('affiliates')
      .select('id, tier, commission_rate')
      .eq('status', 'ativo')

    let promoted = 0
    for (const aff of affiliates || []) {
      // Contar deliverys ativos deste afiliado
      const { count } = await admin
        .from('affiliate_referrals')
        .select('id', { count: 'exact', head: true })
        .eq('affiliate_id', aff.id)
        .eq('status', 'aprovado')

      const total = count ?? 0
      const correctTier = getTierByRestaurantes(total)
      const correctRate = getComissaoDireta(correctTier)

      if (aff.tier !== correctTier.slug || Number(aff.commission_rate) !== correctRate) {
        await admin
          .from('affiliates')
          .update({ tier: correctTier.slug, commission_rate: correctRate })
          .eq('id', aff.id)
        promoted++
      }
    }

    if (promoted > 0) {
      results.push(`Tier promotion: ${promoted} afiliados atualizados`)
    }
  } catch (e) {
    results.push(`Tier promotion error: ${e instanceof Error ? e.message : 'unknown'}`)
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
        const [
          vendorRefsResult,
          leaderRefsResult,
          bonusResult,
          affiliateRowsResult,
          existingSources,
        ] = await Promise.all([
          admin
            .from('affiliate_referrals')
            .select('id, affiliate_id, comissao')
            .eq('status', 'aprovado')
            .not('affiliate_id', 'is', null)
            .gte('approved_at', payoutWindow.periodStart.toISOString())
            .lte('approved_at', payoutWindow.periodEnd.toISOString()),
          admin
            .from('affiliate_referrals')
            .select('id, lider_id, lider_comissao')
            .eq('lider_status', 'aprovado')
            .not('lider_id', 'is', null)
            .gte('lider_approved_at', payoutWindow.periodStart.toISOString())
            .lte('lider_approved_at', payoutWindow.periodEnd.toISOString()),
          admin
            .from('affiliate_bonuses')
            .select('id, affiliate_id, valor_bonus')
            .eq('status', 'pendente')
            .lte('created_at', nowIso),
          admin.from('affiliates').select('id, nome, chave_pix'),
          admin
            .from('payout_item_sources')
            .select('source_type, source_id')
            .in('source_type', ['referral_direct', 'referral_leader', 'bonus']),
        ])

        const vendorRefs = vendorRefsResult.data ?? []
        const leaderRefs = leaderRefsResult.data ?? []
        const bonuses = bonusResult.data ?? []
        const affiliates = affiliateRowsResult.data ?? []
        const allocatedKeys = new Set(
          (existingSources.data ?? []).map((row) => `${row.source_type}:${row.source_id}`)
        )

        const affiliateMap = new Map(
          affiliates.map((affiliate) => [
            affiliate.id,
            { nome: affiliate.nome ?? null, chave_pix: affiliate.chave_pix ?? null },
          ])
        )

        if (vendorRefs.length > 0 || leaderRefs.length > 0 || bonuses.length > 0) {
          const groups = new Map<string, GroupedPayoutItem>()

          for (const ref of vendorRefs) {
            const sourceKey = `referral_direct:${ref.id}`
            if (!ref.affiliate_id || !ref.comissao || allocatedKeys.has(sourceKey)) continue
            const affiliate = affiliateMap.get(ref.affiliate_id)
            appendGroupedSource(groups, {
              affiliateId: ref.affiliate_id,
              tipo: 'vendedor',
              affiliateName: affiliate?.nome ?? null,
              pixKey: affiliate?.chave_pix ?? null,
              source: {
                sourceType: 'referral_direct',
                sourceId: ref.id,
                amount: Number(ref.comissao),
              },
            })
          }

          for (const ref of leaderRefs) {
            const sourceKey = `referral_leader:${ref.id}`
            if (!ref.lider_id || !ref.lider_comissao || allocatedKeys.has(sourceKey)) continue
            const affiliate = affiliateMap.get(ref.lider_id)
            appendGroupedSource(groups, {
              affiliateId: ref.lider_id,
              tipo: 'lider',
              affiliateName: affiliate?.nome ?? null,
              pixKey: affiliate?.chave_pix ?? null,
              source: {
                sourceType: 'referral_leader',
                sourceId: ref.id,
                amount: Number(ref.lider_comissao),
              },
            })
          }

          for (const bonus of bonuses) {
            const sourceKey = `bonus:${bonus.id}`
            if (!bonus.affiliate_id || !bonus.valor_bonus || allocatedKeys.has(sourceKey)) continue
            const affiliate = affiliateMap.get(bonus.affiliate_id)
            appendGroupedSource(groups, {
              affiliateId: bonus.affiliate_id,
              tipo: 'bonus',
              affiliateName: affiliate?.nome ?? null,
              pixKey: affiliate?.chave_pix ?? null,
              source: {
                sourceType: 'bonus',
                sourceId: bonus.id,
                amount: Number(bonus.valor_bonus),
              },
            })
          }

          const groupedItems = Array.from(groups.values()).map((item) => {
            const validation = validatePayoutItemSnapshot({
              affiliateId: item.affiliateId,
              affiliateName: item.affiliateName,
              amount: item.amount,
              pixKey: item.pixKey,
            })

            return {
              ...item,
              pixKey: validation.normalizedPixKey ?? item.pixKey,
              validationStatus: validation.status,
              validationErrors: validation.issues,
            }
          })

          const validationSummary = buildPayoutBatchValidationSummary(
            groupedItems.map((item) => ({
              affiliateId: item.affiliateId,
              affiliateName: item.affiliateName,
              amount: item.amount,
              pixKey: item.pixKey,
            })),
            groupedItems.map((item) => ({
              status: item.validationStatus,
              normalizedPixKey: item.pixKey,
              issues: item.validationErrors,
            }))
          )

          const totalAmount = groupedItems.reduce((sum, item) => sum + item.amount, 0)

          // Criar batch
          const { data: batch } = await admin
            .from('payout_batches')
            .insert({
              referencia,
              period_start: periodStart,
              period_end: periodEnd,
              validation_status: validationSummary.status,
              validation_summary: validationSummary,
              total_amount: totalAmount,
              items_count: groupedItems.length,
            })
            .select('id')
            .single()

          if (batch) {
            const items = groupedItems.map((item) => ({
              batch_id: batch.id,
              affiliate_id: item.affiliateId,
              affiliate_nome_snapshot: item.affiliateName,
              tipo: item.tipo,
              valor: item.amount,
              chave_pix: item.pixKey,
              validation_status: item.validationStatus,
              validation_errors: item.validationErrors,
            }))

            const { data: insertedItems } = await admin
              .from('payout_items')
              .insert(items)
              .select('id, affiliate_id, tipo')

            const payoutItemIdMap = new Map(
              (insertedItems ?? []).map((item) => [`${item.affiliate_id}:${item.tipo}`, item.id])
            )

            const itemSources = groupedItems.flatMap((item) => {
              const payoutItemId = payoutItemIdMap.get(`${item.affiliateId}:${item.tipo}`)
              if (!payoutItemId) return []

              return item.sources.map((source) => ({
                payout_item_id: payoutItemId,
                source_type: source.sourceType,
                source_id: source.sourceId,
                amount: source.amount,
              }))
            })

            if (itemSources.length > 0) {
              await admin.from('payout_item_sources').insert(itemSources)
            }

            // Registrar reservas no ledger
            for (const item of groupedItems) {
              if (item.tipo === 'bonus') continue

              await admin.from('financial_ledger').insert({
                tipo: item.tipo === 'lider' ? 'reserva_lider' : 'reserva_afiliado',
                valor: item.amount,
                referencia,
                affiliate_id: item.affiliateId,
                payout_id: batch.id,
                descricao: `Reserva ${item.tipo} - ${referencia}`,
              })
            }

            results.push(
              `Batch ${referencia}: ${items.length} itens, total R$ ${totalAmount.toFixed(2)}, validação ${validationSummary.status}`
            )
          }
        } else {
          // Criar batch vazio
          await admin.from('payout_batches').insert({
            referencia,
            period_start: periodStart,
            period_end: periodEnd,
            validation_status: 'pronto',
            validation_summary: buildPayoutBatchValidationSummary([], []),
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

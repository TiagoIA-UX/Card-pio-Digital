/**
 * GET  /api/afiliados/me  — dados, stats e posição do afiliado logado
 * PATCH /api/afiliados/me — atualiza configurações (chave_pix, cidade, estado, bio, avatar_url)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTierForReferrals, getCommissionRate, getNextTier } from '@/lib/get-affiliate-tier'
import { validatePixKey } from '@/app/api/afiliados/registrar/route'
import { checkRateLimit, getRateLimitIdentifier, RATE_LIMITS } from '@/lib/rate-limit'

/** Retorna o próximo dia 5 do mês (UTC). */
function proximaDataPagamento(): string {
  const now = new Date()
  const ano = now.getUTCFullYear()
  const mes = now.getUTCMonth()
  const dia = now.getUTCDate()
  const alvo = new Date(Date.UTC(ano, dia < 5 ? mes : mes + 1, 5))
  return alvo.toISOString().split('T')[0]
}

export async function GET(req: NextRequest) {
  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Rate limit por usuário
  const rl = await checkRateLimit(getRateLimitIdentifier(req, user.id), RATE_LIMITS.public)
  if (!rl.success) {
    return NextResponse.json({ error: 'Muitas requisições' }, { status: 429, headers: rl.headers })
  }

  const admin = createAdminClient()

  const { data: affiliate } = await admin
    .from('affiliates')
    .select(
      'id, code, nome, chave_pix, status, tier, commission_rate, cidade, estado, bio, avatar_url, created_at'
    )
    .eq('user_id', user.id)
    .single()

  if (!affiliate) {
    return NextResponse.json({ affiliate: null })
  }

  // Busca em paralelo: referrals diretos, stats do ranking, bônus, e vendedores recrutados
  const [referralsResult, rankingResult, bonusesResult, redeResult, redeReferralsResult] =
    await Promise.all([
      admin
        .from('affiliate_referrals')
        .select('id, plano, valor_assinatura, comissao, status, referencia_mes, created_at')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false }),
      admin
        .from('affiliate_ranking')
        .select('posicao, is_lider, total_vendedores, rede_indicados, mrr_direto, mrr_rede')
        .eq('id', affiliate.id)
        .single(),
      admin
        .from('affiliate_bonuses')
        .select('id, nivel, valor_bonus, status, referencia_mes, created_at')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false }),
      // Vendedores que este afiliado recrutou
      admin
        .from('affiliates')
        .select('id, nome, code, status, created_at')
        .eq('lider_id', affiliate.id)
        .order('created_at', { ascending: false }),
      // Comissões de rede recebidas como líder
      admin
        .from('affiliate_referrals')
        .select('id, lider_comissao, lider_status, referencia_mes, created_at')
        .eq('lider_id', affiliate.id)
        .order('created_at', { ascending: false }),
    ])

  const refs = referralsResult.data ?? []
  const rankRow = rankingResult.data
  const posicao_ranking: number | null = rankRow?.posicao ?? null
  const is_lider: boolean = rankRow?.is_lider ?? false
  const bonuses = bonusesResult.data ?? []
  const vendedores = redeResult.data ?? []
  const rede_referrals = redeReferralsResult.data ?? []

  // ── Tier info ─────────────────────────────────────────────────────────────
  const totalIndicados = refs.length
  const tierAtual = getTierForReferrals(totalIndicados)
  const proximoTier = getNextTier(tierAtual)

  const stats = {
    total_indicados: totalIndicados,
    // TAREFA 6: desagrega comissão em 3 estados distintos
    pendente_analise: refs
      .filter((r) => r.status === 'pendente')
      .reduce((s, r) => s + Number(r.comissao ?? 0), 0),
    aprovado_aguardando: refs
      .filter((r) => r.status === 'aprovado')
      .reduce((s, r) => s + Number(r.comissao ?? 0), 0),
    comissao_paga: refs
      .filter((r) => r.status === 'pago')
      .reduce((s, r) => s + Number(r.comissao ?? 0), 0),
    // Mantém alias para compatibilidade
    comissao_pendente: refs
      .filter((r) => r.status === 'pendente')
      .reduce((s, r) => s + Number(r.comissao ?? 0), 0),
    comissao_aprovada: refs
      .filter((r) => r.status === 'aprovado')
      .reduce((s, r) => s + Number(r.comissao ?? 0), 0),
    proxima_data_pagamento: proximaDataPagamento(),
    mrr_direto: Number(rankRow?.mrr_direto ?? 0),
    mrr_rede: Number(rankRow?.mrr_rede ?? 0),
    mrr_estimado: Number(rankRow?.mrr_direto ?? 0) + Number(rankRow?.mrr_rede ?? 0),
    total_vendedores: Number(rankRow?.total_vendedores ?? 0),
    rede_indicados: Number(rankRow?.rede_indicados ?? 0),
  }

  return NextResponse.json({
    affiliate,
    referrals: refs,
    stats,
    posicao_ranking,
    is_lider,
    bonuses,
    vendedores,
    rede_referrals,
    // TAREFA 2: info de tier
    tier_info: {
      atual: tierAtual,
      commission_rate: getCommissionRate(tierAtual),
      proximo: proximoTier,
      restaurantes_para_proximo: proximoTier
        ? Math.max(0, proximoTier.minRestaurantes - totalIndicados)
        : 0,
    },
  })
}

// ── PATCH /api/afiliados/me ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { chave_pix, cidade, estado, bio, avatar_url } = body

  // Validação de chave PIX (se fornecida)
  if (chave_pix !== undefined && chave_pix !== null && chave_pix !== '') {
    const pixResult = validatePixKey(String(chave_pix).trim())
    if (!pixResult.valid) {
      return NextResponse.json(
        {
          error:
            'Chave PIX inválida. Aceitos: CPF, CNPJ, e-mail, telefone (+55) ou chave aleatória (UUID).',
        },
        { status: 400 }
      )
    }
  }

  const admin = createAdminClient()

  // Encontra o afiliado do usuário logado
  const { data: existing } = await admin
    .from('affiliates')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Afiliado não encontrado' }, { status: 404 })
  }

  // Monta payload apenas com campos presentes no body
  const updates: Record<string, unknown> = {}
  if (chave_pix !== undefined)
    updates.chave_pix = chave_pix ? String(chave_pix).trim().slice(0, 200) : null
  if (cidade !== undefined) updates.cidade = cidade ? String(cidade).trim().slice(0, 100) : null
  if (estado !== undefined)
    updates.estado = estado ? String(estado).trim().slice(0, 2).toUpperCase() : null
  if (bio !== undefined) updates.bio = bio ? String(bio).trim().slice(0, 280) : null
  if (avatar_url !== undefined)
    updates.avatar_url = avatar_url
      ? (() => {
          const raw = String(avatar_url).trim().slice(0, 500)
          try {
            const u = new URL(raw)
            if (u.protocol !== 'https:') return null
            return u.href
          } catch {
            return null
          }
        })()
      : null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const { data: updated, error } = await admin
    .from('affiliates')
    .update(updates)
    .eq('id', existing.id)
    .select('id, nome, chave_pix, cidade, estado, bio, avatar_url')
    .single()

  if (error) {
    console.error('[afiliados/me PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 })
  }

  return NextResponse.json({ affiliate: updated })
}

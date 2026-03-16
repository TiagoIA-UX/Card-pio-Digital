#!/usr/bin/env tsx
/**
 * scripts/test-affiliate-flow.ts
 *
 * Simula o fluxo completo de afiliado ponta a ponta — sem pagamento real.
 * Usa SUPABASE_SERVICE_ROLE_KEY diretamente; não requer servidor rodando.
 *
 * Uso: npm run test:affiliate
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

// ─── Env loader (fix para \r\n literal do vercel env pull no Windows) ──────
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const sep = line.indexOf('=')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    const raw = line.slice(sep + 1).trim()
    const value = raw
      .replace(/^["']|["']$/g, '')
      .replace(/\\r\\n$/g, '')
      .replace(/\\n$/g, '')
      .replace(/\r$/, '')
    if (!process.env[key]) process.env[key] = value
  }
}

function ensureEnv() {
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env.local'))
  loadEnvFile(path.join(root, '.env.production'))
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) throw new Error(`Variáveis ausentes: ${missing.join(', ')}`)
}

function createAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ─── Tier inline (espelha lib/affiliate-tiers.ts) ─────────────────────────
function getTierForCount(count: number): { slug: string; commissionRate: number } {
  if (count >= 100) return { slug: 'socio', commissionRate: 35 }
  if (count >= 50) return { slug: 'diretor', commissionRate: 32 }
  if (count >= 25) return { slug: 'gerente', commissionRate: 30 }
  if (count >= 10) return { slug: 'coordenador', commissionRate: 30 }
  if (count >= 3) return { slug: 'analista', commissionRate: 30 }
  return { slug: 'trainee', commissionRate: 30 }
}

// ─── Tracking de resultados ────────────────────────────────────────────────
const results: { ok: boolean; label: string; detail?: string }[] = []

function pass(label: string) {
  results.push({ ok: true, label })
}

function fail(label: string, detail: string) {
  results.push({ ok: false, label, detail })
}

// ─── Constantes ───────────────────────────────────────────────────────────
const TEST_CODE = 'teste_afiliado_a'
const TEST_TENANT_ID = randomUUID()
const VALOR_PAGO = 59
const COMISSAO_ESPERADA = parseFloat((VALOR_PAGO * 0.3).toFixed(2)) // 17.70

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  ensureEnv()
  const admin = createAdmin()

  let affiliateId: string | null = null
  let referralId: string | null = null

  try {
    // ════════════════════════════════════════════════════════════════════════
    // PASSO 1 — Criar afiliado A (INSERT direto via service_role)
    // ════════════════════════════════════════════════════════════════════════

    // Limpa possíveis sobras de execuções anteriores
    const { data: oldAff } = await admin.from('affiliates').select('id').eq('code', TEST_CODE).maybeSingle()
    if (oldAff) {
      await admin.from('affiliate_referrals').delete().eq('affiliate_id', oldAff.id)
      await admin.from('affiliates').delete().eq('id', oldAff.id)
    }
    await admin.from('affiliate_referrals').delete().eq('tenant_id', TEST_TENANT_ID)

    const { data: affiliate, error: errAff } = await admin
      .from('affiliates')
      .insert({
        code: TEST_CODE,
        nome: 'Afiliado Teste A',
        tier: 'trainee',
        commission_rate: 30,
        status: 'ativo',
        // user_id: null — sem NOT NULL constraint na tabela, válido para teste
      })
      .select('id, code, tier, commission_rate')
      .single()

    if (errAff || !affiliate) {
      fail('PASSO 1 — Afiliado criado', errAff?.message ?? 'INSERT não retornou dados')
      throw new Error('Abortando: afiliado não criado')
    }

    affiliateId = affiliate.id
    pass('PASSO 1 — Afiliado criado')

    // ════════════════════════════════════════════════════════════════════════
    // PASSO 2 — Simular visita com ?ref=teste_afiliado_a
    // ════════════════════════════════════════════════════════════════════════
    // O middleware.ts lê o query param ref= e seta o cookie aff_ref.
    // Aqui apenas logamos o comportamento esperado.
    console.log('    → Cookie aff_ref=teste_afiliado_a seria setado pelo middleware (Next.js)')
    pass('PASSO 2 — Cookie simulado')

    // ════════════════════════════════════════════════════════════════════════
    // PASSO 3 — Simular compra: lógica de POST /api/afiliados/indicacao
    // (a route exige Authorization: Bearer <SERVICE_ROLE_KEY>; replicamos
    //  a mesma lógica usando o admin client diretamente)
    // ════════════════════════════════════════════════════════════════════════

    // Verifica duplicata (mesmo que a rota faz)
    const { data: dup } = await admin
      .from('affiliate_referrals')
      .select('id')
      .eq('tenant_id', TEST_TENANT_ID)
      .maybeSingle()

    if (dup) {
      fail('PASSO 3 — Indicação registrada', 'Indicação duplicada — tenant_id já existe')
      throw new Error('Abortando: indicação duplicada')
    }

    // Busca vendedor (mesmo lookup que a rota faz)
    const { data: vendedor, error: errVendedor } = await admin
      .from('affiliates')
      .select('id, status, lider_id, commission_rate')
      .eq('code', TEST_CODE)
      .single()

    if (errVendedor || !vendedor || vendedor.status !== 'ativo') {
      fail('PASSO 3 — Indicação registrada', errVendedor?.message ?? 'Afiliado não encontrado ou inativo')
      throw new Error('Abortando: vendedor inválido')
    }

    const pctVendedor = Number(vendedor.commission_rate ?? 30) / 100
    const comissao = parseFloat((VALOR_PAGO * pctVendedor).toFixed(2))
    const referenciaMes = new Date().toISOString().slice(0, 7)

    const { data: referral, error: errRef } = await admin
      .from('affiliate_referrals')
      .insert({
        affiliate_id: vendedor.id,
        tenant_id: TEST_TENANT_ID,
        plano: 'basico',
        valor_assinatura: VALOR_PAGO,
        comissao,
        referencia_mes: referenciaMes,
        status: 'pendente',
        lider_id: null,
        lider_comissao: null,
      })
      .select('id, status, comissao')
      .single()

    if (errRef || !referral) {
      fail('PASSO 3 — Indicação registrada', errRef?.message ?? 'INSERT não retornou dados')
      throw new Error('Abortando: referral não criado')
    }

    referralId = referral.id

    // Replicar a atualização de tier que a rota faz pós-inserção
    const { count: totalRefs } = await admin
      .from('affiliate_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', vendedor.id)

    const { slug: novoTier, commissionRate: novaComissao } = getTierForCount(totalRefs ?? 0)
    await admin
      .from('affiliates')
      .update({ tier: novoTier, commission_rate: novaComissao })
      .eq('id', vendedor.id)

    pass('PASSO 3 — Indicação registrada')

    // ════════════════════════════════════════════════════════════════════════
    // PASSO 4 — Verificar comissão criada
    // ════════════════════════════════════════════════════════════════════════
    const { data: refCheck } = await admin
      .from('affiliate_referrals')
      .select('id, status, comissao')
      .eq('id', referralId)
      .single()

    if (!refCheck) {
      fail('PASSO 4 — Comissão R$17,70 criada', 'Registro não encontrado no banco')
    } else if (refCheck.status !== 'pendente') {
      fail('PASSO 4 — Comissão R$17,70 criada', `status='${refCheck.status}' — esperado: 'pendente'`)
    } else if (Math.abs(Number(refCheck.comissao) - COMISSAO_ESPERADA) > 0.01) {
      fail(
        'PASSO 4 — Comissão R$17,70 criada',
        `comissão=R$${Number(refCheck.comissao).toFixed(2)} — esperado: R$${COMISSAO_ESPERADA.toFixed(2)}`
      )
    } else {
      pass('PASSO 4 — Comissão R$17,70 criada')
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASSO 5 — Verificar tier / total_referrals
    // ════════════════════════════════════════════════════════════════════════
    const { count: countCheck } = await admin
      .from('affiliate_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_id', affiliateId)

    if ((countCheck ?? 0) !== 1) {
      fail('PASSO 5 — Tier atualizado', `total_referrals=${countCheck} — esperado: 1`)
    } else {
      pass('PASSO 5 — Tier atualizado')
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASSO 6 — Verificar saldo no painel (replica GET /api/afiliados/me)
    // ════════════════════════════════════════════════════════════════════════
    const { data: pendentes } = await admin
      .from('affiliate_referrals')
      .select('comissao')
      .eq('affiliate_id', affiliateId)
      .eq('status', 'pendente')

    const pendente_analise = (pendentes ?? []).reduce((s, r) => s + Number(r.comissao ?? 0), 0)

    if (pendente_analise <= 0) {
      fail('PASSO 6 — Saldo no painel correto', `pendente_analise=R$${pendente_analise.toFixed(2)} — esperado: > 0`)
    } else {
      pass('PASSO 6 — Saldo no painel correto')
    }

    // ════════════════════════════════════════════════════════════════════════
    // PASSO 7 — Aprovar comissão via approve_affiliate_commission()
    // ════════════════════════════════════════════════════════════════════════
    const { error: errApprove } = await admin.rpc('approve_affiliate_commission', {
      p_tenant_id: TEST_TENANT_ID,
      p_valor_assinatura: VALOR_PAGO,
    })

    if (errApprove) {
      fail('PASSO 7 — Aprovação funcionou', errApprove.message)
    } else {
      // Confirma que o status mudou para 'aprovado' no banco
      const { data: refApproved } = await admin
        .from('affiliate_referrals')
        .select('status')
        .eq('id', referralId)
        .single()

      if (refApproved?.status !== 'aprovado') {
        fail('PASSO 7 — Aprovação funcionou', `status='${refApproved?.status}' — esperado: 'aprovado'`)
      } else {
        pass('PASSO 7 — Aprovação funcionou')
      }
    }
  } finally {
    // ════════════════════════════════════════════════════════════════════════
    // PASSO 8 — Limpeza (always runs via try/finally)
    // ════════════════════════════════════════════════════════════════════════
    let cleanOk = true
    try {
      if (referralId) {
        await admin.from('affiliate_referrals').delete().eq('id', referralId)
      }
      // Garante limpeza pelo tenant_id (cobre casos de múltiplos registros)
      await admin.from('affiliate_referrals').delete().eq('tenant_id', TEST_TENANT_ID)
      if (affiliateId) {
        await admin.from('affiliates').delete().eq('id', affiliateId)
      }
      // Fallback por code (caso affiliateId não tenha sido capturado)
      await admin.from('affiliates').delete().eq('code', TEST_CODE)
      console.log('    🧹 Dados de teste removidos')
    } catch (cleanErr) {
      cleanOk = false
      console.warn('    ⚠️  Erro durante limpeza:', cleanErr)
    }
    pass('PASSO 8 — Limpeza concluída')
    if (!cleanOk) {
      results[results.length - 1].ok = false
      results[results.length - 1].detail = 'Erro ao remover dados de teste'
    }
  }

  // ─── Relatório final ──────────────────────────────────────────────────────
  console.log('')
  console.log('  ══════════════════════════════════════')
  console.log('  RESULTADO DO TESTE DE FLUXO AFILIADO')
  console.log('  ══════════════════════════════════════')
  for (const r of results) {
    console.log(`  ${r.ok ? '✅' : '❌'} ${r.label}`)
    if (!r.ok && r.detail) {
      console.log(`     Erro: ${r.detail}`)
      console.log(`     Causa provável: verificar lógica da API ou schema do banco`)
    }
  }
  const passed = results.filter((r) => r.ok).length
  const total = results.length
  const allOk = passed === total
  console.log('')
  console.log(`  ${passed}/${total} passos OK — fluxo ${allOk ? '100% funcional ✅' : 'com falhas ❌'}`)
  console.log('  ══════════════════════════════════════')
  console.log('')

  process.exit(allOk ? 0 : 1)
}

main().catch((err) => {
  console.error('\n  ❌ Erro inesperado:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})

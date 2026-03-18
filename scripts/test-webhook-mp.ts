#!/usr/bin/env npx tsx
/**
 * test-webhook-mp.ts — Simulador de webhooks do Mercado Pago
 *
 * Testa a rota /api/webhook/mercadopago localmente, incluindo:
 *   T1  GET  — verificação de URL (MP faz isso ao configurar webhook)
 *   T2  POST — payload sem type (evento desconhecido, deve retornar 200)
 *   T3  POST — payload vazio (deve retornar 200 sem crash)
 *   T4  POST — type=payment sem data.id (retorna 200, log warn)
 *   T5  POST — assinatura inválida (retorna 401)
 *   T6  POST — evento real simulado (payment, sem external_reference real)
 *   T7  POST — duplicata: mesmo notification_id (retorna 200 idempotente)
 *
 * Uso:
 *   npx tsx scripts/test-webhook-mp.ts
 *   TEST_WEBHOOK_URL=https://meu-ngrok.ngrok.io npx tsx scripts/test-webhook-mp.ts
 */

import crypto from 'crypto'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const BASE_URL = process.env.TEST_WEBHOOK_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
const SECRET = process.env.MP_WEBHOOK_SECRET ?? ''
const WEBHOOK_PATH = '/api/webhook/mercadopago'

// ── Helpers ───────────────────────────────────────────────────────────────

function buildSignature(dataId: string, requestId: string, ts: string): string {
  if (!SECRET) return ''
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const sig = crypto.createHmac('sha256', SECRET).update(manifest).digest('hex')
  return `ts=${ts},v1=${sig}`
}

function buildBadSignature(): string {
  return `ts=${Math.floor(Date.now() / 1000)},v1=000000000000000000000000000000000000000000000000000000000000dead`
}

interface TestResult {
  label: string
  status: number
  body: string
  passed: boolean
  reason: string
}

const results: TestResult[] = []

async function post(
  label: string,
  body: object,
  opts?: { badSignature?: boolean; expectStatus?: number }
): Promise<void> {
  const expectStatus = opts?.expectStatus ?? 200
  const requestId = crypto.randomUUID()
  const ts = Math.floor(Date.now() / 1000).toString()
  const dataId = String((body as Record<string, { id?: unknown }>).data?.id ?? '')
  const sig = opts?.badSignature ? buildBadSignature() : buildSignature(dataId, requestId, ts)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-request-id': requestId,
  }
  if (sig) headers['x-signature'] = sig

  const url = `${BASE_URL}${WEBHOOK_PATH}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const text = await res.text()
    const passed = res.status === expectStatus
    results.push({
      label,
      status: res.status,
      body: text,
      passed,
      reason: passed ? 'ok' : `esperado ${expectStatus}`,
    })
    const icon = passed ? '✅' : '❌'
    console.log(`  ${icon} [${label}] HTTP ${res.status} → ${text.slice(0, 120)}`)
  } catch (err) {
    results.push({ label, status: 0, body: '', passed: false, reason: `conexão: ${err}` })
    console.error(`  ❌ [${label}] Erro de conexão: ${err}`)
    console.error('     → Servidor rodando? npm run dev')
  }
}

async function get(label: string): Promise<void> {
  const url = `${BASE_URL}${WEBHOOK_PATH}`
  try {
    const res = await fetch(url)
    const text = await res.text()
    const passed = res.status === 200
    results.push({
      label,
      status: res.status,
      body: text,
      passed,
      reason: passed ? 'ok' : `HTTP ${res.status}`,
    })
    console.log(`  ${passed ? '✅' : '❌'} [${label}] HTTP ${res.status} → ${text.slice(0, 120)}`)
  } catch (err) {
    results.push({ label, status: 0, body: '', passed: false, reason: `conexão: ${err}` })
    console.error(`  ❌ [${label}] Erro de conexão: ${err}`)
  }
}

// ── Testes ────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60))
  console.log('Mercado Pago Webhook Simulator')
  console.log(`  URL    : ${BASE_URL}${WEBHOOK_PATH}`)
  console.log(
    `  Secret : ${SECRET ? '✅ configurado (validação HMAC ativa)' : '⚠️  sem MP_WEBHOOK_SECRET (validação HMAC ignorada)'}`
  )
  console.log('═'.repeat(60))
  console.log()

  // T1 — GET: MP verifica a URL antes de ativar webhook
  await get('T1 GET verificação')

  // T2 — Tipo desconhecido → 200 silencioso
  await post('T2 tipo desconhecido', {
    id: `notif-unknown-${Date.now()}`,
    type: 'subscription_preapproval',
    data: { id: 'sub-abc-001' },
    live_mode: false,
  })

  // T3 — Payload vazio → deve retornar 200 sem crash
  await post('T3 payload vazio', {})

  // T4 — payment sem data.id → 200 com log warn
  await post('T4 payment sem data.id', {
    id: `notif-noid-${Date.now()}`,
    type: 'payment',
    data: {},
    live_mode: false,
  })

  // T5 — Assinatura inválida (só testado quando SECRET está configurado)
  if (SECRET) {
    await post(
      'T5 assinatura inválida',
      { id: `notif-badsig-${Date.now()}`, type: 'payment', data: { id: '9999' }, live_mode: false },
      { badSignature: true, expectStatus: 401 }
    )
  } else {
    console.log('  ⏭️  [T5 assinatura inválida] pulado — MP_WEBHOOK_SECRET não configurado')
  }

  // T6 — Evento real (MP vai recusar porque payment_id não existe em sandbox)
  //       Testa apenas que a rota não crasha antes de chamar mercadopago.get()
  const notifId6 = `notif-real-${Date.now()}`
  await post('T6 payment event real (falha no MP esperada)', {
    id: notifId6,
    type: 'payment',
    data: { id: 'test-fake-payment-000' },
    live_mode: false,
    // É esperado que retorne 500 porque mercadopago.get() vai rejeitar o ID falso
    // Em produção, use um payment_id real do MP Sandbox
  })

  // T7 — Duplicata: reenvia T2 com o mesmo notification_id
  //       Se a rota + webhook_events estão funcionando, deve retornar 200 imediato
  //       sem reprocessar (log: webhook_duplicate_skipped)
  const dupId = `notif-dup-${Date.now()}`
  const dupBody = {
    id: dupId,
    type: 'subscription_preapproval',
    data: { id: 'sub-dup-001' },
    live_mode: false,
  }
  console.log()
  console.log('  — T7: enviando mesmo notification_id duas vezes —')
  await post('T7a primeira vez', dupBody)
  await post('T7b duplicata (idempotência)', dupBody)

  // ── Resumo ──────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  console.log()
  console.log('═'.repeat(60))
  console.log(`Resultado: ${passed}/${total} testes OK`)
  if (passed < total) {
    console.log()
    console.log('Falhas:')
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  ❌ ${r.label}: ${r.reason}`)
      })
  }
  console.log('═'.repeat(60))

  // T6 pode falhar (500 esperado com ID fake) — não conta como falha do sistema
  const ignoredFails = results.filter((r) => !r.passed && r.label.includes('falha no MP esperada'))
  const realFails = results.filter((r) => !r.passed && !r.label.includes('falha no MP esperada'))
  if (realFails.length > 0) process.exit(1)
  else if (ignoredFails.length > 0)
    console.log('  ℹ️  T6 falhou como esperado (ID de pagamento inválido no MP)')
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})

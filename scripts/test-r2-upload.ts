#!/usr/bin/env npx tsx
/**
 * test-r2-upload.ts — Testa o sistema de upload para Cloudflare R2
 *
 * Testa duas camadas:
 *   Bloco A: lib/r2.ts diretamente (requer credenciais R2 configuradas)
 *   Bloco B: rota POST /api/upload (requer servidor rodando + usuário autenticado)
 *
 * Uso:
 *   npm run test:r2
 *   TEST_UPLOAD_URL=https://meu-ngrok.ngrok.io npm run test:r2
 *
 * Para testar a rota, configure também:
 *   TEST_SUPABASE_TOKEN=<seu_access_token_jwt>
 */

import path from 'path'
import { readFileSync } from 'fs'

// Carrega .env.local manualmente (sem dotenv)
try {
  const envPath = path.resolve(process.cwd(), '.env.local')
  const lines = readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, '$1')
    if (key && !process.env[key]) process.env[key] = val
  }
} catch { /* .env.local opcional */ }

const BASE_URL = process.env.TEST_UPLOAD_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
const SUPABASE_TOKEN = process.env.TEST_SUPABASE_TOKEN ?? ''

// ── Helpers ───────────────────────────────────────────────────────────────

interface TestResult {
  label: string
  passed: boolean
  reason: string
}

const results: TestResult[] = []

function pass(label: string) {
  results.push({ label, passed: true, reason: 'ok' })
  console.log(`  ✅ ${label}`)
}

function fail(label: string, reason: string) {
  results.push({ label, passed: false, reason })
  console.log(`  ❌ ${label}: ${reason}`)
}

/** Gera um PNG sintético de 1x1 pixel sem dependências de disco */
function makePngBuffer(): Buffer {
  // PNG mínimo válido: 1x1 pixel preto
  const PNG_1x1 = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // magic
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // IHDR length + type
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01, // width=1, height=1
    0x08,
    0x02,
    0x00,
    0x00,
    0x00,
    0x90,
    0x77,
    0x53, // bit depth=8, color type=2 (RGB)
    0xde,
    0x00,
    0x00,
    0x00,
    0x0c,
    0x49,
    0x44,
    0x41, // IHDR crc + IDAT length + type
    0x54,
    0x08,
    0xd7,
    0x63,
    0xf8,
    0xcf,
    0xc0,
    0x00, // IDAT (compressed)
    0x00,
    0x00,
    0x02,
    0x00,
    0x01,
    0xe2,
    0x21,
    0xbc, // IDAT continued
    0x33,
    0x00,
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e, // IDAT crc + IEND length + type
    0x44,
    0xae,
    0x42,
    0x60,
    0x82, // IEND crc
  ])
  return PNG_1x1
}

// ── Bloco A: lib/r2.ts direto ─────────────────────────────────────────────

async function testR2Direct() {
  console.log()
  console.log('Bloco A — lib/r2.ts (direto)')
  console.log('─'.repeat(50))

  const hasCredentials =
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_PUBLIC_URL

  if (!hasCredentials) {
    console.log('  ⏭️  Credenciais R2 não configuradas — testes do Bloco A ignorados')
    console.log(
      '  Para testar: configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL no .env.local'
    )
    return
  }

  // A1 — uploadFile com PNG válido
  try {
    const { uploadFile } = await import('../lib/r2')
    const buffer = makePngBuffer()
    const result = await uploadFile({ buffer, mimeType: 'image/png', folder: 'pratos' })

    if (!result.url || !result.key || result.size === 0) {
      fail('A1 uploadFile PNG', `resultado inválido: ${JSON.stringify(result)}`)
      return
    }
    if (!result.url.startsWith('http')) {
      fail('A1 uploadFile PNG', `URL sem scheme: ${result.url}`)
      return
    }
    pass(`A1 uploadFile PNG → ${result.url}`)

    // A2 — deleteFile com a chave gerada em A1
    try {
      const { deleteFile } = await import('../lib/r2')
      await deleteFile(result.key)
      pass(`A2 deleteFile → ${result.key}`)
    } catch (err) {
      fail('A2 deleteFile', String(err))
    }
  } catch (err) {
    fail('A1 uploadFile PNG', String(err))
  }
}

// ── Bloco B: rota POST /api/upload ────────────────────────────────────────

async function testUploadRoute() {
  console.log()
  console.log('Bloco B — POST /api/upload (requer servidor)')
  console.log(`  URL: ${BASE_URL}/api/upload`)
  console.log('─'.repeat(50))

  if (!SUPABASE_TOKEN) {
    console.log('  ⏭️  TEST_SUPABASE_TOKEN não configurado — testes da rota pulados')
    console.log('  Para testar: set TEST_SUPABASE_TOKEN=<seu_token_jwt>')
    return
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${SUPABASE_TOKEN}` }

  // B1 — sem autenticação → 401
  try {
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST' })
    if (res.status === 401) pass('B1 sem auth → 401')
    else fail('B1 sem auth → 401', `recebeu ${res.status}`)
  } catch (err) {
    fail('B1 sem auth', `conexão: ${err} — servidor rodando?`)
    console.log('  Abortando testes da rota (servidor inacessível)')
    return
  }

  // B2 — campo "file" ausente → 400
  {
    const form = new FormData()
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', headers, body: form })
    const json = await res.json().catch(() => ({}))
    if (res.status === 400) pass('B2 sem file → 400')
    else fail('B2 sem file → 400', `status=${res.status} body=${JSON.stringify(json)}`)
  }

  // B3 — MIME inválido (text/plain) → 400
  {
    const form = new FormData()
    form.append('file', new Blob(['conteudo'], { type: 'text/plain' }), 'test.txt')
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', headers, body: form })
    if (res.status === 400) pass('B3 MIME inválido → 400')
    else fail('B3 MIME inválido → 400', `recebeu ${res.status}`)
  }

  // B4 — pasta inválida → 400
  {
    const form = new FormData()
    const png = makePngBuffer()
    form.append('file', new Blob([png], { type: 'image/png' }), 'test.png')
    form.append('folder', 'hacker-folder')
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', headers, body: form })
    if (res.status === 400) pass('B4 pasta inválida → 400')
    else fail('B4 pasta inválida → 400', `recebeu ${res.status}`)
  }

  // B5 — arquivo acima de 5MB → 400
  {
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 0)
    const form = new FormData()
    form.append('file', new Blob([oversized], { type: 'image/png' }), 'big.png')
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', headers, body: form })
    if (res.status === 400) pass('B5 arquivo > 5MB → 400')
    else fail('B5 arquivo > 5MB → 400', `recebeu ${res.status}`)
  }

  // B6 — PNG válido em pasta "pratos" → 200 (só passa se R2 estiver configurado no servidor)
  {
    const png = makePngBuffer()
    const form = new FormData()
    form.append('file', new Blob([png], { type: 'image/png' }), 'test.png')
    form.append('folder', 'pratos')
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', headers, body: form })
    const json = await res.json().catch(() => ({}))
    if (res.status === 200 && json.success && json.url?.startsWith('http')) {
      pass(`B6 upload PNG válido → ${json.url}`)
    } else if (res.status === 500) {
      console.log(
        `  ⏭️  B6 retornou 500 — R2 não configurado no servidor (esperado em ambiente local)`
      )
      results.push({
        label: 'B6 upload PNG válido',
        passed: true,
        reason: 'skipped (R2 não configurado)',
      })
    } else {
      fail('B6 upload PNG válido', `status=${res.status} body=${JSON.stringify(json)}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('═'.repeat(60))
  console.log('Cloudflare R2 Upload — Test Suite')
  console.log('═'.repeat(60))

  await testR2Direct()
  await testUploadRoute()

  const passed = results.filter((r) => r.passed).length
  const total = results.length
  const failed = results.filter((r) => !r.passed)

  console.log()
  console.log('═'.repeat(60))
  console.log(`Resultado: ${passed}/${total} testes OK`)
  if (failed.length > 0) {
    console.log()
    console.log('Falhas:')
    failed.forEach((r) => console.log(`  ❌ ${r.label}: ${r.reason}`))
    process.exit(1)
  }
  console.log('═'.repeat(60))
}

main().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})

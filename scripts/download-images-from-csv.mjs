/**
 * Gera e baixa imagens via Pollinations.ai para cada produto do CSV
 * Salva em public/template-images/<filename>
 *
 * USO:
 *   node scripts/download-images-from-csv.mjs
 *   node scripts/download-images-from-csv.mjs --start=50
 *   node scripts/download-images-from-csv.mjs --template=pizzaria
 *   node scripts/download-images-from-csv.mjs --dry-run
 *
 * DEPOIS DE RODAR:
 *   node scripts/update-image-map-local.js
 */

import fs from 'fs'
import https from 'https'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CSV_PATH = path.join(__dirname, 'image-prompts.csv')
const OUTPUT_DIR = path.join(ROOT, 'public', 'template-images')
const PROGRESS_FILE = path.join(__dirname, '.download-progress.json')

// ---- Config ----
const DELAY_MS = 4000 // 4s entre requests (Pollinations limite ~15 req/min)
const MAX_RETRIES = 3
const TIMEOUT_MS = 30000

// ---- Args ----
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, ...rest] = a.slice(2).split('=')
      return [k, rest.length ? rest.join('=') : true]
    })
)
const FILTER_TEMPLATE = args['template'] || null
const START_FROM = parseInt(args['start'] || '0', 10)
const DRY_RUN = args['dry-run'] === true || args['dry-run'] === 'true'

// ---- Helpers ----
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function parseCSV(content) {
  const lines = content.split('\n').filter((l) => l.trim())
  const [header, ...rows] = lines
  const cols = header.split(',')
  return rows.map((row) => {
    const values = []
    let current = ''
    let inQuotes = false
    for (const char of row) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    values.push(current)
    return Object.fromEntries(cols.map((col, i) => [col, values[i] || '']))
  })
}

function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
  } catch {
    return { done: [] }
  }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

function buildPollinationsUrl(prompt) {
  const encoded = encodeURIComponent(prompt)
  // width=800, height=800, seed aleatório para evitar cache, nologo=true
  const seed = Math.floor(Math.random() * 999999)
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=800&seed=${seed}&nologo=true&model=flux`
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      req.destroy()
      reject(new Error('Timeout'))
    }, TIMEOUT_MS)

    const protocol = url.startsWith('https') ? https : http

    const req = protocol.get(url, (res) => {
      // Seguir redirecionamentos (Pollinations redireciona)
      if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
        clearTimeout(timeout)
        return resolve(downloadImage(res.headers.location, destPath))
      }

      if (res.statusCode !== 200) {
        clearTimeout(timeout)
        return reject(new Error(`HTTP ${res.statusCode}`))
      }

      const contentType = res.headers['content-type'] || ''
      if (!contentType.includes('image')) {
        clearTimeout(timeout)
        return reject(new Error(`Resposta não é imagem: ${contentType}`))
      }

      const fileStream = fs.createWriteStream(destPath)
      res.pipe(fileStream)

      fileStream.on('finish', () => {
        clearTimeout(timeout)
        fileStream.close()
        // Verificar que o arquivo tem tamanho razoável (>5KB)
        const stats = fs.statSync(destPath)
        if (stats.size < 5000) {
          fs.unlinkSync(destPath)
          reject(new Error(`Arquivo muito pequeno (${stats.size}B) — provável erro da API`))
        } else {
          resolve()
        }
      })

      fileStream.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
      })
    })

    req.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

async function downloadWithRetry(url, destPath, productName, attempt = 1) {
  try {
    await downloadImage(url, destPath)
    return true
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      const waitTime = DELAY_MS * attempt
      console.log(
        `    ⚠ Tentativa ${attempt} falhou (${err.message}). Aguardando ${waitTime / 1000}s...`
      )
      await sleep(waitTime)
      // Novo seed para cada tentativa
      return downloadWithRetry(
        buildPollinationsUrl(
          url.split('/prompt/')[1]?.split('?')[0]
            ? decodeURIComponent(url.split('/prompt/')[1]?.split('?')[0])
            : ''
        ),
        destPath,
        productName,
        attempt + 1
      )
    }
    console.log(`    ✗ Falhou após ${MAX_RETRIES} tentativas: ${err.message}`)
    return false
  }
}

// ---- Main ----
async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ CSV não encontrado:', CSV_PATH)
    process.exit(1)
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf-8'))
  const progress = loadProgress()

  let filtered = rows
  if (FILTER_TEMPLATE) {
    filtered = rows.filter((r) => r.template === FILTER_TEMPLATE)
    console.log(`🔍 Filtro: template="${FILTER_TEMPLATE}" → ${filtered.length} produtos`)
  }
  if (START_FROM > 0) {
    filtered = filtered.slice(START_FROM)
    console.log(`▶ Iniciando do produto #${START_FROM + 1}`)
  }

  const total = filtered.length
  const already = filtered.filter((r) => progress.done.includes(r.filename)).length
  const remaining = total - already

  console.log(`\n📦 Pollinations.ai Image Downloader`)
  console.log(`   CSV: ${rows.length} produtos total`)
  console.log(`   Filtrados: ${total} | Já feitos: ${already} | Restantes: ${remaining}`)
  if (DRY_RUN) console.log(`   ⚠ DRY-RUN — nenhuma imagem será baixada\n`)
  else
    console.log(`   ⏱ Tempo estimado: ~${Math.ceil((remaining * (DELAY_MS + 5000)) / 60000)} min\n`)

  let done = 0
  let failed = 0
  let skipped = 0

  for (const row of filtered) {
    const { template, categoria, nome, filename, prompt } = row
    if (!filename || !prompt) continue

    const destPath = path.join(OUTPUT_DIR, filename)
    const key = filename

    if (progress.done.includes(key)) {
      skipped++
      continue
    }

    if (fs.existsSync(destPath)) {
      const stats = fs.statSync(destPath)
      if (stats.size > 5000) {
        progress.done.push(key)
        saveProgress(progress)
        skipped++
        continue
      }
    }

    const idx = done + failed + skipped + 1
    process.stdout.write(`[${idx}/${total}] ${template}/${categoria} — ${nome} ... `)

    if (DRY_RUN) {
      const url = buildPollinationsUrl(prompt)
      console.log(`\n    URL: ${url}`)
      done++
      continue
    }

    const url = buildPollinationsUrl(prompt)
    const success = await downloadWithRetry(url, destPath, nome)

    if (success) {
      const stats = fs.statSync(destPath)
      console.log(`✓ (${Math.round(stats.size / 1024)}KB)`)
      progress.done.push(key)
      saveProgress(progress)
      done++
    } else {
      failed++
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n✅ Concluído!`)
  console.log(`   ✓ Baixadas: ${done}`)
  console.log(`   ↷ Puladas (já existiam): ${skipped}`)
  console.log(`   ✗ Falhas: ${failed}`)
  console.log(`\nPróximo passo:`)
  console.log(`   node scripts/update-image-map-local.js`)

  if (failed > 0) {
    console.log(`\nPara re-tentar as falhas:`)
    console.log(
      `   node scripts/download-images-from-csv.mjs${FILTER_TEMPLATE ? ` --template=${FILTER_TEMPLATE}` : ''}`
    )
  }
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})

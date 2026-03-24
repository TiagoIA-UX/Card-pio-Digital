/**
 * Gera imagens automaticamente via Google Gemini Imagen 3
 * e salva em public/template-images/
 *
 * Modelo: imagen-3.0-generate-002 (via Gemini API)
 *
 * PRÉ-REQUISITO: Chave da API disponível em aistudio.google.com/app/apikey
 * USO: GEMINI_API_KEY=AIza... node scripts/generate-images-gemini.js
 *
 * CUSTO ESTIMADO: ~$0.04/imagem × 877 = ~$35 total (Imagen 3)
 * TEMPO ESTIMADO: ~1-2 horas (60 req/min no tier padrão)
 *
 * OPÇÕES:
 *   --template=pizzaria     → gera só um template
 *   --start=50              → continua a partir do produto #50
 *   --dry-run               → mostra prompts sem gerar nada
 *   --concurrency=3         → downloads simultâneos (default: 1)
 *
 * PRÓXIMO PASSO:
 *   node scripts/update-image-map-local.js
 *   → atualiza lib/generated-template-product-images.ts com os caminhos locais
 */
'use strict'

const fs = require('fs')
const path = require('path')
const https = require('https')

const ROOT = path.resolve(__dirname, '..')
const OUTPUT_DIR = path.join(ROOT, 'public', 'template-images')
const CSV_PATH = path.join(ROOT, 'scripts', 'image-prompts.csv')
const PROGRESS_FILE = path.join(__dirname, '.gemini-progress.json')

// ---- Config ----
const API_KEY = process.env.GEMINI_API_KEY
// Imagen 3 endpoint (Gemini API v1beta)
const IMAGEN_MODEL = 'imagen-3.0-generate-002'
const API_HOST = 'generativelanguage.googleapis.com'
const API_PATH = `/v1beta/models/${IMAGEN_MODEL}:predict`

// Rate limit conservador: Imagen 3 permite 60 req/min no tier gratuito
const DELAY_MS = 1200 // ~50 req/min → margem segura

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
const CONCURRENCY = Math.max(1, parseInt(args['concurrency'] || '1', 10))

if (!API_KEY && !DRY_RUN) {
  console.error('❌ Defina a variável: GEMINI_API_KEY=AIza...')
  console.error('   Obtenha em: https://aistudio.google.com/app/apikey')
  console.error('   Ou use --dry-run para ver os prompts')
  process.exit(1)
}

// ---- Helpers ----
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Chama Imagen 3 (via Gemini API) e retorna os bytes da imagem em base64.
 * @param {string} prompt
 * @returns {Promise<{ mimeType: string, bytesBase64: string }>}
 */
function callImagenAPI(prompt) {
  const body = JSON.stringify({
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',
      safetyFilterLevel: 'BLOCK_ONLY_HIGH',
      personGeneration: 'DONT_ALLOW',
    },
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: API_HOST,
        path: `${API_PATH}?key=${API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            if (json.error) {
              return reject(new Error(`Gemini API error ${json.error.code}: ${json.error.message}`))
            }
            const prediction = json.predictions?.[0]
            if (!prediction?.bytesBase64Encoded) {
              return reject(new Error('Resposta inesperada da API — sem imagem gerada'))
            }
            resolve({
              mimeType: prediction.mimeType || 'image/png',
              bytesBase64: prediction.bytesBase64Encoded,
            })
          } catch (e) {
            reject(new Error(`Falha ao parsear resposta: ${e.message}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

/**
 * Salva bytes base64 em um arquivo de imagem.
 * @param {string} bytesBase64
 * @param {string} dest  caminho completo do arquivo de destino
 */
function saveBase64Image(bytesBase64, dest) {
  const buffer = Buffer.from(bytesBase64, 'base64')
  fs.writeFileSync(dest, buffer)
}

/**
 * Extensão correta pelo mimeType retornado pela API.
 * O CSV já define .jpg como destino; este helper resolve conflitos.
 */
function extForMime(mimeType, fallbackFilename) {
  if (mimeType === 'image/png') return fallbackFilename.replace(/\.(jpg|jpeg)$/, '.png')
  return fallbackFilename
}

/** Parseia uma linha CSV respeitando aspas duplas */
function parseCSVLine(line) {
  const cols = []
  let cur = ''
  let inQuote = false
  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      cols.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  cols.push(cur)
  return cols
}

// ---- Main ----
async function main() {
  // Lê o CSV de prompts
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
  const lines = csvContent.trim().split('\n').slice(1) // pula o header

  const products = lines.map((line) => {
    const cols = parseCSVLine(line)
    return {
      template: cols[0],
      categoria: cols[1],
      ordem: cols[2],
      nome: cols[3],
      filename: cols[4],
      prompt: cols[5],
    }
  })

  // Aplica filtros
  let filtered = products
  if (FILTER_TEMPLATE) {
    filtered = products.filter((p) => p.template === FILTER_TEMPLATE)
    console.log(`Filtrando por template: ${FILTER_TEMPLATE} (${filtered.length} produtos)`)
  }
  if (START_FROM > 0) {
    filtered = filtered.slice(START_FROM)
    console.log(`Começando do produto #${START_FROM}`)
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log(`Total a gerar: ${filtered.length} imagens`)
  console.log(`Modelo: ${IMAGEN_MODEL}`)
  if (CONCURRENCY > 1) console.log(`Concorrência: ${CONCURRENCY}`)

  if (DRY_RUN) {
    console.log('\n--- DRY RUN (primeiros 10 prompts) ---')
    filtered.slice(0, 10).forEach((p, i) => {
      console.log(`${START_FROM + i + 1}. [${p.template}] ${p.nome}`)
      console.log(`   prompt: ${p.prompt}`)
      console.log(`   dest:   public/template-images/${p.filename}`)
    })
    console.log('\nArquivo NÃO gerado (--dry-run)')
    return
  }

  // Carrega progresso anterior
  const done = fs.existsSync(PROGRESS_FILE)
    ? JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
    : {}

  let generated = 0
  let skipped = 0
  let errors = 0

  // Processa com pool de concorrência simples
  async function processItem(p, idx) {
    const dest = path.join(OUTPUT_DIR, p.filename)

    if (done[p.filename] || fs.existsSync(dest)) {
      skipped++
      return
    }

    process.stdout.write(`[${idx + 1}/${filtered.length}] ${p.template} — ${p.nome} ... `)

    try {
      const result = await callImagenAPI(p.prompt)
      const finalDest = extForMime(result.mimeType, dest)
      saveBase64Image(result.bytesBase64, finalDest)
      done[p.filename] = true
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(done, null, 2))
      generated++
      console.log('✓')
    } catch (e) {
      errors++
      console.log(`✗ ${e.message}`)
    }
  }

  // Processa em série (ou pool limitado) com rate limiting
  if (CONCURRENCY === 1) {
    for (let i = 0; i < filtered.length; i++) {
      await processItem(filtered[i], i)
      if (i < filtered.length - 1) await sleep(DELAY_MS)
    }
  } else {
    // Pool de concorrência
    let nextIdx = 0
    async function worker() {
      while (true) {
        const idx = nextIdx++
        if (idx >= filtered.length) break
        await processItem(filtered[idx], idx)
        await sleep(DELAY_MS)
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
  }

  console.log('\n✅ Concluído!')
  console.log(`   Geradas:                  ${generated}`)
  console.log(`   Puladas (já existiam):    ${skipped}`)
  console.log(`   Erros:                    ${errors}`)
  console.log(`   Salvas em:                public/template-images/`)
  console.log()
  console.log('Próximo passo:')
  console.log('  node scripts/update-image-map-local.js')
  console.log('  → atualiza lib/generated-template-product-images.ts com os caminhos locais')
}

main().catch((err) => {
  console.error('Erro fatal:', err.message)
  process.exit(1)
})

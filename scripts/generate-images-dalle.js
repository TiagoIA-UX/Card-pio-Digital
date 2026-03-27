/**
 * Gera imagens automaticamente via DALL-E 3 (OpenAI API)
 * e salva em public/template-images/
 *
 * PRÉ-REQUISITO: npm install openai
 * USO: OPENAI_API_KEY=sk-... node scripts/generate-images-dalle.js
 *
 * CUSTO ESTIMADO: ~$0.04/imagem × 877 = ~$35 total
 * TEMPO ESTIMADO: ~2-3 horas (throttle de 5 imagens/min no tier padrão)
 *
 * OPÇÕES:
 *   --template=pizzaria     → gera só um template
 *   --start=50              → continua a partir do produto #50
 *   --dry-run               → mostra prompts sem gerar nada
 */
const fs = require('fs')
const path = require('path')
const https = require('https')

const ROOT = path.resolve(__dirname, '..')
const OUTPUT_DIR = path.join(ROOT, 'public', 'template-images')
const CSV_PATH = path.join(ROOT, 'scripts', 'image-prompts.csv')

// ---- Config ----
const API_KEY = process.env.OPENAI_API_KEY
const DELAY_MS = 13000 // ~4.6 imgs/min → fica abaixo de 5/min (tier 1)
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => a.slice(2).split('='))
)
const FILTER_TEMPLATE = args['template'] || null
const START_FROM = parseInt(args['start'] || '0', 10)
const DRY_RUN = 'dry-run' in args

if (!API_KEY && !DRY_RUN) {
  console.error('❌ Defina a variável: OPENAI_API_KEY=sk-...')
  console.error('   Ou use --dry-run para ver os prompts')
  process.exit(1)
}

// ---- Helpers ----
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https
      .get(url, (res) => {
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve()
        })
      })
      .on('error', (e) => {
        fs.unlink(dest, () => {})
        reject(e)
      })
  })
}

async function generateImage(prompt, filename) {
  const body = JSON.stringify({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'url',
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + API_KEY,
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
            if (json.error) return reject(new Error(json.error.message))
            resolve(json.data[0].url)
          } catch (e) {
            reject(e)
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ---- Main ----
async function main() {
  // Read CSV
  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
  const lines = csvContent.trim().split('\n').slice(1) // skip header

  const products = lines.map((line) => {
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
    return {
      template: cols[0],
      categoria: cols[1],
      ordem: cols[2],
      nome: cols[3],
      filename: cols[4],
      prompt: cols[5],
    }
  })

  // Filter
  let filtered = products
  if (FILTER_TEMPLATE) {
    filtered = products.filter((p) => p.template === FILTER_TEMPLATE)
    console.log('Filtrando por template:', FILTER_TEMPLATE, '(' + filtered.length + ' produtos)')
  }
  if (START_FROM > 0) {
    filtered = filtered.slice(START_FROM)
    console.log('Começando do produto #' + START_FROM)
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  console.log('Total a gerar:', filtered.length, 'imagens')
  if (DRY_RUN) {
    console.log('\n--- DRY RUN (primeiros 10 prompts) ---')
    filtered.slice(0, 10).forEach((p, i) => {
      console.log(START_FROM + i + 1 + '. [' + p.template + '] ' + p.nome)
      console.log('   prompt: ' + p.prompt)
      console.log('   dest:   public/template-images/' + p.filename)
    })
    return
  }

  // Track progress
  const progressFile = path.join(__dirname, '.dalle-progress.json')
  const done = fs.existsSync(progressFile) ? JSON.parse(fs.readFileSync(progressFile, 'utf-8')) : {}

  let generated = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < filtered.length; i++) {
    const p = filtered[i]
    const dest = path.join(OUTPUT_DIR, p.filename)

    if (done[p.filename] || fs.existsSync(dest)) {
      skipped++
      continue
    }

    process.stdout.write(
      '[' + (i + 1) + '/' + filtered.length + '] ' + p.template + ' — ' + p.nome + ' ... '
    )

    try {
      const imgUrl = await generateImage(p.prompt, p.filename)
      await downloadImage(imgUrl, dest)
      done[p.filename] = true
      fs.writeFileSync(progressFile, JSON.stringify(done))
      generated++
      console.log('✓')
    } catch (e) {
      errors++
      console.log('✗ ' + e.message)
    }

    if (i < filtered.length - 1) await sleep(DELAY_MS)
  }

  console.log('\n✅ Concluído!')
  console.log('   Geradas:', generated)
  console.log('   Puladas (já existiam):', skipped)
  console.log('   Erros:', errors)
  console.log('   Salvas em: public/template-images/')
  console.log('\nPróximo passo: rode node scripts/update-image-map-local.js para')
  console.log('atualizar lib/generated-template-product-images.ts com os caminhos locais.')
}

main().catch(console.error)

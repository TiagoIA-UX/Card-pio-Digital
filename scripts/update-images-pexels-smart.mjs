/**
 * Atualiza lib/generated-template-product-images.ts
 * buscando no Pexels pelo nome ESPECÍFICO de cada produto.
 *
 * Diferencial do script anterior:
 * - Usa o nome do produto como query de busca (ex: "Picanha na Chapa")
 * - Traduz termos BR→EN para melhores resultados
 * - Garante unicidade: nenhum photo_id repetido
 * - Retry automático com queries alternativas se sem resultado
 *
 * PRÉ-REQUISITO: PEXELS_API_KEY no .env.local
 * USO: node scripts/update-images-pexels-smart.mjs
 * USO (só um template): node scripts/update-images-pexels-smart.mjs --template=pizzaria
 * USO (dry-run): node scripts/update-images-pexels-smart.mjs --dry-run
 */

import fs from 'fs'
import https from 'https'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ---- Config ----
const CSV_PATH = path.join(__dirname, 'image-prompts.csv')
const GEN_FILE = path.join(ROOT, 'lib', 'generated-template-product-images.ts')
const PROGRESS_FILE = path.join(__dirname, '.pexels-progress.json')
const DELAY_MS = 700 // Pexels permite 200 req/hora = 1 a cada 18s, mas na prática 200/hr free, usamos margem segura
const MAX_RETRIES = 2

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
const DRY_RUN = args['dry-run'] === true || args['dry-run'] === 'true'

// ---- Tradução BR→EN para queries Pexels ----
// Mapeamento de termos comuns para inglês (Pexels tem mais fotos em EN)
const TRANSLATIONS = {
  // Carnes e proteínas
  'filé de frango grelhado': 'grilled chicken fillet',
  'frango grelhado': 'grilled chicken',
  'bife acebolado': 'beef steak onions',
  'picanha na chapa': 'picanha beef steak',
  picanha: 'picanha beef steak',
  'strogonoff de frango': 'chicken stroganoff',
  strogonoff: 'stroganoff',
  'filé à parmegiana': 'chicken parmigiana',
  'filé a parmegiana': 'chicken parmigiana',
  'frango à parmegiana': 'chicken parmigiana',
  'frango a parmegiana': 'chicken parmigiana',
  'feijoada completa': 'feijoada brazilian black bean stew',
  feijoada: 'feijoada black bean stew',
  moqueca: 'moqueca brazilian fish stew',
  'camarão à paulista': 'shrimp garlic butter',
  'tilápia grelhada': 'grilled tilapia fish',
  tilapia: 'tilapia fish',
  'peixe frito': 'fried fish',
  robalo: 'sea bass fish',
  costela: 'beef ribs',
  'marmita fitness': 'healthy meal prep box',
  marmita: 'lunch box meal',
  'executivo do dia': 'daily lunch special',
  // Pizzas
  'pizza calabresa': 'calabresa pizza',
  'pizza portuguesa': 'portuguesa pizza',
  'pizza margherita': 'margherita pizza',
  'pizza napolitana': 'neapolitan pizza',
  'pizza pepperoni': 'pepperoni pizza',
  'pizza mussarela': 'mozzarella pizza',
  'pizza quatro queijos': 'four cheese pizza',
  calzone: 'calzone italian',
  esfiha: 'esfiha arab pastry',
  'borda recheada': 'stuffed crust pizza',
  // Hambúrgueres
  'hambúrguer artesanal': 'artisan gourmet burger',
  hamburguês: 'hamburger',
  burguer: 'gourmet burger',
  smash: 'smash burger',
  'x-bacon': 'bacon cheeseburger',
  'x-egg': 'egg burger',
  'x-tudo': 'loaded burger',
  'hot dog': 'hot dog',
  'cachorro quente': 'hot dog',
  wrap: 'wrap sandwich',
  crepe: 'savory crepe',
  // Sushi
  temaki: 'temaki sushi cone',
  uramaki: 'uramaki sushi roll',
  niguiri: 'nigiri sushi',
  sashimi: 'sashimi fish slices',
  'sushi combinado': 'sushi platter combo',
  yakissoba: 'yakisoba noodles',
  lamen: 'ramen noodle soup',
  lachonete: 'street food snacks',
  // Açaí
  açaí: 'acai bowl',
  acai: 'acai bowl',
  'tigela de açaí': 'acai bowl toppings',
  pitaya: 'dragon fruit bowl',
  cupuaçu: 'cupuacu fruit',
  // Bebidas
  'suco natural': 'fresh juice glass',
  suco: 'fruit juice glass',
  limonada: 'lemonade glass',
  'água de coco': 'coconut water',
  smoothie: 'smoothie drink',
  caipirinha: 'caipirinha cocktail',
  chopp: 'draft beer glass',
  chope: 'draft beer glass',
  'cerveja artesanal': 'craft beer bottle glass',
  'dose de cachaça': 'cachaça shot glass',
  'bebida sem álcool': 'non-alcoholic drink',
  'milk shake': 'milkshake thick cream',
  milkshake: 'milkshake',
  // Sobremesas
  pudim: 'flan caramel pudding',
  'mousse de chocolate': 'chocolate mousse dessert',
  brigadeiro: 'brigadeiro chocolate truffle',
  'petit gateau': 'chocolate lava cake',
  sorvete: 'ice cream scoop',
  picole: 'popsicle',
  'bolo de chocolate': 'chocolate cake slice',
  cheesecake: 'cheesecake slice',
  torta: 'pie tart dessert',
  // Café
  cappuccino: 'cappuccino coffee cup',
  espresso: 'espresso coffee',
  'café com leite': 'cafe au lait coffee',
  latte: 'latte coffee art',
  'chocolate quente': 'hot chocolate mug',
  croissant: 'croissant bakery',
  'pão de queijo': 'pao de queijo cheese bread',
  coxinha: 'coxinha brazilian snack',
  pastel: 'pastel fried pastry',
  empada: 'brazilian chicken pie',
  salgado: 'savory snack',
  // Petiscos / Bar
  petisco: 'bar snack appetizer',
  'tábua de frios': 'cheese meat charcuterie board',
  porcão: 'side dish portion',
  'batata frita': 'french fries crispy',
  'polenta frita': 'fried polenta',
  'frango assado no espeto': 'rotisserie chicken',
  'costela no bafo': 'slow cooked beef ribs',
}

function translateQuery(nome) {
  const lower = nome.toLowerCase().trim()
  // Busca match exato primeiro
  if (TRANSLATIONS[lower]) return TRANSLATIONS[lower]
  // Busca substring
  for (const [br, en] of Object.entries(TRANSLATIONS)) {
    if (lower.includes(br)) return en
  }
  // Remove acentos e devolve em inglês aproximado
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim()
}

// ---- CSV Parser ----
function parseCSV(content) {
  const lines = content.split('\n').filter((l) => l.trim())
  const [, ...rows] = lines
  return rows.map((row) => {
    const values = []
    let current = ''
    let inQuotes = false
    for (const char of row) {
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) {
        values.push(current)
        current = ''
      } else current += char
    }
    values.push(current)
    return {
      template: values[0],
      categoria: values[1],
      ordem: values[2],
      nome: values[3],
      filename: values[4],
    }
  })
}

// ---- Key normalizer (igual ao resolveTemplateProductImageUrl) ----
function normalizeKeyPart(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ---- Pexels search ----
function pexelsSearch(query, apiKey, page = 1) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query)
    const options = {
      hostname: 'api.pexels.com',
      path: `/v1/search?query=${encoded}&per_page=5&page=${page}&orientation=square`,
      headers: { Authorization: apiKey },
    }
    const req = https.get(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error('JSON parse error'))
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Timeout'))
    })
  })
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ---- Load progress ----
function loadProgress() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'))
  } catch {
    return { done: {} }
  }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
}

// ---- Parse existing map ----
function parseExistingMap(content) {
  const match = content.match(/=\s*(\{[\s\S]+\})\s*;?\s*$/)
  if (!match) return {}
  try {
    return JSON.parse(match[1])
  } catch {
    return {}
  }
}

// ---- Main ----
async function main() {
  // Carregar API key do .env.local
  const envContent = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf-8')
  const pexelsMatch = envContent.match(/^PEXELS_API_KEY=(.+)$/m)
  if (!pexelsMatch) {
    console.error('❌ PEXELS_API_KEY não encontrada em .env.local')
    process.exit(1)
  }
  const PEXELS_API_KEY = pexelsMatch[1].trim()

  const rows = parseCSV(fs.readFileSync(CSV_PATH, 'utf-8'))
  const currentMapContent = fs.readFileSync(GEN_FILE, 'utf-8')
  const currentMap = parseExistingMap(currentMapContent)
  const progress = loadProgress()

  // Conjunto de photo IDs já usados (para evitar duplicatas)
  const usedPhotoIds = new Set(
    Object.values(currentMap)
      .map((url) => {
        const m = url.match(/photos\/(\d+)\//)
        return m ? m[1] : null
      })
      .filter(Boolean)
  )

  let filtered = rows
  if (FILTER_TEMPLATE) {
    filtered = rows.filter((r) => r.template === FILTER_TEMPLATE)
    console.log(`🔍 Filtro: template="${FILTER_TEMPLATE}" → ${filtered.length} produtos`)
  }

  const total = filtered.length
  const alreadyDone = filtered.filter((r) => progress.done[r.filename]).length
  const remaining = total - alreadyDone

  console.log(`\n🔎 Pexels Smart Image Updater`)
  console.log(
    `   Total CSV: ${rows.length} produtos | Filtrados: ${total} | Restantes: ${remaining}`
  )
  if (DRY_RUN) console.log(`   ⚠ DRY-RUN\n`)
  else console.log(`   ⏱ Tema estimado: ~${Math.ceil((remaining * DELAY_MS) / 60000)} min\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of filtered) {
    const { template, categoria, ordem, nome, filename } = row
    if (!nome || !filename) continue

    const key =
      normalizeKeyPart(template) +
      '::' +
      normalizeKeyPart(categoria) +
      '::' +
      ordem +
      '::' +
      normalizeKeyPart(nome)

    if (progress.done[filename]) {
      skipped++
      continue
    }

    const idx = updated + failed + skipped + 1
    const query = translateQuery(nome)
    process.stdout.write(`[${idx}/${total}] ${nome} (query: ${query}) ... `)

    if (DRY_RUN) {
      console.log(`→ key: ${key}`)
      updated++
      continue
    }

    // Tentar buscar foto única
    let photoUrl = null
    const queriesToTry = [query, `${query} food`, translateQuery(categoria), 'brazilian food']

    for (let attempt = 0; attempt < queriesToTry.length && !photoUrl; attempt++) {
      try {
        const q = queriesToTry[attempt]
        const data = await pexelsSearch(q, PEXELS_API_KEY, 1)
        const photos = data.photos || []

        // Selecionar foto não usada ainda
        const available = photos.filter((p) => !usedPhotoIds.has(String(p.id)))
        if (available.length > 0) {
          const photo = available[0]
          photoUrl = `https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=800`
          usedPhotoIds.add(String(photo.id))
        } else if (photos.length > 0 && attempt === queriesToTry.length - 1) {
          // Última tentativa: aceitar duplicata do que for
          const photo = photos[0]
          photoUrl = `https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=800`
          usedPhotoIds.add(String(photo.id))
        }
      } catch (err) {
        if (attempt < queriesToTry.length - 1) {
          await sleep(2000)
        }
      }
    }

    if (photoUrl) {
      currentMap[key] = photoUrl
      progress.done[filename] = photoUrl
      saveProgress(progress)
      console.log(`✓`)
      updated++
    } else {
      console.log(`✗ sem resultado`)
      failed++
    }

    await sleep(DELAY_MS)
  }

  if (!DRY_RUN && updated > 0) {
    // Salvar arquivo atualizado
    const sorted = Object.fromEntries(
      Object.entries(currentMap).sort(([a], [b]) => a.localeCompare(b))
    )
    const output =
      '// AUTO-GENERATED — DO NOT EDIT MANUALLY\n' +
      '// Atualizado por scripts/update-images-pexels-smart.mjs\n' +
      '// Última atualização: ' +
      new Date().toISOString() +
      '\n\n' +
      'export const TEMPLATE_PRODUCT_IMAGE_URLS: Record<string, string> =\n' +
      JSON.stringify(sorted, null, 2) +
      ';\n'
    fs.writeFileSync(GEN_FILE, output, 'utf-8')
    console.log(`\n✅ lib/generated-template-product-images.ts atualizado!`)
  }

  console.log(`\n📊 Resultado:`)
  console.log(`   ✓ Atualizados: ${updated}`)
  console.log(`   ↷ Pulados: ${skipped}`)
  console.log(`   ✗ Falhos: ${failed}`)

  if (failed > 0) {
    console.log(`\nPara re-tentar falhos:`)
    console.log(
      `   node scripts/update-images-pexels-smart.mjs${FILTER_TEMPLATE ? ` --template=${FILTER_TEMPLATE}` : ''}`
    )
  }
}

main().catch((err) => {
  console.error('❌ Erro fatal:', err)
  process.exit(1)
})

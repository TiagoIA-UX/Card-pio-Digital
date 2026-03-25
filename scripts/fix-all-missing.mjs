/**
 * Comprehensive fix: adds missing product images + fixes açaí hero.
 * 
 * - Reads missing-products.json (52 missing products)
 * - Searches Pexels for each with curated search terms
 * - Updates generated-template-product-images.ts
 * - Also searches for a proper açaí hero image
 *
 * Usage:
 *   $env:PEXELS_API_KEY = "..."; node scripts/fix-all-missing.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const API_KEY = process.env.PEXELS_API_KEY
if (!API_KEY) { console.error('Missing PEXELS_API_KEY'); process.exit(1) }

const GENERATED_FILE = resolve(ROOT, 'lib/generated-template-product-images.ts')

// ─── Collect used photo IDs ────────────────────────────────────
const usedPhotoIds = new Set()
const existingContent = readFileSync(GENERATED_FILE, 'utf-8')
const existingRegex = /pexels-photo-(\d+)/g
let em
while ((em = existingRegex.exec(existingContent)) !== null) {
  usedPhotoIds.add(em[1])
}
console.log(`Loaded ${usedPhotoIds.size} existing photo IDs`)

// ─── Read missing products ────────────────────────────────────
const missingProducts = JSON.parse(readFileSync(resolve(ROOT, 'scripts/missing-products.json'), 'utf-8'))
console.log(`Missing products to fix: ${missingProducts.length}\n`)

// ─── Curated search terms for each missing product ────────────
// Key pattern: slug::categoria → search term base
const SEARCH_TERMS = {
  // Pizzaria - Pizzas Tradicionais (all 11 missing)
  'pizzaria::calabresa': 'pepperoni pizza traditional',
  'pizzaria::mussarela': 'mozzarella cheese pizza',
  'pizzaria::portuguesa': 'portuguese pizza ham egg olive',
  'pizzaria::frango-com-catupiry': 'chicken cream cheese pizza',
  'pizzaria::napolitana': 'neapolitan pizza tomato fresh',
  'pizzaria::bacon': 'bacon pizza crispy',
  'pizzaria::atum': 'tuna fish pizza',
  'pizzaria::palmito': 'palm heart pizza brazilian',
  'pizzaria::milho-com-bacon': 'corn bacon pizza',
  'pizzaria::escarola-com-bacon': 'escarole endive pizza',
  'pizzaria::aliche': 'anchovy pizza olive oil',

  // Adega - Gelo & Acessórios (2 missing)
  'adega::carvao-vegetal-3kg': 'charcoal bag barbecue',
  'adega::copo-descartavel-300ml-pct-50un': 'disposable plastic cups party',

  // Mercadinho - Laticínios & Frios (12 missing)
  'mercadinho::leite-integral-ninho-1l': 'whole milk carton box',
  'mercadinho::leite-desnatado-parmalat-1l': 'skim milk carton dairy',
  'mercadinho::iogurte-danone-morango-900g': 'strawberry yogurt cup',
  'mercadinho::iogurte-grego-vigor-100g': 'greek yogurt small cup',
  'mercadinho::queijo-mussarela-tirolez-fatiado-150g': 'sliced mozzarella cheese package',
  'mercadinho::queijo-prato-tirolez-fatiado-150g': 'sliced yellow cheese package',
  'mercadinho::presunto-cozido-sadia-fatiado-200g': 'sliced cooked ham package deli',
  'mercadinho::requeijao-cremoso-catupiry-200g': 'cream cheese spread jar',
  'mercadinho::manteiga-presidente-com-sal-200g': 'butter package salted',
  'mercadinho::cream-cheese-philadelphia-150g': 'cream cheese philadelphia',
  'mercadinho::mortadela-ceratti-fatiada-200g': 'mortadella sliced deli meat',
  'mercadinho::peito-de-peru-sadia-fatiado-200g': 'turkey breast sliced deli',

  // Mercadinho - Higiene Pessoal (9 missing)
  'mercadinho::sabonete-dove-original-90g': 'dove soap bar white',
  'mercadinho::shampoo-pantene-restauracao-400ml': 'shampoo bottle hair care',
  'mercadinho::condicionador-pantene-restauracao-400ml': 'conditioner bottle hair product',
  'mercadinho::desodorante-rexona-aerosol-150ml': 'deodorant spray aerosol',
  'mercadinho::creme-dental-colgate-total-12-90g': 'toothpaste tube dental care',
  'mercadinho::papel-higienico-neve-folha-dupla-12un': 'toilet paper rolls package',
  'mercadinho::escova-dental-oral-b-indicator': 'toothbrush oral care',
  'mercadinho::absorvente-always-noturno-8un': 'feminine hygiene product pad package',
  'mercadinho::protetor-solar-sundown-fps-50-200ml': 'sunscreen lotion bottle spf',

  // Mercadinho - Utilidades (7 missing)
  'mercadinho::carvao-vegetal-3kg': 'charcoal bag barbecue grill',
  'mercadinho::gelo-em-cubo-3kg': 'ice cubes bag frozen',
  'mercadinho::copos-descartaveis-300ml-50un': 'disposable cups plastic party',
  'mercadinho::guardanapo-snob-50-folhas': 'paper napkins white stack',
  'mercadinho::pilha-duracell-aa-4un': 'AA batteries pack alkaline',
  'mercadinho::isqueiro-bic-maxi': 'lighter bic flame',
  'mercadinho::fosforo-fiat-lux-cx-longa': 'matchbox matches wooden',

  // Açougue - Embutidos & Linguiças (7 missing)
  'acougue::linguica-toscana-seara-700g': 'italian sausage toscana raw',
  'acougue::linguica-de-frango-sadia-500g': 'chicken sausage link',
  'acougue::linguica-calabresa-perdigao-400g': 'calabresa sausage smoked',
  'acougue::salsicha-hot-dog-sadia-500g': 'hot dog sausage frank',
  'acougue::bacon-em-manta-500g': 'slab bacon raw pork',
  'acougue::linguica-artesanal-apimentada-kg': 'artisan spicy sausage',
  'acougue::kafta-500g': 'kafta kebab ground meat seasoned',

  // Açougue - Acompanhamentos (3 missing)
  'acougue::carvao-vegetal-3kg': 'charcoal bag barbeque',
  'acougue::carvao-vegetal-5kg': 'large charcoal bag grill',
  'acougue::gelo-em-cubo-3kg': 'ice cubes bag clear',

  // Doceria - Docinhos para Festa (1 missing)
  'doceria::cento-de-brigadeiros-tradicionais': 'brigadeiro brazilian chocolate truffle tray',
}

// ─── Pexels API ─────────────────────────────────────────────
async function searchPexels(query, perPage = 15) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`
  const res = await fetch(url, { headers: { Authorization: API_KEY } })
  if (res.status === 429) {
    console.log('  ⏳ Rate limited. Waiting 60s...')
    await new Promise(r => setTimeout(r, 60_000))
    return searchPexels(query, perPage)
  }
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${res.statusText}`)
  const data = await res.json()
  return data.photos || []
}

function pickUnique(photos) {
  for (const photo of photos) {
    const id = String(photo.id)
    if (!usedPhotoIds.has(id)) {
      usedPhotoIds.add(id)
      return photo
    }
  }
  return null
}

function photoUrl(photo) {
  return `https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=800`
}

function deriveSearchKey(product) {
  const namePart = product.key.split('::').pop()
  return `${product.slug}::${namePart}`
}

function deriveSearchTerm(product) {
  // Fallback: use product name parts as search
  const name = product.nome
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
  const cat = product.categoria
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
  return `${name} ${cat} food`.toLowerCase()
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log(`\n🔧 Fixing all missing product images (${missingProducts.length} products)\n`)

  // First: search for açaí hero image
  console.log('🍇 Searching for açaí hero banner image...')
  const heroPhotos = await searchPexels('acai bowl purple berry topping overhead', 15)
  const heroPhoto = pickUnique(heroPhotos)
  let heroUrl = null
  if (heroPhoto) {
    heroUrl = `https://images.pexels.com/photos/${heroPhoto.id}/pexels-photo-${heroPhoto.id}.jpeg?auto=compress&cs=tinysrgb&w=1200`
    console.log(`  ✅ Hero photo: ${heroPhoto.id}\n`)
  } else {
    console.log('  ❌ No hero photo found\n')
  }
  await new Promise(r => setTimeout(r, 1800))

  // Also search for category fallback image (açaí/tigela/pitaya etc.)
  console.log('🍇 Searching for açaí category fallback image...')
  const catPhotos = await searchPexels('acai smoothie bowl fruit toppings', 15)
  const catPhoto = pickUnique(catPhotos)
  let catFallbackUrl = null
  if (catPhoto) {
    catFallbackUrl = `https://images.pexels.com/photos/${catPhoto.id}/pexels-photo-${catPhoto.id}.jpeg?auto=compress&cs=tinysrgb&w=600`
    console.log(`  ✅ Category fallback photo: ${catPhoto.id}\n`)
  }
  await new Promise(r => setTimeout(r, 1800))

  // Also search for "adicionais/complementos" category fallback
  console.log('🍇 Searching for adicionais category fallback image...')
  const addPhotos = await searchPexels('acai bowl toppings granola fruit banana', 15)
  const addPhoto = pickUnique(addPhotos)
  let addFallbackUrl = null
  if (addPhoto) {
    addFallbackUrl = `https://images.pexels.com/photos/${addPhoto.id}/pexels-photo-${addPhoto.id}.jpeg?auto=compress&cs=tinysrgb&w=600`
    console.log(`  ✅ Adicionais fallback photo: ${addPhoto.id}\n`)
  }
  await new Promise(r => setTimeout(r, 1800))

  // Now fix all missing products
  const results = new Map()
  for (let i = 0; i < missingProducts.length; i++) {
    const product = missingProducts[i]
    const searchKey = deriveSearchKey(product)
    const searchTerm = SEARCH_TERMS[searchKey] || deriveSearchTerm(product)

    process.stdout.write(`  [${i + 1}/${missingProducts.length}] "${searchTerm.substring(0, 50)}"... `)

    const photos = await searchPexels(searchTerm)
    const photo = pickUnique(photos)

    if (photo) {
      results.set(product.key, photoUrl(photo))
      console.log(`✅ photo ${photo.id}`)
    } else {
      // Broader fallback
      const broader = searchTerm.split(' ').slice(0, 2).join(' ') + ' food'
      const fallbackPhotos = await searchPexels(broader, 30)
      const fallbackPhoto = pickUnique(fallbackPhotos)
      if (fallbackPhoto) {
        results.set(product.key, photoUrl(fallbackPhoto))
        console.log(`✅ photo ${fallbackPhoto.id} (fallback)`)
      } else {
        console.log(`❌ no photo found`)
      }
    }
    await new Promise(r => setTimeout(r, 1800))
  }

  // ─── Update the generated-template-product-images.ts ────────
  console.log('\n📝 Updating generated file...')

  const mapRegex = /"([^"]+)":\s*"([^"]+)"/g
  const allEntries = new Map()
  let mm
  while ((mm = mapRegex.exec(existingContent)) !== null) {
    allEntries.set(mm[1], mm[2])
  }

  let added = 0
  for (const [key, url] of results) {
    if (!allEntries.has(key)) added++
    allEntries.set(key, url)
  }

  const sortedKeys = [...allEntries.keys()].sort()
  const lines = sortedKeys.map(k => `  "${k}": "${allEntries.get(k)}"`)

  const output = `/**
 * Mapeamento gerado em lote para imagens individuais de produtos dos templates.
 *
 * Chave (string) criada com \`getTemplateProductImageKey\`
 * (ver \`lib/template-product-images.ts\`).
 *
 * Gerado automaticamente - ${new Date().toISOString().slice(0, 10)}
 * Total: ${sortedKeys.length} imagens mapeadas
 * Fotos únicas: ${sortedKeys.length}
 */
export const TEMPLATE_PRODUCT_IMAGE_URLS: Record<string, string> = {
${lines.join(',\n')}
}
`

  writeFileSync(GENERATED_FILE, output, 'utf-8')
  console.log(`  Added ${added} new entries. Total: ${sortedKeys.length}`)

  // ─── Output hero & fallback info ────────────────────────────
  console.log('\n═══ HERO & FALLBACK URLS ═══')
  if (heroUrl) console.log(`ACAI_HERO: ${heroUrl}`)
  if (catFallbackUrl) console.log(`ACAI_CAT_FALLBACK: ${catFallbackUrl}`)
  if (addFallbackUrl) console.log(`ADICIONAIS_FALLBACK: ${addFallbackUrl}`)

  console.log('\n✅ Concluído!')
  console.log(`   Products added: ${added}`)
  console.log(`   Total entries: ${sortedKeys.length}`)
}

main().catch(err => { console.error(err); process.exit(1) })

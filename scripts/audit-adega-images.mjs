/**
 * Audit adega product images — fetches alt text from Pexels for each product
 * and flags mismatches.
 *
 * Usage:
 *   $env:PEXELS_API_KEY = "..."; node scripts/audit-adega-images.mjs
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const API_KEY = process.env.PEXELS_API_KEY
if (!API_KEY) { console.error('Missing PEXELS_API_KEY'); process.exit(1) }

const GEN_FILE = resolve(ROOT, 'lib/generated-template-product-images.ts')

// Extract all adega entries
function getAdegaEntries(content) {
  const regex = /"adega::([^"]+)":\s*"https:\/\/images\.pexels\.com\/photos\/(\d+)\//g
  const entries = []
  let m
  while ((m = regex.exec(content)) !== null) {
    const key = m[1]
    const photoId = m[2]
    // Extract product name from key: categoria::ordem::nome-slug
    const parts = key.split('::')
    const nameSlug = parts[2] || parts[1] || key
    const productName = nameSlug.replace(/-/g, ' ')
    entries.push({ key, photoId, productName, category: parts[0] })
  }
  return entries
}

async function getPhotoDetails(photoId) {
  const url = `https://api.pexels.com/v1/photos/${photoId}`
  const res = await fetch(url, { headers: { Authorization: API_KEY } })
  if (res.status === 429) {
    console.log('  ⏳ Rate limited. Waiting 60s...')
    await new Promise(r => setTimeout(r, 60_000))
    return getPhotoDetails(photoId)
  }
  if (!res.ok) return null
  return res.json()
}

// Semantic relevance checker
function isRelevant(productName, category, alt) {
  if (!alt) return { ok: false, reason: 'no alt text' }
  const a = alt.toLowerCase()
  const p = productName.toLowerCase()
  const c = category.toLowerCase()

  // Build expected keywords based on category and product
  const categoryKeywords = {
    'cervejas-lata': ['beer', 'cerveja', 'can', 'lata', 'lager', 'ale', 'brew', 'pint', 'draft', 'alcohol', 'drink'],
    'cervejas-long-neck': ['beer', 'cerveja', 'bottle', 'long neck', 'lager', 'ale', 'brew', 'alcohol', 'drink'],
    'cervejas-600ml-litrao': ['beer', 'cerveja', 'bottle', 'lager', 'ale', 'brew', 'alcohol', 'drink'],
    'cervejas-artesanais-especiais': ['beer', 'cerveja', 'craft', 'artisan', 'bottle', 'brew', 'alcohol', 'drink'],
    'vinhos-tintos': ['wine', 'vinho', 'red', 'bottle', 'glass', 'grape', 'tinto'],
    'vinhos-brancos-roses': ['wine', 'vinho', 'white', 'rosé', 'rose', 'bottle', 'glass', 'grape'],
    'espumantes': ['champagne', 'sparkling', 'espumante', 'prosecco', 'bottle', 'celebration', 'toast', 'wine', 'bubbly'],
    'whisky': ['whisky', 'whiskey', 'bourbon', 'scotch', 'spirit', 'glass', 'bottle', 'amber', 'drink', 'alcohol'],
    'vodka': ['vodka', 'spirit', 'bottle', 'clear', 'drink', 'alcohol', 'cocktail'],
    'gin': ['gin', 'tonic', 'botanical', 'spirit', 'bottle', 'drink', 'alcohol', 'cocktail'],
    'rum-cachaca': ['rum', 'cachaça', 'spirit', 'bottle', 'drink', 'alcohol', 'cocktail', 'sugar'],
    'drinks-prontos-ice': ['drink', 'cocktail', 'ice', 'ready', 'bottle', 'alcohol', 'beverage', 'cooler'],
    'energeticos': ['energy', 'drink', 'can', 'caffeine', 'beverage', 'energetic'],
    'refrigerantes-agua': ['soda', 'water', 'cola', 'soft drink', 'juice', 'beverage', 'bottle', 'can', 'refreshment'],
    'gelo-acessorios': ['ice', 'charcoal', 'cup', 'lime', 'lemon', 'accessory', 'grill', 'party'],
    'petiscos-acompanhamentos': ['snack', 'nuts', 'chips', 'appetizer', 'food', 'peanut', 'salami'],
    'combos-kits-praia': ['beach', 'party', 'beer', 'cooler', 'kit', 'celebration', 'drink', 'outdoor'],
  }

  const keywords = categoryKeywords[c] || ['drink', 'food', 'beverage']
  const found = keywords.some(kw => a.includes(kw))

  // Also check for completely wrong subjects
  const wrongSubjects = ['soap', 'dove', 'shampoo', 'cleaning', 'laundry', 'clothes', 'fashion',
    'computer', 'phone', 'laptop', 'car', 'building', 'architecture', 'office',
    'baby', 'children', 'toy', 'cat ', 'dog ', 'pet', 'flower', 'plant', 
    'book', 'pen', 'paper', 'desk', 'chair', 'furniture']
  const hasWrong = wrongSubjects.some(w => a.includes(w))

  if (hasWrong) return { ok: false, reason: `WRONG SUBJECT: "${alt}"` }
  if (!found) return { ok: false, reason: `NO KEYWORD MATCH: "${alt}"` }
  return { ok: true, reason: alt }
}

async function main() {
  const content = readFileSync(GEN_FILE, 'utf-8')
  const entries = getAdegaEntries(content)
  console.log(`\n🔍 Auditing ${entries.length} adega product images\n`)

  const problems = []
  const noAlt = []

  for (let i = 0; i < entries.length; i++) {
    const { key, photoId, productName, category } = entries[i]
    process.stdout.write(`  [${i + 1}/${entries.length}] ${productName.substring(0, 35).padEnd(35)} `)

    const photo = await getPhotoDetails(photoId)
    if (!photo) {
      console.log(`❌ photo ${photoId} NOT FOUND`)
      problems.push({ ...entries[i], reason: 'PHOTO NOT FOUND' })
      continue
    }

    const alt = photo.alt || ''
    const check = isRelevant(productName, category, alt)

    if (check.ok) {
      console.log(`✅ "${alt.substring(0, 50)}"`)
    } else {
      console.log(`⚠️  ${check.reason.substring(0, 60)}`)
      problems.push({ ...entries[i], reason: check.reason, alt })
    }

    // Respect rate limits (200/hr = 1 every 18s, but let's be faster with bursts)
    await new Promise(r => setTimeout(r, 400))
  }

  console.log('\n═══ AUDIT RESULTS ═══')
  console.log(`  Total: ${entries.length}`)
  console.log(`  OK: ${entries.length - problems.length}`)
  console.log(`  Problems: ${problems.length}`)

  if (problems.length > 0) {
    console.log('\n⚠️  PROBLEMS:')
    for (const p of problems) {
      console.log(`  ${p.productName} (${p.category}) → photo ${p.photoId}`)
      console.log(`    ${p.reason}`)
    }
  }

  // Output JSON for fix script
  if (problems.length > 0) {
    const json = JSON.stringify(problems.map(p => ({
      key: `adega::${p.key}`,
      product: p.productName,
      category: p.category,
      photoId: p.photoId,
      reason: p.reason,
    })), null, 2)
    const { writeFileSync } = await import('node:fs')
    writeFileSync(resolve(ROOT, 'scripts/adega-image-problems.json'), json)
    console.log('\n📝 Problems written to scripts/adega-image-problems.json')
  }

  console.log('\n✅ Audit concluído!')
}

main().catch(err => { console.error(err); process.exit(1) })

/**
 * Fix ALL template hero images — replaces Unsplash with curated Pexels.
 * Uses highly specific search terms to guarantee correct subject matter.
 *
 * Usage:
 *   $env:PEXELS_API_KEY = "..."; node scripts/fix-hero-images.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const API_KEY = process.env.PEXELS_API_KEY
if (!API_KEY) { console.error('Missing PEXELS_API_KEY'); process.exit(1) }

const CONFIG_FILE = resolve(ROOT, 'lib/templates-config.ts')

// ─── Hero search terms (curated for each template) ─────────
const HERO_SEARCHES = [
  {
    slug: 'restaurante',
    search: 'restaurant food plate dinner table elegant',
    oldPattern: 'photo-1504674900247-0877df9cc836',
  },
  {
    slug: 'pizzaria',
    search: 'pizza oven fresh baked pepperoni cheese',
    oldPattern: 'photo-1513104890138-7c749659a591',
  },
  {
    slug: 'lanchonete',
    search: 'hamburger burger fries fast food gourmet',
    oldPattern: 'photo-1550547660-d9450f859349',
  },
  {
    slug: 'bar',
    search: 'bar cocktail drinks pub nightlife counter',
    oldPattern: 'photo-1514933651103-005eec06c04b',
  },
  {
    slug: 'cafeteria',
    search: 'coffee shop latte art barista cafe cup',
    oldPattern: 'photo-1495474472287-4d71bcdd2085',
  },
  {
    slug: 'sushi',
    search: 'sushi platter japanese food sashimi fresh salmon',
    oldPattern: 'photo-1579584425555-c3ce17fd4351',
  },
  {
    slug: 'adega',
    search: 'wine bottles cellar store liquor spirits',
    oldPattern: 'photo-1510812431401-41d2bd2722f3',
  },
  {
    slug: 'mercadinho',
    search: 'grocery store market shelves supermarket aisle products',
    oldPattern: 'photo-1604719312566-8912e9227c6a',
  },
  {
    slug: 'padaria',
    search: 'bakery fresh bread loaves artisan baguette',
    oldPattern: 'photo-1509440159596-0249088772ff',
  },
  {
    slug: 'sorveteria',
    search: 'ice cream scoops cone colorful gelato',
    oldPattern: 'photo-1501443762994-82bd5dace89a',
  },
  {
    slug: 'acougue',
    search: 'butcher shop meat cuts steak beef display',
    oldPattern: 'photo-1607623814075-e51df1bdc82f',
  },
  {
    slug: 'hortifruti',
    search: 'fresh fruits vegetables market colorful produce',
    oldPattern: 'photo-1542838132-92c53300491e',
  },
  {
    slug: 'petshop',
    search: 'pet shop dog cat supplies store animals',
    oldPattern: 'photo-1587300003388-59208cc962cb',
  },
  {
    slug: 'doceria',
    search: 'bakery sweets cupcake cake candy confectionery brigadeiro',
    oldPattern: 'photo-1558326567-98ae2405596b',
  },
]

// ─── Pexels API ─────────────────────────────────────────────
const usedIds = new Set()

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
    if (!usedIds.has(id)) {
      usedIds.add(id)
      return photo
    }
  }
  return null
}

// ─── Main ───────────────────────────────────────────────────
async function main() {
  console.log(`\n🖼️  Fixing ALL template hero images (${HERO_SEARCHES.length} templates)\n`)

  let content = readFileSync(CONFIG_FILE, 'utf-8')
  const results = []

  for (let i = 0; i < HERO_SEARCHES.length; i++) {
    const { slug, search, oldPattern } = HERO_SEARCHES[i]
    process.stdout.write(`  [${i + 1}/${HERO_SEARCHES.length}] ${slug}: "${search.substring(0, 45)}"... `)

    const photos = await searchPexels(search)
    const photo = pickUnique(photos)

    if (photo) {
      const newUrl = `https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=1200`
      results.push({ slug, oldPattern, newUrl, photoId: photo.id })
      console.log(`✅ photo ${photo.id}`)
    } else {
      console.log('❌ no photo found')
    }

    await new Promise(r => setTimeout(r, 1800))
  }

  // ─── Apply replacements ────────────────────────────────
  console.log('\n📝 Applying hero image replacements...\n')

  for (const { slug, oldPattern, newUrl } of results) {
    // Find the old Unsplash URL containing the pattern and replace
    const oldUrlRegex = new RegExp(
      `https://images\\.unsplash\\.com/${oldPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^'"+]*`,
      'g'
    )

    const matches = content.match(oldUrlRegex)
    if (matches && matches.length > 0) {
      // Replace only the imageUrl occurrence (w=900)
      const heroMatch = matches.find(m => m.includes('w=900'))
      if (heroMatch) {
        content = content.replace(heroMatch, newUrl)
        console.log(`  ✅ ${slug}: replaced hero (was ${oldPattern.substring(0, 30)}...)`)
      }

      // Also check for category fallback occurrences (w=600) of the same URL
      const fallbackMatches = matches.filter(m => m.includes('w=600'))
      for (const fm of fallbackMatches) {
        const fallbackPexels = newUrl.replace('w=1200', 'w=600')
        content = content.replace(fm, fallbackPexels)
        console.log(`  ✅ ${slug}: also replaced category fallback`)
      }
    } else {
      console.log(`  ⚠️  ${slug}: pattern not found (already replaced?)`)
    }
  }

  writeFileSync(CONFIG_FILE, content, 'utf-8')

  // ─── Summary ─────────────────────────────────────────────
  console.log('\n═══ HERO IMAGE SUMMARY ═══')
  for (const { slug, photoId, newUrl } of results) {
    console.log(`  ${slug}: photo ${photoId}`)
  }

  // Check remaining unsplash references
  const remainingUnsplash = (content.match(/unsplash\.com/g) || []).length
  console.log(`\n  Remaining Unsplash refs in file: ${remainingUnsplash}`)

  console.log('\n✅ Concluído!')
}

main().catch(err => { console.error(err); process.exit(1) })

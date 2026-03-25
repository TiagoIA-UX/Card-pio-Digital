/**
 * Fix remaining Unsplash sampleProduct images in templates-config.ts → Pexels.
 * All remaining are in the adega template.
 *
 * Usage:
 *   $env:PEXELS_API_KEY = "..."; node scripts/fix-sample-product-images.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const API_KEY = process.env.PEXELS_API_KEY
if (!API_KEY) { console.error('Missing PEXELS_API_KEY'); process.exit(1) }

const CONFIG_FILE = resolve(ROOT, 'lib/templates-config.ts')

// Extract unique Unsplash photo IDs remaining in file
function getUniqueUnsplashIds(content) {
  const regex = /https:\/\/images\.unsplash\.com\/(photo-[a-zA-Z0-9_-]+)\?/g
  const ids = new Set()
  let m
  while ((m = regex.exec(content)) !== null) ids.add(m[1])
  return [...ids]
}

async function searchPexels(query, perPage = 10) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`
  const res = await fetch(url, { headers: { Authorization: API_KEY } })
  if (res.status === 429) {
    console.log('  ⏳ Rate limited. Waiting 60s...')
    await new Promise(r => setTimeout(r, 60_000))
    return searchPexels(query, perPage)
  }
  if (!res.ok) throw new Error(`Pexels ${res.status}`)
  const data = await res.json()
  return data.photos || []
}

const usedIds = new Set()
function pickUnique(photos) {
  for (const p of photos) {
    if (!usedIds.has(String(p.id))) { usedIds.add(String(p.id)); return p }
  }
  return null
}

// ─── Search map: Unsplash photo ID → search term ────────────
// These are mostly wine/beer/spirits product images in adega template
const SEARCH_MAP = {
  'photo-1609951651556-5335e45e3a5e': 'heineken beer can green cold',
  'photo-1608270586620-248524c67de9': 'budweiser beer can red cold',
  'photo-1558618666-fcd25c85cd64': 'beer can lager cold gold',
  'photo-1566633806327-68e152aaf26d': 'beer can spaten lager craft',
  'photo-1622483767028-3f66f32aef97': 'corona beer bottle lime beach',
  'photo-1559526324-593bc073d938': 'draft beer pint glass pub tap',
  'photo-1506377247377-2a5b3b417ebb': 'red wine bottle glass elegant',
  'photo-1586370434639-0fe43b2d32e6': 'white wine bottle chardonnay glass',
  'photo-1567696153798-9111f9cd3d0d': 'champagne sparkling wine bottle celebration',
  'photo-1569529465841-dfecdab7503b': 'whiskey bottle glass spirits amber',
  'photo-1546171753-97d7676e4602': 'vodka bottle clear spirits smirnoff',
  'photo-1585837146751-a44118595376': 'rum bottle cachaça spirits',
  'photo-1570598912132-0ba1dc952b7d': 'gin bottle botanical spirits tonic',
  'photo-1514362545857-3bc16c4c7d1b': 'cocktail caipirinha bar drink colorful',
  'photo-1535958636474-b021ee887b13': 'chopp draft beer glass golden foam',
  'photo-1551024601-bec78aea704b': 'chocolate dessert cake sweet',
  'photo-1568901346375-23c9450c58cd': 'hamburger combo promo meal burger',
}

async function main() {
  let content = readFileSync(CONFIG_FILE, 'utf-8')
  const ids = getUniqueUnsplashIds(content)
  console.log(`\n🖼️  ${ids.length} unique Unsplash IDs remaining\n`)

  let replaced = 0
  for (let i = 0; i < ids.length; i++) {
    const unsplashId = ids[i]
    const search = SEARCH_MAP[unsplashId] || 'food drink beverage product'
    process.stdout.write(`  [${i + 1}/${ids.length}] ${unsplashId.substring(0, 35)}... `)

    const photos = await searchPexels(search)
    const photo = pickUnique(photos)

    if (photo) {
      const newUrl = `https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=400`
      const regex = new RegExp(
        `https://images\\.unsplash\\.com/${unsplashId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^'\"]+`,
        'g'
      )
      const matchCount = (content.match(regex) || []).length
      content = content.replace(regex, newUrl)
      replaced += matchCount
      console.log(`✅ photo ${photo.id} (${matchCount} refs)`)
    } else {
      console.log('❌ no photo found')
    }
    await new Promise(r => setTimeout(r, 1500))
  }

  writeFileSync(CONFIG_FILE, content, 'utf-8')

  const remaining = (content.match(/unsplash\.com/g) || []).length
  console.log(`\n═══ SUMMARY ═══`)
  console.log(`  Replaced: ${replaced} refs`)
  console.log(`  Remaining Unsplash: ${remaining}`)
  console.log('\n✅ Concluído!')
}

main().catch(err => { console.error(err); process.exit(1) })

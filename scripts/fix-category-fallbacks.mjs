/**
 * Fix ALL remaining Unsplash category fallback images → Pexels.
 * Groups similar categories under the same search, ensures unique photos.
 *
 * Usage:
 *   $env:PEXELS_API_KEY = "..."; node scripts/fix-category-fallbacks.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const API_KEY = process.env.PEXELS_API_KEY
if (!API_KEY) { console.error('Missing PEXELS_API_KEY'); process.exit(1) }

const CONFIG_FILE = resolve(ROOT, 'lib/templates-config.ts')

// ─── Group Unsplash photo IDs that need replacing ────────────────
// Each group: { searchTerm, unsplashPhotoId (the unique part in the URL) }
// Extracted from the CATEGORY_IMAGE_MAP in templates-config.ts
const UNSPLASH_REPLACEMENTS = [
  {
    search: 'food plate dinner elegant dish meal',
    unsplashId: 'photo-1546069901-ba9599a7e63c',   // prato, executivo
  },
  {
    search: 'lunchbox marmita rice beans plate takeaway',
    unsplashId: 'photo-1512058564366-18510be2db19',  // marmita
  },
  {
    search: 'grilled fish seafood plate fresh',
    unsplashId: 'photo-1534604973900-c43ab4c2e0ab',  // peix, fruto (do mar)
  },
  {
    search: 'appetizer side dish french fries portion snack bar',
    unsplashId: 'photo-1626645738196-c2a7c87a8f58',  // porç, acompanha, petisco, tábua, entrada
  },
  {
    search: 'chocolate dessert cake sweet pudding',
    unsplashId: 'photo-1551024601-bec78aea704b',     // sobremesa, doce
  },
  {
    search: 'hamburger cheeseburger combo meal',
    unsplashId: 'photo-1568901346375-23c9450c58cd',  // combo, promoç, lanche, hambúrguer, burger
  },
  {
    search: 'fresh orange juice glass fruit drink',
    unsplashId: 'photo-1622597467836-f3285f2131b8',  // suco
  },
  {
    search: 'soda water bottle cold drink refreshment',
    unsplashId: 'photo-1581006852262-e4307cf6283a',  // refrigerante, água, sem alcool, bebida, energético
  },
  {
    search: 'cocktail bar drink glass colorful',
    unsplashId: 'photo-1514362545857-3bc16c4c7d1b',  // drink, caipirinha, coquetel
  },
  {
    search: 'whiskey glass spirits liquor bottle',
    unsplashId: 'photo-1569529465841-dfecdab7503b',  // dose, garrafa, destilado, whisky, uísque, vodka, gin, rum, licor, cachaça, tequila
  },
  {
    search: 'draft beer pint mug pub glass',
    unsplashId: 'photo-1535958636474-b021ee887b13',  // chopp, cerveja
  },
  {
    search: 'coffee cup espresso latte cappuccino',
    unsplashId: 'photo-1509042239860-f550ce710b93',  // café
  },
  {
    search: 'herbal tea cup green loose leaf',
    unsplashId: 'photo-1556679343-c7306c1976bc',     // chá
  },
  {
    search: 'pizza margherita oven baked italian',
    unsplashId: 'photo-1565299624946-b28f40a0ae38',  // borda, calzone, esfiha, pizza
  },
  {
    search: 'sandwich wrap pita bread filled',
    unsplashId: 'photo-1553909489-cd47e0907980',     // sanduíche, wrap, crepe
  },
  {
    search: 'hot dog sausage bun mustard ketchup',
    unsplashId: 'photo-1612392062126-2f1006e35595',  // hotdog, hot dog, cachorro
  },
  {
    search: 'french fries crispy potato golden',
    unsplashId: 'photo-1630384060421-cb20d0e0649d',  // batata, frita
  },
  {
    search: 'milkshake strawberry cream glass thick',
    unsplashId: 'photo-1572490122747-3968b75cc699',  // milk, shake
  },
  {
    search: 'ice cream sundae chocolate syrup bowl',
    unsplashId: 'photo-1563805042-7684c019e1cb',     // sundae
  },
  {
    search: 'yakisoba noodles stir fry wok asian',
    unsplashId: 'photo-1569718212165-3a8278d5f624',  // yakisoba
  },
  {
    search: 'chocolate cake layered slice bakery',
    unsplashId: 'photo-1578985545062-69928b1d9587',  // bolo, torta
  },
  {
    search: 'coxinha fried pastry snack brazilian salgado',
    unsplashId: 'photo-1604467707321-70d009801bf5',  // salgado
  },
  {
    search: 'croissant fresh butter flaky pastry',
    unsplashId: 'photo-1555507036-ab1f4038024a',     // croissant
  },
  {
    search: 'grilled chicken roasted poultry breast',
    unsplashId: 'photo-1598103442097-8b74394b95c6',  // frango, ave
  },
  {
    search: 'sausage salami deli cold cuts cured',
    unsplashId: 'photo-1606851094655-b3b484ab9bd9',  // embutido, linguiça, frios
  },
  {
    search: 'fresh fruits tropical colorful bowl market',
    unsplashId: 'photo-1619566636858-adf3ef46400b',  // fruta, hortifruti
  },
  {
    search: 'spice herbs seasoning kitchen jar',
    unsplashId: 'photo-1596040033229-a9821ebd058d',  // tempero, temperado
  },
  {
    search: 'grocery store shelves canned food aisle',
    unsplashId: 'photo-1584568694244-14fbdf83bd30',  // mercearia, enlatado, conserva, snack, guloseima, congelado
  },
  {
    search: 'dairy milk cheese eggs refrigerator',
    unsplashId: 'photo-1628088062854-d1870b4553da',  // laticinío, laticínio, ovo
  },
  {
    search: 'cereal breakfast granola bowl oats',
    unsplashId: 'photo-1556909114-44e3e70034e2',     // matinal, matinais, cereal, grão
  },
  {
    search: 'cleaning supplies household products detergent',
    unsplashId: 'photo-1563453392212-326f5e854473',  // utilidade, limpeza, higiene pessoal, higiene
  },
  {
    search: 'pasta spaghetti sauce italian noodles',
    unsplashId: 'photo-1551462147-ff29053bfc14',     // massa, molho
  },
]

// ─── Pexels API ─────────────────────────────────────────────
const usedIds = new Set()

async function searchPexels(query, perPage = 15) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`
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
  console.log(`\n🖼️  Fixing ${UNSPLASH_REPLACEMENTS.length} category fallback groups\n`)

  let content = readFileSync(CONFIG_FILE, 'utf-8')
  const results = []

  for (let i = 0; i < UNSPLASH_REPLACEMENTS.length; i++) {
    const { search, unsplashId } = UNSPLASH_REPLACEMENTS[i]
    process.stdout.write(`  [${i + 1}/${UNSPLASH_REPLACEMENTS.length}] "${search.substring(0, 50)}"... `)

    const photos = await searchPexels(search)
    const photo = pickUnique(photos)

    if (photo) {
      // Build pexels URL w=600 for category fallback size
      const newUrl = `https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=600`
      
      // Replace ALL occurrences of this Unsplash photo ID in the file
      const regex = new RegExp(
        `https://images\\.unsplash\\.com/${unsplashId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^'\"]+`,
        'g'
      )
      const matchCount = (content.match(regex) || []).length
      content = content.replace(regex, newUrl)
      results.push({ search: search.substring(0, 40), unsplashId, photoId: photo.id, replaced: matchCount })
      console.log(`✅ photo ${photo.id} (${matchCount} refs)`)
    } else {
      console.log('❌ no photo found')
    }

    // Be nice to API
    await new Promise(r => setTimeout(r, 1500))
  }

  writeFileSync(CONFIG_FILE, content, 'utf-8')

  // Summary
  const totalReplaced = results.reduce((s, r) => s + r.replaced, 0)
  console.log(`\n═══ CATEGORY FALLBACK SUMMARY ═══`)
  console.log(`  Groups fixed: ${results.length}/${UNSPLASH_REPLACEMENTS.length}`)
  console.log(`  Total refs replaced: ${totalReplaced}`)

  const remaining = (content.match(/unsplash\.com/g) || []).length
  console.log(`  Remaining Unsplash refs: ${remaining}`)

  if (remaining > 0) {
    // Show the remaining ones
    const lines = content.split('\n')
    console.log('\n  Remaining Unsplash lines:')
    lines.forEach((line, idx) => {
      if (line.includes('unsplash.com')) {
        console.log(`    L${idx + 1}: ${line.trim().substring(0, 100)}`)
      }
    })
  }

  console.log('\n✅ Concluído!')
}

main().catch(err => { console.error(err); process.exit(1) })

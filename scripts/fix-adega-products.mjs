/**
 * Fix specific problematic adega product images identified by audit.
 * Searches Pexels with precise terms and updates generated-template-product-images.ts
 *
 * Usage:
 *   $env:PEXELS_API_KEY = "..."; node scripts/fix-adega-products.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const API_KEY = process.env.PEXELS_API_KEY
if (!API_KEY) { console.error('Missing PEXELS_API_KEY'); process.exit(1) }

const GEN_FILE = resolve(ROOT, 'lib/generated-template-product-images.ts')

// ─── Products that need new images ──────────────────────────
const FIXES = [
  // Cervejas Long Neck — wrong images
  { key: 'adega::cervejas-long-neck::7::heineken-long-neck-330ml',       search: 'heineken beer bottle green label cold' },
  { key: 'adega::cervejas-long-neck::8::budweiser-long-neck-330ml',      search: 'budweiser beer long neck bottle red label' },
  { key: 'adega::cervejas-long-neck::11::eisenbahn-pilsen-long-neck-355ml', search: 'craft beer pilsner bottle golden lager' },

  // Vinhos Tintos — all 5 mapped to same photo; give each a unique image
  { key: 'adega::vinhos-tintos::21::casillero-del-diablo-cabernet-sauvignon', search: 'cabernet sauvignon red wine bottle' },
  { key: 'adega::vinhos-tintos::22::santa-helena-reservado-merlot',           search: 'merlot red wine bottle glass pour' },
  { key: 'adega::vinhos-tintos::23::miolo-selecao-cabernet-sauvignon',        search: 'red wine bottle dark label premium' },
  { key: 'adega::vinhos-tintos::24::marcus-james-merlot',                     search: 'red wine glass pouring dinner elegant' },
  { key: 'adega::vinhos-tintos::25::pergola-tinto-suave',                     search: 'sweet red wine bottle grapes rustic' },

  // Whisky — diversify (all were same image)
  { key: 'adega::whisky::36::johnnie-walker-red-label-750ml', search: 'whisky bottle amber scotch label' },
  { key: 'adega::whisky::37::johnnie-walker-black-label-750ml', search: 'premium whisky glass neat dark' },
  { key: 'adega::whisky::39::chivas-regal-12-anos-750ml', search: 'scotch whisky bottle 12 year aged' },
  { key: 'adega::whisky::40::white-horse-750ml', search: 'blended scotch whisky bottle bar shelf' },

  // Vodka — diversify
  { key: 'adega::vodka::41::absolut-original-750ml', search: 'vodka bottle clear spirit absolut' },
  { key: 'adega::vodka::42::smirnoff-998ml', search: 'smirnoff vodka bottle red label' },
  { key: 'adega::vodka::43::grey-goose-750ml', search: 'premium vodka bottle frosted grey goose' },
  { key: 'adega::vodka::44::ciroc-750ml', search: 'luxury vodka bottle nightclub bar' },
  { key: 'adega::vodka::45::skyy-980ml', search: 'blue vodka bottle cocktail spirit' },

  // Gin — diversify (all same photo)
  { key: 'adega::gin::46::tanqueray-london-dry-750ml', search: 'tanqueray gin bottle green label' },
  { key: 'adega::gin::47::beefeater-london-dry-750ml', search: 'gin bottle london dry botanical herbs' },
  { key: 'adega::gin::48::bombay-sapphire-750ml', search: 'bombay sapphire blue gin bottle' },

  // Rum & Cachaça — diversify
  { key: 'adega::rum-cachaca::50::bacardi-carta-blanca-980ml', search: 'bacardi rum white bottle bar' },
  { key: 'adega::rum-cachaca::51::captain-morgan-original-750ml', search: 'spiced rum bottle captain morgan dark' },
  { key: 'adega::rum-cachaca::52::ypioca-prata-965ml', search: 'cachaça bottle brazilian spirit sugar cane' },
  { key: 'adega::rum-cachaca::53::51-965ml', search: 'cachaça 51 brazil spirit caipirinha' },

  // Combos — wrong images (pizza on kit sunset, cheeseburger on kit casal, noodles on reveillon)
  { key: 'adega::combos-kits-praia::78::kit-churrasco-na-praia', search: 'beach barbecue cooler beer ice outdoor party' },
  { key: 'adega::combos-kits-praia::79::kit-sunset', search: 'beer ice cooler sunset beach corona party' },
  { key: 'adega::combos-kits-praia::80::kit-casal-romantico', search: 'romantic champagne toast couple celebration glasses' },
  { key: 'adega::combos-kits-praia::81::kit-gin-tonica', search: 'gin tonic cocktail fresh lime botanical' },
  { key: 'adega::combos-kits-praia::83::kit-reveillon-ano-novo', search: 'new year eve champagne celebration fireworks toast' },

  // Energéticos — Red Bull was flagged
  { key: 'adega::energeticos::58::red-bull-250ml', search: 'energy drink can red bull caffeine' },

  // Petiscos
  { key: 'adega::petiscos-acompanhamentos::75::batata-chips-ruffles-96g', search: 'potato chips crispy snack bowl salty' },
  { key: 'adega::petiscos-acompanhamentos::76::salaminho-sadia-100g', search: 'salami pepperoni cold cut sliced' },

  // Refrigerantes
  { key: 'adega::refrigerantes-agua::62::coca-cola-lata-350ml', search: 'coca cola can red soda cold' },
  { key: 'adega::refrigerantes-agua::64::guarana-antarctica-350ml', search: 'green soda can guarana brazilian drink' },

  // Drinks Prontos & Ice — diversify
  { key: 'adega::drinks-prontos-ice::54::smirnoff-ice-275ml', search: 'smirnoff ice bottle lemon vodka premix' },
  { key: 'adega::drinks-prontos-ice::56::keep-cooler-classic-275ml', search: 'wine cooler bottle fruity drink sweet' },
  { key: 'adega::drinks-prontos-ice::57::askov-ice-limao-275ml', search: 'ice drink bottle lime lemon vodka premix' },

  // Energéticos — diversify
  { key: 'adega::energeticos::59::monster-energy-473ml', search: 'monster energy drink green can caffeine' },
  { key: 'adega::energeticos::60::tnt-energy-269ml', search: 'energy drink can small caffeine boost' },
  { key: 'adega::energeticos::61::fusion-energy-250ml', search: 'energy drink can colorful neon' },

  // Espumantes — diversify (all same photo)
  { key: 'adega::espumantes::31::chandon-brut-750ml', search: 'champagne bottle brut sparkling wine' },
  { key: 'adega::espumantes::32::chandon-rose-750ml', search: 'rosé sparkling wine bottle pink glass' },
  { key: 'adega::espumantes::33::salton-brut-750ml', search: 'sparkling wine bottle celebration gold' },
  { key: 'adega::espumantes::34::garibaldi-prosecco-750ml', search: 'prosecco bottle italian sparkling wine' },
  { key: 'adega::espumantes::35::freixenet-cordon-negro-750ml', search: 'cava sparkling wine bottle black elegant' },
]

// ─── Pexels API ─────────────────────────────────────────────
const usedIds = new Set()

// Collect existing IDs to avoid duplicates
function collectExistingIds(content) {
  const regex = /pexels-photo-(\d+)/g
  let m
  while ((m = regex.exec(content)) !== null) usedIds.add(m[1])
}

async function searchPexels(query, perPage = 15) {
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

function pickUnique(photos) {
  for (const p of photos) {
    if (!usedIds.has(String(p.id))) {
      usedIds.add(String(p.id))
      return p
    }
  }
  return null
}

async function main() {
  let content = readFileSync(GEN_FILE, 'utf-8')
  collectExistingIds(content)

  console.log(`\n🔧 Fixing ${FIXES.length} adega product images\n`)

  let fixed = 0
  for (let i = 0; i < FIXES.length; i++) {
    const { key, search } = FIXES[i]
    const shortName = key.split('::').pop().substring(0, 35)
    process.stdout.write(`  [${i + 1}/${FIXES.length}] ${shortName.padEnd(35)} `)

    const photos = await searchPexels(search)
    const photo = pickUnique(photos)

    if (photo) {
      const newUrl = `https://images.pexels.com/photos/${photo.id}/pexels-photo-${photo.id}.jpeg?auto=compress&cs=tinysrgb&w=800`
      // Replace the URL for this key
      const keyEscaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`("${keyEscaped}":\\s*)"[^"]+"`)
      if (regex.test(content)) {
        content = content.replace(regex, `$1"${newUrl}"`)
        fixed++
        console.log(`✅ photo ${photo.id}`)
      } else {
        console.log(`⚠️  key not found in file`)
      }
    } else {
      console.log('❌ no photo found')
    }

    await new Promise(r => setTimeout(r, 2000))

    // Save progress every 5 items
    if ((i + 1) % 5 === 0 || i === FIXES.length - 1) {
      writeFileSync(GEN_FILE, content, 'utf-8')
      console.log(`    💾 Saved progress (${i + 1}/${FIXES.length})`)
    }
  }

  writeFileSync(GEN_FILE, content, 'utf-8')

  // Count unique photos
  const allIds = [...content.matchAll(/pexels-photo-(\d+)/g)].map(m => m[1])
  const uniqueIds = new Set(allIds)

  console.log(`\n═══ SUMMARY ═══`)
  console.log(`  Fixed: ${fixed}/${FIXES.length}`)
  console.log(`  Total entries: ${allIds.length}`)
  console.log(`  Unique photos: ${uniqueIds.size}`)
  console.log('\n✅ Concluído!')
}

main().catch(err => { console.error(err); process.exit(1) })

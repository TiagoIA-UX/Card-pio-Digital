/**
 * Gera URLs do Pollinations.ai para todos os produtos do catálogo
 * e atualiza lib/generated-template-product-images.ts
 *
 * Estratégia híbrida:
 * - Produtos embalados/de marca usam foto de produto em fundo branco (packshot)
 * - Pratos preparados usam prompts gastronômicos específicos
 *
 * Objetivo: reduzir imagens "parecidas" e aproximar o visual do produto real.
 *
 * USO: node scripts/generate-images-pollinations.js
 * USO (dry-run): node scripts/generate-images-pollinations.js --dry-run
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const content = fs.readFileSync(path.join(ROOT, 'lib/templates-config.ts'), 'utf-8')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')

// ---- helpers ----
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

function norm(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text))
}

const PHOTO_BASE =
  'professional commercial photography, ultra detailed, sharp focus, realistic, high resolution, no text, no watermark, no people'

const FOOD_BASE =
  'restaurant menu photography, appetizing, realistic plating, commercial food styling, high resolution, no text, no watermark, no people'

const PACKSHOT_BASE =
  'isolated product packshot, centered composition, clean white studio background, soft shadow, realistic packaging, e-commerce photography, commercial lighting, high resolution, no text overlay, no watermark, no people'

const BRAND_TERMS = [
  /coca[\s-]?cola/,
  /guarana antartica/,
  /\bbrahma\b/,
  /heineken/,
  /budweiser/,
  /stella artois/,
  /corona/,
  /spaten/,
  /eisenbahn/,
  /original 600ml/,
  /red bull/,
  /monster/,
  /\btnt\b/,
  /fusion energy/,
  /del valle/,
  /crystal/,
  /kero coco/,
  /fuze/,
  /\bninho\b/,
  /parmalat/,
  /danone/,
  /vigor/,
  /tirolez/,
  /catupiry/,
  /president/,
  /philadelphia/,
  /ceratti/,
  /sadia/,
  /camil/,
  /uniao/,
  /pilao/,
  /\bliza\b/,
  /barilla/,
  /heinz/,
  /dona benta/,
  /gallo/,
  /\bmoca\b/,
  /nestle/,
  /dove/,
  /pantene/,
  /rexona/,
  /colgate/,
  /neve/,
  /oral-b/,
  /always/,
  /sundown/,
  /ype/,
  /pinho sol/,
  /veja/,
  /\bomo\b/,
  /comfort/,
  /scotch-brite/,
  /pullman/,
  /oreo/,
  /vitarella/,
  /piraque/,
  /bauducco/,
  /lays/,
  /doritos/,
  /cheetos/,
  /lacta/,
  /fini/,
  /yoki/,
  /mantiqueira/,
  /qualy/,
  /quaker/,
  /queensberry/,
  /johnnie walker/,
  /jack daniel/,
  /jack daniel's/,
  /absolut/,
  /tanqueray/,
  /beefeater/,
  /bombay/,
  /gordon'?s/,
  /bacardi/,
  /ypioca/,
  /\b51\b/,
  /smirnoff ice/,
  /keep cooler/,
  /askov ice/,
  /golden/,
  /premier/,
  /royal canin/,
  /pedigree/,
  /dog chow/,
  /hills/,
  /whiskas/,
  /cat chow/,
  /sheba/,
  /dreamies/,
  /frontline/,
  /drontal/,
  /organnact/,
  /pipicat/,
  /viva verde/,
]

const PACKAGED_CATEGORY_TERMS = [
  /bebidas/,
  /refrigerantes/,
  /agua/,
  /energeticos/,
  /laticinios/,
  /mercearia/,
  /higiene/,
  /limpeza/,
  /congelados/,
  /biscoitos/,
  /snacks/,
  /guloseimas/,
  /ovos/,
  /cereais/,
  /temperos/,
  /molhos/,
  /utilidades/,
  /racao/,
  /farmacia pet/,
  /areia/,
  /descartaveis/,
]

const PREPARED_CATEGORY_TERMS = [
  /pratos/,
  /porcoes/,
  /sobremesas/,
  /pizzas/,
  /hamburgueres/,
  /hot dogs/,
  /wraps/,
  /crepes/,
  /cafes/,
  /salgados/,
  /croissants/,
  /sanduiches/,
  /toasts/,
  /doces/,
  /confeitaria/,
  /tigelas/,
  /temakis/,
  /sashimis/,
  /combinados/,
  /rolls/,
  /niguiris/,
  /petiscos/,
  /tabuas/,
  /caipirinhas/,
  /drinks/,
]

const ADDON_TERMS = [
  /adicional/,
  /adicionais/,
  /extra/,
  /borda/,
  /calda/,
  /complementos/,
  /acompanhamentos/,
]

const FOOD_PROMPTS = {
  pizza: (nome) =>
    `${nome}, whole artisan pizza, toppings exactly matching the flavor, golden crust, melted cheese, overhead food photography, rustic table, ${FOOD_BASE}`,
  pizza_doce: (nome) =>
    `${nome}, brazilian sweet pizza, dessert style, toppings exactly matching the flavor, chocolate or fruit clearly visible, overhead food photography, ${FOOD_BASE}`,
  burger: (nome) =>
    `${nome}, artisan burger assembled exactly as described by the product name, toasted bun, visible layers, side angle, fries optional, ${FOOD_BASE}`,
  hotdog: (nome) =>
    `${nome}, brazilian gourmet hot dog assembled exactly as described, soft bun, visible toppings, side angle, ${FOOD_BASE}`,
  sushi: (nome) =>
    `${nome}, japanese food presentation, pieces matching the product type exactly, elegant dark plate, side angle, ${FOOD_BASE}`,
  temaki: (nome) =>
    `${nome}, japanese temaki cone, ingredients visible at top, elegant plating, side angle, ${FOOD_BASE}`,
  combinado: (nome) =>
    `${nome}, japanese sushi combo platter, assorted pieces organized neatly, premium presentation, overhead angle, ${FOOD_BASE}`,
  cafe_quente: (nome) =>
    `${nome}, hot specialty coffee drink in ceramic cup, realistic foam or steam if appropriate, cozy cafe table, side angle, ${PHOTO_BASE}`,
  bebida_gelada_artesanal: (nome) =>
    `${nome}, freshly prepared cold drink in glass, condensation, garnish matching flavor, neutral background, ${PHOTO_BASE}`,
  sobremesa: (nome) =>
    `${nome}, plated dessert matching the product exactly, elegant garnish, soft natural light, side angle, ${FOOD_BASE}`,
  bolo_fatia: (nome) =>
    `${nome}, slice of cake matching flavor exactly, visible crumb and filling, plate presentation, side angle, ${FOOD_BASE}`,
  bolo_inteiro: (nome) =>
    `${nome}, whole decorated cake matching the product exactly, bakery display style, clean background, ${FOOD_BASE}`,
  acai: (nome) =>
    `${nome}, brazilian acai bowl or cup matching the product exactly, purple acai cream, toppings clearly visible, overhead food photography, ${FOOD_BASE}`,
  sorvete: (nome) =>
    `${nome}, artisanal ice cream presentation matching the product exactly, creamy texture, dessert styling, ${PHOTO_BASE}`,
  milkshake: (nome) =>
    `${nome}, thick gourmet milkshake in transparent cup, toppings and drizzle matching flavor, studio food photography, ${PHOTO_BASE}`,
  salgado: (nome) =>
    `${nome}, brazilian savory bakery snack, plated and photographed close-up, crispy texture visible, ${FOOD_BASE}`,
  sanduiche: (nome) =>
    `${nome}, sandwich or toast assembled exactly as named, visible fillings, cafe presentation, ${FOOD_BASE}`,
  prato_refeicao: (nome) =>
    `${nome}, brazilian plated meal served exactly as named, complete lunch dish with sides, appetizing restaurant plating, side angle, ${FOOD_BASE}`,
  peixe_prato: (nome) =>
    `${nome}, brazilian seafood dish served exactly as named, plated meal with fish or shrimp clearly visible, restaurant presentation, side angle, ${FOOD_BASE}`,
  porcao_petisco: (nome) =>
    `${nome}, shared appetizer portion exactly as named, crispy texture visible, served on platter or basket, restaurant presentation, ${FOOD_BASE}`,
  carne_crua: (nome) =>
    `${nome}, raw premium butcher cut photographed like a butcher catalog, realistic meat texture, neutral butcher paper or board, ${PHOTO_BASE}`,
  hortifruti: (nome) =>
    `${nome}, fresh produce item photographed like grocery catalog, isolated or in small crate, realistic natural color, ${PHOTO_BASE}`,
  produto_generico: (nome) =>
    `${nome}, product photography, realistic and commercially usable, ${PHOTO_BASE}`,
}

function classifyProduct(nome, categoria, slug) {
  const n = norm(nome)
  const c = norm(categoria)
  const s = norm(slug)
  const joined = `${n} ${c} ${s}`

  const isAddon = hasAny(joined, ADDON_TERMS)
  const hasBrand = hasAny(joined, BRAND_TERMS)
  const packagedByCategory = hasAny(c, PACKAGED_CATEGORY_TERMS)
  const preparedByCategory = hasAny(c, PREPARED_CATEGORY_TERMS)

  if (isAddon) {
    return {
      strategy: 'prepared',
      type: 'produto_generico',
      reason: 'adicional-ou-acessorio',
    }
  }

  if (s === 'petshop') {
    return {
      strategy: 'packshot',
      type: 'produto_generico',
      reason: 'catalogo-petshop',
    }
  }

  if (s === 'mercadinho') {
    return {
      strategy: 'packshot',
      type: /banana|maca|laranja|manga|mamao|morango|abacaxi|uva|limao|tomate|cebola|batata|alface/.test(
        n
      )
        ? 'hortifruti'
        : 'produto_generico',
      reason: 'catalogo-mercadinho',
    }
  }

  if (s === 'hortifruti') {
    return {
      strategy: 'prepared',
      type: 'hortifruti',
      reason: 'hortifruti-fresco',
    }
  }

  if (s === 'acougue') {
    return {
      strategy: 'prepared',
      type: 'carne_crua',
      reason: 'catalogo-acougue',
    }
  }

  if (hasBrand || packagedByCategory) {
    return {
      strategy: 'packshot',
      type: 'produto_generico',
      reason: hasBrand ? 'produto-com-marca' : 'categoria-embalada',
    }
  }

  if (/\bpizza\b|calabresa|mussarela|portuguesa|margherita|pepperoni|napolitana/.test(n)) {
    return {
      strategy: 'prepared',
      type: /chocolate|morango|banana|prestigio|romeu/.test(n) ? 'pizza_doce' : 'pizza',
      reason: 'pizza',
    }
  }

  if (/hamburg|burger|x-burg|x-salada|x-bacon|x-egg|x-tudo|smash/.test(n)) {
    return { strategy: 'prepared', type: 'burger', reason: 'burger' }
  }

  if (/hot dog|cachorro/.test(n)) {
    return { strategy: 'prepared', type: 'hotdog', reason: 'hotdog' }
  }

  if (/temaki/.test(n)) {
    return { strategy: 'prepared', type: 'temaki', reason: 'temaki' }
  }

  if (
    /combo \d+ pecas|combo .*pecas|combinado|uramaki|niguiri|sashimi|joe |hot philadelphia|dragon roll|rainbow roll/.test(
      n
    )
  ) {
    return {
      strategy: 'prepared',
      type: /combo|combinado/.test(n) ? 'combinado' : 'sushi',
      reason: 'sushi-combinado',
    }
  }

  if (/sushi|yakissoba|lamen|donburi|gyoza|harumaki|sunomono|edamame|shimeji|tempura/.test(n)) {
    return { strategy: 'prepared', type: 'sushi', reason: 'japones' }
  }

  if (/acai|pitaya|cupuacu|tigela/.test(n) || s === 'acai') {
    return { strategy: 'prepared', type: 'acai', reason: 'acai' }
  }

  if (/milk shake|milkshake/.test(n)) {
    return { strategy: 'prepared', type: 'milkshake', reason: 'milkshake' }
  }

  if (/sorvete|picole|sundae|banana split|taca|casquinha|copao/.test(n) || s === 'sorveteria') {
    return { strategy: 'prepared', type: 'sorvete', reason: 'sorvete' }
  }

  if (/espresso|cappuccino|latte|mocha|americano|cafe com leite|chocolate quente|chai/.test(n)) {
    return { strategy: 'prepared', type: 'cafe_quente', reason: 'cafe-quente' }
  }

  if (
    /suco natural|smoothie|limonada|cha gelado|frappuccino|iced latte|iced mocha|agua de coco natural/.test(
      n
    )
  ) {
    return {
      strategy: 'prepared',
      type: 'bebida_gelada_artesanal',
      reason: 'bebida-feita-na-hora',
    }
  }

  if (/bolo inteiro|bolo decorado|naked cake|cheesecake|torta /.test(n)) {
    return {
      strategy: 'prepared',
      type: /bolo inteiro|bolo decorado|naked cake/.test(n) ? 'bolo_inteiro' : 'sobremesa',
      reason: 'bolo-grande-ou-torta',
    }
  }

  if (
    /bolo|brownie|brigadeiro|trufa|bombom|cupcake|cookie|pudim|mousse|cocada|quindim|sonho|berlim|carolina|churros|pao de mel/.test(
      n
    )
  ) {
    return {
      strategy: 'prepared',
      type: /bolo/.test(n) ? 'bolo_fatia' : 'sobremesa',
      reason: 'doceria',
    }
  }

  if (
    /croissant|pao de queijo|empada|esfiha|quiche|pastel|coxinha|salgado|bolinha de queijo|enroladinho/.test(
      n
    )
  ) {
    return { strategy: 'prepared', type: 'salgado', reason: 'salgado-padaria' }
  }

  if (/misto quente|toast|sanduiche|wrap|crepe|bauru|club sandwich|natural/.test(n)) {
    return { strategy: 'prepared', type: 'sanduiche', reason: 'lanche' }
  }

  if (
    /executivo|grelhado|acebolado|strogonoff|parmegiana|feijoada|marmita|marmitao|tradicional p|tradicional g|fitness|low carb|file de frango|frango grelhado|bife |picanha na chapa/.test(
      n
    )
  ) {
    return { strategy: 'prepared', type: 'prato_refeicao', reason: 'prato-refeicao' }
  }

  if (
    /tilapia|moqueca|camarao|robalo|casquinha de siri|peixe frito|isca de peixe|bacalhau|frutos do mar/.test(
      joined
    )
  ) {
    return { strategy: 'prepared', type: 'peixe_prato', reason: 'prato-peixe' }
  }

  if (
    /porcao|batata frita|mandioca frita|polenta frita|frango a passarinha|onion rings|nuggets|pastel frito|bruschetta|carpaccio|bolinho de bacalhau|petisco|tabua/.test(
      joined
    )
  ) {
    return { strategy: 'prepared', type: 'porcao_petisco', reason: 'porcao-petisco' }
  }

  if (
    /picanha inteira|contra file peca|alcatra peca|maminha peca|fraldinha peca|costela bovina|cupim|file mignon peca|acem|patinho|bisteca suina|lombo suino|panceta suina|frango inteiro resfriado|peito de frango file|coxa e sobrecoxa|asa de frango|coracao de frango|tulipa de frango|linguica toscana|linguica artesanal|kafta|medalhao de file/.test(
      n
    )
  ) {
    return { strategy: 'prepared', type: 'carne_crua', reason: 'corte-carnes' }
  }

  if (preparedByCategory) {
    return { strategy: 'prepared', type: 'produto_generico', reason: 'categoria-preparada' }
  }

  return {
    strategy: 'prepared',
    type: 'produto_generico',
    reason: 'fallback',
  }
}

function buildPrompt(nome, categoria, slug) {
  const classification = classifyProduct(nome, categoria, slug)

  if (classification.strategy === 'packshot') {
    return {
      ...classification,
      prompt: `${nome}, exact product matching the Brazilian item name, packaged consumer good, ${PACKSHOT_BASE}`,
    }
  }

  const promptBuilder = FOOD_PROMPTS[classification.type] || FOOD_PROMPTS.produto_generico
  return {
    ...classification,
    prompt: promptBuilder(nome),
  }
}

function pollinationsUrl(nome, categoria, slug, seed) {
  const meta = buildPrompt(nome, categoria, slug)
  const encoded = encodeURIComponent(meta.prompt)
  return {
    ...meta,
    url:
      'https://image.pollinations.ai/prompt/' +
      encoded +
      '?width=800&height=800&seed=' +
      seed +
      '&nologo=true&model=flux&enhance=true&safe=true',
  }
}

async function ensurePollinationsAvailable() {
  const probeUrl =
    'https://image.pollinations.ai/prompt/test?width=800&height=800&seed=1&nologo=true&model=flux&enhance=true&safe=true'

  try {
    const response = await fetch(probeUrl)

    if (!response.ok) {
      throw new Error(`status ${response.status}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Pollinations indisponivel no momento (${message}). O arquivo gerado nao foi sobrescrito.`
    )
  }
}

// ---- extract products ----
const blocks = [
  ...content.matchAll(
    /slug:\s*'([^']+)'[\s\S]*?sampleProducts:\s*\[([\s\S]*?)\](?:\s*,\s*\n|\s*\.map)/g
  ),
]

const result = {}
const debugEntries = []
let total = 0
let seedCounter = 1000

for (const b of blocks) {
  const slug = b[1]
  const block = b[2]
  const prodBlocks = [
    ...block.matchAll(
      /\{[^{}]*?nome:\s*'([^']+)'[^{}]*?categoria:\s*'([^']+)'[^{}]*?ordem:\s*(\d+)[^{}]*?\}/gs
    ),
  ]

  for (const pm of prodBlocks) {
    const nome = pm[1]
    const categoria = pm[2]
    const ordem = pm[3]
    const key =
      normalizeKeyPart(slug) +
      '::' +
      normalizeKeyPart(categoria) +
      '::' +
      ordem +
      '::' +
      normalizeKeyPart(nome)

    const imageMeta = pollinationsUrl(nome, categoria, slug, seedCounter++)
    result[key] = imageMeta.url
    debugEntries.push({
      key,
      slug,
      categoria,
      nome,
      strategy: imageMeta.strategy,
      type: imageMeta.type,
      reason: imageMeta.reason,
      prompt: imageMeta.prompt,
      url: imageMeta.url,
    })
    total++
  }
}

async function main() {
  if (DRY_RUN) {
    console.log('DRY RUN — primeiros 12 exemplos da classificação híbrida:')
    debugEntries.slice(0, 12).forEach((item, index) => {
      console.log('\n#' + (index + 1))
      console.log('Key:', item.key)
      console.log('Slug:', item.slug)
      console.log('Categoria:', item.categoria)
      console.log('Nome:', item.nome)
      console.log('Strategy:', item.strategy)
      console.log('Type:', item.type)
      console.log('Reason:', item.reason)
      console.log('Prompt:', item.prompt)
      console.log('URL:', item.url)
    })

    const summary = debugEntries.reduce((acc, item) => {
      const key = `${item.strategy}:${item.type}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    console.log('\nResumo por estratégia/tipo:')
    Object.entries(summary)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([key, count]) => console.log(`- ${key}: ${count}`))

    console.log('\nTotal:', total, 'produtos')
    console.log('Arquivo NÃO foi escrito (--dry-run)')
    return
  }

  await ensurePollinationsAvailable()

  // ---- write output ----
  const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)))

  const output =
    '// AUTO-GENERATED — DO NOT EDIT MANUALLY\n' +
    '// Imagens: Pollinations.ai (classificacao hibrida packshot + food photography)\n' +
    '// Regenerar: node scripts/generate-images-pollinations.js\n' +
    '// Gerado em: ' +
    new Date().toISOString() +
    '\n\n' +
    'export const TEMPLATE_PRODUCT_IMAGE_URLS: Record<string, string> =\n' +
    JSON.stringify(sorted, null, 2) +
    ';\n'

  const genFile = path.join(ROOT, 'lib', 'generated-template-product-images.ts')
  fs.writeFileSync(genFile, output, 'utf-8')

  console.log('✅ Gerado: lib/generated-template-product-images.ts')
  console.log('   Total de produtos:', total)
  console.log('   Estratégia: híbrida (packshot para embalados, food styling para pratos)')
  console.log('\nExemplo de URL gerada:')
  console.log(' ', Object.values(result)[0])
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})

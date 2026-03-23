/**
 * Audita o mapeamento: verifica se cada produto recebeu uma imagem
 * de um pool semanticamente adequado ao seu nome/categoria.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const content = fs.readFileSync(path.join(ROOT, 'lib/templates-config.ts'), 'utf-8')

// Replicate normalizeKeyPart
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

// Parse the generated file
const genContent = fs.readFileSync(
  path.join(ROOT, 'lib/generated-template-product-images.ts'),
  'utf-8'
)
const genMatch = genContent.match(/=\s*(\{[\s\S]+\})/)
const imageMap = JSON.parse(genMatch[1])

// Extract photo ID from URL
function getPhotoId(url) {
  const m = url.match(/photos\/(\d+)\//)
  return m ? m[1] : null
}

// Read POOLS dynamically from generator script (always in sync)
const genScript = fs.readFileSync(path.join(__dirname, 'generate-template-images.js'), 'utf-8')
const poolsBlock = genScript.match(/const POOLS\s*=\s*\{([\s\S]*?)\n\}/)[1]
const POOLS = {}
const poolRegex = /(\w+):\s*\[([\d,\s]+)\]/g
let pm
while ((pm = poolRegex.exec(poolsBlock)) !== null) {
  POOLS[pm[1]] = pm[2]
    .split(',')
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
}

const idToPool = {}
for (const [pool, ids] of Object.entries(POOLS)) {
  for (const id of ids) {
    idToPool[String(id)] = pool
  }
}

// Extract products with original names
const blocks = [
  ...content.matchAll(
    /slug:\s*'([^']+)'[\s\S]*?sampleProducts:\s*\[([\s\S]*?)\](?:\s*,\s*\n|\s*\.map)/g
  ),
]
const allProducts = []
for (const b of blocks) {
  const slug = b[1]
  const block = b[2]
  const prodBlocks = [
    ...block.matchAll(
      /\{[^{}]*?nome:\s*'([^']+)'[^{}]*?categoria:\s*'([^']+)'[^{}]*?ordem:\s*(\d+)[^{}]*?\}/gs
    ),
  ]
  for (const pm of prodBlocks) {
    const key =
      normalizeKeyPart(slug) +
      '::' +
      normalizeKeyPart(pm[2]) +
      '::' +
      pm[3] +
      '::' +
      normalizeKeyPart(pm[1])
    allProducts.push({ slug, nome: pm[1], cat: pm[2], ordem: pm[3], key })
  }
}

// Audit: for each product, check what pool it got assigned
const issues = []
for (const p of allProducts) {
  const url = imageMap[p.key]
  if (!url) {
    issues.push({ ...p, problem: 'NO IMAGE' })
    continue
  }
  const photoId = getPhotoId(url)
  const pool = idToPool[photoId] || 'UNKNOWN'

  // Check if pool makes sense for this product
  const n = (p.nome + ' ' + p.cat)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  let expectedPools = []
  // Define what pools are acceptable for each type of product

  // Early non-food
  if (
    /saco de lixo|agua sanitaria|desinfetante|detergente|amaciante|esponja|vassoura|alvej|multiuso/.test(
      n
    )
  )
    expectedPools = ['cleaning']
  else if (/\bracao\b/.test(n)) expectedPools = ['pet']
  // Pastry / special priority
  else if (/croissant/.test(n) && !/pizza/.test(n)) expectedPools = ['bread', 'sandwich']
  else if (/empada\b/.test(n)) expectedPools = ['bread', 'snack']
  else if (/torta salgada/.test(n)) expectedPools = ['bread', 'snack']
  else if (/pao de mel/.test(n)) expectedPools = ['candy', 'chocolate', 'bread']
  else if (/misto quente|bauru/.test(n)) expectedPools = ['sandwich', 'bread', 'hamburger']
  else if (
    /pizza|mussarela|calabresa|margherita|portuguesa|napolitana|pepperoni|calzone|esfiha|esfirra|aliche|palmito|escarola|borda|focaccia/.test(
      n
    )
  )
    expectedPools = ['pizza']
  else if (
    /sushi|sashimi|temaki|nigiri|uramaki|joe de|rainbow roll|california roll|dragon roll|philly roll|yakisoba|missoshiru|guioza|gyoza|edamame|harumaki|sunomono|combinado/.test(
      n
    )
  )
    expectedPools = ['sushi']
  else if (/hamburgu|burger|smash|x-/.test(n)) expectedPools = ['hamburger']
  else if (/hot.?dog/.test(n)) expectedPools = ['hotdog', 'hamburger', 'snack']
  else if (/sanduiche|sandwich|wrap|crepe|toast|panini/.test(n))
    expectedPools = ['sandwich', 'bread']
  else if (/sorvete|picole|sundae|milkshake|milk shake|casquinha|copao|gelato/.test(n))
    expectedPools = ['icecream']
  else if (/acai|pitaya|cupuacu|smoothie|bowl de/.test(n))
    expectedPools = ['acai', 'icecream', 'fruit']
  else if (/cafe|cappuccino|latte|espresso|mocha|macchiato|chocolate quente/.test(n))
    expectedPools = ['coffee']
  else if (
    /caipirinha|mojito|gin\b|moscow|margarita|aperol|negroni|sangria|daiquiri|drink|shot|cuba libre|cosmopolitan|blue lagoon|pina colada|whisky sour|long island|sex on/.test(
      n
    )
  )
    expectedPools = ['cocktail']
  else if (
    /cerveja|chopp|ipa\b|pilsen|lager|weiss|stout|heineken|brahma|skol|stella|budweiser|corona|amstel|long neck/.test(
      n
    )
  )
    expectedPools = ['beer']
  else if (/vinho|espumante|prosecco|champagne|cabernet|merlot|malbec|chardonnay|sauvignon/.test(n))
    expectedPools = ['wine']
  else if (/whisky|vodka|tequila|rum\b|cachaca|licor|baileys/.test(n))
    expectedPools = ['cocktail', 'wine']
  else if (/peixe|salmao|atum|camarao|siri|robalo|tilapia|moqueca|fruto do mar|pirao/.test(n))
    expectedPools = ['fish']
  else if (
    /picanha|bife|carne|bovino|alcatra|contrafile|maminha|costela|cupim|feijoada|parmegiana|strogonoff|marmita|executivo|frango|peito de|coxa|asa\b|passarinha|suino|porco|lombo|pernil|bacon|linguica|salsicha|salame|presunto|mortadela|torresmo|file\b|filet|panceta/.test(
      n
    )
  )
    expectedPools = ['meat', 'snack']
  else if (/batata|porcao|isca|petisco|tabua|polenta|mandioca|nugget/.test(n))
    expectedPools = ['snack', 'meat']
  else if (/arroz|feijao|farofa|vinagrete|pure/.test(n)) expectedPools = ['rice', 'grocery']
  else if (/salada|omelete|fitness|low carb/.test(n)) expectedPools = ['salad', 'vegetable']
  else if (
    /suco|agua\b|refrigerante|coca|guarana|energetico|red bull|monster|gatorade|tonico/.test(n)
  )
    expectedPools = ['beverages']
  else if (/brigadeiro|trufa|bombom|docinho|bem.casado|confeit|doce/.test(n))
    expectedPools = ['candy', 'chocolate', 'cupcake']
  else if (/cupcake|cookie|brownie|macaron/.test(n))
    expectedPools = ['cupcake', 'candy', 'chocolate']
  else if (/chocolate|mousse|pudim|sobremesa|cocada|gelatina|bolo|torta|cheesecake/.test(n))
    expectedPools = ['chocolate', 'candy', 'cupcake']
  else if (
    /pao|baguete|focaccia|ciabatta|salgado|coxinha|empada|quibe|pastel|biscoito|bolacha/.test(n)
  )
    expectedPools = ['bread', 'snack']
  else if (
    /fruta|maca\b|banana|laranja|morango|abacaxi|manga|melancia|uva\b|limao|polpa|cesta|organico/.test(
      n
    )
  )
    expectedPools = ['fruit', 'vegetable']
  else if (
    /verdura|folha|alface|rucula|espinafre|couve|agriao|brocoli|repolho|legume|tomate|cebola|cenoura|abobrinha|berinjela|pimentao|milho|beterraba|raiz|inhame|gengibre/.test(
      n
    )
  )
    expectedPools = ['vegetable', 'fruit']
  else if (
    /tempero|erva|alho|salsa|cebolinha|manjericao|louro|oregano|cominho|colorau|molho/.test(n)
  )
    expectedPools = ['spice']
  else if (
    /racao|pet\b|cao\b|gato|filhote|adulto|castrado|brinquedo|mordedor|bolinha|arranhador|coleira|guia\b|comedouro|areia|tapete|vermifugo|antipulga|shampoo|condicionador|perfume pet|peitoral|ossinho|bifinhos|sache|pate/.test(
      n
    )
  )
    expectedPools = ['pet']
  else if (
    /limpeza|detergente|desinfetante|amaciante|esponja|vassoura|multiuso|saco de lixo|higiene|sabonete|papel hig|escova de|absorvente|desodorante|creme dental/.test(
      n
    )
  )
    expectedPools = ['cleaning']
  else if (/queijo|leite|iogurte|manteiga|creme de|requeijao|nata|laticinio/.test(n))
    expectedPools = ['dairy', 'grocery']
  else if (/dose/.test(n)) expectedPools = ['cocktail', 'wine', 'beer']
  else
    expectedPools = [
      'grocery',
      'candy',
      'bread',
      'snack',
      'meat',
      'dairy',
      'spice',
      'fruit',
      'vegetable',
      'cleaning',
      'pet',
      'acai',
      'coffee',
      'beverages',
      'chocolate',
      'cupcake',
      'rice',
      'salad',
    ] // generic fallback — accept almost anything

  if (expectedPools.length > 0 && !expectedPools.includes(pool)) {
    issues.push({
      slug: p.slug,
      nome: p.nome,
      cat: p.cat,
      assignedPool: pool,
      expectedPools: expectedPools.join('/'),
      photoId,
    })
  }
}

console.log(`\nTotal products: ${allProducts.length}`)
console.log(`Mismatched images: ${issues.length}\n`)

// Group by template
const bySlug = {}
for (const i of issues) {
  if (!bySlug[i.slug]) bySlug[i.slug] = []
  bySlug[i.slug].push(i)
}

for (const [slug, items] of Object.entries(bySlug).sort()) {
  console.log(`\n=== ${slug} (${items.length} mismatches) ===`)
  for (const i of items) {
    console.log(
      `  "${i.nome}" [${i.cat}] → got: ${i.assignedPool}, expected: ${i.expectedPools} (photo: ${i.photoId})`
    )
  }
}

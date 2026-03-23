/**
 * Script para gerar o mapeamento de imagens individuais para todos os 877
 * produtos de template. Escreve em lib/generated-template-product-images.ts
 *
 * v2 — Pools expandidos + overflow inteligente por afinidade semântica
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const content = fs.readFileSync(path.join(ROOT, 'lib/templates-config.ts'), 'utf-8')

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

const P = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`

const COMBO_TEMPLATE_POOLS = {
  restaurante: 'meat',
  pizzaria: 'pizza',
  lanchonete: 'hamburger',
  bar: 'snack',
  cafeteria: 'sandwich',
  acai: 'acai',
  sushi: 'sushi',
  adega: 'wine',
  mercadinho: 'grocery',
  padaria: 'bread',
  sorveteria: 'icecream',
  acougue: 'meat',
  hortifruti: 'fruit',
  petshop: 'pet',
  doceria: 'chocolate',
}

// ---- MEGA IMAGE LIBRARY — all verified Pexels IDs (v2 expanded) ----
const POOLS = {
  pizza: [
    315755, 5848286, 708587, 842519, 3343621, 3915857, 2762942, 280453, 5792322, 5848277, 4109072,
    2260561, 7912400, 4109070, 4109077, 5848287, 6068711, 3944309, 1028433, 845798, 10802332,
    4109085, 2295285,
  ],
  hamburger: [
    70497, 327158, 983297, 1600727, 2702674, 1556688, 1251198, 3219483, 1552641, 4109130, 1639562,
    1639557, 4021927, 2119758, 2128536, 2983099, 2983098, 750073, 1639565, 1059040, 3764353,
    3139343, 2983101,
  ],
  sushi: [
    2098143, 359993, 5900512, 5310869, 1199982, 7719913, 7245464, 7243416, 5900884, 6531075,
    5900771, 6629017, 2323391, 6984182, 357756, 3338496, 684964, 8951243, 10692490, 8518854,
    10295767, 14856480, 15590363, 3763621,
  ],
  icecream: [
    367191, 1978181, 1352272, 5060373, 5796721, 3086863, 22809599, 4875225, 10175400, 8589559,
    1362534, 2708337, 29269196, 5108033, 1346341, 2846337, 6865764, 9227962, 5535557, 5108030,
    684968, 8713083, 2518078, 5507727, 8250429, 13701346, 8713081, 6025810, 6413445, 17717452,
    11222645, 1352296, 20683687, 5060300, 5060463, 8713094, 29290850, 7346520, 32592847, 8043652,
    33313352, 6542780, 675439, 17582266, 22809626,
  ],
  coffee: [
    373948, 7362647, 7519230, 1235706, 948358, 4547567, 1233528, 8056682, 997656, 3653799, 2668498,
    4349777, 685527, 129207, 2316543, 2775828, 2318033, 2659387, 1727123, 2878709, 324028, 2575835,
    2159093, 2128026, 312418, 302899, 414720,
  ],
  cocktail: [
    4051212, 7376988, 7985176, 7985162, 4051363, 3407782, 5455638, 4051365, 8084598, 1590154,
    4051366, 4051396, 5947075, 7376995, 8668601, 2480823, 4051360, 7985166, 4457153, 5433717,
    4051259, 4871173,
  ],
  beer: [
    1552630, 1269025, 1267696, 5537777, 1552617, 1672304, 5490965, 1089930, 667986, 159291, 5530252,
    4068383, 669213, 14823758, 5858056, 5530262, 2848681, 1267292, 991970, 1267302, 7421851, 669211,
    3650616, 669210, 29290422, 6223375, 168989, 1435598, 6346098, 1267264,
  ],
  wine: [
    2702805, 2912108, 2920841, 3019019, 374073, 1123260, 2258660, 1407846, 1598505, 434311, 2664150,
    169386, 12322, 11851422, 2647933, 12179476, 1522594, 7809780, 2820146, 5651790, 1712737,
    3620231, 3398711, 4004433, 7809784, 3240, 7809779, 33265, 2897305, 4622303, 7282899, 4408180,
  ],
  fish: [
    5739585, 1321124, 5863618, 6439345, 6046746, 8696559, 2597565, 6046747, 8963384, 30635698,
    32722832, 6046671, 1510714, 725991, 3296398, 8352806,
  ],
  chocolate: [
    1854652, 2819088, 9227707, 4109998, 718754, 918328, 1998633, 3825318, 1684880, 1693027, 1343504,
    3740193, 291528, 697571, 4110008, 960540, 7664871, 2567854,
  ],
  meat: [
    1565982, 1352274, 2673353, 3659857, 1603901, 2641886, 1373915, 2741448, 1437267, 4886680,
    699953, 3535383, 29724647, 34442361, 12884549, 11898916, 20187072, 8477072, 13279401, 8477071,
    36319688, 13279350, 8477074, 618775, 12884548, 10201880, 13279395, 9541962, 20187071, 8444102,
    12884547, 1314041, 28881688, 4661802, 5643415, 20187067, 9541976,
  ],
  salad: [1059905, 1213710, 1640777, 1604174, 2097090, 1547592, 1410235, 2313682, 824635, 2280545],
  rice: [1204228, 3186654, 3186982, 2116094, 5419336, 3926120, 1435904],
  bread: [
    1387070, 1775043, 3218467, 461060, 2135, 209206, 2253643, 2441281, 461393, 1070850, 1109671,
  ],
  snack: [1893555, 2338407, 3026810, 2271107, 60616, 1437590, 3659862, 33173598, 29042351, 1583884],
  beverages: [
    50593, 327090, 416528, 3819969, 1556679, 2983100, 110470, 2668308, 158053, 616833, 1030973,
    1132047,
  ],
  acai: [
    1099680, 1092730, 3026801, 1105166, 1600711, 4725644, 461382, 1721935, 2347311, 4750264,
    3732468, 3084443, 14167805, 11094179, 4553027, 9893209, 3622478, 7937333, 3622474, 8465241,
    4099233, 12955709, 9102652, 1334129, 6637835, 4099234, 32934774, 2173772, 20348546, 13153317,
    32557575, 17597421, 4099235, 4099236, 28935593, 4099237,
  ],
  hotdog: [1556687, 4518615, 1603898, 2255569, 1555992, 4518544],
  sandwich: [1647163, 2955819, 4750267, 1556715, 1406766, 3926133, 1647164],
  pet: [
    1108099, 406014, 1851164, 2607544, 2253275, 3299905, 2173872, 160846, 128817, 551628, 248280,
    825949, 58997, 2023384, 1404819, 33287, 45201, 179908, 1629781, 3361739, 3715587, 6131004,
    7210754, 5731846, 5732455, 333083, 8434618, 12125510, 16465615, 45170, 615369, 18124745,
    27806129, 46024, 9952105, 16395147, 4214919, 6568950, 16395151, 3945402, 208984, 30337930,
    16395150, 7527355, 800330, 7516109, 6821106, 1909802, 12928245,
  ],
  cleaning: [
    4239013, 4239012, 4239014, 3987146, 4108666, 3987151, 3987147, 4108672, 3987148, 4108665,
    4108668, 4108670, 6621461, 4239027, 5217963,
  ],
  fruit: [
    1132047, 461382, 1300975, 1128678, 1295572, 327098, 1132050, 1128684, 2294477, 161559, 95301,
    209439, 259611, 42263, 461192, 461195, 796580, 235294, 2611810, 867349, 918643, 1414129,
    2288683, 709567, 1435735, 3025236, 6157052, 2363345, 30893227, 5217970, 5945867, 4113825,
    5677309, 4110334, 137132,
  ],
  vegetable: [
    2255935, 143133, 2659401, 1400172, 53130, 2097090, 461193, 2518, 1367242, 461191, 461190,
    161559, 2252584, 2252589, 6039877, 2977435, 3650647, 2255930, 14227475, 2955794, 1265627,
    2137649, 868110, 3714083, 1691180, 109277, 1656664, 1363850, 1656663, 1093837, 2255999, 2448523,
    2813133,
  ],
  candy: [
    1721932, 298217, 3338681, 4016498, 3186519, 2878454, 1998635, 5553, 227432, 3992134, 6411063,
    1191639,
  ],
  cupcake: [
    718754, 913135, 1055272, 4686960, 3338691, 1126359, 4109009, 1775281, 1028714, 2693447, 1291712,
    3992935, 1326946,
  ],
  grocery: [
    264636, 1370942, 2733019, 3735195, 3962294, 5632403, 7963141, 3962275, 7963135, 4033405,
    7963132, 2733020, 1370945, 264635,
  ],
  dairy: [773253, 2289, 1775292, 2531188, 821365, 1435706, 4108729, 4397896, 2702070, 2208160],
  spice: [1340116, 1047365, 1329316, 531446, 2802527, 2802526, 6157, 1329318, 1164570, 1340118],
}

// ---- SMART OVERFLOW: preferências de pools relacionados ----
const RELATED_POOLS = {
  pizza: ['bread', 'snack', 'meat', 'hamburger'],
  hamburger: ['sandwich', 'hotdog', 'snack', 'meat', 'bread'],
  sushi: ['fish', 'rice', 'salad', 'beverages'],
  icecream: ['acai', 'fruit', 'candy', 'chocolate', 'cupcake', 'beverages'],
  coffee: ['chocolate', 'bread', 'cupcake', 'beverages'],
  cocktail: ['beer', 'wine', 'beverages'],
  beer: ['wine', 'cocktail', 'beverages'],
  wine: ['beer', 'cocktail', 'beverages'],
  fish: ['meat', 'salad', 'rice'],
  chocolate: ['candy', 'cupcake', 'coffee', 'icecream'],
  meat: ['fish', 'snack', 'hamburger', 'rice', 'salad'],
  salad: ['vegetable', 'fruit', 'rice'],
  rice: ['salad', 'meat', 'vegetable'],
  bread: ['sandwich', 'snack', 'cupcake', 'grocery'],
  snack: ['bread', 'meat', 'hamburger', 'rice'],
  beverages: ['coffee', 'cocktail', 'beer', 'wine', 'fruit'],
  acai: ['icecream', 'fruit', 'beverages', 'candy'],
  hotdog: ['hamburger', 'sandwich', 'snack', 'meat'],
  sandwich: ['hamburger', 'hotdog', 'bread', 'snack'],
  pet: ['cleaning', 'grocery'],
  cleaning: ['grocery', 'pet', 'spice', 'dairy'],
  fruit: ['vegetable', 'acai', 'beverages', 'salad'],
  vegetable: ['fruit', 'salad', 'spice', 'rice'],
  candy: ['cupcake', 'chocolate', 'bread', 'acai'],
  cupcake: ['candy', 'chocolate', 'bread', 'coffee'],
  grocery: ['dairy', 'bread', 'spice', 'cleaning'],
  dairy: ['grocery', 'bread', 'beverages'],
  spice: ['grocery', 'vegetable', 'salad'],
}

function shouldUseCategoryFallback(nome, cat) {
  const text = `${nome} ${cat}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (
    /adicionais|utilidades|higiene pessoal|laticinios? & frios|embutidos? & linguicas?/.test(text)
  ) {
    return true
  }

  return /carvao|gelo em cubo|copos? descart|guardanapo|pilha|bateria|isqueiro|fosforo|papel aluminio|whey protein/.test(
    text
  )
}

// ---- keyword matcher ----
function findPool(nome, cat, slug) {
  const n = (nome + ' ' + cat)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (shouldUseCategoryFallback(nome, cat)) return null

  // Early non-food detection (before any food keyword)
  if (
    /saco de lixo|agua sanitaria|desinfetante|detergente|amaciante|esponja|vassoura|alvej|multiuso/.test(
      n
    )
  )
    return 'cleaning'
  if (/\bracao\b/.test(n)) return 'pet'

  // Pastry / special priority (before meat/fish keywords steal them)
  if (/croissant/.test(n) && !/pizza/.test(n)) return 'bread'
  if (/empada\b/.test(n)) return 'bread'
  if (/torta salgada/.test(n)) return 'bread'
  if (/pao de mel/.test(n)) return 'candy'
  if (/misto quente|bauru/.test(n)) return 'sandwich'

  if (
    /pizza|mussarela|calabresa|margherita|portuguesa|napolitana|pepperoni|aliche|palmito|escarola|borda|calzone|esfiha|esfirra|focaccia/.test(
      n
    )
  )
    return 'pizza'
  if (
    /sushi|sashimi|temaki|nigiri|uramaki|joe de|rainbow roll|california roll|dragon roll|philly roll|yakisoba|missoshiru|guioza|gyoza|edamame|harumaki|sunomono|combinado/.test(
      n
    )
  )
    return 'sushi'
  if (/hamburgu|burger|smash|x-/.test(n)) return 'hamburger'
  if (/hot.?dog/.test(n)) return 'hotdog'
  if (/sanduiche|sandwich|wrap|crepe|toast|panini/.test(n)) return 'sandwich'
  if (/sorvete|picole|sundae|milkshake|milk shake|casquinha|copao|gelato|acai com sorvete/.test(n))
    return 'icecream'
  if (/acai|pitaya|cupuacu|smoothie|bowl de/.test(n)) return 'acai'
  if (/cafe|cappuccino|latte|espresso|mocha|macchiato|chocolate quente/.test(n)) return 'coffee'
  if (/cha\b/.test(n) && cat.toLowerCase().includes('quente')) return 'coffee'

  if (/combo|kit|promo/.test(n)) {
    return COMBO_TEMPLATE_POOLS[slug] || 'grocery'
  }

  if (
    /caipirinha|mojito|gin\b|moscow|margarita|aperol|negroni|whisky sour|sangria|long island|sex on|cosmopolitan|blue lagoon|daiquiri|drink|shot|cuba libre|pina colada/.test(
      n
    )
  )
    return 'cocktail'
  if (
    /cerveja|chopp|ipa\b|pilsen|lager|weiss|stout|heineken|brahma|antartica|skol|stella|budweiser|corona|amstel|long neck/.test(
      n
    )
  )
    return 'beer'
  if (
    /vinho|espumante|prosecco|champagne|rose\b|cabernet|merlot|malbec|chardonnay|sauvignon/.test(n)
  )
    return 'wine'
  if (/whisky|vodka|tequila|rum\b|cachaca|licor|baileys/.test(n)) return 'cocktail'
  if (/dose/.test(n) && !/condensado/.test(n)) return 'cocktail'

  if (/peixe|salmao|atum|camarao|siri|robalo|tilapia|moqueca|fruto do mar|pirao/.test(n))
    return 'fish'
  if (
    /picanha|bife|carne|bovino|alcatra|contrafile|maminha|costela|cupim|corte|feijoada|parmegiana|strogonoff|marmita|executivo/.test(
      n
    )
  )
    return 'meat'
  if (
    /suino|porco|lombo|pernil|bacon|panceta|linguica|salsicha|salame|presunto|embutido|mortadela|torresmo/.test(
      n
    )
  )
    return 'meat'
  if (/frango|peito de|coxa\b|asa\b|passarinha/.test(n)) return 'meat'
  if (/file\b|filet/.test(n)) return 'meat'
  if (/kit churrasco|temperado/.test(n)) return 'meat'

  if (/batata|porcao|isca|petisco|tabua|polenta|mandioca|nugget/.test(n)) return 'snack'

  if (/arroz|feijao|farofa|vinagrete|pure/.test(n)) return 'rice'
  if (/salada|omelete|fitness|low carb/.test(n)) return 'salad'

  if (/suco|agua\b|refrigerante|coca|guarana|energetico|red bull|monster|gatorade|tonico/.test(n))
    return 'beverages'

  if (/brigadeiro|trufa|bombom|docinho|bem.casado/.test(n)) return 'candy'
  if (/cupcake|cookie|brownie|macaron/.test(n)) return 'cupcake'
  if (/chocolate|mousse|pudim|sobremesa|cocada|gelatina|bolo|torta|cheesecake/.test(n))
    return 'chocolate'

  if (/pao|baguete|ciabatta|salgado|coxinha|empada|quibe|pastel|croissant/.test(n)) return 'bread'
  if (/confeit|doce/.test(n)) return 'candy'

  if (/fruta|maca\b|banana|laranja|morango|abacaxi|manga|melancia|uva\b|limao|polpa|cesta/.test(n))
    return 'fruit'
  if (/verdura|folha|alface|rucula|espinafre|couve|agriao|brocoli|repolho/.test(n))
    return 'vegetable'
  if (
    /legume|tomate|cebola|cenoura|batata doce|abobrinha|berinjela|pimentao|milho|beterraba/.test(n)
  )
    return 'vegetable'
  if (/raiz|inhame|gengibre|rabanete|nabo/.test(n)) return 'vegetable'
  if (/tempero|erva|alho|salsa|cebolinha|manjericao|louro|oregano|cominho|colorau|molho/.test(n))
    return 'spice'
  if (/organico|hortifruti/.test(n)) return 'fruit'

  if (
    /racao|pet\b|cao\b|gato|filhote|adulto|castrado|brinquedo|mordedor|bolinha|arranhador|coleira|guia\b|comedouro|areia|tapete hig|granulado|vermifugo|antipulga|shampoo|condicionador|perfume pet|peitoral|caixa de transporte|ossinho|bifinhos|sache|pate|farmacia|cama pet|caminha|casinha|spray pet|roupa pet|bandana|focinheira|pet shop|animal|petisco canino|petisco felino/.test(
      n
    )
  )
    return 'pet'
  if (
    /limpeza|detergente|desinfetante|amaciante|lava\b|esponja|vassoura|multiuso|alvej|saco de lixo/.test(
      n
    )
  )
    return 'cleaning'
  if (/higiene|sabonete|papel hig|escova de|absorvente|desodorante|creme dental/.test(n))
    return 'cleaning'

  if (/presunto|linguica|bacon|salsicha|mortadela|salame|embutido|defumado/.test(n)) return null
  if (/queijo|leite|iogurte|manteiga|creme de|requeijao|nata|laticinio/.test(n)) return 'dairy'
  if (/cereal|aveia|granola|sucrilhos|achocolatado/.test(n)) return 'grocery'
  if (/enlatado|conserva|ervilha|milho verde|sardinha|extrato/.test(n)) return 'grocery'
  if (/macarrao|massa|farinha|oleo|acucar|sal\b|fuba/.test(n)) return 'grocery'
  if (/congelado|lasanha/.test(n)) return 'grocery'
  if (/biscoito|bolacha|bisnaguinha|pao de forma/.test(n)) return 'bread'
  if (/salgadinho|batatinha|amendoim|bala|chiclete|pacoca|chips/.test(n)) return 'candy'
  if (/ovo\b|basico/.test(n)) return 'grocery'

  if (/encomenda|personaliz/.test(n)) return 'candy'
  if (/happy hour/.test(n)) return 'beer'
  if (/tigela|bowl|granola|leite condensado/.test(n)) return 'acai'

  // Fall back by category name
  const c = cat
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (/cafe|quente/.test(c)) return 'coffee'
  if (/gelad/.test(c)) return 'beverages'
  if (/sobremesa|doce|confeit/.test(c)) return 'chocolate'
  if (/prato|execut|marmit/.test(c)) return 'meat'
  if (/acompanha/.test(c)) return 'rice'
  if (/refriger|bebida|agua/.test(c)) return 'beverages'
  if (/combo|kit/.test(c)) return 'meat'
  if (/entrada|petisco|porcao/.test(c)) return 'snack'
  if (/pizza/.test(c)) return 'pizza'
  if (/sushi|japone/.test(c)) return 'sushi'
  if (/burger|lanche/.test(c)) return 'hamburger'
  if (/cerveja/.test(c)) return 'beer'
  if (/vinho|destilado|adega/.test(c)) return 'wine'
  if (/acai/.test(c)) return 'acai'
  if (/sorvete/.test(c)) return 'icecream'

  return 'grocery'
}

// ---- extract products ----
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

console.log('Products extracted:', allProducts.length)

// ---- assign images ----
const result = {}
const usedPerTemplate = {}
const recycleIdx = {}
let recycleTotal = 0

for (const p of allProducts) {
  if (!usedPerTemplate[p.slug]) usedPerTemplate[p.slug] = new Set()
  const used = usedPerTemplate[p.slug]

  const poolName = findPool(p.nome, p.cat, p.slug)
  if (!poolName) {
    continue
  }

  const pool = POOLS[poolName] || POOLS.grocery

  let assignedId = null
  for (const id of pool) {
    if (!used.has(id)) {
      assignedId = id
      break
    }
  }

  // Recycle from primary pool (semantic correctness > uniqueness)
  if (assignedId === null && pool.length > 0) {
    const rk = `${p.slug}::${poolName}`
    recycleIdx[rk] = recycleIdx[rk] || 0
    assignedId = pool[recycleIdx[rk] % pool.length]
    recycleIdx[rk]++
    recycleTotal++
  }

  // Fallback: try RELATED pools (semantically similar, for variety)
  if (assignedId === null) {
    const related = RELATED_POOLS[poolName] || []
    for (const relName of related) {
      const relPool = POOLS[relName]
      if (!relPool) continue
      for (const id of relPool) {
        if (!used.has(id)) {
          assignedId = id
          break
        }
      }
      if (assignedId) break
    }
  }

  // Last resort: try ALL pools (safety net)
  if (assignedId === null) {
    for (const k of Object.keys(POOLS)) {
      for (const id of POOLS[k]) {
        if (!used.has(id)) {
          assignedId = id
          break
        }
      }
      if (assignedId) break
    }
  }

  if (assignedId) {
    used.add(assignedId)
    result[p.key] = P(assignedId)
  } else {
    console.warn('NO IMAGE FOR:', p.key)
  }
}

console.log('Total mapped:', Object.keys(result).length, '/', allProducts.length)
if (recycleTotal > 0) console.log('Recycled (duplicates for semantic correctness):', recycleTotal)

for (const [slug, used] of Object.entries(usedPerTemplate)) {
  const tp = allProducts.filter((p) => p.slug === slug)
  console.log(`  ${slug}: ${tp.length} products, ${used.size} unique images`)
}

// ---- write output ----
const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)))

const lines = [
  '/**',
  ' * Mapeamento gerado em lote para imagens individuais de produtos dos templates.',
  ' *',
  ' * Chave (string) criada com `getTemplateProductImageKey`',
  ' * (ver `lib/template-product-images.ts`).',
  ' *',
  ' * Gerado automaticamente - ' + new Date().toISOString().split('T')[0],
  ' * Total: ' + Object.keys(sorted).length + ' imagens mapeadas',
  ' */',
  'export const TEMPLATE_PRODUCT_IMAGE_URLS: Record<string, string> = ' +
    JSON.stringify(sorted, null, 2),
  '',
]

const outPath = path.join(ROOT, 'lib/generated-template-product-images.ts')
fs.writeFileSync(outPath, lines.join('\n'))
console.log('\nFile written:', outPath)
console.log('Size:', Math.round(fs.statSync(outPath).size / 1024) + ' KB')

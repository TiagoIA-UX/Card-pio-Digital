import type { TemplateSampleProduct } from '@/lib/domains/marketing/templates-config'
import {
  getCategoryFallbackImage,
  getProductFallbackImage,
} from '@/lib/domains/marketing/templates-config'
import { TEMPLATE_PRODUCT_IMAGE_URLS } from '@/lib/domains/image/generated-template-product-images'

type GeneratedImageIndex = Record<string, string>
export type TemplateProductImageSource =
  | 'generated-map'
  | 'product-image'
  | 'product-fallback'
  | 'category-fallback'
  | 'template-fallback'

const LEGACY_TEMPLATE_CATEGORY_ALIASES: Record<string, Record<string, string[]>> = {
  minimercado: {
    bebidas: ['bebidas'],
    'bebidas-extras': ['bebidas'],
    'bebidas-quentes': ['bebidas', 'matinais-cereais'],
    'cervejas-destilados': ['cervejas-destilados'],
    congelados: ['congelados'],
    'congelados-extras': ['congelados'],
    'higiene-pessoal': ['higiene-pessoal'],
    hortifruti: ['hortifruti-basico'],
    'kits-combos': ['combos-kits'],
    'kits-suplementares': ['combos-kits'],
    'laticinios-frios': ['laticinios-frios'],
    limpeza: ['limpeza'],
    mercearia: ['mercearia'],
    'mercearia-suplementar': ['mercearia'],
    'molhos-especiais': ['temperos-molhos', 'mercearia'],
    'padaria-matinal': ['padaria-biscoitos', 'matinais-cereais'],
    'snacks-doces': ['snacks-guloseimas'],
    'snacks-extras': ['snacks-guloseimas'],
    utilidades: ['utilidades'],
  },
}

const LEGACY_TEMPLATE_SLUG_ALIASES: Record<string, string[]> = {
  minimercado: ['mercadinho'],
}

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function pickDeterministicUrl(seed: string, options: string[]) {
  if (options.length === 0) return undefined
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return options[hash % options.length]
}

function getMinimercadoSmartFallbackImage(product: TemplateSampleProduct): string | undefined {
  const categoria = normalizeKeyPart(product.categoria)
  const nome = normalizeForMatch(product.nome)
  const seed = `${categoria}::${nome}`

  if (categoria === 'bebidas' || categoria === 'bebidas-extras') {
    if (/red bull/.test(nome)) {
      return 'https://images.pexels.com/photos/3684971/pexels-photo-3684971.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    if (/monster|reign/.test(nome)) {
      return 'https://images.pexels.com/photos/4758134/pexels-photo-4758134.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    if (/energet|\btnt\b|\bc4\b|vibe/.test(nome)) {
      return 'https://images.pexels.com/photos/4386022/pexels-photo-4386022.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    if (/agua mineral|galao/.test(nome)) {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/4113683/pexels-photo-4113683.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/593099/pexels-photo-593099.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    if (/agua com gas|perrier/.test(nome)) {
      return 'https://images.pexels.com/photos/7509048/pexels-photo-7509048.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    if (/tonica|schweppes/.test(nome)) {
      return 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    if (/suco|del valle|maguary|tang|ades|detox|integral|pink lemonade/.test(nome)) {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/4113653/pexels-photo-4113653.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/7655906/pexels-photo-7655906.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/6707445/pexels-photo-6707445.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    if (/gatorade|powerade|isoton/.test(nome)) {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/7259047/pexels-photo-7259047.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/6412584/pexels-photo-6412584.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    if (/cha|tea|kombucha|matcha|mate/.test(nome)) {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/2763380/pexels-photo-2763380.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/4985535/pexels-photo-4985535.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    if (/coca|cola/.test(nome)) {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/4113625/pexels-photo-4113625.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1003711/pexels-photo-1003711.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    if (/guarana|kuat|jesus|dolly|tubaina/.test(nome)) {
      return 'https://images.pexels.com/photos/5860659/pexels-photo-5860659.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    if (/fanta|sprite|pepsi|refrigerante|soda/.test(nome)) {
      return 'https://images.pexels.com/photos/7001005/pexels-photo-7001005.jpeg?auto=compress&cs=tinysrgb&w=800'
    }
    return 'https://images.pexels.com/photos/4113653/pexels-photo-4113653.jpeg?auto=compress&cs=tinysrgb&w=800'
  }

  if (categoria === 'cervejas-destilados') {
    if (/vodka|smirnoff|grey goose/.test(nome))
      return 'https://images.pexels.com/photos/4433107/pexels-photo-4433107.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/gin|tanqueray|beefeater|gordon|hendrick/.test(nome))
      return 'https://images.pexels.com/photos/1277203/pexels-photo-1277203.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/whisky|whiskey|johnnie|jack daniels|chivas|ballantine|macallan/.test(nome))
      return 'https://images.pexels.com/photos/6103842/pexels-photo-6103842.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/rum|bacardi/.test(nome))
      return 'https://images.pexels.com/photos/2360578/pexels-photo-2360578.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/tequila|patron|cuervo/.test(nome))
      return 'https://images.pexels.com/photos/3023237/pexels-photo-3023237.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/cachaca|ypioca|catuaba/.test(nome))
      return 'https://images.pexels.com/photos/3084623/pexels-photo-3084623.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/vinho tinto|malbec|casillero|concha y toro/.test(nome))
      return 'https://images.pexels.com/photos/7564984/pexels-photo-7564984.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/vinho branco/.test(nome))
      return 'https://images.pexels.com/photos/3244133/pexels-photo-3244133.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/rose|ros[eé]/.test(nome))
      return 'https://images.pexels.com/photos/5732808/pexels-photo-5732808.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/espumante|chandon|freixenet/.test(nome))
      return 'https://images.pexels.com/photos/2454122/pexels-photo-2454122.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/licor|amarula|campari|aperol|sangria|sake/.test(nome))
      return 'https://images.pexels.com/photos/35925508/pexels-photo-35925508.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/carvao/.test(nome))
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/6023/pexels-photo-6023.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/5533764/pexels-photo-5533764.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/5538231/pexels-photo-5538231.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5538166/pexels-photo-5538166.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/7421851/pexels-photo-7421851.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4620723/pexels-photo-4620723.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5055189/pexels-photo-5055189.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4833632/pexels-photo-4833632.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'laticinios-frios') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/7407295/pexels-photo-7407295.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4021931/pexels-photo-4021931.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5946723/pexels-photo-5946723.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'mercearia' || categoria === 'mercearia-suplementar') {
    if (/arroz/.test(nome))
      return 'https://images.pexels.com/photos/3737694/pexels-photo-3737694.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/feijao/.test(nome))
      return 'https://images.pexels.com/photos/4716798/pexels-photo-4716798.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/macarrao|miojo|noodles/.test(nome))
      return 'https://images.pexels.com/photos/4431588/pexels-photo-4431588.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/oleo|azeite|vinagre/.test(nome))
      return 'https://images.pexels.com/photos/4910159/pexels-photo-4910159.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/acucar|adocante/.test(nome))
      return 'https://images.pexels.com/photos/5590955/pexels-photo-5590955.jpeg?auto=compress&cs=tinysrgb&w=800'
    if (/cafe|capuccino/.test(nome))
      return 'https://images.pexels.com/photos/4829072/pexels-photo-4829072.jpeg?auto=compress&cs=tinysrgb&w=800'
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/5951182/pexels-photo-5951182.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5908226/pexels-photo-5908226.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'congelados' || categoria === 'congelados-extras') {
    if (/sorvete|picole|acai/.test(nome)) {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/5796721/pexels-photo-5796721.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/4021931/pexels-photo-4021931.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/5946723/pexels-photo-5946723.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5796721/pexels-photo-5796721.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4021931/pexels-photo-4021931.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/6151203/pexels-photo-6151203.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4021982/pexels-photo-4021982.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1251197/pexels-photo-1251197.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'carnes-acougue') {
    if (/frango|coxa|sobrecoxa|asa|peito/.test(nome)) {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/5769375/pexels-photo-5769375.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/3926125/pexels-photo-3926125.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    if (/linguica|calabresa|salsicha|bacon|embutido/.test(nome)) {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/4504592/pexels-photo-4504592.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/5939414/pexels-photo-5939414.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    if (/picanha|alcatra|maminha|contra|file|acem|patinho|costela|bovino/.test(nome)) {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/5774147/pexels-photo-5774147.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/618775/pexels-photo-618775.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/7613561/pexels-photo-7613561.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    if (/carvao/.test(nome)) {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/6023/pexels-photo-6023.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/5533764/pexels-photo-5533764.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/5774147/pexels-photo-5774147.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5769375/pexels-photo-5769375.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4504592/pexels-photo-4504592.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'snacks-doces' || categoria === 'snacks-extras') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/6349943/pexels-photo-6349943.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4815064/pexels-photo-4815064.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3803490/pexels-photo-3803490.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'padaria-matinal') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/7440414/pexels-photo-7440414.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4676413/pexels-photo-4676413.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'hortifruti') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/5009732/pexels-photo-5009732.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1093837/pexels-photo-1093837.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2912621/pexels-photo-2912621.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5629821/pexels-photo-5629821.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'higiene-pessoal' || categoria === 'bebe-infantil') {
    if (categoria === 'bebe-infantil') {
      if (/fralda|lenco umedecido|assadura|pomada/.test(nome)) {
        return pickDeterministicUrl(seed, [
          'https://images.pexels.com/photos/6849576/pexels-photo-6849576.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/6845799/pexels-photo-6845799.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/6294154/pexels-photo-6294154.jpeg?auto=compress&cs=tinysrgb&w=800',
        ])
      }
      if (/mamadeira|chupeta|mordedor|copo transicao|colher|babador|kit higiene|escova/.test(nome)) {
        return pickDeterministicUrl(seed, [
          'https://images.pexels.com/photos/4587997/pexels-photo-4587997.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/4038653/pexels-photo-4038653.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/4167778/pexels-photo-4167778.jpeg?auto=compress&cs=tinysrgb&w=800',
        ])
      }
      if (/formula|papinha|mucilon|farinha lactea|biscoito baby|suco baby/.test(nome)) {
        return pickDeterministicUrl(seed, [
          'https://images.pexels.com/photos/6845799/pexels-photo-6845799.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/6294154/pexels-photo-6294154.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/6849576/pexels-photo-6849576.jpeg?auto=compress&cs=tinysrgb&w=800',
        ])
      }
    }
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/6690197/pexels-photo-6690197.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/7262987/pexels-photo-7262987.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/7428095/pexels-photo-7428095.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/7120503/pexels-photo-7120503.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/6849576/pexels-photo-6849576.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'limpeza' || categoria === 'utilidades' || categoria === 'papelaria') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/5218019/pexels-photo-5218019.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4167778/pexels-photo-4167778.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4038653/pexels-photo-4038653.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/159751/book-address-book-learning-learn-159751.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2544989/pexels-photo-2544989.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'kits-combos' || categoria === 'kits-suplementares') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/983297/pexels-photo-983297.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/4109132/pexels-photo-4109132.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4676413/pexels-photo-4676413.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4109136/pexels-photo-4109136.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'molhos-especiais') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/4910159/pexels-photo-4910159.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5951182/pexels-photo-5951182.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5908226/pexels-photo-5908226.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'bebidas-quentes') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/4829072/pexels-photo-4829072.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/2763380/pexels-photo-2763380.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4985535/pexels-photo-4985535.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5590955/pexels-photo-5590955.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'pet-animais') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/796584/pexels-photo-796584.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5731866/pexels-photo-5731866.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/6568941/pexels-photo-6568941.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4587997/pexels-photo-4587997.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'tabacaria-conveniencia') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/2544989/pexels-photo-2544989.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4038653/pexels-photo-4038653.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4167778/pexels-photo-4167778.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'importados-gourmet' || categoria === 'fitness-saude' || categoria === 'pratos-prontos') {
    if (categoria === 'fitness-saude') {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/6707445/pexels-photo-6707445.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/7655906/pexels-photo-7655906.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/6412584/pexels-photo-6412584.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/7208619/pexels-photo-7208619.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/7476698/pexels-photo-7476698.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/6845651/pexels-photo-6845651.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    if (categoria === 'pratos-prontos') {
      return pickDeterministicUrl(seed, [
        'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/3737694/pexels-photo-3737694.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/4910159/pexels-photo-4910159.jpeg?auto=compress&cs=tinysrgb&w=800',
      ])
    }
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3737694/pexels-photo-3737694.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5908226/pexels-photo-5908226.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5951182/pexels-photo-5951182.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4910159/pexels-photo-4910159.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'farmacia-basica') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/6690197/pexels-photo-6690197.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/7262987/pexels-photo-7262987.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/7120503/pexels-photo-7120503.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4038653/pexels-photo-4038653.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/6322805/pexels-photo-6322805.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4045552/pexels-photo-4045552.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3963082/pexels-photo-3963082.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/7692473/pexels-photo-7692473.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/5202453/pexels-photo-5202453.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  if (categoria === 'sorvetes-sobremesas') {
    return pickDeterministicUrl(seed, [
      'https://images.pexels.com/photos/5796721/pexels-photo-5796721.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4021931/pexels-photo-4021931.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3803490/pexels-photo-3803490.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/4815064/pexels-photo-4815064.jpeg?auto=compress&cs=tinysrgb&w=800',
    ])
  }

  return pickDeterministicUrl(seed, [
    'https://images.pexels.com/photos/4113653/pexels-photo-4113653.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3737694/pexels-photo-3737694.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5908226/pexels-photo-5908226.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5951182/pexels-photo-5951182.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/7440414/pexels-photo-7440414.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4815064/pexels-photo-4815064.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4021931/pexels-photo-4021931.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5009732/pexels-photo-5009732.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1093837/pexels-photo-1093837.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5218019/pexels-photo-5218019.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4038653/pexels-photo-4038653.jpeg?auto=compress&cs=tinysrgb&w=800',
  ])
}

const TEMPLATE_PRODUCT_IMAGE_BY_NAME: GeneratedImageIndex = Object.entries(
  TEMPLATE_PRODUCT_IMAGE_URLS
).reduce<GeneratedImageIndex>((index, [key, url]) => {
  const [templateSlug, categoria, , nome] = key.split('::')
  if (!templateSlug || !categoria || !nome) return index

  index[`${templateSlug}::${categoria}::${nome}`] = url
  return index
}, {})

function normalizeKeyPart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Chave estável para mapear a imagem gerada para um produto do template.
 * Use sempre nas duas pontas (gerador e consumo) para evitar divergências.
 */
export function getTemplateProductImageKey(templateSlug: string, product: TemplateSampleProduct) {
  const nome = normalizeKeyPart(product.nome)
  const categoria = normalizeKeyPart(product.categoria)
  const ordem = String(product.ordem ?? 0)
  return `${normalizeKeyPart(templateSlug)}::${categoria}::${ordem}::${nome}`
}

function getCompatibleGeneratedImageUrl(
  templateSlug: string,
  product: TemplateSampleProduct
): string | undefined {
  const normalizedTemplateSlug = normalizeKeyPart(templateSlug)
  const normalizedCategory = normalizeKeyPart(product.categoria)
  const normalizedName = normalizeKeyPart(product.nome)
  const aliasTemplates = LEGACY_TEMPLATE_SLUG_ALIASES[normalizedTemplateSlug] ?? []
  const aliasCategories = LEGACY_TEMPLATE_CATEGORY_ALIASES[normalizedTemplateSlug]?.[
    normalizedCategory
  ] ?? [normalizedCategory]

  for (const aliasTemplate of aliasTemplates) {
    for (const aliasCategory of aliasCategories) {
      const compatibleKey = `${aliasTemplate}::${aliasCategory}::${normalizedName}`
      const compatibleUrl = TEMPLATE_PRODUCT_IMAGE_BY_NAME[compatibleKey]
      if (compatibleUrl) return compatibleUrl
    }
  }

  return undefined
}

export function resolveTemplateProductImageUrl(params: {
  templateSlug: string
  product: TemplateSampleProduct
  fallbackTemplateImageUrl: string
}): string {
  return resolveTemplateProductImage(params).url
}

export function resolveTemplateProductImage(params: {
  templateSlug: string
  product: TemplateSampleProduct
  fallbackTemplateImageUrl: string
}): { url: string; source: TemplateProductImageSource } {
  const { templateSlug, product, fallbackTemplateImageUrl } = params
  const key = getTemplateProductImageKey(templateSlug, product)
  const generatedUrl =
    TEMPLATE_PRODUCT_IMAGE_URLS[key] ?? getCompatibleGeneratedImageUrl(templateSlug, product)
  if (generatedUrl) {
    return {
      url: generatedUrl,
      source: 'generated-map',
    }
  }

  if (product.imagem_url) {
    return {
      url: product.imagem_url,
      source: 'product-image',
    }
  }

  if (normalizeKeyPart(templateSlug) === 'minimercado') {
    const smartFallback = getMinimercadoSmartFallbackImage(product)
    if (smartFallback) {
      return {
        url: smartFallback,
        source: 'product-fallback',
      }
    }
  }

  const productFallbackUrl = getProductFallbackImage(product.nome, product.categoria)
  if (productFallbackUrl) {
    return {
      url: productFallbackUrl,
      source: 'product-fallback',
    }
  }

  const categoryFallbackUrl = getCategoryFallbackImage(product.categoria)
  if (categoryFallbackUrl) {
    return {
      url: categoryFallbackUrl,
      source: 'category-fallback',
    }
  }

  return {
    url: fallbackTemplateImageUrl,
    source: 'template-fallback',
  }
}

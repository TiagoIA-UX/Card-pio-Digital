import { DEMO_ADDRESS } from '@/lib/template-demo'
import {
  TEMPLATE_PRESETS,
  type RestaurantTemplateSlug,
  type TemplatePreset,
} from '@/lib/restaurant-customization'
import type { Template } from '@/types/template'

export interface TemplateSampleProduct {
  nome: string
  descricao: string
  preco: number
  categoria: string
  ordem: number
  imagem_url?: string
}

type TemplateIconKey =
  | 'store'
  | 'pizza'
  | 'burger'
  | 'beer'
  | 'coffee'
  | 'ice-cream'
  | 'fish'

export interface RestaurantTemplateConfig {
  slug: RestaurantTemplateSlug
  iconKey: TemplateIconKey
  name: string
  shortDescription: string
  description: string
  category: Template['category']
  imageUrl: string
  previewUrl: string
  price: number
  originalPrice: number
  isFeatured: boolean
  isNew: boolean
  isBestseller: boolean
  salesCount: number
  ratingAvg: number
  ratingCount: number
  eyebrow: string
  accent: string
  chip: string
  highlights: string[]
  features: string[]
  slogan: string
  cor_primaria: string
  cor_secundaria: string
  preset: TemplatePreset
  sampleProducts: TemplateSampleProduct[]
}

export const RESTAURANT_TEMPLATE_CONFIGS: Record<RestaurantTemplateSlug, RestaurantTemplateConfig> = {
  restaurante: {
    slug: 'restaurante',
    iconKey: 'store',
    name: 'Restaurante / Marmitaria',
    shortDescription: 'Para restaurantes e marmitarias',
    description:
      'Cardápio ideal para restaurantes, marmitarias e self-service. Organizado por pratos executivos, porções e bebidas.',
    category: 'restaurante',
    imageUrl:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&auto=format&fit=crop&q=80',
    previewUrl: '/templates/restaurante',
    price: 247,
    originalPrice: 297,
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    salesCount: 156,
    ratingAvg: 4.8,
    ratingCount: 42,
    eyebrow: 'Operação de almoço',
    accent: 'from-amber-500/20 via-orange-500/10 to-transparent',
    chip: 'bg-amber-500/10 text-amber-700',
    highlights: ['Pratos do dia', 'Marmitas', 'Combos executivos'],
    features: ['Pratos executivos', 'Marmitas', 'Porções', 'Bebidas', 'Sobremesas'],
    slogan: 'Pratos do dia, combos e delivery em um só lugar.',
    cor_primaria: '#f59e0b',
    cor_secundaria: '#ea580c',
    preset: TEMPLATE_PRESETS.restaurante,
    sampleProducts: [
      {
        nome: 'Prato Executivo da Casa',
        descricao: 'Arroz, feijão, proteína do dia, salada e acompanhamento.',
        preco: 29.9,
        categoria: 'Pratos executivos',
        ordem: 1,
      },
      {
        nome: 'Marmita Premium',
        descricao: 'Porção generosa com proteína grelhada e dois acompanhamentos.',
        preco: 34.9,
        categoria: 'Marmitas',
        ordem: 2,
      },
      {
        nome: 'Suco Natural 500ml',
        descricao: 'Laranja, limão ou abacaxi com hortelã.',
        preco: 8.9,
        categoria: 'Bebidas',
        ordem: 3,
      },
    ],
  },
  pizzaria: {
    slug: 'pizzaria',
    iconKey: 'pizza',
    name: 'Pizzaria',
    shortDescription: 'Para pizzarias',
    description:
      'Cardápio completo para pizzarias com opções de tamanhos, sabores e bordas recheadas.',
    category: 'pizzaria',
    imageUrl:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900&auto=format&fit=crop&q=80',
    previewUrl: '/templates/pizzaria',
    price: 247,
    originalPrice: 297,
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    salesCount: 89,
    ratingAvg: 4.7,
    ratingCount: 28,
    eyebrow: 'Ticket alto no delivery',
    accent: 'from-red-500/20 via-orange-500/10 to-transparent',
    chip: 'bg-red-500/10 text-red-700',
    highlights: ['Sabores e bordas', 'Combos família', 'Upsell de bebida'],
    features: ['Pizzas tradicionais', 'Pizzas especiais', 'Bordas recheadas', 'Bebidas', 'Combos'],
    slogan: 'Sabores, combos e bordas com pedido rápido.',
    cor_primaria: '#ef4444',
    cor_secundaria: '#f97316',
    preset: TEMPLATE_PRESETS.pizzaria,
    sampleProducts: [
      {
        nome: 'Pizza Calabresa Média',
        descricao: 'Molho artesanal, muçarela, calabresa e cebola roxa.',
        preco: 49.9,
        categoria: 'Pizzas tradicionais',
        ordem: 1,
      },
      {
        nome: 'Pizza Frango com Catupiry Grande',
        descricao: 'Frango temperado, muçarela e catupiry.',
        preco: 62.9,
        categoria: 'Pizzas especiais',
        ordem: 2,
      },
      {
        nome: 'Combo Pizza + Refrigerante',
        descricao: 'Pizza média salgada com refrigerante 2L.',
        preco: 69.9,
        categoria: 'Combos',
        ordem: 3,
      },
    ],
  },
  lanchonete: {
    slug: 'lanchonete',
    iconKey: 'burger',
    name: 'Hamburgueria / Lanchonete',
    shortDescription: 'Para lanchonetes e hamburguerias',
    description:
      'Cardápio para lanchonetes e hamburguerias artesanais. Com adicionais e combos personalizados.',
    category: 'lanchonete',
    imageUrl:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=900&auto=format&fit=crop&q=80',
    previewUrl: '/templates/lanchonete',
    price: 247,
    originalPrice: 297,
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    salesCount: 67,
    ratingAvg: 4.9,
    ratingCount: 19,
    eyebrow: 'Montagem e adicionais',
    accent: 'from-yellow-500/20 via-orange-500/10 to-transparent',
    chip: 'bg-yellow-500/15 text-yellow-800',
    highlights: ['Combos prontos', 'Adicionais', 'Cards agressivos'],
    features: ['Hambúrgueres', 'Hot dogs', 'Porções', 'Bebidas', 'Combos'],
    slogan: 'Lanches e combos com visual que abre o apetite.',
    cor_primaria: '#f59e0b',
    cor_secundaria: '#ea580c',
    preset: TEMPLATE_PRESETS.lanchonete,
    sampleProducts: [
      {
        nome: 'Burger Artesanal',
        descricao: 'Pão brioche, burger bovino, cheddar e bacon crocante.',
        preco: 29.9,
        categoria: 'Lanches',
        ordem: 1,
      },
      {
        nome: 'Batata Suprema',
        descricao: 'Batata frita com cheddar, bacon e molho da casa.',
        preco: 21.9,
        categoria: 'Acompanhamentos',
        ordem: 2,
      },
      {
        nome: 'Combo Burger + Fritas + Refri',
        descricao: 'Combinação pronta para elevar o ticket médio.',
        preco: 39.9,
        categoria: 'Combos',
        ordem: 3,
      },
    ],
  },
  bar: {
    slug: 'bar',
    iconKey: 'beer',
    name: 'Bar / Pub',
    shortDescription: 'Para bares e pubs',
    description:
      'Cardápio para bares, pubs e casas noturnas. Com drinks, cervejas artesanais e petiscos.',
    category: 'bar',
    imageUrl:
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&auto=format&fit=crop&q=80',
    previewUrl: '/templates/bar',
    price: 247,
    originalPrice: 297,
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    salesCount: 34,
    ratingAvg: 4.6,
    ratingCount: 12,
    eyebrow: 'Noite e giro rápido',
    accent: 'from-zinc-700/30 via-amber-500/10 to-transparent',
    chip: 'bg-zinc-900/10 text-zinc-700',
    highlights: ['Happy hour', 'Drinks', 'Petiscos'],
    features: ['Cervejas', 'Drinks', 'Porções', 'Sem álcool', 'Happy hour'],
    slogan: 'Petiscos e drinks organizados para vender mais.',
    cor_primaria: '#d97706',
    cor_secundaria: '#92400e',
    preset: TEMPLATE_PRESETS.bar,
    sampleProducts: [
      {
        nome: 'Porção de Frango Crocante',
        descricao: 'Serve 2 pessoas com molho especial.',
        preco: 32.9,
        categoria: 'Petiscos',
        ordem: 1,
      },
      {
        nome: 'Gin Tônica da Casa',
        descricao: 'Gin, tônica e toque cítrico.',
        preco: 24.9,
        categoria: 'Drinks',
        ordem: 2,
      },
      {
        nome: 'Balde com 6 Long Necks',
        descricao: 'Seleção gelada para compartilhar.',
        preco: 54.9,
        categoria: 'Promoções',
        ordem: 3,
      },
    ],
  },
  cafeteria: {
    slug: 'cafeteria',
    iconKey: 'coffee',
    name: 'Cafeteria',
    shortDescription: 'Para cafeterias e padarias',
    description:
      'Cardápio para cafeterias, padarias e confeitarias. Com cafés especiais, doces e salgados.',
    category: 'cafeteria',
    imageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900&auto=format&fit=crop&q=80',
    previewUrl: '/templates/cafeteria',
    price: 247,
    originalPrice: 297,
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    salesCount: 45,
    ratingAvg: 4.8,
    ratingCount: 15,
    eyebrow: 'Marca e atmosfera',
    accent: 'from-stone-500/20 via-orange-500/10 to-transparent',
    chip: 'bg-stone-500/10 text-stone-700',
    highlights: ['Cafés especiais', 'Doces', 'Brunch'],
    features: ['Cafés', 'Doces', 'Salgados', 'Sanduíches', 'Bebidas'],
    slogan: 'Cafés especiais, doces e brunch com apresentação premium.',
    cor_primaria: '#a16207',
    cor_secundaria: '#c2410c',
    preset: TEMPLATE_PRESETS.cafeteria,
    sampleProducts: [
      {
        nome: 'Cappuccino Cremoso',
        descricao: 'Espresso, leite vaporizado e chocolate.',
        preco: 14.9,
        categoria: 'Cafés',
        ordem: 1,
      },
      {
        nome: 'Croissant de Presunto e Queijo',
        descricao: 'Assado na hora e servido quentinho.',
        preco: 16.9,
        categoria: 'Salgados',
        ordem: 2,
      },
      {
        nome: 'Cheesecake de Frutas Vermelhas',
        descricao: 'Fatia individual com cobertura artesanal.',
        preco: 18.9,
        categoria: 'Doces',
        ordem: 3,
      },
    ],
  },
  acai: {
    slug: 'acai',
    iconKey: 'ice-cream',
    name: 'Açaíteria',
    shortDescription: 'Para açaíterias',
    description:
      'Cardápio para açaíterias e lanchonetes naturais. Com tigelas, copos e adicionais.',
    category: 'acai',
    imageUrl:
      'https://images.unsplash.com/photo-1590080874088-eec64895b423?w=900&auto=format&fit=crop&q=80',
    previewUrl: '/templates/acai',
    price: 247,
    originalPrice: 297,
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    salesCount: 28,
    ratingAvg: 4.5,
    ratingCount: 9,
    eyebrow: 'Visual leve e fresco',
    accent: 'from-fuchsia-500/20 via-violet-500/10 to-transparent',
    chip: 'bg-fuchsia-500/10 text-fuchsia-700',
    highlights: ['Tigelas', 'Complementos', 'Combos fitness'],
    features: ['Açaí no copo', 'Tigelas', 'Adicionais', 'Vitaminas', 'Bebidas'],
    slogan: 'Monte tigelas e complementos sem travar o pedido.',
    cor_primaria: '#a855f7',
    cor_secundaria: '#7c3aed',
    preset: TEMPLATE_PRESETS.acai,
    sampleProducts: [
      {
        nome: 'Açaí 400ml',
        descricao: 'Base cremosa com 3 complementos à escolha.',
        preco: 18.9,
        categoria: 'Copos',
        ordem: 1,
      },
      {
        nome: 'Tigela Energia 700ml',
        descricao: 'Açaí, banana, granola, leite em pó e paçoca.',
        preco: 26.9,
        categoria: 'Tigelas',
        ordem: 2,
      },
      {
        nome: 'Smoothie Tropical',
        descricao: 'Açaí batido com morango e banana.',
        preco: 15.9,
        categoria: 'Bebidas geladas',
        ordem: 3,
      },
    ],
  },
  sushi: {
    slug: 'sushi',
    iconKey: 'fish',
    name: 'Japonês / Sushi',
    shortDescription: 'Para restaurantes japoneses',
    description:
      'Cardápio para restaurantes japoneses e sushis. Com sashimis, rolls e temakis.',
    category: 'sushi',
    imageUrl:
      'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=900&auto=format&fit=crop&q=80',
    previewUrl: '/templates/sushi',
    price: 247,
    originalPrice: 297,
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    salesCount: 52,
    ratingAvg: 4.7,
    ratingCount: 18,
    eyebrow: 'Percepção premium',
    accent: 'from-emerald-500/20 via-cyan-500/10 to-transparent',
    chip: 'bg-emerald-500/10 text-emerald-700',
    highlights: ['Combinados', 'Temakis', 'Menus premium'],
    features: ['Sushis', 'Sashimis', 'Rolls', 'Temakis', 'Combos'],
    slogan: 'Combinados e peças com visual premium e leitura clara.',
    cor_primaria: '#10b981',
    cor_secundaria: '#0891b2',
    preset: TEMPLATE_PRESETS.sushi,
    sampleProducts: [
      {
        nome: 'Combo 20 Peças',
        descricao: 'Seleção de hot rolls, uramaki e niguiris.',
        preco: 44.9,
        categoria: 'Combinados',
        ordem: 1,
      },
      {
        nome: 'Temaki Salmão Cream Cheese',
        descricao: 'Salmão fresco, cream cheese e cebolinha.',
        preco: 24.9,
        categoria: 'Temakis',
        ordem: 2,
      },
      {
        nome: 'Sunomono',
        descricao: 'Salada leve para complementar o pedido.',
        preco: 12.9,
        categoria: 'Entradas',
        ordem: 3,
      },
    ],
  },
}

export const RESTAURANT_TEMPLATES = Object.values(RESTAURANT_TEMPLATE_CONFIGS)

export function getRestaurantTemplateConfig(slug?: string | null) {
  if (!slug) {
    return RESTAURANT_TEMPLATE_CONFIGS.restaurante
  }

  return RESTAURANT_TEMPLATE_CONFIGS[slug as RestaurantTemplateSlug] || RESTAURANT_TEMPLATE_CONFIGS.restaurante
}

export function getTemplateCatalog(): Template[] {
  return RESTAURANT_TEMPLATES.map((template) => ({
    id: template.slug,
    slug: template.slug,
    name: template.name,
    description: template.description,
    shortDescription: template.shortDescription,
    price: template.price,
    originalPrice: template.originalPrice,
    category: template.category,
    imageUrl: template.imageUrl,
    previewUrl: template.previewUrl,
    features: template.features,
    isFeatured: template.isFeatured,
    isNew: template.isNew,
    isBestseller: template.isBestseller,
    salesCount: template.salesCount,
    ratingAvg: template.ratingAvg,
    ratingCount: template.ratingCount,
    status: 'active',
  }))
}

export function buildTemplateDemoData(slug: RestaurantTemplateSlug) {
  const template = getRestaurantTemplateConfig(slug)

  return {
    restaurant: {
      id: `demo-${template.slug}`,
      user_id: 'demo-user',
      nome: `${template.name} Demo`,
      slug: `demo-${template.slug}`,
      telefone: '12996887993',
      logo_url: null,
      banner_url: template.imageUrl,
      slogan: template.slogan,
      cor_primaria: template.cor_primaria,
      cor_secundaria: template.cor_secundaria,
      template_slug: template.slug,
      google_maps_url: DEMO_ADDRESS.mapsUrl,
      endereco_texto: DEMO_ADDRESS.full,
      customizacao: null,
      ativo: true,
    },
    products: template.sampleProducts.map((product, index) => ({
      id: `demo-${template.slug}-${index + 1}`,
      restaurant_id: `demo-${template.slug}`,
      nome: product.nome,
      descricao: product.descricao,
      preco: product.preco,
      imagem_url: product.imagem_url || template.imageUrl,
      categoria: product.categoria,
      ativo: true,
      ordem: product.ordem,
    })),
  }
}
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
  /** Preço mensal em R$ */
  priceMonthly: number
  /** Preço anual em R$ (desconto = 2 meses grátis) */
  priceAnnual: number
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
    priceMonthly: 59,
    priceAnnual: 590,
    price: 59,
    originalPrice: 708,
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    salesCount: 156,
    ratingAvg: 4.8,
    ratingCount: 42,
    eyebrow: 'Operação de almoço',
    accent: 'from-amber-500/25 via-orange-500/15 to-transparent',
    chip: 'bg-amber-500/15 text-amber-800',
    highlights: ['Pratos do dia', 'Marmitas', 'Combos executivos'],
    features: ['Pratos executivos', 'Marmitas', 'Porções', 'Bebidas', 'Sobremesas'],
    slogan: 'Pratos do dia, combos e delivery em um só lugar.',
    cor_primaria: '#d97706',
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
        nome: 'Filé de Frango Grelhado',
        descricao: 'Arroz, feijão, filé de frango grelhado, salada e batata.',
        preco: 32.9,
        categoria: 'Pratos executivos',
        ordem: 2,
      },
      {
        nome: 'Marmita Tradicional',
        descricao: 'Arroz, feijão, carne, salada e dois acompanhamentos.',
        preco: 28.9,
        categoria: 'Marmitas',
        ordem: 3,
      },
      {
        nome: 'Marmita Fitness',
        descricao: 'Arroz integral, frango grelhado, legumes no vapor e salada.',
        preco: 34.9,
        categoria: 'Marmitas',
        ordem: 4,
      },
      {
        nome: 'Marmita Família',
        descricao: 'Porção para 4 pessoas. Arroz, feijão, 2 proteínas e acompanhamentos.',
        preco: 89.9,
        categoria: 'Marmitas',
        ordem: 5,
      },
      {
        nome: 'Porção de Batata Frita',
        descricao: 'Batata frita crocante, serve 2 pessoas.',
        preco: 18.9,
        categoria: 'Acompanhamentos',
        ordem: 6,
      },
      {
        nome: 'Salada Verde',
        descricao: 'Alface, tomate, cebola e molho à escolha.',
        preco: 12.9,
        categoria: 'Acompanhamentos',
        ordem: 7,
      },
      {
        nome: 'Pudim de Leite',
        descricao: 'Fatia individual com calda de caramelo.',
        preco: 9.9,
        categoria: 'Sobremesas',
        ordem: 8,
      },
      {
        nome: 'Suco Natural 500ml',
        descricao: 'Laranja, limão ou abacaxi com hortelã.',
        preco: 8.9,
        categoria: 'Bebidas',
        ordem: 9,
      },
      {
        nome: 'Refrigerante 2L',
        descricao: 'Coca-Cola, Guaraná ou Fanta.',
        preco: 12.9,
        categoria: 'Bebidas',
        ordem: 10,
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
    priceMonthly: 69,
    priceAnnual: 690,
    price: 69,
    originalPrice: 828,
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    salesCount: 89,
    ratingAvg: 4.7,
    ratingCount: 28,
    eyebrow: 'Ticket alto no delivery',
    accent: 'from-red-600/25 via-red-500/15 to-orange-500/10',
    chip: 'bg-red-500/15 text-red-800',
    highlights: ['Sabores e bordas', 'Combos família', 'Upsell de bebida'],
    features: ['Pizzas tradicionais', 'Pizzas especiais', 'Bordas recheadas', 'Bebidas', 'Combos'],
    slogan: 'Sabores, combos e bordas com pedido rápido.',
    cor_primaria: '#dc2626',
    cor_secundaria: '#ea580c',
    preset: TEMPLATE_PRESETS.pizzaria,
    sampleProducts: [
      {
        nome: 'Calabresa',
        descricao: 'Molho de tomate, mussarela, calabresa fatiada e cebola',
        preco: 45.9,
        categoria: 'Pizzas Tradicionais',
        ordem: 1,
      },
      {
        nome: 'Mussarela',
        descricao: 'Molho de tomate, mussarela e orégano',
        preco: 42.9,
        categoria: 'Pizzas Tradicionais',
        ordem: 2,
      },
      {
        nome: 'Portuguesa',
        descricao: 'Molho de tomate, mussarela, presunto, ovos, cebola e azeitona',
        preco: 49.9,
        categoria: 'Pizzas Tradicionais',
        ordem: 3,
      },
      {
        nome: 'Frango com Catupiry',
        descricao: 'Molho de tomate, mussarela, frango desfiado e catupiry',
        preco: 52.9,
        categoria: 'Pizzas Tradicionais',
        ordem: 4,
      },
      {
        nome: 'Quatro Queijos',
        descricao: 'Mussarela, provolone, gorgonzola e parmesão',
        preco: 58.9,
        categoria: 'Pizzas Especiais',
        ordem: 5,
      },
      {
        nome: 'Pepperoni',
        descricao: 'Molho de tomate, mussarela e pepperoni importado',
        preco: 56.9,
        categoria: 'Pizzas Especiais',
        ordem: 6,
      },
      {
        nome: 'Margherita',
        descricao: 'Molho de tomate, mussarela de búfala, tomate e manjericão fresco',
        preco: 54.9,
        categoria: 'Pizzas Especiais',
        ordem: 7,
      },
      {
        nome: 'Chocolate com Morango',
        descricao: 'Chocolate ao leite, morangos frescos e leite condensado',
        preco: 48.9,
        categoria: 'Pizzas Doces',
        ordem: 8,
      },
      {
        nome: 'Romeu e Julieta',
        descricao: 'Mussarela e goiabada cremosa',
        preco: 44.9,
        categoria: 'Pizzas Doces',
        ordem: 9,
      },
      {
        nome: 'Borda de Catupiry',
        descricao: 'Adicional para qualquer pizza',
        preco: 8,
        categoria: 'Bordas Recheadas',
        ordem: 10,
      },
      {
        nome: 'Borda de Cheddar',
        descricao: 'Adicional para qualquer pizza',
        preco: 8,
        categoria: 'Bordas Recheadas',
        ordem: 11,
      },
      {
        nome: 'Refrigerante 2L',
        descricao: 'Coca-Cola, Guaraná ou Fanta',
        preco: 14,
        categoria: 'Bebidas',
        ordem: 12,
      },
      {
        nome: 'Suco Natural 1L',
        descricao: 'Laranja, limão ou maracujá',
        preco: 16,
        categoria: 'Bebidas',
        ordem: 13,
      },
      {
        nome: 'Combo Pizza Média + Refri 2L',
        descricao: 'Pizza média à escolha + refrigerante 2L.',
        preco: 54.9,
        categoria: 'Combos',
        ordem: 14,
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
    priceMonthly: 57,
    priceAnnual: 570,
    price: 57,
    originalPrice: 684,
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    salesCount: 67,
    ratingAvg: 4.9,
    ratingCount: 19,
    eyebrow: 'Montagem e adicionais',
    accent: 'from-amber-400/25 via-yellow-500/15 to-orange-500/10',
    chip: 'bg-amber-400/20 text-amber-900',
    highlights: ['Combos prontos', 'Adicionais', 'Cards agressivos'],
    features: ['Hambúrgueres', 'Hot dogs', 'Porções', 'Bebidas', 'Combos'],
    slogan: 'Lanches e combos com visual que abre o apetite.',
    cor_primaria: '#eab308',
    cor_secundaria: '#f97316',
    preset: TEMPLATE_PRESETS.lanchonete,
    sampleProducts: [
      {
        nome: 'X-Burguer',
        descricao: 'Pão, hambúrguer bovino, queijo, alface e tomate.',
        preco: 22.9,
        categoria: 'Hambúrgueres',
        ordem: 1,
      },
      {
        nome: 'X-Salada',
        descricao: 'Pão, hambúrguer, queijo, alface, tomate e maionese.',
        preco: 24.9,
        categoria: 'Hambúrgueres',
        ordem: 2,
      },
      {
        nome: 'Burger Artesanal',
        descricao: 'Pão brioche, burger bovino 180g, cheddar e bacon crocante.',
        preco: 32.9,
        categoria: 'Hambúrgueres',
        ordem: 3,
      },
      {
        nome: 'X-Frango',
        descricao: 'Pão, filé de frango empanado, queijo, alface e tomate.',
        preco: 26.9,
        categoria: 'Hambúrgueres',
        ordem: 4,
      },
      {
        nome: 'Batata Frita',
        descricao: 'Porção individual de batata frita crocante.',
        preco: 14.9,
        categoria: 'Acompanhamentos',
        ordem: 5,
      },
      {
        nome: 'Batata com Cheddar e Bacon',
        descricao: 'Batata frita com cheddar derretido e bacon crocante.',
        preco: 21.9,
        categoria: 'Acompanhamentos',
        ordem: 6,
      },
      {
        nome: 'Anel de Cebola',
        descricao: '6 unidades empanadas e fritas.',
        preco: 16.9,
        categoria: 'Acompanhamentos',
        ordem: 7,
      },
      {
        nome: 'Combo X-Salada + Batata + Refri',
        descricao: 'X-Salada, batata média e refrigerante 350ml.',
        preco: 34.9,
        categoria: 'Combos',
        ordem: 8,
      },
      {
        nome: 'Combo Duplo + Fritas + 2 Refris',
        descricao: '2 X-Burguer, batata grande e 2 refrigerantes.',
        preco: 49.9,
        categoria: 'Combos',
        ordem: 9,
      },
      {
        nome: 'Refrigerante 350ml',
        descricao: 'Coca-Cola, Guaraná ou Fanta.',
        preco: 5.9,
        categoria: 'Bebidas',
        ordem: 10,
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
    priceMonthly: 64,
    priceAnnual: 640,
    price: 64,
    originalPrice: 768,
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    salesCount: 34,
    ratingAvg: 4.6,
    ratingCount: 12,
    eyebrow: 'Noite e giro rápido',
    accent: 'from-zinc-800/40 via-amber-900/20 to-zinc-900/30',
    chip: 'bg-amber-900/30 text-amber-200',
    highlights: ['Happy hour', 'Drinks', 'Petiscos'],
    features: ['Cervejas', 'Drinks', 'Porções', 'Sem álcool', 'Happy hour'],
    slogan: 'Petiscos e drinks organizados para vender mais.',
    cor_primaria: '#78350f',
    cor_secundaria: '#b45309',
    preset: TEMPLATE_PRESETS.bar,
    sampleProducts: [
      {
        nome: 'Porção de Batata Frita',
        descricao: 'Batata frita crocante com molho especial. Serve 2.',
        preco: 28.9,
        categoria: 'Petiscos',
        ordem: 1,
      },
      {
        nome: 'Frango à Passarinha',
        descricao: 'Coxas e sobrecoxas crocantes. Serve 2 pessoas.',
        preco: 42.9,
        categoria: 'Petiscos',
        ordem: 2,
      },
      {
        nome: 'Tábua de Frios',
        descricao: 'Queijos, presunto, salame e azeitonas. Serve 3.',
        preco: 54.9,
        categoria: 'Petiscos',
        ordem: 3,
      },
      {
        nome: 'Bolinho de Bacalhau',
        descricao: '6 unidades com molho tártaro.',
        preco: 32.9,
        categoria: 'Petiscos',
        ordem: 4,
      },
      {
        nome: 'Chopp 300ml',
        descricao: 'Chopp gelado da torneira.',
        preco: 12.9,
        categoria: 'Cervejas',
        ordem: 5,
      },
      {
        nome: 'Long Neck',
        descricao: 'Heineken, Brahma ou Stella Artois.',
        preco: 10.9,
        categoria: 'Cervejas',
        ordem: 6,
      },
      {
        nome: 'Balde 6 Long Necks',
        descricao: 'Seleção gelada para compartilhar.',
        preco: 54.9,
        categoria: 'Cervejas',
        ordem: 7,
      },
      {
        nome: 'Caipirinha',
        descricao: 'Limão, cachaça, açúcar e gelo.',
        preco: 18.9,
        categoria: 'Drinks',
        ordem: 8,
      },
      {
        nome: 'Gin Tônica',
        descricao: 'Gin, tônica e toque cítrico.',
        preco: 24.9,
        categoria: 'Drinks',
        ordem: 9,
      },
      {
        nome: 'Refrigerante 350ml',
        descricao: 'Coca-Cola, Guaraná ou água.',
        preco: 6.9,
        categoria: 'Sem álcool',
        ordem: 10,
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
    priceMonthly: 54,
    priceAnnual: 540,
    price: 54,
    originalPrice: 648,
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    salesCount: 45,
    ratingAvg: 4.8,
    ratingCount: 15,
    eyebrow: 'Marca e atmosfera',
    accent: 'from-amber-900/30 via-stone-700/20 to-amber-800/15',
    chip: 'bg-amber-900/20 text-amber-100',
    highlights: ['Cafés especiais', 'Doces', 'Brunch'],
    features: ['Cafés', 'Doces', 'Salgados', 'Sanduíches', 'Bebidas'],
    slogan: 'Cafés especiais, doces e brunch com apresentação premium.',
    cor_primaria: '#78350f',
    cor_secundaria: '#a16207',
    preset: TEMPLATE_PRESETS.cafeteria,
    sampleProducts: [
      {
        nome: 'Expresso',
        descricao: 'Café espresso tradicional 50ml.',
        preco: 6.9,
        categoria: 'Cafés',
        ordem: 1,
      },
      {
        nome: 'Cappuccino',
        descricao: 'Espresso, leite vaporizado e espuma.',
        preco: 14.9,
        categoria: 'Cafés',
        ordem: 2,
      },
      {
        nome: 'Latte',
        descricao: 'Espresso com leite vaporizado e arte no leite.',
        preco: 15.9,
        categoria: 'Cafés',
        ordem: 3,
      },
      {
        nome: 'Mocha',
        descricao: 'Espresso, chocolate, leite e chantilly.',
        preco: 18.9,
        categoria: 'Cafés',
        ordem: 4,
      },
      {
        nome: 'Suco Natural 500ml',
        descricao: 'Laranja, limão, maracujá ou abacaxi.',
        preco: 12.9,
        categoria: 'Sucos',
        ordem: 5,
      },
      {
        nome: 'Croissant de Presunto e Queijo',
        descricao: 'Assado na hora e servido quentinho.',
        preco: 16.9,
        categoria: 'Salgados',
        ordem: 6,
      },
      {
        nome: 'Pão de Queijo',
        descricao: '3 unidades quentinhas.',
        preco: 9.9,
        categoria: 'Salgados',
        ordem: 7,
      },
      {
        nome: 'Misto Quente',
        descricao: 'Pão, presunto e queijo gratinado.',
        preco: 14.9,
        categoria: 'Salgados',
        ordem: 8,
      },
      {
        nome: 'Bolo de Chocolate',
        descricao: 'Fatia generosa com cobertura.',
        preco: 12.9,
        categoria: 'Doces',
        ordem: 9,
      },
      {
        nome: 'Cheesecake',
        descricao: 'Fatia com frutas vermelhas ou doce de leite.',
        preco: 18.9,
        categoria: 'Doces',
        ordem: 10,
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
    priceMonthly: 52,
    priceAnnual: 520,
    price: 52,
    originalPrice: 624,
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    salesCount: 28,
    ratingAvg: 4.5,
    ratingCount: 9,
    eyebrow: 'Visual leve e fresco',
    accent: 'from-fuchsia-600/25 via-purple-600/15 to-violet-700/20',
    chip: 'bg-fuchsia-500/20 text-fuchsia-900',
    highlights: ['Tigelas', 'Complementos', 'Combos fitness'],
    features: ['Açaí no copo', 'Tigelas', 'Adicionais', 'Vitaminas', 'Bebidas'],
    slogan: 'Monte tigelas e complementos sem travar o pedido.',
    cor_primaria: '#7c3aed',
    cor_secundaria: '#a855f7',
    preset: TEMPLATE_PRESETS.acai,
    sampleProducts: [
      {
        nome: 'Açaí 300ml',
        descricao: 'Base cremosa com 2 complementos, 1 calda e 1 fruta.',
        preco: 16.9,
        categoria: 'Copos',
        ordem: 1,
      },
      {
        nome: 'Açaí 500ml',
        descricao: 'Base cremosa com 3 complementos, 1 calda e 1 fruta.',
        preco: 21.9,
        categoria: 'Copos',
        ordem: 2,
      },
      {
        nome: 'Açaí 700ml',
        descricao: 'Base cremosa com 4 complementos, 1 calda e 1 fruta.',
        preco: 26.9,
        categoria: 'Copos',
        ordem: 3,
      },
      {
        nome: 'Tigela 500ml',
        descricao: 'Açaí em camadas com 4 complementos e 1 calda.',
        preco: 24.9,
        categoria: 'Tigelas',
        ordem: 4,
      },
      {
        nome: 'Tigela 1L',
        descricao: 'Porção família com 5 complementos inclusos.',
        preco: 39.9,
        categoria: 'Tigelas',
        ordem: 5,
      },
      {
        nome: 'Açaí Napolitano',
        descricao: 'Açaí, morango, banana, granola, leite condensado e Nutella.',
        preco: 28.9,
        categoria: 'Especiais',
        ordem: 6,
      },
      {
        nome: 'Açaí com Paçoca',
        descricao: 'Açaí, banana, granola, leite em pó e paçoca.',
        preco: 24.9,
        categoria: 'Especiais',
        ordem: 7,
      },
      {
        nome: 'Smoothie de Açaí',
        descricao: 'Açaí batido com morango e banana.',
        preco: 15.9,
        categoria: 'Bebidas',
        ordem: 8,
      },
      {
        nome: 'Vitamina de Açaí',
        descricao: 'Açaí batido com leite e banana.',
        preco: 14.9,
        categoria: 'Bebidas',
        ordem: 9,
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
    priceMonthly: 74,
    priceAnnual: 740,
    price: 74,
    originalPrice: 888,
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    salesCount: 52,
    ratingAvg: 4.7,
    ratingCount: 18,
    eyebrow: 'Percepção premium',
    accent: 'from-red-900/30 via-rose-900/20 to-stone-900/25',
    chip: 'bg-red-900/25 text-red-100',
    highlights: ['Combinados', 'Temakis', 'Menus premium'],
    features: ['Sushis', 'Sashimis', 'Rolls', 'Temakis', 'Combos'],
    slogan: 'Combinados e peças com visual premium e leitura clara.',
    cor_primaria: '#991b1b',
    cor_secundaria: '#1f2937',
    preset: TEMPLATE_PRESETS.sushi,
    sampleProducts: [
      {
        nome: 'Harumaki',
        descricao: '6 unidades de rolinho primavera frito.',
        preco: 18.9,
        categoria: 'Entradas',
        ordem: 1,
      },
      {
        nome: 'Sunomono',
        descricao: 'Salada de pepino com vinagre de arroz.',
        preco: 14.9,
        categoria: 'Entradas',
        ordem: 2,
      },
      {
        nome: 'Combo 12 Peças',
        descricao: 'Seleção de hot rolls, uramaki e niguiris.',
        preco: 39.9,
        categoria: 'Combinados',
        ordem: 3,
      },
      {
        nome: 'Combo 25 Peças',
        descricao: 'Combinado variado com salmão, atum e hot.',
        preco: 59.9,
        categoria: 'Combinados',
        ordem: 4,
      },
      {
        nome: 'Combo Salmão',
        descricao: '15 peças focadas em salmão fresco.',
        preco: 54.9,
        categoria: 'Combinados',
        ordem: 5,
      },
      {
        nome: 'Temaki Salmão',
        descricao: 'Salmão fresco, arroz e nori.',
        preco: 22.9,
        categoria: 'Temakis',
        ordem: 6,
      },
      {
        nome: 'Temaki Califórnia',
        descricao: 'Kani, pepino, manga e cream cheese.',
        preco: 19.9,
        categoria: 'Temakis',
        ordem: 7,
      },
      {
        nome: 'Hot Philadelphia',
        descricao: 'Salmão, cream cheese empanado e frito.',
        preco: 28.9,
        categoria: 'Rolls',
        ordem: 8,
      },
      {
        nome: 'Uramaki Skin',
        descricao: 'Pele de salmão crocante, pepino e maionese.',
        preco: 26.9,
        categoria: 'Rolls',
        ordem: 9,
      },
      {
        nome: 'Yakissoba',
        descricao: 'Macarrão frito com legumes e proteína.',
        preco: 34.9,
        categoria: 'Pratos quentes',
        ordem: 10,
      },
    ],
  },
}

export const RESTAURANT_TEMPLATES = Object.values(RESTAURANT_TEMPLATE_CONFIGS)

export function getRestaurantTemplateConfig(slug?: string | null) {
  const normalized = typeof slug === 'string' ? slug.trim().toLowerCase() : ''
  if (!normalized) {
    return RESTAURANT_TEMPLATE_CONFIGS.restaurante
  }

  const config = RESTAURANT_TEMPLATE_CONFIGS[normalized as RestaurantTemplateSlug]
  return config || RESTAURANT_TEMPLATE_CONFIGS.restaurante
}

export function getTemplateCatalog(): Template[] {
  return RESTAURANT_TEMPLATES.map((template) => ({
    id: template.slug,
    slug: template.slug,
    name: template.name,
    description: template.description,
    shortDescription: template.shortDescription,
    price: template.priceMonthly,
    originalPrice: template.originalPrice,
    priceMonthly: template.priceMonthly,
    priceAnnual: template.priceAnnual,
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
      telefone: '11999999999',
      logo_url: null,
      banner_url: template.imageUrl,
      slogan: template.slogan,
      cor_primaria: '#d97706',
      cor_secundaria: '#ea580c',
      template_slug: template.slug,
      google_maps_url: 'https://www.google.com/maps?q=Av.+Paulista,+1578,+Bela+Vista,+São+Paulo',
      endereco_texto: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
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
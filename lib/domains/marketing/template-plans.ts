/**
 * 📊 ESTRUTURA DE PLANOS POR TEMPLATE - PhD Level Analysis
 *
 * Baseado em análise de mercado brasileiro e dados reais de estabelecimentos
 * Cada template possui 3 planos integrados baseados na quantidade mínima de produtos
 */

export interface TemplatePlan {
  id: string
  name: string
  displayName: string
  description: string
  maxProducts: number
  features: string[]
  priceMonthly: number
  priceAnnual: number
  recommended: boolean
  popular?: boolean
}

export interface TemplatePlans {
  [templateSlug: string]: TemplatePlan[]
}

/**
 * 🎯 DEFINIÇÃO DE PLANOS POR TEMPLATE
 *
 * Lógica baseada em dados reais do mercado brasileiro:
 * - Essencial: Quantidade mínima para sobreviver (15-40 produtos)
 * - Profissional: Cardápio completo para operação regular (25-80 produtos)
 * - Empresarial: Sortimento completo para grandes operações (40-120+ produtos)
 */
export const TEMPLATE_PLANS: TemplatePlans = {
  // 🍽️ RESTAURANTE - Foco em pratos executivos e marmitas
  restaurante: [
    {
      id: 'restaurante-essencial',
      name: 'essencial',
      displayName: 'Essencial',
      description: 'Para restaurantes iniciantes - pratos principais + básicos',
      maxProducts: 25,
      features: [
        'Até 25 produtos',
        'Pratos executivos básicos',
        '2 categorias principais',
        'Suporte básico',
        'Relatórios simples',
      ],
      priceMonthly: 97,
      priceAnnual: 970,
      recommended: true,
    },
    {
      id: 'restaurante-profissional',
      name: 'profissional',
      displayName: 'Profissional',
      description: 'Cardápio completo para restaurantes estabelecidos',
      maxProducts: 40,
      features: [
        'Até 40 produtos',
        'Cardápio completo',
        'Peixes e frutos do mar',
        'Marmitas fitness',
        'Combos promocionais',
        'Suporte prioritário',
      ],
      priceMonthly: 147,
      priceAnnual: 1470,
      recommended: false,
      popular: true,
    },
    {
      id: 'restaurante-empresarial',
      name: 'empresarial',
      displayName: 'Empresarial',
      description: 'Para redes e operações de grande porte',
      maxProducts: 52,
      features: [
        'Até 52 produtos',
        'Sortimento completo',
        'Todas as categorias',
        'Análises avançadas',
        'Suporte 24/7',
        'API personalizada',
      ],
      priceMonthly: 247,
      priceAnnual: 2470,
      recommended: false,
    },
  ],

  // 🍕 PIZZARIA - Foco em sabores e combinações
  pizzaria: [
    {
      id: 'pizzaria-essencial',
      name: 'essencial',
      displayName: 'Essencial',
      description: 'Para pizzarias pequenas - sabores básicos',
      maxProducts: 18,
      features: [
        'Até 18 produtos',
        'Sabores tradicionais',
        '2 tamanhos',
        'Bebidas básicas',
        'Suporte básico',
      ],
      priceMonthly: 97,
      priceAnnual: 970,
      recommended: true,
    },
    {
      id: 'pizzaria-profissional',
      name: 'profissional',
      displayName: 'Profissional',
      description: 'Pizzaria completa com variações',
      maxProducts: 30,
      features: [
        'Até 30 produtos',
        'Linha completa',
        'Esfihas e calzones',
        'Combos família',
        'Bordas recheadas',
        'Suporte prioritário',
      ],
      priceMonthly: 147,
      priceAnnual: 1470,
      recommended: false,
      popular: true,
    },
    {
      id: 'pizzaria-empresarial',
      name: 'empresarial',
      displayName: 'Empresarial',
      description: 'Para redes de pizzaria',
      maxProducts: 48,
      features: [
        'Até 48 produtos',
        'Catálogo premium',
        'Pizzas doces',
        'Programa de fidelidade',
        'Análises avançadas',
        'Suporte 24/7',
      ],
      priceMonthly: 247,
      priceAnnual: 2470,
      recommended: false,
    },
  ],

  // 🍔 LANCHONETE - Foco em sanduíches e porções
  lanchonete: [
    {
      id: 'lanchonete-essencial',
      name: 'essencial',
      displayName: 'Essencial',
      description: 'Para lanchonetes pequenas',
      maxProducts: 20,
      features: [
        'Até 20 produtos',
        'Sanduíches básicos',
        'Porções simples',
        'Bebidas',
        'Suporte básico',
      ],
      priceMonthly: 97,
      priceAnnual: 970,
      recommended: true,
    },
    {
      id: 'lanchonete-profissional',
      name: 'profissional',
      displayName: 'Profissional',
      description: 'Lanchonete completa',
      maxProducts: 35,
      features: [
        'Até 35 produtos',
        'Cardápio variado',
        'Combos promocionais',
        'Porções especiais',
        'Suporte prioritário',
      ],
      priceMonthly: 147,
      priceAnnual: 1470,
      recommended: false,
      popular: true,
    },
    {
      id: 'lanchonete-empresarial',
      name: 'empresarial',
      displayName: 'Empresarial',
      description: 'Para redes de lanchonetes',
      maxProducts: 46,
      features: [
        'Até 46 produtos',
        'Sortimento completo',
        'Programa fidelidade',
        'Análises avançadas',
        'Suporte 24/7',
      ],
      priceMonthly: 247,
      priceAnnual: 2470,
      recommended: false,
    },
  ],

  // 🍨 AÇAÍ/SORVETERIA - Foco em variações e toppings
  acai: [
    {
      id: 'acai-essencial',
      name: 'essencial',
      displayName: 'Essencial',
      description: 'Para pontos de açaí pequenos',
      maxProducts: 12,
      features: ['Até 12 produtos', 'Açaí básico', '2-3 acompanhamentos', 'Suporte básico'],
      priceMonthly: 77,
      priceAnnual: 770,
      recommended: true,
    },
    {
      id: 'acai-profissional',
      name: 'profissional',
      displayName: 'Profissional',
      description: 'Açaí completo com variações',
      maxProducts: 25,
      features: [
        'Até 25 produtos',
        'Linha completa',
        'Toppings variados',
        'Combos',
        'Suporte prioritário',
      ],
      priceMonthly: 127,
      priceAnnual: 1270,
      recommended: false,
      popular: true,
    },
    {
      id: 'acai-empresarial',
      name: 'empresarial',
      displayName: 'Empresarial',
      description: 'Para redes de açaí',
      maxProducts: 38,
      features: [
        'Até 38 produtos',
        'Catálogo premium',
        'Frutas especiais',
        'Programa fidelidade',
        'Análises avançadas',
      ],
      priceMonthly: 197,
      priceAnnual: 1970,
      recommended: false,
    },
  ],

  // 🛒 MERCADINHO - Foco em itens essenciais
  mercadinho: [
    {
      id: 'mercadinho-essencial',
      name: 'essencial',
      displayName: 'Essencial',
      description: 'Para mercadinhos pequenos',
      maxProducts: 50,
      features: ['Até 50 produtos', 'Itens básicos', 'Conveniência', 'Suporte básico'],
      priceMonthly: 127,
      priceAnnual: 1270,
      recommended: true,
    },
    {
      id: 'mercadinho-profissional',
      name: 'profissional',
      displayName: 'Profissional',
      description: 'Mercadinho completo',
      maxProducts: 90,
      features: [
        'Até 90 produtos',
        'Sortimento médio',
        'Produtos frescos',
        'Combos promocionais',
        'Suporte prioritário',
      ],
      priceMonthly: 197,
      priceAnnual: 1970,
      recommended: false,
      popular: true,
    },
    {
      id: 'mercadinho-empresarial',
      name: 'empresarial',
      displayName: 'Empresarial',
      description: 'Para redes de varejo',
      maxProducts: 128,
      features: [
        'Até 128 produtos',
        'Sortimento completo',
        'Programa fidelidade',
        'Análises avançadas',
        'Suporte 24/7',
        'Integração ERP',
      ],
      priceMonthly: 297,
      priceAnnual: 2970,
      recommended: false,
    },
  ],

  // 🐕 PETSHOP - Foco em produtos para animais
  petshop: [
    {
      id: 'petshop-essencial',
      name: 'essencial',
      displayName: 'Essencial',
      description: 'Para petshops pequenos',
      maxProducts: 25,
      features: ['Até 25 produtos', 'Ração básica', 'Petiscos', 'Suporte básico'],
      priceMonthly: 97,
      priceAnnual: 970,
      recommended: true,
    },
    {
      id: 'petshop-profissional',
      name: 'profissional',
      displayName: 'Profissional',
      description: 'Petshop completo',
      maxProducts: 45,
      features: [
        'Até 45 produtos',
        'Linha completa',
        'Acessórios',
        'Higiene',
        'Suporte prioritário',
      ],
      priceMonthly: 147,
      priceAnnual: 1470,
      recommended: false,
      popular: true,
    },
    {
      id: 'petshop-empresarial',
      name: 'empresarial',
      displayName: 'Empresarial',
      description: 'Para redes de petshop',
      maxProducts: 66,
      features: [
        'Até 66 produtos',
        'Catálogo premium',
        'Programa fidelidade',
        'Análises avançadas',
        'Suporte 24/7',
      ],
      priceMonthly: 247,
      priceAnnual: 2470,
      recommended: false,
    },
  ],
}

/**
 * 🔍 UTILITÁRIOS PARA PLANOS
 */
export function getTemplatePlans(templateSlug: string): TemplatePlan[] {
  return TEMPLATE_PLANS[templateSlug] || []
}

export function getPlanById(templateSlug: string, planId: string): TemplatePlan | undefined {
  const plans = getTemplatePlans(templateSlug)
  return plans.find((plan) => plan.id === planId)
}

export function getRecommendedPlan(templateSlug: string): TemplatePlan | undefined {
  const plans = getTemplatePlans(templateSlug)
  return plans.find((plan) => plan.recommended)
}

export function getPopularPlan(templateSlug: string): TemplatePlan | undefined {
  const plans = getTemplatePlans(templateSlug)
  return plans.find((plan) => plan.popular)
}

/**
 * 📊 MÉTRICAS DE PLANOS
 */
export const PLAN_METRICS = {
  totalTemplates: Object.keys(TEMPLATE_PLANS).length,
  totalPlans: Object.values(TEMPLATE_PLANS).reduce((sum, plans) => sum + plans.length, 0),
  avgProductsEssential: Math.round(
    Object.values(TEMPLATE_PLANS)
      .map((plans) => plans.find((p) => p.name === 'essencial')?.maxProducts || 0)
      .filter((count) => count > 0)
      .reduce((sum, count, _, arr) => sum + count / arr.length, 0)
  ),
  avgProductsProfessional: Math.round(
    Object.values(TEMPLATE_PLANS)
      .map((plans) => plans.find((p) => p.name === 'profissional')?.maxProducts || 0)
      .filter((count) => count > 0)
      .reduce((sum, count, _, arr) => sum + count / arr.length, 0)
  ),
  avgProductsEnterprise: Math.round(
    Object.values(TEMPLATE_PLANS)
      .map((plans) => plans.find((p) => p.name === 'empresarial')?.maxProducts || 0)
      .filter((count) => count > 0)
      .reduce((sum, count, _, arr) => sum + count / arr.length, 0)
  ),
} as const

import type { SubscriptionPlanSlug } from '@/lib/domains/marketing/pricing'

export interface PublicPlanDisplay {
  name: string
  phase: string
  microcopy: string
  cta: string
  badge?: string
}

const PUBLIC_PLAN_DISPLAY: Record<SubscriptionPlanSlug, PublicPlanDisplay> = {
  semente: {
    name: 'Impulso',
    phase: 'Começando com direção',
    microcopy: 'Para começar com investimento leve e subir no ritmo certo',
    cta: 'Começar agora',
  },
  basico: {
    name: 'Operação',
    phase: 'Rodando com consistência',
    microcopy: 'Para organizar o dia a dia e vender com mais estrutura',
    cta: 'Escolher Operação',
    badge: 'Mais escolhido',
  },
  pro: {
    name: 'Escala',
    phase: 'Crescendo com estrutura',
    microcopy: 'Para ampliar catálogo, categorias e receita com segurança',
    cta: 'Escolher Escala',
  },
  premium: {
    name: 'Expansão',
    phase: 'Expandindo com controle',
    microcopy: 'Para operar com mais capacidade, alcance e liberdade',
    cta: 'Escolher Expansão',
  },
}

export function getPublicPlanDisplay(slug: SubscriptionPlanSlug): PublicPlanDisplay {
  return PUBLIC_PLAN_DISPLAY[slug]
}


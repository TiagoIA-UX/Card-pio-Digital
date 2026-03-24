import type { LucideIcon } from 'lucide-react'
import {
  Apple,
  Beer,
  Cake,
  Coffee,
  Croissant,
  Fish,
  Flame,
  IceCream,
  LayoutTemplate,
  MessageCircle,
  PawPrint,
  Pizza,
  Rocket,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Store,
  TabletSmartphone,
  Wine,
} from 'lucide-react'
import { RESTAURANT_TEMPLATES } from '@/lib/templates-config'

const ICONS = {
  store: Store,
  pizza: Pizza,
  burger: ShoppingBag,
  beer: Beer,
  coffee: Coffee,
  'ice-cream': IceCream,
  fish: Fish,
  wine: Wine,
  cart: ShoppingCart,
  croissant: Croissant,
  flame: Flame,
  apple: Apple,
  paw: PawPrint,
  cake: Cake,
} as const satisfies Record<string, LucideIcon>

export const WHATSAPP_NUMBER = '5512996887993'

const WHATSAPP_MESSAGE = encodeURIComponent(
  'Olá! Quero conhecer os modelos prontos de cardápio digital para os 15 tipos de negócio.',
)

export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

export const SCREENSHOT_EDITOR = '/screenshots/painel-editor.png'
export const SCREENSHOT_DASHBOARD = '/screenshots/painel-dashboard.png'

export interface NicheTemplate {
  slug: string
  name: string
  eyebrow: string
  description: string
  image: string
  icon: LucideIcon
  accent: string
  chip: string
  highlights: string[]
}

export const NICHE_TEMPLATES: NicheTemplate[] = RESTAURANT_TEMPLATES.map((template) => ({
  slug: template.slug,
  name: template.name,
  eyebrow: template.eyebrow,
  description: template.description,
  image: template.imageUrl,
  icon: ICONS[template.iconKey],
  accent: template.accent,
  chip: template.chip,
  highlights: template.highlights,
}))

export const HERO_TEMPLATE_SLUG = 'pizzaria'

export const PLATFORM_FEATURES = [
  {
    icon: LayoutTemplate,
    title: '15 Modelos Prontos para Cada Tipo de Operação',
    description:
      'Pizzaria, hamburgueria, açaí, sushi, bar, doceria — cada template foi desenhado para o perfil do negócio, com visual que facilita a escolha do cliente e aumenta a conversão.',
  },
  {
    icon: Shield,
    title: 'Zero Comissão por Pedido — o Lucro É Todo Seu',
    description:
      'Diferente de plataformas que cobram de 12% a 27% por pedido, aqui você paga apenas a assinatura fixa. Tudo que o cliente paga vai direto pra você.',
  },
  {
    icon: TabletSmartphone,
    title: 'Painel Simples no Celular e no Computador',
    description:
      'Se você sabe usar WhatsApp, consegue usar o painel. Atualize preços, fotos e promoções de qualquer lugar, sem depender de ninguém.',
  },
  {
    icon: Rocket,
    title: 'Preparado para Alta Temporada e Picos de Demanda',
    description:
      'No litoral e em datas sazonais o volume de pedidos dispara. Com o cardápio digital organizado, sua equipe atende mais rápido e sem perder pedido.',
  },
] as const

export const HIGHLIGHT_BENEFITS = [
  {
    title: 'Venda Mais sem Pagar Comissão por Pedido',
    description:
      'Em plataformas tradicionais, cada pedido custa entre 12% e 27% em taxas. Aqui a assinatura é fixa: o valor integral do pedido vai direto para o seu caixa, sem desconto por venda.',
  },
  {
    title: 'Preparado para Períodos de Alta Demanda',
    description:
      'Feriados, férias escolares, temporada de verão — quando o volume de pedidos explode, o cardápio digital organiza o fluxo para sua equipe atender com agilidade e sem perder vendas.',
  },
] as const

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Escolha o Modelo do Seu Segmento',
    description:
      'Selecione entre 15 templates profissionais — pizzaria, hamburgueria, sushi, bar, cafeteria e mais. Cada modelo já vem com a estrutura ideal para o seu tipo de operação.',
  },
  {
    step: '02',
    title: 'Personalize pelo Painel — Sem Programador',
    description:
      'Cadastre seus produtos, defina preços, adicione fotos e organize as categorias. O painel é visual e funciona no celular. Se você usa WhatsApp, consegue usar.',
  },
  {
    step: '03',
    title: 'Publique e Venda Direto pelo Seu Canal',
    description:
      'Compartilhe o link no WhatsApp, Instagram e QR Code. Os pedidos chegam organizados no seu canal, sem intermediário e sem comissão por venda.',
  },
] as const

export interface PlatformFeature {
  icon: LucideIcon
  title: string
  description: string
}

export interface HighlightBenefit {
  title: string
  description: string
}

export interface ProcessStep {
  step: string
  title: string
  description: string
}

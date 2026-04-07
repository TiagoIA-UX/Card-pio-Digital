import {
  Apple,
  Beer,
  Cake,
  Coffee,
  Croissant,
  Fish,
  Flame,
  IceCream,
  PawPrint,
  Pizza,
  ShoppingCart,
  Store,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from 'lucide-react'
import type { RestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'
import { RESTAURANT_TEMPLATE_CONFIGS } from '@/lib/domains/marketing/templates-config'

export const TEMPLATE_CHECKOUT_VISUALS: Record<
  RestaurantTemplateSlug,
  { icon: LucideIcon; color: string }
> = {
  restaurante: { icon: Store, color: 'bg-orange-500' },
  pizzaria: { icon: Pizza, color: 'bg-red-500' },
  lanchonete: { icon: UtensilsCrossed, color: 'bg-yellow-500' },
  bar: { icon: Beer, color: 'bg-amber-600' },
  cafeteria: { icon: Coffee, color: 'bg-amber-800' },
  acai: { icon: IceCream, color: 'bg-purple-600' },
  sushi: { icon: Fish, color: 'bg-rose-600' },
  adega: { icon: Wine, color: 'bg-purple-800' },
  mercadinho: { icon: ShoppingCart, color: 'bg-emerald-600' },
  minimercado: { icon: ShoppingCart, color: 'bg-emerald-700' },
  padaria: { icon: Croissant, color: 'bg-amber-700' },
  sorveteria: { icon: IceCream, color: 'bg-pink-500' },
  acougue: { icon: Flame, color: 'bg-red-700' },
  hortifruti: { icon: Apple, color: 'bg-green-600' },
  petshop: { icon: PawPrint, color: 'bg-sky-500' },
  doceria: { icon: Cake, color: 'bg-rose-500' },
}

export function isRestaurantTemplateSlug(value: string): value is RestaurantTemplateSlug {
  return value in RESTAURANT_TEMPLATE_CONFIGS
}
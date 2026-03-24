/**
 * Adapter puro: converte estado de edição (draft) para objetos de preview,
 * sem depender de hooks ou estado persistido.
 */

import type { CardapioRestaurant } from '@/lib/cardapio-renderer'
import type { RestaurantCustomization } from '@/lib/restaurant-customization'
import type { FormState } from './types'

// ── Customization from draft ───────────────────────────────────────────

export function buildCustomizationFromDraft(
  form: FormState,
  customCategories: string[]
): RestaurantCustomization {
  return {
    sections: { hero: true, service: true, categories: true, about: true },
    customCategories: customCategories.length > 0 ? customCategories : undefined,
    heroSloganPreset: form.heroSloganPreset,
    badge: form.badge,
    heroTitle: form.heroTitle,
    heroDescription: form.heroDescription,
    sectionTitle: form.sectionTitle,
    sectionDescription: form.sectionDescription,
    aboutTitle: form.aboutTitle,
    aboutDescription: form.aboutDescription,
    primaryCtaLabel: form.primaryCtaLabel,
    secondaryCtaLabel: form.secondaryCtaLabel,
    deliveryLabel: form.deliveryLabel,
    pickupLabel: form.pickupLabel,
    dineInLabel: form.dineInLabel,
  }
}

// ── Preview restaurant from draft ──────────────────────────────────────

export function buildPreviewRestaurant(
  restaurant: CardapioRestaurant | null,
  form: FormState,
  customization: RestaurantCustomization
): CardapioRestaurant | null {
  if (!restaurant) return null
  return {
    ...restaurant,
    nome: form.nome || restaurant.nome || 'Seu delivery',
    telefone: form.telefone || null,
    endereco_texto: form.endereco_texto?.trim() || null,
    google_maps_url: form.google_maps_url?.trim() || null,
    logo_url: form.logo_url || null,
    banner_url: form.banner_url || null,
    slogan: form.slogan || null,
    customizacao: customization as Record<string, unknown>,
  }
}

// ── Display categories from draft ──────────────────────────────────────

export function buildDisplayCategories(
  customCategories: string[],
  productCategories: string[]
): string[] {
  const fromProducts = [...new Set(productCategories.filter(Boolean))]
  return customCategories.length > 0
    ? [...customCategories, ...fromProducts.filter((c) => !customCategories.includes(c))]
    : [...fromProducts].sort()
}

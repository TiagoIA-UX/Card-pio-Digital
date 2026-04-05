import type { EditorBlockId } from '@/components/template-editor/cardapio-editor-preview'
import type { HeroSloganPresetId } from '@/lib/domains/core/restaurant-customization'
import { PREVIEW_TO_EDITOR_BLOCK } from './block-schema'

export type EditorBlockIdShort = EditorBlockId

export interface FormState {
  nome: string
  telefone: string
  endereco_texto: string
  google_maps_url: string
  logo_url: string
  banner_url: string
  slogan: string
  heroSloganPreset: HeroSloganPresetId
  badge: string
  heroTitle: string
  heroDescription: string
  sectionTitle: string
  sectionDescription: string
  aboutTitle: string
  aboutDescription: string
  primaryCtaLabel: string
  secondaryCtaLabel: string
  deliveryLabel: string
  pickupLabel: string
  dineInLabel: string
}

export const INITIAL_FORM: FormState = {
  nome: '',
  telefone: '',
  endereco_texto: '',
  google_maps_url: '',
  logo_url: '',
  banner_url: '',
  slogan: '',
  heroSloganPreset: 'custom',
  badge: '',
  heroTitle: '',
  heroDescription: '',
  sectionTitle: '',
  sectionDescription: '',
  aboutTitle: '',
  aboutDescription: '',
  primaryCtaLabel: '',
  secondaryCtaLabel: '',
  deliveryLabel: 'Entrega',
  pickupLabel: 'Retirada',
  dineInLabel: 'Consumir no local',
}

/** Derived from EDITOR_BLOCK_SCHEMA — maps preview data-blocks to editor blocks */
export const DATA_BLOCK_TO_EDITOR: Record<string, EditorBlockIdShort> = PREVIEW_TO_EDITOR_BLOCK

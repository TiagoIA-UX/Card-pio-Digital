/**
 * Declarative block schema for the visual editor.
 *
 * Single source of truth for:
 * - Which blocks exist and their labels
 * - Which fields belong to each block
 * - How preview data-blocks map to editor blocks
 * - Which fields support inline editing in the preview
 */

import type { EditorBlockId, EditorFieldId, PreviewDataBlock } from '@/components/template-editor/cardapio-editor-preview'

// ── Field definition ────────────────────────────────────────────────────

export type EditorFieldType = 'text' | 'textarea' | 'image' | 'select' | 'toggle'

export interface BlockFieldDefinition {
  id: EditorFieldId
  label: string
  type: EditorFieldType
  placeholder?: string
  /** Field supports inline text editing in the preview canvas */
  inlineText?: boolean
  /** Field supports inline image editing in the preview canvas */
  inlineImage?: boolean
}

// ── Block definition ────────────────────────────────────────────────────

export interface EditorBlockDefinition {
  id: EditorBlockId
  label: string
  /** Preview data-block(s) that map to this editor block */
  previewBlocks: PreviewDataBlock[]
  fields: BlockFieldDefinition[]
}

// ── Schema ──────────────────────────────────────────────────────────────

export const EDITOR_BLOCK_SCHEMA: EditorBlockDefinition[] = [
  {
    id: 'negocio',
    label: 'Negócio',
    previewBlocks: ['header', 'address'],
    fields: [
      { id: 'nome', label: 'Nome', type: 'text', placeholder: 'Nome do estabelecimento' },
      { id: 'telefone', label: 'WhatsApp', type: 'text', placeholder: '(11) 99999-9999' },
      { id: 'slogan', label: 'Slogan', type: 'text', placeholder: 'Ex: O melhor da cidade' },
      {
        id: 'endereco_texto',
        label: 'Endereço',
        type: 'text',
        placeholder: 'Av. Exemplo, 123 - Bairro - Cidade/SP',
      },
      {
        id: 'google_maps_url',
        label: 'Link do Google Maps',
        type: 'text',
        placeholder: 'https://maps.google.com/?q=Seu+Delivery',
      },
    ],
  },
  {
    id: 'branding',
    label: 'Logo e Banner',
    previewBlocks: ['banner'],
    fields: [
      { id: 'logo_url', label: 'Logo', type: 'image', inlineImage: true },
      { id: 'banner_url', label: 'Banner', type: 'image', inlineImage: true },
    ],
  },
  {
    id: 'hero',
    label: 'Hero / Banner principal',
    previewBlocks: ['hero'],
    fields: [
      { id: 'badge', label: 'Badge superior', type: 'text', inlineText: true },
      { id: 'heroTitle', label: 'Título principal', type: 'textarea', inlineText: true },
      { id: 'heroDescription', label: 'Descrição principal', type: 'textarea', inlineText: true },
      { id: 'primaryCtaLabel', label: 'CTA principal', type: 'text', inlineText: true },
      { id: 'secondaryCtaLabel', label: 'CTA secundário', type: 'text', inlineText: true },
    ],
  },
  {
    id: 'service',
    label: 'Serviço / Modalidades',
    previewBlocks: ['service'],
    fields: [
      { id: 'deliveryLabel', label: 'Entrega', type: 'text', placeholder: 'Entrega' },
      { id: 'pickupLabel', label: 'Retirada', type: 'text', placeholder: 'Retirada' },
      { id: 'dineInLabel', label: 'Consumir no local', type: 'text', placeholder: 'Consumir no local' },
    ],
  },
  {
    id: 'products',
    label: 'Produtos / Categorias',
    previewBlocks: ['products', 'product-card'],
    fields: [
      {
        id: 'sectionTitle',
        label: 'Título da seção',
        type: 'text',
        placeholder: 'Ex: Pizzas, bordas e bebidas',
        inlineText: true,
      },
      {
        id: 'sectionDescription',
        label: 'Descrição da seção',
        type: 'textarea',
        placeholder: 'Ex: Encontre tudo em uma estrutura fácil...',
        inlineText: true,
      },
    ],
  },
  {
    id: 'about',
    label: 'Institucional',
    previewBlocks: ['about'],
    fields: [
      { id: 'aboutTitle', label: 'Título institucional', type: 'text', inlineText: true },
      { id: 'aboutDescription', label: 'Descrição institucional', type: 'textarea', inlineText: true },
    ],
  },
  {
    id: 'structure',
    label: 'Estrutura / Visibilidade',
    previewBlocks: ['colors'],
    fields: [
      { id: 'heroVisible', label: 'Exibir Hero', type: 'toggle' },
      { id: 'serviceVisible', label: 'Exibir Serviço', type: 'toggle' },
      { id: 'categoriesVisible', label: 'Exibir Categorias', type: 'toggle' },
      { id: 'aboutVisible', label: 'Exibir Institucional', type: 'toggle' },
    ],
  },
]

// ── Derived lookups (computed once at module level) ─────────────────────

/** Map from preview data-block id → editor block id */
export const PREVIEW_TO_EDITOR_BLOCK: Record<string, EditorBlockId> = Object.fromEntries(
  EDITOR_BLOCK_SCHEMA.flatMap((block) =>
    block.previewBlocks.map((pb) => [pb, block.id])
  )
) as Record<string, EditorBlockId>

/** Map from field id → block id it belongs to */
export const FIELD_TO_BLOCK: Record<string, EditorBlockId> = Object.fromEntries(
  EDITOR_BLOCK_SCHEMA.flatMap((block) =>
    block.fields.map((f) => [f.id, block.id])
  )
) as Record<string, EditorBlockId>

/** Set of field IDs that support inline text editing */
export const INLINE_TEXT_FIELD_IDS = new Set(
  EDITOR_BLOCK_SCHEMA.flatMap((block) =>
    block.fields.filter((f) => f.inlineText).map((f) => f.id)
  )
)

/** Set of field IDs that support inline image editing */
export const INLINE_IMAGE_FIELD_IDS = new Set(
  EDITOR_BLOCK_SCHEMA.flatMap((block) =>
    block.fields.filter((f) => f.inlineImage).map((f) => f.id)
  )
)

/** Get a block definition by id */
export function getBlockDefinition(blockId: EditorBlockId): EditorBlockDefinition | undefined {
  return EDITOR_BLOCK_SCHEMA.find((b) => b.id === blockId)
}

/** Get all fields for a specific block */
export function getBlockFields(blockId: EditorBlockId): BlockFieldDefinition[] {
  return getBlockDefinition(blockId)?.fields ?? []
}


'use client'

import { useMemo, type MouseEvent } from 'react'
import Image from 'next/image'
import { Check, Loader2, MapPin, Store } from 'lucide-react'
import {
  buildCardapioViewModel,
  resolveCardapioProductsForPreview,
  type CardapioProduct,
  type CardapioRestaurant,
} from '@/lib/cardapio-renderer'
import { cn, formatCurrency } from '@/lib/utils'
import { TEMPLATE_PRESETS } from '@/lib/restaurant-customization'

export type EditorBlockId =
  | 'negocio'
  | 'branding'
  | 'structure'
  | 'hero'
  | 'service'
  | 'products'
  | 'about'

export type EditorFieldId =
  | 'nome'
  | 'telefone'
  | 'template'
  | 'slogan'
  | 'google_maps_url'
  | 'endereco_texto'
  | 'logo_url'
  | 'banner_url'
  | 'cor_primaria'
  | 'cor_secundaria'
  | 'heroVisible'
  | 'serviceVisible'
  | 'categoriesVisible'
  | 'aboutVisible'
  | 'badge'
  | 'heroTitle'
  | 'heroDescription'
  | 'primaryCtaLabel'
  | 'secondaryCtaLabel'
  | 'sectionTitle'
  | 'sectionDescription'
  | 'aboutTitle'
  | 'aboutDescription'
  | 'deliveryLabel'
  | 'pickupLabel'
  | 'dineInLabel'

export type PreviewDataBlock =
  | 'header'
  | 'banner'
  | 'colors'
  | 'hero'
  | 'service'
  | 'products'
  | 'product-card'
  | 'about'
  | 'address'

export interface InlineProductDraft {
  nome: string
  descricao: string
  preco: string
}

export const INLINE_TEXT_FIELDS = [
  'badge',
  'heroTitle',
  'heroDescription',
  'primaryCtaLabel',
  'secondaryCtaLabel',
  'sectionTitle',
  'sectionDescription',
  'aboutTitle',
  'aboutDescription',
] as const

export type InlineTextField = (typeof INLINE_TEXT_FIELDS)[number]

export type InlineProductSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const INLINE_TEXT_FIELD_CONFIG: Record<
  InlineTextField,
  {
    label: string
    multiline: boolean
    rows?: number
    editorClassName?: string
    inputClassName?: string
  }
> = {
  badge: {
    label: 'Badge superior',
    multiline: false,
    editorClassName: 'relative z-10 max-w-sm',
    inputClassName:
      'rounded-full border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold text-white placeholder:text-white/60',
  },
  heroTitle: {
    label: 'Título principal',
    multiline: true,
    rows: 2,
    editorClassName: 'relative z-10 mt-4 max-w-2xl',
    inputClassName:
      'border-white/30 bg-white/10 px-4 py-3 text-2xl leading-tight font-semibold text-white placeholder:text-white/60',
  },
  heroDescription: {
    label: 'Descrição principal',
    multiline: true,
    rows: 3,
    editorClassName: 'relative z-10 mt-3 max-w-xl',
    inputClassName:
      'border-white/30 bg-white/10 px-4 py-3 text-sm leading-6 text-white placeholder:text-white/60',
  },
  primaryCtaLabel: {
    label: 'CTA principal',
    multiline: false,
    editorClassName: 'min-w-55',
    inputClassName:
      'rounded-full border-white/30 bg-white px-4 py-2 text-sm font-semibold text-black placeholder:text-zinc-500',
  },
  secondaryCtaLabel: {
    label: 'CTA secundário',
    multiline: false,
    editorClassName: 'min-w-55',
    inputClassName:
      'rounded-full border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white placeholder:text-white/60',
  },
  sectionTitle: {
    label: 'Título da seção de categorias',
    multiline: false,
    inputClassName: 'text-foreground px-3 py-2 text-sm font-semibold',
  },
  sectionDescription: {
    label: 'Descrição da seção de categorias',
    multiline: true,
    rows: 3,
    editorClassName: 'mt-1',
    inputClassName: 'text-foreground px-3 py-2 text-sm',
  },
  aboutTitle: {
    label: 'Título do bloco institucional',
    multiline: false,
    inputClassName: 'text-foreground px-3 py-2 text-sm font-medium',
  },
  aboutDescription: {
    label: 'Descrição do bloco institucional',
    multiline: true,
    rows: 3,
    editorClassName: 'mt-1',
    inputClassName: 'text-foreground px-3 py-2 text-sm',
  },
}

interface PreviewSelection {
  dataBlock: PreviewDataBlock
  field?: EditorFieldId
  productId?: string
}

interface CardapioEditorPreviewProps {
  restaurant: CardapioRestaurant
  products: CardapioProduct[]
  selectedBlock: EditorBlockId
  selectedField: EditorFieldId | null
  selectedProductId: string | null
  activeInlineTextField: InlineTextField | null
  productDrafts: Record<string, InlineProductDraft>
  inlineTextDrafts: Partial<Record<InlineTextField, string>>
  productSaveState: Record<string, InlineProductSaveStatus>
  onSelectContext: (selection: PreviewSelection) => void
  onInlineTextChange: (field: InlineTextField, value: string) => void
  onInlineTextSave: (field: InlineTextField) => void
  onInlineTextCancel: (field: InlineTextField) => void
  onInlineProductChange: (productId: string, field: keyof InlineProductDraft, value: string) => void
  onInlineProductSave: (productId: string) => void
  onInlineProductCancel: (productId: string) => void
}

function parseInlineDraftPrice(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  const parsed = Number.parseFloat(normalized)

  return Number.isFinite(parsed) ? parsed : null
}

function readSelectionFromElement(element: HTMLElement): PreviewSelection | null {
  const dataBlock = element.dataset.block as PreviewDataBlock | undefined

  if (!dataBlock) return null

  return {
    dataBlock,
    field: element.dataset.field as EditorFieldId | undefined,
    productId: element.dataset.productId,
  }
}

export function CardapioEditorPreview({
  restaurant,
  products,
  selectedBlock,
  selectedField,
  selectedProductId,
  activeInlineTextField,
  productDrafts,
  inlineTextDrafts,
  productSaveState,
  onSelectContext,
  onInlineTextChange,
  onInlineTextSave,
  onInlineTextCancel,
  onInlineProductChange,
  onInlineProductSave,
  onInlineProductCancel,
}: CardapioEditorPreviewProps) {
  const previewProducts = useMemo(
    () => resolveCardapioProductsForPreview(restaurant, products),
    [restaurant, products]
  )
  const displayProducts = useMemo(
    () =>
      previewProducts.map((product) => {
        const draft = productDrafts[product.id]

        if (!draft) return product

        const draftPrice = parseInlineDraftPrice(draft.preco)

        return {
          ...product,
          nome: draft.nome,
          descricao: draft.descricao || null,
          preco: draftPrice ?? product.preco,
        }
      }),
    [previewProducts, productDrafts]
  )
  const viewModel = useMemo(
    () => buildCardapioViewModel(restaurant, displayProducts),
    [displayProducts, restaurant]
  )
  const {
    presentation,
    productsByCategory,
    categories,
    branding,
    templateSlug,
    sectionVisibility,
  } = viewModel
  const accentClassName = TEMPLATE_PRESETS[templateSlug].accentClassName
  const persistedProductIds = useMemo(
    () => new Set(products.map((product) => product.id)),
    [products]
  )

  const handlePreviewSelect = (event: MouseEvent<HTMLElement>) => {
    const selection = readSelectionFromElement(event.currentTarget)

    if (!selection) return

    onSelectContext(selection)
  }

  return (
    <div className="border-border bg-background overflow-hidden rounded-3xl border shadow-sm">
      {sectionVisibility.hero && (
        <div
          className={cn(
            'relative min-h-56 w-full bg-linear-to-br p-6 text-left text-white transition-shadow',
            accentClassName,
            selectedBlock === 'hero' && 'ring-primary ring-2 ring-inset'
          )}
        >
          <button
            type="button"
            data-block="banner"
            data-field="banner_url"
            onClick={handlePreviewSelect}
            className={cn(
              'absolute inset-0 z-0',
              selectedField === 'banner_url' && 'ring-primary ring-2 ring-inset'
            )}
            aria-label="Editar banner do template"
          />

          <div className="relative z-10 mb-6 flex items-center gap-3">
            <button
              type="button"
              data-block="header"
              data-field="logo_url"
              onClick={handlePreviewSelect}
              title="Editar branding"
              aria-label="Editar branding"
              className={cn(
                'flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/20 transition-transform hover:scale-[1.02]',
                selectedField === 'logo_url' && 'ring-2 ring-white/80'
              )}
            >
              {branding.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt={restaurant.nome}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Store className="h-6 w-6" />
              )}
            </button>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-white/80 uppercase">
                {TEMPLATE_PRESETS[templateSlug].label}
              </p>
              <button
                type="button"
                data-block="header"
                data-field="nome"
                onClick={handlePreviewSelect}
                title="Editar base do negócio"
                className={cn(
                  'text-lg font-semibold',
                  selectedField === 'nome' && 'underline underline-offset-4'
                )}
              >
                {restaurant.nome || 'Seu restaurante'}
              </button>
            </div>
          </div>

          <ConfigurableInlineTextField
            field="badge"
            value={presentation.badge}
            dataBlock="hero"
            isActive={activeInlineTextField === 'badge'}
            isSelected={selectedField === 'badge'}
            draftValue={inlineTextDrafts.badge}
            onSelect={handlePreviewSelect}
            onChange={onInlineTextChange}
            onSave={onInlineTextSave}
            onCancel={onInlineTextCancel}
            triggerClassName="relative z-10 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm"
            selectedClassName="ring-2 ring-white/80"
          />

          <ConfigurableInlineTextField
            field="heroTitle"
            value={presentation.heroTitle}
            dataBlock="hero"
            isActive={activeInlineTextField === 'heroTitle'}
            isSelected={selectedField === 'heroTitle'}
            draftValue={inlineTextDrafts.heroTitle}
            onSelect={handlePreviewSelect}
            onChange={onInlineTextChange}
            onSave={onInlineTextSave}
            onCancel={onInlineTextCancel}
            triggerClassName="relative z-10 mt-4 block text-left text-2xl leading-tight font-semibold"
            selectedClassName="underline underline-offset-4"
          />

          <ConfigurableInlineTextField
            field="heroDescription"
            value={presentation.heroDescription}
            dataBlock="hero"
            isActive={activeInlineTextField === 'heroDescription'}
            isSelected={selectedField === 'heroDescription'}
            draftValue={inlineTextDrafts.heroDescription}
            onSelect={handlePreviewSelect}
            onChange={onInlineTextChange}
            onSave={onInlineTextSave}
            onCancel={onInlineTextCancel}
            triggerClassName="relative z-10 mt-3 block max-w-md text-left text-sm leading-6 text-white/90"
            selectedClassName="underline underline-offset-4"
          />

          <div className="relative z-10 mt-5 flex flex-wrap gap-2">
            <ConfigurableInlineTextField
              field="primaryCtaLabel"
              value={presentation.primaryCtaLabel}
              dataBlock="hero"
              isActive={activeInlineTextField === 'primaryCtaLabel'}
              isSelected={selectedField === 'primaryCtaLabel'}
              draftValue={inlineTextDrafts.primaryCtaLabel}
              onSelect={handlePreviewSelect}
              onChange={onInlineTextChange}
              onSave={onInlineTextSave}
              onCancel={onInlineTextCancel}
              triggerClassName="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
              selectedClassName="ring-2 ring-white/60"
            />
            <ConfigurableInlineTextField
              field="secondaryCtaLabel"
              value={presentation.secondaryCtaLabel}
              dataBlock="hero"
              isActive={activeInlineTextField === 'secondaryCtaLabel'}
              isSelected={selectedField === 'secondaryCtaLabel'}
              draftValue={inlineTextDrafts.secondaryCtaLabel}
              onSelect={handlePreviewSelect}
              onChange={onInlineTextChange}
              onSave={onInlineTextSave}
              onCancel={onInlineTextCancel}
              triggerClassName="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white"
              selectedClassName="ring-2 ring-white/60"
            />
          </div>

          <div className="relative z-10 mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              data-block="colors"
              data-field="cor_primaria"
              onClick={handlePreviewSelect}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold text-white',
                selectedField === 'cor_primaria' && 'ring-2 ring-white/70'
              )}
            >
              <span className="rounded-full border border-white/30 px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] uppercase">
                {branding.primaryColor}
              </span>
              Cor principal
            </button>
            <button
              type="button"
              data-block="colors"
              data-field="cor_secundaria"
              onClick={handlePreviewSelect}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-xs font-semibold text-white',
                selectedField === 'cor_secundaria' && 'ring-2 ring-white/70'
              )}
            >
              <span className="rounded-full border border-white/30 px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] uppercase">
                {branding.secondaryColor}
              </span>
              Cor de apoio
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 p-6">
        {sectionVisibility.service && (
          <div
            className={cn(
              'rounded-2xl border border-transparent transition-colors',
              selectedBlock === 'service' && 'ring-primary ring-2 ring-inset'
            )}
          >
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { label: presentation.deliveryLabel, field: 'deliveryLabel' as const },
                { label: presentation.pickupLabel, field: 'pickupLabel' as const },
                { label: presentation.dineInLabel, field: 'dineInLabel' as const },
              ].map((item) => (
                <button
                  key={item.field}
                  type="button"
                  data-block="service"
                  data-field={item.field}
                  onClick={handlePreviewSelect}
                  className={cn(
                    'border-border bg-secondary/40 text-foreground rounded-2xl border px-4 py-3 text-sm font-medium',
                    selectedField === item.field && 'ring-primary ring-2 ring-inset'
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {sectionVisibility.categories && (
          <div
            className={cn(
              'rounded-2xl border border-transparent transition-colors',
              selectedBlock === 'products' && 'ring-primary ring-2 ring-inset'
            )}
          >
            <div className="rounded-2xl border p-4">
              <ConfigurableInlineTextField
                field="sectionTitle"
                value={presentation.sectionTitle}
                dataBlock="products"
                isActive={activeInlineTextField === 'sectionTitle'}
                isSelected={selectedField === 'sectionTitle'}
                draftValue={inlineTextDrafts.sectionTitle}
                onSelect={handlePreviewSelect}
                onChange={onInlineTextChange}
                onSave={onInlineTextSave}
                onCancel={onInlineTextCancel}
                triggerClassName="text-foreground block text-left font-semibold"
                selectedClassName="underline underline-offset-4"
              />
              <ConfigurableInlineTextField
                field="sectionDescription"
                value={presentation.sectionDescription}
                dataBlock="products"
                isActive={activeInlineTextField === 'sectionDescription'}
                isSelected={selectedField === 'sectionDescription'}
                draftValue={inlineTextDrafts.sectionDescription}
                onSelect={handlePreviewSelect}
                onChange={onInlineTextChange}
                onSave={onInlineTextSave}
                onCancel={onInlineTextCancel}
                triggerClassName="text-muted-foreground mt-1 block text-left text-sm"
                selectedClassName="underline underline-offset-4"
              />

              {products.length === 0 && (
                <div className="mt-3 rounded-xl border border-dashed border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800">
                  O preview está usando itens de exemplo do template. Cadastre produtos reais para
                  habilitar edição inline persistente.
                </div>
              )}

              <div className="mt-4 space-y-4">
                {categories.slice(0, 2).map((category) => (
                  <div key={category}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-foreground text-sm font-semibold">{category}</p>
                      <span className="text-muted-foreground text-xs">
                        {(productsByCategory[category] || []).length} itens
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {(productsByCategory[category] || []).slice(0, 2).map((product) => (
                        <div key={product.id}>
                          {selectedProductId === product.id ? (
                            <div
                              data-block="product-card"
                              data-product-id={product.id}
                              className="bg-card ring-primary space-y-3 rounded-xl border p-3 ring-2 ring-inset"
                            >
                              {persistedProductIds.has(product.id) ? (
                                <>
                                  <div className="grid gap-2">
                                    <input
                                      type="text"
                                      value={productDrafts[product.id]?.nome ?? product.nome}
                                      onChange={(event) =>
                                        onInlineProductChange(
                                          product.id,
                                          'nome',
                                          event.target.value
                                        )
                                      }
                                      className="border-border bg-background text-foreground focus:ring-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                      placeholder="Nome do produto"
                                      aria-label="Nome do produto"
                                    />
                                    <input
                                      type="text"
                                      value={productDrafts[product.id]?.preco ?? ''}
                                      onChange={(event) =>
                                        onInlineProductChange(
                                          product.id,
                                          'preco',
                                          event.target.value
                                        )
                                      }
                                      className="border-border bg-background text-foreground focus:ring-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                      placeholder="0,00"
                                      aria-label="Preço do produto"
                                    />
                                    <textarea
                                      rows={2}
                                      value={productDrafts[product.id]?.descricao ?? ''}
                                      onChange={(event) =>
                                        onInlineProductChange(
                                          product.id,
                                          'descricao',
                                          event.target.value
                                        )
                                      }
                                      className="border-border bg-background text-foreground focus:ring-primary rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                                      placeholder="Descrição do produto"
                                      aria-label="Descrição do produto"
                                    />
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-muted-foreground text-xs">
                                      {productSaveState[product.id] === 'saving' &&
                                        'Salvando no banco...'}
                                      {productSaveState[product.id] === 'saved' &&
                                        'Produto salvo no preview.'}
                                      {productSaveState[product.id] === 'error' &&
                                        'Falha ao salvar. Revise os campos e tente novamente.'}
                                      {(productSaveState[product.id] ?? 'idle') === 'idle' &&
                                        'Edite nome, preço e descrição sem sair do preview.'}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => onInlineProductCancel(product.id)}
                                        className="bg-secondary text-foreground rounded-full px-3 py-1.5 text-xs font-semibold"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onInlineProductSave(product.id)}
                                        className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold"
                                      >
                                        {productSaveState[product.id] === 'saving' ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : productSaveState[product.id] === 'saved' ? (
                                          <Check className="h-3.5 w-3.5" />
                                        ) : null}
                                        Salvar item
                                      </button>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-foreground text-sm font-semibold">
                                    Produto de exemplo do template
                                  </p>
                                  <p className="text-muted-foreground text-xs leading-5">
                                    Este card usa amostra automática porque ainda não há produtos
                                    reais salvos. Cadastre ao menos um item para habilitar edição
                                    inline persistente.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => onInlineProductCancel(product.id)}
                                    className="bg-secondary text-foreground rounded-full px-3 py-1.5 text-xs font-semibold"
                                  >
                                    Fechar destaque
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              data-block="product-card"
                              data-product-id={product.id}
                              onClick={handlePreviewSelect}
                              className={cn(
                                'bg-card hover:border-primary/40 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                                selectedProductId === product.id && 'ring-primary ring-2 ring-inset'
                              )}
                            >
                              {product.imagem_url ? (
                                <Image
                                  src={product.imagem_url}
                                  alt={product.nome}
                                  width={56}
                                  height={56}
                                  className="h-14 w-14 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="bg-muted h-14 w-14 rounded-lg" />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-foreground truncate text-sm font-semibold">
                                  {product.nome}
                                </p>
                                <p className="text-muted-foreground line-clamp-1 text-xs">
                                  {product.descricao}
                                </p>
                              </div>
                              <span className="text-primary text-sm font-bold">
                                {formatCurrency(product.preco)}
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {sectionVisibility.about && (
          <div
            className={cn(
              'rounded-2xl border border-transparent transition-colors',
              selectedBlock === 'about' && 'ring-primary ring-2 ring-inset'
            )}
          >
            <div className="border-border bg-card rounded-2xl border border-dashed p-4">
              <button
                type="button"
                data-block="address"
                data-field="endereco_texto"
                onClick={handlePreviewSelect}
                className={cn(
                  'mb-2 flex items-center gap-2 text-left text-xs text-zinc-500',
                  selectedField === 'endereco_texto' && 'underline underline-offset-4'
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                {restaurant.endereco_texto || 'Endereço ainda não configurado'}
              </button>
              <ConfigurableInlineTextField
                field="aboutTitle"
                value={presentation.aboutTitle}
                dataBlock="about"
                isActive={activeInlineTextField === 'aboutTitle'}
                isSelected={selectedField === 'aboutTitle'}
                draftValue={inlineTextDrafts.aboutTitle}
                onSelect={handlePreviewSelect}
                onChange={onInlineTextChange}
                onSave={onInlineTextSave}
                onCancel={onInlineTextCancel}
                triggerClassName="text-foreground block text-left font-medium"
                selectedClassName="underline underline-offset-4"
              />
              <ConfigurableInlineTextField
                field="aboutDescription"
                value={presentation.aboutDescription}
                dataBlock="about"
                isActive={activeInlineTextField === 'aboutDescription'}
                isSelected={selectedField === 'aboutDescription'}
                draftValue={inlineTextDrafts.aboutDescription}
                onSelect={handlePreviewSelect}
                onChange={onInlineTextChange}
                onSave={onInlineTextSave}
                onCancel={onInlineTextCancel}
                triggerClassName="text-muted-foreground mt-1 block text-left text-sm"
                selectedClassName="underline underline-offset-4"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfigurableInlineTextField({
  field,
  value,
  dataBlock,
  isActive,
  isSelected,
  draftValue,
  onSelect,
  onChange,
  onSave,
  onCancel,
  triggerClassName,
  selectedClassName,
}: {
  field: InlineTextField
  value: string
  dataBlock: PreviewDataBlock
  isActive: boolean
  isSelected: boolean
  draftValue?: string
  onSelect: (event: MouseEvent<HTMLElement>) => void
  onChange: (field: InlineTextField, value: string) => void
  onSave: (field: InlineTextField) => void
  onCancel: (field: InlineTextField) => void
  triggerClassName: string
  selectedClassName?: string
}) {
  const config = INLINE_TEXT_FIELD_CONFIG[field]

  if (isActive) {
    return (
      <InlinePreviewTextEditor
        value={draftValue ?? value}
        onChange={(nextValue) => onChange(field, nextValue)}
        onSave={() => onSave(field)}
        onCancel={() => onCancel(field)}
        multiline={config.multiline}
        rows={config.rows}
        label={config.label}
        className={config.editorClassName}
        inputClassName={config.inputClassName}
      />
    )
  }

  return (
    <button
      type="button"
      data-block={dataBlock}
      data-field={field}
      onClick={onSelect}
      className={cn(triggerClassName, isSelected && selectedClassName)}
    >
      {value}
    </button>
  )
}

function InlinePreviewTextEditor({
  value,
  onChange,
  onSave,
  onCancel,
  multiline,
  rows = 2,
  label,
  className,
  inputClassName,
}: {
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  multiline: boolean
  rows?: number
  label: string
  className?: string
  inputClassName?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {multiline ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          title={label}
          placeholder={label}
          className={cn(
            'border-border bg-background focus:ring-primary w-full rounded-xl border focus:ring-2 focus:outline-none',
            inputClassName
          )}
          autoFocus
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          title={label}
          placeholder={label}
          className={cn(
            'border-border bg-background focus:ring-primary w-full rounded-xl border focus:ring-2 focus:outline-none',
            inputClassName
          )}
          autoFocus
        />
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="bg-secondary text-foreground rounded-full px-3 py-1.5 text-xs font-semibold"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          className="bg-primary text-primary-foreground rounded-full px-3 py-1.5 text-xs font-semibold"
        >
          Aplicar no preview
        </button>
      </div>
    </div>
  )
}

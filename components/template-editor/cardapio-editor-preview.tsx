'use client'

import { useMemo, type MouseEvent } from 'react'
import Image from 'next/image'
import { Check, Loader2, MapPin, MessageCircle, Phone, Plus, Store } from 'lucide-react'
import {
  buildCardapioViewModel,
  resolveCardapioProductsForPreview,
  type CardapioProduct,
  type CardapioRestaurant,
} from '@/lib/cardapio-renderer'
import { formatCurrency } from '@/lib/format-currency'
import { cn, formatPhone } from '@/lib/utils'
import { TEMPLATE_PRESETS, type RestaurantTemplateSlug } from '@/lib/restaurant-customization'

/** Banner padrão no editor quando o restaurante ainda não definiu imagem (hero sempre bonito) */
const DEFAULT_HERO_BANNER_URL =
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&auto=format&fit=crop&q=80'

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

export type InlineImageField = 'logo_url' | 'banner_url'

export interface InlineProductDraft {
  nome: string
  descricao: string
  preco: string
  categoria?: string
  imagem_url?: string
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
      'rounded-full border-2 border-white/80 bg-white/95 px-4 py-2.5 text-sm font-semibold text-black placeholder:text-zinc-500 shadow-lg',
  },
  heroTitle: {
    label: 'Título principal',
    multiline: true,
    rows: 2,
    editorClassName: 'relative z-10 mt-4 max-w-2xl',
    inputClassName:
      'border-2 border-white/80 bg-white/95 px-4 py-3 text-xl font-semibold leading-tight text-black placeholder:text-zinc-500 shadow-lg sm:text-2xl',
  },
  heroDescription: {
    label: 'Descrição principal',
    multiline: true,
    rows: 3,
    editorClassName: 'relative z-10 mt-3 max-w-xl',
    inputClassName:
      'border-2 border-white/80 bg-white/95 px-4 py-3 text-base leading-6 text-black placeholder:text-zinc-500 shadow-lg',
  },
  primaryCtaLabel: {
    label: 'CTA principal',
    multiline: false,
    editorClassName: 'min-w-55',
    inputClassName:
      'rounded-full border-2 border-white/80 bg-white px-4 py-2.5 text-sm font-semibold text-black placeholder:text-zinc-500 shadow-lg',
  },
  secondaryCtaLabel: {
    label: 'CTA secundário',
    multiline: false,
    editorClassName: 'min-w-55',
    inputClassName:
      'rounded-full border-2 border-white/80 bg-white/95 px-4 py-2.5 text-sm font-semibold text-black placeholder:text-zinc-500 shadow-lg',
  },
  sectionTitle: {
    label: 'Título da seção de categorias',
    multiline: false,
    inputClassName: 'border-2 border-primary/50 bg-white px-4 py-2.5 text-base font-semibold text-foreground shadow-md dark:bg-card',
  },
  sectionDescription: {
    label: 'Descrição da seção de categorias',
    multiline: true,
    rows: 3,
    editorClassName: 'mt-1',
    inputClassName: 'border-2 border-primary/50 bg-white px-4 py-2.5 text-sm text-foreground shadow-md dark:bg-card',
  },
  aboutTitle: {
    label: 'Título do bloco institucional',
    multiline: false,
    inputClassName: 'border-2 border-primary/50 bg-white px-4 py-2.5 text-base font-medium text-foreground shadow-md dark:bg-card',
  },
  aboutDescription: {
    label: 'Descrição do bloco institucional',
    multiline: true,
    rows: 3,
    editorClassName: 'mt-1',
    inputClassName: 'border-2 border-primary/50 bg-white px-4 py-2.5 text-sm text-foreground shadow-md dark:bg-card',
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
  activeInlineImageField: InlineImageField | null
  productDrafts: Record<string, InlineProductDraft>
  inlineTextDrafts: Partial<Record<InlineTextField, string>>
  inlineImageDrafts: Partial<Record<InlineImageField, string>>
  productSaveState: Record<string, InlineProductSaveStatus>
  onSelectContext: (selection: PreviewSelection) => void
  onInlineTextChange: (field: InlineTextField, value: string) => void
  onInlineTextSave: (field: InlineTextField) => void
  onInlineTextCancel: (field: InlineTextField) => void
  onInlineImageChange: (field: InlineImageField, value: string) => void
  onInlineImageSave: (field: InlineImageField) => void
  onInlineImageCancel: (field: InlineImageField) => void
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
  activeInlineImageField,
  productDrafts,
  inlineTextDrafts,
  inlineImageDrafts,
  productSaveState,
  onSelectContext,
  onInlineTextChange,
  onInlineTextSave,
  onInlineTextCancel,
  onInlineImageChange,
  onInlineImageSave,
  onInlineImageCancel,
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
  const accentClassName = TEMPLATE_PRESETS[templateSlug as RestaurantTemplateSlug].accentClassName
  const persistedProductIds = useMemo(
    () => new Set(products.filter((p) => !p.id.startsWith('preview-')).map((p) => p.id)),
    [products]
  )

  const handlePreviewSelect = (event: MouseEvent<HTMLElement>) => {
    const selection = readSelectionFromElement(event.currentTarget)

    if (!selection) return

    onSelectContext(selection)
  }

  const handleImageSelect = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    handlePreviewSelect(e)
  }

  return (
    <div className="border-border bg-background min-w-0 w-full overflow-x-hidden overflow-y-visible rounded-2xl border shadow-sm sm:rounded-3xl">
      {sectionVisibility.hero && (
        <div
          className={cn(
            'relative min-h-56 w-full overflow-hidden text-left text-white transition-shadow sm:min-h-72 md:min-h-96',
            selectedBlock === 'hero' && 'ring-primary ring-2 ring-inset'
          )}
        >
          {/* Fundo do Hero: banner padrão ou do restaurante, com gradiente por cima */}
          <ConfigurableInlineImageField
            field="banner_url"
            value={branding.bannerUrl || ''}
            dataBlock="banner"
            isActive={activeInlineImageField === 'banner_url'}
            isSelected={selectedField === 'banner_url'}
            draftValue={inlineImageDrafts.banner_url}
            onSelect={handlePreviewSelect}
            onChange={onInlineImageChange}
            onSave={onInlineImageSave}
            onCancel={onInlineImageCancel}
            className="absolute inset-0 z-0 border-0 bg-transparent"
            imageClassName="object-cover"
            overlayClassName="bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.7))]"
          >
            <Image
              src={branding.bannerUrl || DEFAULT_HERO_BANNER_URL}
              alt={restaurant.nome}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.7))]" />
          </ConfigurableInlineImageField>

          <div className="relative mx-auto flex h-full min-w-0 max-w-5xl flex-col justify-end px-4 py-6 sm:px-6 sm:py-10">
            <div className="max-w-3xl min-w-0">
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
            triggerClassName="relative z-10 mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm"
            selectedClassName="ring-2 ring-white/80"
          />

          <h2 className="relative z-10 block text-left text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            {restaurant.nome || presentation.heroTitle}
          </h2>

          <p className="relative z-10 mt-4 block max-w-2xl text-left text-base leading-7 text-white/90 sm:text-lg">
            {restaurant.slogan || presentation.heroDescription}
          </p>

          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
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
              triggerClassName="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
              selectedClassName="ring-2 ring-white/60"
            />
            {restaurant.telefone && (
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
                triggerClassName="rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white"
                selectedClassName="ring-2 ring-white/60"
              />
            )}
          </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto -mt-12 max-w-5xl px-4 sm:px-6">
        <div
          className={cn(
            'grid gap-4',
            sectionVisibility.service ? 'md:grid-cols-[1.2fr_0.8fr]' : 'md:grid-cols-1'
          )}
        >
          <div
            role="button"
            tabIndex={0}
            data-block="header"
            data-field="nome"
            onClick={handlePreviewSelect}
            onKeyDown={(e) => e.key === 'Enter' && handlePreviewSelect(e as unknown as MouseEvent<HTMLElement>)}
            className={cn(
              'border-border bg-card flex w-full cursor-pointer items-start gap-4 rounded-3xl border p-5 text-left shadow-lg transition-colors hover:border-primary/30 sm:p-6',
              selectedBlock === 'negocio' && 'ring-primary ring-2 ring-inset'
            )}
          >
            <ConfigurableInlineImageField
              field="logo_url"
              value={branding.logoUrl || ''}
              dataBlock="header"
              isActive={activeInlineImageField === 'logo_url'}
              isSelected={selectedField === 'logo_url'}
              draftValue={inlineImageDrafts.logo_url}
              onSelect={handleImageSelect}
              onChange={onInlineImageChange}
              onSave={onInlineImageSave}
              onCancel={onInlineImageCancel}
              className="bg-muted relative block h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-md sm:h-24 sm:w-24"
              compact
            >
              {branding.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt={restaurant.nome}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="bg-primary flex h-full w-full items-center justify-center">
                  <Store className="h-10 w-10 text-white" />
                </div>
              )}
            </ConfigurableInlineImageField>
            <div className="min-w-0 flex-1">
              <h2 className="text-foreground truncate text-xl font-bold sm:text-2xl">
                {restaurant.nome || 'Seu restaurante'}
              </h2>
              {restaurant.slogan && (
                <p className="text-muted-foreground mt-1 text-sm">{restaurant.slogan}</p>
              )}
              <div className="text-muted-foreground mt-4 flex flex-wrap gap-3 text-sm">
                {restaurant.telefone && (
                  <span className="bg-secondary/60 inline-flex items-center gap-2 rounded-full px-3 py-2">
                    <Phone className="h-4 w-4" />
                    {formatPhone(restaurant.telefone)}
                  </span>
                )}
                {restaurant.endereco_texto && (
                  <span className="bg-secondary/60 inline-flex items-center gap-2 rounded-full px-3 py-2">
                    <MapPin className="h-4 w-4" />
                    {restaurant.endereco_texto}
                  </span>
                )}
              </div>
            </div>
          </div>

          {sectionVisibility.service && (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
              <button
                type="button"
                data-block="service"
                data-field="deliveryLabel"
                onClick={handlePreviewSelect}
                className={cn(
                  'border-border bg-card rounded-2xl border p-4 text-left transition-colors hover:border-primary/30',
                  selectedField === 'deliveryLabel' && 'ring-primary ring-2 ring-inset'
                )}
              >
                <h4 className="text-foreground font-semibold">{presentation.deliveryLabel}</h4>
              </button>
              <button
                type="button"
                data-block="service"
                data-field="pickupLabel"
                onClick={handlePreviewSelect}
                className={cn(
                  'border-border bg-card rounded-2xl border p-4 text-left transition-colors hover:border-primary/30',
                  selectedField === 'pickupLabel' && 'ring-primary ring-2 ring-inset'
                )}
              >
                <h4 className="text-foreground font-semibold">{presentation.pickupLabel}</h4>
              </button>
              <button
                type="button"
                data-block="service"
                data-field="dineInLabel"
                onClick={handlePreviewSelect}
                className={cn(
                  'border-border bg-card rounded-2xl border p-4 text-left transition-colors hover:border-primary/30',
                  selectedField === 'dineInLabel' && 'ring-primary ring-2 ring-inset'
                )}
              >
                <h4 className="text-foreground font-semibold">{presentation.dineInLabel}</h4>
              </button>
            </div>
          )}
        </div>
      </div>

      {sectionVisibility.categories && (
        <section
          className={cn(
            'mx-auto max-w-5xl min-w-0 px-4 py-8 sm:px-6',
            selectedBlock === 'products' && 'ring-primary ring-2 ring-inset rounded-3xl'
          )}
        >
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
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
                triggerClassName="text-foreground mt-2 block text-left text-2xl font-semibold sm:text-3xl"
                selectedClassName="underline underline-offset-4"
              />
            </div>
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
              triggerClassName="text-muted-foreground max-w-2xl block text-left text-sm leading-7 sm:text-base"
              selectedClassName="underline underline-offset-4"
            />
          </div>

          {categories.length === 0 ? (
            <div className="border-border bg-card rounded-3xl border border-dashed py-16 text-center">
              <Store className="text-muted-foreground/30 mx-auto mb-4 h-16 w-16" />
              <h3 className="text-foreground mb-2 text-lg font-medium">
                {presentation.emptyStateTitle}
              </h3>
              <p className="text-muted-foreground mx-auto max-w-md">
                {presentation.emptyStateDescription}
              </p>
            </div>
          ) : (
            categories.map((category) => {
              const categoryProducts = productsByCategory[category] || []
              if (categoryProducts.length === 0) return null

              return (
                <section
                  key={category}
                  id={`category-${category}`}
                  className="mb-10 scroll-mt-24"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <h4 className="text-foreground text-lg font-bold sm:text-xl">{category}</h4>
                    <span className="text-muted-foreground text-sm">({categoryProducts.length})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {categoryProducts.map((product) => (
                      <EditorProductCard
                        key={product.id}
                        product={product}
                        productDrafts={productDrafts}
                        productSaveState={productSaveState}
                        persistedProductIds={persistedProductIds}
                        selectedProductId={selectedProductId}
                        availableCategories={categories}
                        onSelect={handlePreviewSelect}
                        onInlineProductChange={onInlineProductChange}
                        onInlineProductSave={onInlineProductSave}
                        onInlineProductCancel={onInlineProductCancel}
                      />
                    ))}
                  </div>
                </section>
              )
            })
          )}
        </section>
      )}

      {sectionVisibility.about && (
        <section className="mx-auto max-w-5xl min-w-0 px-4 pb-6 sm:px-6">
          <button
            type="button"
            data-block="about"
            onClick={handlePreviewSelect}
            className={cn(
              'border-border bg-card w-full rounded-3xl border p-6 text-left shadow-sm transition-colors',
              selectedBlock === 'about' && 'ring-primary ring-2 ring-inset'
            )}
          >
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
              triggerClassName="text-foreground block text-left text-xl font-semibold"
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
              triggerClassName="text-muted-foreground mt-2 block max-w-3xl text-left leading-7"
              selectedClassName="underline underline-offset-4"
            />
          </button>
        </section>
      )}

      {(restaurant.endereco_texto || restaurant.google_maps_url || restaurant.telefone) && (
        <footer className="border-border bg-gradient-to-b from-muted/30 to-muted/60 mx-auto max-w-5xl border-t px-4 py-12 pb-12 sm:px-6 lg:py-16">
          <div className="mb-8 text-center sm:text-left">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl">
              Localização e contato
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Venha nos visitar ou finalize seu pedido para falar conosco
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[1fr_320px]">
            {(restaurant.endereco_texto || restaurant.google_maps_url) && (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl ring-1 ring-black/5">
                <div className="relative aspect-[16/10] w-full bg-muted sm:aspect-video">
                  <iframe
                    title="Localização no mapa"
                    src={(() => {
                      const addr = restaurant.endereco_texto?.trim()
                      if (addr) {
                        return `https://www.google.com/maps?q=${encodeURIComponent(addr)}&output=embed`
                      }
                      const url = restaurant.google_maps_url
                      if (url) {
                        try {
                          const u = new URL(url)
                          const q = u.searchParams.get('query')
                          if (q) return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
                        } catch {}
                        return `https://www.google.com/maps?q=${encodeURIComponent(url)}&output=embed`
                      }
                      return ''
                    })()}
                    className="absolute inset-0 h-full w-full"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                {restaurant.endereco_texto && (
                  <div className="border-border flex items-center gap-3 border-t bg-card/80 px-4 py-3 backdrop-blur-sm">
                    <MapPin className="text-primary h-5 w-5 shrink-0" />
                    <p className="text-foreground text-sm font-medium">{restaurant.endereco_texto}</p>
                  </div>
                )}
                <div className="border-border flex items-center justify-center gap-2 border-t px-4 py-3">
                  <MapPin className="text-muted-foreground h-4 w-4" />
                  <span className="text-muted-foreground text-sm font-medium">
                    Abrir no Google Maps
                  </span>
                </div>
              </div>
            )}
            {restaurant.telefone && (
              <div className="border-border bg-card flex flex-col justify-center rounded-2xl border p-6 shadow-lg ring-1 ring-black/5 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/15 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
                    <Phone className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                      Finalize o pedido para entrar em contato
                    </p>
                    <p className="text-foreground mt-2 text-lg font-bold">
                      {formatPhone(restaurant.telefone)}
                    </p>
                    <span className="text-muted-foreground mt-2 inline-flex items-center gap-1.5 text-sm">
                      <MessageCircle className="h-4 w-4" />
                      Falar no WhatsApp
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}

function EditorProductCard({
  product,
  productDrafts,
  productSaveState,
  persistedProductIds,
  selectedProductId,
  availableCategories,
  onSelect,
  onInlineProductChange,
  onInlineProductSave,
  onInlineProductCancel,
}: {
  product: CardapioProduct
  productDrafts: Record<string, InlineProductDraft>
  productSaveState: Record<string, InlineProductSaveStatus>
  persistedProductIds: Set<string>
  selectedProductId: string | null
  availableCategories: string[]
  onSelect: (event: MouseEvent<HTMLElement>) => void
  onInlineProductChange: (productId: string, field: keyof InlineProductDraft, value: string) => void
  onInlineProductSave: (productId: string) => void
  onInlineProductCancel: (productId: string) => void
}) {
  const draft = productDrafts[product.id]
  const displayProduct = draft
    ? {
        ...product,
        nome: draft.nome,
        descricao: draft.descricao || null,
        preco: parseInlineDraftPrice(draft.preco) ?? product.preco,
        categoria: draft.categoria ?? product.categoria,
        imagem_url: draft.imagem_url ?? product.imagem_url,
      }
    : product

  if (selectedProductId === product.id) {
    const isTemplateProduct = !persistedProductIds.has(product.id)
    return (
      <div
        data-block="product-card"
        data-product-id={product.id}
        className="bg-card ring-primary group flex min-w-0 gap-3 rounded-xl border p-3 ring-2 ring-inset sm:gap-4 sm:p-4"
      >
        <div className="bg-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28">
          {(displayProduct.imagem_url && (
            <Image
              src={displayProduct.imagem_url}
              alt={displayProduct.nome}
              fill
              className="object-cover"
            />
          )) || (
            <div className="bg-muted flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              Foto
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">URL da foto</label>
            <input
              type="url"
              value={productDrafts[product.id]?.imagem_url ?? product.imagem_url ?? ''}
              onChange={(e) => onInlineProductChange(product.id, 'imagem_url', e.target.value)}
              className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder="https://..."
            />
          </div>
          <input
            type="text"
            value={productDrafts[product.id]?.nome ?? product.nome}
            onChange={(e) => onInlineProductChange(product.id, 'nome', e.target.value)}
            className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm font-semibold focus:ring-2 focus:outline-none"
            placeholder="Nome do produto"
          />
          <textarea
            rows={2}
            value={productDrafts[product.id]?.descricao ?? product.descricao ?? ''}
            onChange={(e) => onInlineProductChange(product.id, 'descricao', e.target.value)}
            className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder="Descrição"
          />
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">Categoria</label>
            <input
              type="text"
              value={productDrafts[product.id]?.categoria ?? product.categoria ?? ''}
              onChange={(e) => onInlineProductChange(product.id, 'categoria', e.target.value)}
              list={`categorias-${product.id}`}
              className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder="Ex: Pizzas Doces"
            />
            <datalist id={`categorias-${product.id}`}>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div className="flex items-center justify-between gap-2 pt-2">
            <input
              type="text"
              value={productDrafts[product.id]?.preco ?? ''}
              onChange={(e) => onInlineProductChange(product.id, 'preco', e.target.value)}
              className="border-border bg-background text-foreground focus:ring-primary w-24 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder="0,00"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onInlineProductCancel(product.id)}
                className="bg-secondary text-foreground rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onInlineProductSave(product.id)}
                className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                {productSaveState[product.id] === 'saving' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : productSaveState[product.id] === 'saved' ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
                {isTemplateProduct ? 'Salvar como produto' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      data-block="product-card"
      data-product-id={product.id}
      onClick={onSelect}
      className={cn(
        'group bg-card border-border hover:border-primary/30 flex w-full min-w-0 cursor-pointer gap-3 rounded-xl border p-3 text-left transition-all duration-300 hover:shadow-md sm:gap-4 sm:p-4',
        selectedProductId === product.id && 'ring-primary ring-2 ring-inset'
      )}
    >
      <div className="bg-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28">
        {displayProduct.imagem_url ? (
          <Image
            src={displayProduct.imagem_url}
            alt={displayProduct.nome}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            + Foto
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
          {displayProduct.nome}
        </h3>
        {displayProduct.descricao && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
            {displayProduct.descricao}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="text-primary text-lg font-bold">
            {formatCurrency(displayProduct.preco)}
          </span>
          <span className="bg-primary/10 text-primary flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </span>
        </div>
      </div>
    </button>
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
    <div className={cn('space-y-3 rounded-xl p-1', className)}>
      {multiline ? (
        <textarea
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          title={label}
          placeholder={label}
          className={cn(
            'focus:ring-primary w-full rounded-xl focus:ring-2 focus:outline-none focus:ring-offset-2',
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
            'focus:ring-primary w-full rounded-xl focus:ring-2 focus:outline-none focus:ring-offset-2',
            inputClassName
          )}
          autoFocus
        />
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="bg-muted hover:bg-muted/80 text-foreground rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        >
          Aplicar
        </button>
      </div>
    </div>
  )
}

function ConfigurableInlineImageField({
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
  className,
  imageClassName,
  overlayClassName,
  compact,
  children,
}: {
  field: InlineImageField
  value: string
  dataBlock: PreviewDataBlock
  isActive: boolean
  isSelected: boolean
  draftValue?: string
  onSelect: (e: MouseEvent<HTMLElement>) => void
  onChange: (field: InlineImageField, value: string) => void
  onSave: (field: InlineImageField) => void
  onCancel: (field: InlineImageField) => void
  className?: string
  imageClassName?: string
  overlayClassName?: string
  compact?: boolean
  children: React.ReactNode
}) {
  const label = field === 'logo_url' ? 'URL do logo' : 'URL do banner'

  if (isActive) {
    return (
      <div className={cn('relative', className)}>
        {children}
        <div
          className={cn(
            'absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4',
            compact && 'p-2'
          )}
        >
          <div
            className={cn(
              'bg-background border-border w-full max-w-md rounded-xl border p-4 shadow-xl',
              compact && 'max-w-xs p-3'
            )}
          >
            <label className="text-foreground mb-2 block text-sm font-medium">{label}</label>
            <input
              type="url"
              value={draftValue ?? value}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder="https://..."
              className="border-border bg-background text-foreground focus:ring-primary mb-3 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onCancel(field)}
                className="bg-muted text-foreground rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onSave(field)}
                className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      data-block={dataBlock}
      data-field={field}
      onClick={onSelect as (e: React.MouseEvent<HTMLElement>) => void}
      className={cn(
        'block w-full cursor-pointer',
        isSelected && 'ring-primary ring-2 ring-inset',
        className
      )}
      aria-label={`Editar ${label}`}
    >
      {children}
    </button>
  )
}

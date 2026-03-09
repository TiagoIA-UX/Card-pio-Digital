'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { MapPin, Store } from 'lucide-react'
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

interface CardapioEditorPreviewProps {
  restaurant: CardapioRestaurant
  products: CardapioProduct[]
  selectedBlock: EditorBlockId
  selectedField: EditorFieldId | null
  onSelectBlock: (block: EditorBlockId) => void
  onSelectField: (block: EditorBlockId, field: EditorFieldId) => void
}

export function CardapioEditorPreview({
  restaurant,
  products,
  selectedBlock,
  selectedField,
  onSelectBlock,
  onSelectField,
}: CardapioEditorPreviewProps) {
  const previewProducts = useMemo(
    () => resolveCardapioProductsForPreview(restaurant, products),
    [restaurant, products]
  )
  const viewModel = useMemo(
    () => buildCardapioViewModel(restaurant, previewProducts),
    [restaurant, previewProducts]
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
          <div className="relative z-10 mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onSelectField('branding', 'logo_url')
              }}
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
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectField('negocio', 'nome')
                }}
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

          <button
            type="button"
            onClick={() => onSelectField('hero', 'badge')}
            className={cn(
              'relative z-10 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm',
              selectedField === 'badge' && 'ring-2 ring-white/80'
            )}
          >
            {presentation.badge}
          </button>

          <button
            type="button"
            onClick={() => onSelectField('hero', 'heroTitle')}
            className={cn(
              'relative z-10 mt-4 block text-left text-2xl leading-tight font-semibold',
              selectedField === 'heroTitle' && 'underline underline-offset-4'
            )}
          >
            {presentation.heroTitle}
          </button>
          <button
            type="button"
            onClick={() => onSelectField('hero', 'heroDescription')}
            className={cn(
              'relative z-10 mt-3 block max-w-md text-left text-sm leading-6 text-white/90',
              selectedField === 'heroDescription' && 'underline underline-offset-4'
            )}
          >
            {presentation.heroDescription}
          </button>

          <div className="relative z-10 mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectField('hero', 'primaryCtaLabel')}
              className={cn(
                'rounded-full bg-white px-4 py-2 text-sm font-semibold text-black',
                selectedField === 'primaryCtaLabel' && 'ring-2 ring-white/60'
              )}
            >
              {presentation.primaryCtaLabel}
            </button>
            <button
              type="button"
              onClick={() => onSelectField('hero', 'secondaryCtaLabel')}
              className={cn(
                'rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white',
                selectedField === 'secondaryCtaLabel' && 'ring-2 ring-white/60'
              )}
            >
              {presentation.secondaryCtaLabel}
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
                  onClick={() => onSelectField('service', item.field)}
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
              <button
                type="button"
                onClick={() => onSelectField('products', 'sectionTitle')}
                className={cn(
                  'text-foreground block text-left font-semibold',
                  selectedField === 'sectionTitle' && 'underline underline-offset-4'
                )}
              >
                {presentation.sectionTitle}
              </button>
              <button
                type="button"
                onClick={() => onSelectField('products', 'sectionDescription')}
                className={cn(
                  'text-muted-foreground mt-1 block text-left text-sm',
                  selectedField === 'sectionDescription' && 'underline underline-offset-4'
                )}
              >
                {presentation.sectionDescription}
              </button>

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
                        <div
                          key={product.id}
                          className="bg-card flex items-center gap-3 rounded-xl border p-3"
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
                onClick={() => onSelectField('negocio', 'endereco_texto')}
                className={cn(
                  'mb-2 flex items-center gap-2 text-left text-xs text-zinc-500',
                  selectedField === 'endereco_texto' && 'underline underline-offset-4'
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                {restaurant.endereco_texto || 'Endereço ainda não configurado'}
              </button>
              <button
                type="button"
                onClick={() => onSelectField('about', 'aboutTitle')}
                className={cn(
                  'text-foreground block text-left font-medium',
                  selectedField === 'aboutTitle' && 'underline underline-offset-4'
                )}
              >
                {presentation.aboutTitle}
              </button>
              <button
                type="button"
                onClick={() => onSelectField('about', 'aboutDescription')}
                className={cn(
                  'text-muted-foreground mt-1 block text-left text-sm',
                  selectedField === 'aboutDescription' && 'underline underline-offset-4'
                )}
              >
                {presentation.aboutDescription}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

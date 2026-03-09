'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Pizza,
  Ruler,
  Layers,
  Sparkles,
  Plus,
  Minus,
  ShoppingCart,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

// =====================================================
// Types
// =====================================================

export interface PizzaSize {
  id: string
  nome: string
  preco: number
  max_sabores: number
  ordem: number
}

export interface PizzaFlavor {
  id: string
  category_id: string | null
  nome: string
  descricao: string | null
  preco_adicional: number
}

export interface PizzaCrust {
  id: string
  nome: string
  preco_adicional: number
}

export interface PizzaAddOn {
  id: string
  nome: string
  preco: number
}

export interface PizzaProduct {
  id: string
  nome: string
  descricao: string | null
  imagem_url: string | null
  tipo: 'pizza'
  product_sizes?: PizzaSize[]
}

export interface BuiltPizza {
  product: PizzaProduct
  size: PizzaSize
  flavors: PizzaFlavor[]
  crust?: PizzaCrust
  addons: PizzaAddOn[]
  notes: string
  quantity: number
}

interface PizzaBuilderProps {
  product: {
    id: string
    nome: string
    descricao: string | null
    imagem_url: string | null
    tipo: 'pizza'
    product_sizes?: PizzaSize[]
  }
  sizes: PizzaSize[]
  flavors: PizzaFlavor[]
  crusts: PizzaCrust[]
  addons: PizzaAddOn[]
  onClose: () => void
  onAddToCart: (pizza: BuiltPizza) => void
  primaryColor?: string
}

// =====================================================
// Steps Configuration
// =====================================================

const STEPS = [
  { id: 'size', label: 'Tamanho', icon: Ruler },
  { id: 'flavors', label: 'Sabores', icon: Pizza },
  { id: 'crust', label: 'Borda', icon: Layers },
  { id: 'addons', label: 'Adicionais', icon: Sparkles },
] as const

type StepId = (typeof STEPS)[number]['id']

// =====================================================
// Component
// =====================================================

export function PizzaBuilder({
  product,
  sizes,
  flavors,
  crusts,
  addons,
  onClose,
  onAddToCart,
  primaryColor = '#ea580c',
}: PizzaBuilderProps) {
  // State
  const [currentStep, setCurrentStep] = useState<StepId>('size')
  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null)
  const [selectedFlavors, setSelectedFlavors] = useState<PizzaFlavor[]>([])
  const [selectedCrust, setSelectedCrust] = useState<PizzaCrust | null>(null)
  const [selectedAddons, setSelectedAddons] = useState<PizzaAddOn[]>([])
  const [notes, setNotes] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [flavorSearch, setFlavorSearch] = useState('')

  // Sorted sizes
  const sortedSizes = useMemo(() => [...sizes].sort((a, b) => a.ordem - b.ordem), [sizes])

  // Filtered flavors
  const filteredFlavors = useMemo(() => {
    if (!flavorSearch.trim()) return flavors
    const search = flavorSearch.toLowerCase()
    return flavors.filter(
      (f) => f.nome.toLowerCase().includes(search) || f.descricao?.toLowerCase().includes(search)
    )
  }, [flavors, flavorSearch])

  // Calculate total price
  const totalPrice = useMemo(() => {
    if (!selectedSize) return 0

    let total = selectedSize.preco

    // Add flavor extras (if any have price_adicional)
    selectedFlavors.forEach((f) => {
      total += f.preco_adicional
    })

    // Add crust extra
    if (selectedCrust) {
      total += selectedCrust.preco_adicional
    }

    // Add addons
    selectedAddons.forEach((a) => {
      total += a.preco
    })

    return total * quantity
  }, [selectedSize, selectedFlavors, selectedCrust, selectedAddons, quantity])

  // Step navigation
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep)

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 'size':
        return selectedSize !== null
      case 'flavors':
        return (
          selectedFlavors.length > 0 && selectedFlavors.length <= (selectedSize?.max_sabores || 1)
        )
      case 'crust':
        return true // Optional
      case 'addons':
        return true // Optional
      default:
        return false
    }
  }, [currentStep, selectedSize, selectedFlavors])

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
    }
  }, [currentStepIndex])

  const goPrev = useCallback(() => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }, [currentStepIndex])

  // Toggle flavor selection
  const toggleFlavor = useCallback(
    (flavor: PizzaFlavor) => {
      setSelectedFlavors((prev) => {
        const exists = prev.find((f) => f.id === flavor.id)
        if (exists) {
          return prev.filter((f) => f.id !== flavor.id)
        }

        // Check max flavors
        const maxFlavors = selectedSize?.max_sabores || 1
        if (prev.length >= maxFlavors) {
          // Replace last one
          return [...prev.slice(0, -1), flavor]
        }

        return [...prev, flavor]
      })
    },
    [selectedSize]
  )

  // Toggle addon selection
  const toggleAddon = useCallback((addon: PizzaAddOn) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id)
      if (exists) {
        return prev.filter((a) => a.id !== addon.id)
      }
      return [...prev, addon]
    })
  }, [])

  // Add to cart
  const handleAddToCart = useCallback(() => {
    if (!selectedSize || selectedFlavors.length === 0) return

    onAddToCart({
      product,
      size: selectedSize,
      flavors: selectedFlavors,
      crust: selectedCrust || undefined,
      addons: selectedAddons,
      notes,
      quantity,
    })
  }, [
    product,
    selectedSize,
    selectedFlavors,
    selectedCrust,
    selectedAddons,
    notes,
    quantity,
    onAddToCart,
  ])

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'size':
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => {
                  setSelectedSize(size)
                  // Reset flavors if max changed
                  if (selectedFlavors.length > size.max_sabores) {
                    setSelectedFlavors((prev) => prev.slice(0, size.max_sabores))
                  }
                }}
                className={cn(
                  'relative flex flex-col items-center rounded-xl border-2 p-4 transition-all duration-200',
                  selectedSize?.id === size.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/30 hover:bg-muted/50'
                )}
              >
                {selectedSize?.id === size.id && (
                  <div className="bg-primary absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full">
                    <Check className="text-primary-foreground h-4 w-4" />
                  </div>
                )}
                <div className="mb-2 text-3xl">🍕</div>
                <h4 className="text-foreground font-semibold">{size.nome}</h4>
                <p className="text-muted-foreground text-sm">
                  {size.max_sabores === 1 ? '1 sabor' : `até ${size.max_sabores} sabores`}
                </p>
                <p className="text-primary mt-2 text-lg font-bold">{formatCurrency(size.preco)}</p>
              </button>
            ))}
          </div>
        )

      case 'flavors':
        const maxFlavors = selectedSize?.max_sabores || 1
        return (
          <div className="space-y-4">
            {/* Info */}
            <div className="flex items-center justify-between px-1">
              <p className="text-muted-foreground text-sm">
                Selecione {maxFlavors === 1 ? '1 sabor' : `até ${maxFlavors} sabores`}
              </p>
              <p className="text-primary text-sm font-medium">
                {selectedFlavors.length}/{maxFlavors}
              </p>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Buscar sabor..."
              value={flavorSearch}
              onChange={(e) => setFlavorSearch(e.target.value)}
              className="border-border bg-background focus:ring-primary/20 focus:border-primary w-full rounded-lg border px-4 py-2 transition-all focus:ring-2 focus:outline-none"
            />

            {/* Flavors Grid */}
            <div className="scrollbar-premium grid max-h-[50vh] gap-2 overflow-y-auto pr-2">
              {filteredFlavors.map((flavor) => {
                const isSelected = selectedFlavors.some((f) => f.id === flavor.id)
                return (
                  <button
                    key={flavor.id}
                    onClick={() => toggleFlavor(flavor)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3 text-left transition-all duration-200',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-foreground font-medium">{flavor.nome}</h4>
                      {flavor.descricao && (
                        <p className="text-muted-foreground truncate text-sm">{flavor.descricao}</p>
                      )}
                    </div>
                    <div className="ml-3 flex items-center gap-3">
                      {flavor.preco_adicional > 0 && (
                        <span className="text-primary text-sm font-medium">
                          +{formatCurrency(flavor.preco_adicional)}
                        </span>
                      )}
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
                          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                        )}
                      >
                        {isSelected && <Check className="text-primary-foreground h-4 w-4" />}
                      </div>
                    </div>
                  </button>
                )
              })}

              {filteredFlavors.length === 0 && (
                <p className="text-muted-foreground py-8 text-center">Nenhum sabor encontrado</p>
              )}
            </div>
          </div>
        )

      case 'crust':
        return (
          <div className="space-y-3">
            {/* No crust option */}
            <button
              onClick={() => setSelectedCrust(null)}
              className={cn(
                'flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200',
                selectedCrust === null
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/30'
              )}
            >
              <div>
                <h4 className="text-foreground font-medium">Sem borda recheada</h4>
                <p className="text-muted-foreground text-sm">Borda tradicional</p>
              </div>
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border-2',
                  selectedCrust === null
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30'
                )}
              >
                {selectedCrust === null && <Check className="text-primary-foreground h-4 w-4" />}
              </div>
            </button>

            {crusts.map((crust) => (
              <button
                key={crust.id}
                onClick={() => setSelectedCrust(crust)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200',
                  selectedCrust?.id === crust.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <div>
                  <h4 className="text-foreground font-medium">{crust.nome}</h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary text-sm font-medium">
                    +{formatCurrency(crust.preco_adicional)}
                  </span>
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border-2',
                      selectedCrust?.id === crust.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {selectedCrust?.id === crust.id && (
                      <Check className="text-primary-foreground h-4 w-4" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )

      case 'addons':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground px-1 text-sm">Selecione adicionais (opcional)</p>

            <div className="grid gap-2">
              {addons.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.id === addon.id)
                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3 transition-all duration-200',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <h4 className="text-foreground font-medium">{addon.nome}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-primary text-sm font-medium">
                        +{formatCurrency(addon.preco)}
                      </span>
                      <div
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded border-2',
                          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                        )}
                      >
                        {isSelected && <Check className="text-primary-foreground h-3 w-3" />}
                      </div>
                    </div>
                  </button>
                )
              })}

              {addons.length === 0 && (
                <p className="text-muted-foreground py-8 text-center">
                  Nenhum adicional disponível
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="border-border space-y-2 border-t pt-4">
              <label className="text-foreground text-sm font-medium">Observações (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Sem cebola, bem assada..."
                className="border-border bg-background focus:ring-primary/20 focus:border-primary w-full resize-none rounded-lg border px-4 py-3 transition-all focus:ring-2 focus:outline-none"
                rows={2}
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="bg-background animate-scale-in absolute inset-4 flex flex-col overflow-hidden rounded-2xl shadow-2xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2">
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-3">
            {product.imagem_url ? (
              <div className="bg-muted relative h-12 w-12 overflow-hidden rounded-lg">
                <Image src={product.imagem_url} alt={product.nome} fill className="object-cover" />
              </div>
            ) : (
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Pizza className="text-primary h-6 w-6" />
              </div>
            )}
            <div>
              <h2 className="text-foreground font-bold">{product.nome}</h2>
              {selectedSize && <p className="text-muted-foreground text-sm">{selectedSize.nome}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-muted rounded-lg p-2 transition-colors"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="border-border bg-muted/30 flex items-center justify-between border-b px-4 py-3">
          {STEPS.map((step, i) => {
            const isActive = step.id === currentStep
            const isPast = i < currentStepIndex
            const Icon = step.icon

            return (
              <div
                key={step.id}
                className={cn(
                  'flex flex-col items-center gap-1 transition-colors',
                  isActive && 'text-primary',
                  isPast && 'text-success',
                  !isActive && !isPast && 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                    isActive && 'bg-primary text-primary-foreground',
                    isPast && 'bg-success text-success-foreground',
                    !isActive && !isPast && 'bg-muted'
                  )}
                >
                  {isPast ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="hidden text-xs font-medium sm:block">{step.label}</span>
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="scrollbar-premium flex-1 overflow-y-auto p-4">{renderStep()}</div>

        {/* Footer */}
        <div className="border-border bg-card/50 border-t p-4">
          {/* Quantity (only on last step) */}
          {currentStep === 'addons' && (
            <div className="border-border mb-4 flex items-center justify-between border-b pb-4">
              <span className="text-foreground font-medium">Quantidade</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="bg-muted hover:bg-muted/80 rounded-lg p-2 transition-colors"
                  title="Diminuir quantidade"
                  aria-label="Diminuir quantidade"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-2 transition-colors"
                  title="Aumentar quantidade"
                  aria-label="Aumentar quantidade"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Price and Navigation */}
          <div className="flex items-center justify-between">
            {currentStepIndex > 0 ? (
              <button
                onClick={goPrev}
                className="text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1 rounded-lg px-4 py-2 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {selectedSize && (
                <span className="text-primary text-lg font-bold">{formatCurrency(totalPrice)}</span>
              )}

              {currentStep === 'addons' ? (
                <button
                  onClick={handleAddToCart}
                  disabled={!canGoNext || selectedFlavors.length === 0}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Adicionar</span>
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={!canGoNext}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 rounded-xl px-5 py-2.5 font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Continuar</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PizzaBuilder

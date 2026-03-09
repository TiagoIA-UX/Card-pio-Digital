'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShoppingCart,
  Store,
  X,
} from 'lucide-react'
import type { CardapioProduct, CardapioRestaurant } from '@/lib/cardapio-renderer'
import { buildCardapioViewModel } from '@/lib/cardapio-renderer'
import type { RestaurantPresentation } from '@/lib/restaurant-customization'
import { cn, formatCurrency } from '@/lib/utils'

interface CartItem {
  id: string
  product: CardapioProduct
  quantity: number
}

interface OrderFormState {
  customerName: string
  customerPhone: string
  fulfillment: 'retirada' | 'entrega' | 'local'
  addressStreet: string
  addressDistrict: string
  addressComplement: string
  notes: string
}

interface CardapioClientProps {
  restaurant: CardapioRestaurant
  products: CardapioProduct[]
}

function createInitialOrderForm(isTableOrder: boolean): OrderFormState {
  return {
    customerName: '',
    customerPhone: '',
    fulfillment: isTableOrder ? 'local' : 'retirada',
    addressStreet: '',
    addressDistrict: '',
    addressComplement: '',
    notes: '',
  }
}

export default function CardapioClient({ restaurant, products }: CardapioClientProps) {
  const searchParams = useSearchParams()
  const tableNumber = searchParams.get('mesa')?.trim() || ''
  const isTableOrder = tableNumber.length > 0
  const viewModel = useMemo(
    () => buildCardapioViewModel(restaurant, products),
    [restaurant, products]
  )
  const { categories, productsByCategory, presentation, sectionVisibility } = viewModel

  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [orderForm, setOrderForm] = useState<OrderFormState>(createInitialOrderForm(isTableOrder))

  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0] || null)

  const { totalItems, totalPrice } = useMemo(() => {
    let items = 0
    let price = 0

    cart.forEach((item) => {
      items += item.quantity
      price += item.product.preco * item.quantity
    })

    return { totalItems: items, totalPrice: price }
  }, [cart])

  const addProduct = (product: CardapioProduct) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id)

      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex].quantity += 1
        return updated
      }

      return [
        ...prev,
        {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity: 1,
        },
      ]
    })
  }

  const decrementItem = (cartItemId: string) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === cartItemId)
      if (index < 0) return prev

      if (prev[index].quantity > 1) {
        const updated = [...prev]
        updated[index].quantity -= 1
        return updated
      }

      return prev.filter((item) => item.id !== cartItemId)
    })
  }

  const incrementItem = (cartItemId: string) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === cartItemId)
      if (index < 0) return prev

      const updated = [...prev]
      updated[index].quantity += 1
      return updated
    })
  }

  const removeItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId))
  }

  const updateOrderForm = <Key extends keyof OrderFormState>(
    field: Key,
    value: OrderFormState[Key]
  ) => {
    setOrderForm((prev) => ({ ...prev, [field]: value }))
  }

  const canSubmit =
    cart.length > 0 &&
    !!restaurant.telefone &&
    (!!orderForm.customerName.trim() || isTableOrder) &&
    (orderForm.fulfillment !== 'entrega' ||
      (!!orderForm.addressStreet.trim() && !!orderForm.addressDistrict.trim()))

  const buildWhatsAppMessage = (orderNumber?: number) => {
    const orderOriginLabel = isTableOrder ? `Mesa ${tableNumber}` : 'Online'
    const attendanceLabel =
      orderForm.fulfillment === 'entrega'
        ? presentation.deliveryLabel
        : orderForm.fulfillment === 'retirada'
          ? presentation.pickupLabel
          : presentation.dineInLabel

    let message = `🍽️ *NOVO PEDIDO - ${restaurant.nome}*\n\n`

    if (orderNumber) {
      message += `📋 *Pedido #${orderNumber}*\n`
    }

    message += `📍 *Origem:* ${orderOriginLabel}\n`
    message += `🛎️ *Atendimento:* ${attendanceLabel}\n`

    if (isTableOrder) {
      message += `🪑 *Mesa:* ${tableNumber}\n`
    }

    if (orderForm.customerName.trim()) {
      message += `👤 *Cliente:* ${orderForm.customerName.trim()}\n`
    }

    if (orderForm.customerPhone.trim()) {
      message += `📱 *Telefone:* ${orderForm.customerPhone.trim()}\n`
    }

    if (orderForm.fulfillment === 'entrega') {
      message += `🏠 *Endereço:* ${orderForm.addressStreet.trim()} - ${orderForm.addressDistrict.trim()}\n`

      if (orderForm.addressComplement.trim()) {
        message += `📌 *Complemento:* ${orderForm.addressComplement.trim()}\n`
      }
    }

    message += `\n*Itens:*\n`

    cart.forEach((item, index) => {
      const itemTotal = item.product.preco * item.quantity
      message += `${index + 1}. ${item.quantity}x ${item.product.nome} - ${formatCurrency(itemTotal)}\n`
    })

    message += `\n*Total:* ${formatCurrency(totalPrice)}\n`

    if (orderForm.notes.trim()) {
      message += `\n📝 *Observações:* ${orderForm.notes.trim()}\n`
    }

    return message
  }

  const openWhatsApp = (message: string) => {
    const whatsappNumber = restaurant.telefone?.replace(/\D/g, '')

    if (!whatsappNumber) {
      throw new Error('Este restaurante não configurou o WhatsApp.')
    }

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, '_blank')
  }

  const submitOrder = async () => {
    if (!canSubmit) {
      setError('Preencha os dados necessários para enviar o pedido.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        restaurant_id: restaurant.id,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantidade: item.quantity,
        })),
        cliente_nome: orderForm.customerName.trim() || null,
        cliente_telefone: orderForm.customerPhone.trim() || null,
        tipo_entrega: orderForm.fulfillment === 'entrega' ? 'entrega' : 'retirada',
        endereco_rua: orderForm.fulfillment === 'entrega' ? orderForm.addressStreet.trim() : null,
        endereco_bairro:
          orderForm.fulfillment === 'entrega' ? orderForm.addressDistrict.trim() : null,
        endereco_complemento:
          orderForm.fulfillment === 'entrega' ? orderForm.addressComplement.trim() || null : null,
        observacoes: orderForm.notes.trim() || null,
        order_origin: isTableOrder ? 'mesa' : 'online',
        table_number: isTableOrder ? tableNumber : null,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      const message = buildWhatsAppMessage(result?.numero_pedido)

      if (!response.ok) {
        openWhatsApp(message)
      } else {
        openWhatsApp(message)
      }

      setCart([])
      setOrderForm(createInitialOrderForm(isTableOrder))
      setIsCartOpen(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (submitError) {
      try {
        openWhatsApp(buildWhatsAppMessage())
        setCart([])
        setOrderForm(createInitialOrderForm(isTableOrder))
        setIsCartOpen(false)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch {
        setError('Erro ao enviar pedido. Tente novamente.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bg-background min-h-screen">
      {success && (
        <div className="animate-slide-up fixed top-4 right-4 z-50">
          <div className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white shadow-lg">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Pedido enviado!</span>
          </div>
        </div>
      )}

      {sectionVisibility.hero && (
      <div className="relative min-h-72 overflow-hidden sm:min-h-96">
        {restaurant.banner_url ? (
          <Image
            src={restaurant.banner_url}
            alt={restaurant.nome}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div
            className={`h-full w-full bg-linear-to-br ${presentation.template.accentClassName}`}
          />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.7))]" />

        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-4 py-8 sm:px-6 sm:py-10">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              {presentation.badge}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {presentation.heroTitle}
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
              {presentation.heroDescription}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setIsCartOpen(true)}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                {presentation.primaryCtaLabel}
              </button>
              {restaurant.telefone && (
                <a
                  href={`https://wa.me/55${restaurant.telefone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {presentation.secondaryCtaLabel}
                </a>
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
          <div className="border-border bg-card rounded-3xl border p-5 shadow-lg sm:p-6">
            <div className="flex items-start gap-4">
              <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-md sm:h-24 sm:w-24">
                {restaurant.logo_url ? (
                  <Image
                    src={restaurant.logo_url}
                    alt={restaurant.nome}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-primary flex h-full w-full items-center justify-center">
                    <Store className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-foreground truncate text-xl font-bold sm:text-2xl">
                    {restaurant.nome}
                  </h2>
                  {isTableOrder && (
                    <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                      Mesa {tableNumber}
                    </span>
                  )}
                </div>

                {restaurant.slogan && (
                  <p className="text-muted-foreground mt-1 text-sm">{restaurant.slogan}</p>
                )}

                <div className="text-muted-foreground mt-4 flex flex-wrap gap-3 text-sm">
                  {restaurant.telefone && (
                    <span className="bg-secondary/60 inline-flex items-center gap-2 rounded-full px-3 py-2">
                      <Phone className="h-4 w-4" />
                      {restaurant.telefone}
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
          </div>

          {sectionVisibility.service && (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
              <InfoCard
                title={presentation.deliveryLabel}
                description="Receba pedidos online com clareza de itens e total."
              />
              <InfoCard
                title={isTableOrder ? presentation.dineInLabel : presentation.pickupLabel}
                description={
                  isTableOrder
                    ? `Fluxo priorizado para a mesa ${tableNumber} com identificação no pedido.`
                    : 'Perfeito para quem pede online e vai buscar no balcão.'
                }
              />
            </div>
          )}
        </div>
      </div>

      {sectionVisibility.categories && categories.length > 0 && (
        <div className="bg-background/95 border-border sticky top-0 z-30 mt-6 border-b backdrop-blur-sm">
          <div className="mx-auto max-w-5xl">
            <nav className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3 sm:px-6">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category)
                    document.getElementById(`category-${category}`)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    })
                  }}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                    activeCategory === category
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {sectionVisibility.categories && (
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-primary text-sm font-semibold tracking-[0.18em] uppercase">
                Cardápio online
              </p>
              <h3 className="text-foreground mt-2 text-2xl font-semibold sm:text-3xl">
                {presentation.sectionTitle}
              </h3>
            </div>
            <p className="text-muted-foreground max-w-2xl text-sm leading-7 sm:text-base">
              {presentation.sectionDescription}
            </p>
          </div>

          {categories.map((category) => {
            const categoryProducts = productsByCategory[category] || []
            if (categoryProducts.length === 0) return null

            return (
              <section key={category} id={`category-${category}`} className="mb-10 scroll-mt-24">
                <div className="mb-4 flex items-center gap-3">
                  <h4 className="text-foreground text-lg font-bold sm:text-xl">{category}</h4>
                  <span className="text-muted-foreground text-sm">({categoryProducts.length})</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={() => addProduct(product)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {products.length === 0 && (
            <div className="border-border bg-card rounded-3xl border border-dashed py-16 text-center">
              <Store className="text-muted-foreground/30 mx-auto mb-4 h-16 w-16" />
              <h3 className="text-foreground mb-2 text-lg font-medium">
                {presentation.emptyStateTitle}
              </h3>
              <p className="text-muted-foreground mx-auto max-w-md">
                {presentation.emptyStateDescription}
              </p>
            </div>
          )}
        </section>
      )}

      {sectionVisibility.about && (
        <section className="mx-auto max-w-5xl px-4 pb-28 sm:px-6">
          <div className="border-border bg-card rounded-3xl border p-6 shadow-sm">
            <h3 className="text-foreground text-xl font-semibold">{presentation.aboutTitle}</h3>
            <p className="text-muted-foreground mt-2 max-w-3xl leading-7">
              {presentation.aboutDescription}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
            {restaurant.google_maps_url && (
              <a
                href={restaurant.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <MapPin className="h-4 w-4" />
                Abrir no Google Maps
              </a>
            )}
            {restaurant.telefone && (
              <a
                href={`https://wa.me/55${restaurant.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#20bd5a]"
              >
                <MessageCircle className="h-4 w-4" />
                Falar no WhatsApp
              </a>
            )}
            </div>
          </div>
        </section>
      )}

      {totalItems > 0 && !isCartOpen && (
        <div className="fixed right-4 bottom-6 left-4 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="bg-primary text-primary-foreground mx-auto flex w-full max-w-md items-center justify-between rounded-2xl px-5 py-4 font-semibold shadow-lg transition-opacity hover:opacity-90"
          >
            <span className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-primary absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold">
                  {totalItems}
                </span>
              </div>
              <span>Ver carrinho</span>
            </span>
            <span className="text-lg">{formatCurrency(totalPrice)}</span>
          </button>
        </div>
      )}

      {isCartOpen && (
        <CartDrawer
          cart={cart}
          totalItems={totalItems}
          totalPrice={totalPrice}
          restaurant={restaurant}
          error={error}
          isSubmitting={isSubmitting}
          orderForm={orderForm}
          isTableOrder={isTableOrder}
          tableNumber={tableNumber}
          presentation={presentation}
          onClose={() => setIsCartOpen(false)}
          onIncrement={incrementItem}
          onDecrement={decrementItem}
          onRemove={removeItem}
          onOrderFormChange={updateOrderForm}
          onSubmit={submitOrder}
          canSubmit={canSubmit}
        />
      )}
    </main>
  )
}

// =====================================================
// Product Card Component
// =====================================================

interface ProductCardProps {
  product: CardapioProduct
  onAdd: () => void
}

function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <div
      className="group bg-card border-border hover:border-primary/30 flex cursor-pointer gap-4 rounded-xl border p-4 transition-all duration-300 hover:shadow-md"
      onClick={onAdd}
    >
      {/* Image */}
      {product.imagem_url && (
        <div className="bg-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28">
          <Image
            src={product.imagem_url}
            alt={product.nome}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-foreground group-hover:text-primary line-clamp-1 font-semibold transition-colors">
          {product.nome}
        </h3>

        {product.descricao && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{product.descricao}</p>
        )}

        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="text-primary text-lg font-bold">{formatCurrency(product.preco)}</span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  )
}

interface CartDrawerProps {
  cart: CartItem[]
  totalItems: number
  totalPrice: number
  restaurant: CardapioRestaurant
  error: string | null
  isSubmitting: boolean
  orderForm: OrderFormState
  isTableOrder: boolean
  tableNumber: string
  presentation: RestaurantPresentation
  onClose: () => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
  onOrderFormChange: <Key extends keyof OrderFormState>(
    field: Key,
    value: OrderFormState[Key]
  ) => void
  onSubmit: () => void
  canSubmit: boolean
}

function CartDrawer({
  cart,
  totalItems,
  totalPrice,
  restaurant,
  error,
  isSubmitting,
  orderForm,
  isTableOrder,
  tableNumber,
  presentation,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
  onOrderFormChange,
  onSubmit,
  canSubmit,
}: CartDrawerProps) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-background absolute top-0 right-0 bottom-0 flex w-full max-w-md flex-col shadow-2xl">
        <div className="border-border flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-foreground text-lg font-bold">Seu Pedido</h2>
            <p className="text-muted-foreground text-sm">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-muted rounded-lg p-2 transition-colors"
            title="Fechar carrinho"
            aria-label="Fechar carrinho"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingCart className="text-muted-foreground/30 mb-4 h-12 w-12" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border-border flex items-start gap-3 rounded-xl border p-3"
                >
                  {item.product.imagem_url && (
                    <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={item.product.imagem_url}
                        alt={item.product.nome}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-foreground text-sm font-medium">{item.product.nome}</h4>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="hover:bg-muted text-muted-foreground hover:text-destructive rounded p-1 transition-colors"
                        title="Remover item"
                        aria-label="Remover item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-primary font-semibold">
                        {formatCurrency(item.product.preco * item.quantity)}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onDecrement(item.id)}
                          className="bg-muted hover:bg-muted/80 rounded-lg p-1.5 transition-colors"
                          title="Diminuir quantidade"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => onIncrement(item.id)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-1.5 transition-colors"
                          title="Aumentar quantidade"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="border-border mt-6 space-y-4 border-t pt-4">
              <div>
                <h3 className="text-foreground font-semibold">Dados do pedido</h3>
                <p className="text-muted-foreground text-sm">
                  {isTableOrder
                    ? `Este pedido será identificado como mesa ${tableNumber}.`
                    : 'Preencha os dados para entrega ou retirada.'}
                </p>
              </div>

              <InputField
                label="Nome"
                value={orderForm.customerName}
                onChange={(value) => onOrderFormChange('customerName', value)}
              />
              <InputField
                label="Telefone"
                value={orderForm.customerPhone}
                onChange={(value) => onOrderFormChange('customerPhone', value)}
              />

              {isTableOrder ? (
                <div className="border-primary/20 bg-primary/5 text-foreground rounded-2xl border px-4 py-3 text-sm">
                  Origem do pedido: <span className="font-semibold">Mesa {tableNumber}</span>
                </div>
              ) : (
                <div>
                  <p className="text-foreground mb-2 text-sm font-medium">Tipo de atendimento</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ToggleButton
                      active={orderForm.fulfillment === 'retirada'}
                      label={presentation.pickupLabel}
                      onClick={() => onOrderFormChange('fulfillment', 'retirada')}
                    />
                    <ToggleButton
                      active={orderForm.fulfillment === 'entrega'}
                      label={presentation.deliveryLabel}
                      onClick={() => onOrderFormChange('fulfillment', 'entrega')}
                    />
                  </div>
                </div>
              )}

              {orderForm.fulfillment === 'entrega' && !isTableOrder && (
                <div className="grid gap-3">
                  <InputField
                    label="Rua e número"
                    value={orderForm.addressStreet}
                    onChange={(value) => onOrderFormChange('addressStreet', value)}
                  />
                  <InputField
                    label="Bairro"
                    value={orderForm.addressDistrict}
                    onChange={(value) => onOrderFormChange('addressDistrict', value)}
                  />
                  <InputField
                    label="Complemento"
                    value={orderForm.addressComplement}
                    onChange={(value) => onOrderFormChange('addressComplement', value)}
                  />
                </div>
              )}

              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Observações
                </label>
                <textarea
                  rows={3}
                  value={orderForm.notes}
                  onChange={(event) => onOrderFormChange('notes', event.target.value)}
                  className="border-border bg-background text-foreground focus:ring-primary w-full rounded-xl border px-4 py-3 focus:border-transparent focus:ring-2"
                  placeholder="Ex: sem cebola, retirar embalagem, tocar campainha"
                />
              </div>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-border bg-card/50 space-y-4 border-t p-4">
            {error && (
              <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg p-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="text-muted-foreground flex justify-between">
                <span>Itens</span>
                <span>{totalItems}</span>
              </div>
              <div className="border-border flex justify-between border-t pt-2 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <button
              onClick={onSubmit}
              disabled={isSubmitting || !restaurant.telefone || !canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-4 font-semibold text-white transition-all hover:bg-[#20bd5a] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <MessageCircle className="h-5 w-5" />
              )}
              <span>{isSubmitting ? 'Enviando...' : 'Enviar pedido via WhatsApp'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="text-foreground mb-1 block text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        title={label}
        aria-label={label}
        placeholder={label}
        className="border-border bg-background text-foreground focus:ring-primary w-full rounded-xl border px-4 py-3 focus:border-transparent focus:ring-2"
      />
    </div>
  )
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:bg-secondary'
      )}
    >
      {label}
    </button>
  )
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-border bg-card rounded-3xl border p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-foreground font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">{description}</p>
        </div>
        <div className="bg-primary/10 text-primary rounded-full p-2">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

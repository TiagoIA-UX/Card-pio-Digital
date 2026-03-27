'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { trackEvent } from '@/lib/analytics'
import { buildCardapioViewModel } from '@/lib/cardapio-renderer'
import { buildGoogleMapsLinks } from '@/lib/google-maps'
import type { RestaurantPresentation } from '@/lib/restaurant-customization'
import { formatCurrency } from '@/lib/format-currency'
import { cn, formatPhone } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { formatarTelefoneWhatsApp } from '@/modules/whatsapp'

interface CartItem {
  id: string
  product: CardapioProduct
  quantity: number
}

export type FormaPagamentoNaEntrega = 'dinheiro' | 'pix' | 'cartao' | null

interface OrderFormState {
  customerName: string
  customerPhone: string
  fulfillment: 'retirada' | 'entrega' | 'local'
  addressStreet: string
  addressDistrict: string
  addressComplement: string
  notes: string
  formaPagamentoNaEntrega: FormaPagamentoNaEntrega
  trocoPara: string
  comprovanteUrl: string
  comprovanteKey: string
}

interface CardapioClientProps {
  restaurant: CardapioRestaurant
  products: CardapioProduct[]
}

function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 11)
}

function isValidBrazilPhone(phone: string): boolean {
  const digits = normalizePhoneDigits(phone)
  return digits.length >= 10 && digits.length <= 13
}

function formatPhoneMask(phone: string): string {
  const digits = normalizePhoneDigits(phone)

  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
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
    formaPagamentoNaEntrega: null,
    trocoPara: '',
    comprovanteUrl: '',
    comprovanteKey: '',
  }
}

export default function CardapioClient({ restaurant, products }: CardapioClientProps) {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClient()
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
  const [receiptUploading, setReceiptUploading] = useState(false)
  const [receiptUploadError, setReceiptUploadError] = useState<string | null>(null)
  const [sessionAccessToken, setSessionAccessToken] = useState<string | null>(null)
  const [orderForm, setOrderForm] = useState<OrderFormState>(createInitialOrderForm(isTableOrder))
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0] || null)
  const mapLinks = useMemo(
    () =>
      buildGoogleMapsLinks({
        address: restaurant.endereco_texto,
        mapUrl: restaurant.google_maps_url,
      }),
    [restaurant.endereco_texto, restaurant.google_maps_url]
  )

  const { totalItems, totalPrice } = useMemo(() => {
    let items = 0
    let price = 0

    cart.forEach((item) => {
      items += item.quantity
      price += item.product.preco * item.quantity
    })

    return { totalItems: items, totalPrice: price }
  }, [cart])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const { data } = await supabase.auth.getSession()
      if (!cancelled) {
        setSessionAccessToken(data.session?.access_token || null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [supabase])

  const addProduct = (product: CardapioProduct) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id)

      if (existingIndex >= 0) {
        return prev.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        )
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
    toast({
      title: `✓ ${product.nome} adicionado`,
      description: formatCurrency(product.preco),
      duration: 2000,
    })
  }

  const decrementItem = (cartItemId: string) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === cartItemId)
      if (index < 0) return prev

      if (prev[index].quantity > 1) {
        return prev.map((item, i) =>
          i === index ? { ...item, quantity: item.quantity - 1 } : item
        )
      }

      return prev.filter((item) => item.id !== cartItemId)
    })
  }

  const incrementItem = (cartItemId: string) => {
    setCart((prev) => {
      const index = prev.findIndex((item) => item.id === cartItemId)
      if (index < 0) return prev

      return prev.map((item, i) => (i === index ? { ...item, quantity: item.quantity + 1 } : item))
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
    (!orderForm.customerPhone.trim() || isValidBrazilPhone(orderForm.customerPhone)) &&
    (orderForm.fulfillment !== 'entrega' ||
      (!!orderForm.addressStreet.trim() && !!orderForm.addressDistrict.trim())) &&
    !!orderForm.formaPagamentoNaEntrega

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

    if (orderForm.formaPagamentoNaEntrega) {
      const formas: Record<string, string> = {
        dinheiro: '💵 Dinheiro',
        pix: '📱 PIX',
        cartao: '💳 Cartão (débito/crédito)',
      }
      let pagamento = formas[orderForm.formaPagamentoNaEntrega] || orderForm.formaPagamentoNaEntrega
      if (orderForm.formaPagamentoNaEntrega === 'dinheiro' && orderForm.trocoPara.trim()) {
        const troco = parseFloat(orderForm.trocoPara.replace(',', '.'))
        if (!isNaN(troco) && troco > 0) {
          pagamento += ` (Troco para ${formatCurrency(troco)})`
        }
      }
      message += `\n💳 *Pagamento:* ${pagamento}\n`
    }

    if (orderForm.formaPagamentoNaEntrega === 'pix' && orderForm.comprovanteUrl) {
      message += `\n📎 *Comprovante:* ${orderForm.comprovanteUrl}\n`
    }

    if (orderForm.notes.trim()) {
      message += `\n📝 *Observações:* ${orderForm.notes.trim()}\n`
    }

    return message
  }

  const openWhatsApp = (message: string) => {
    if (!restaurant.telefone?.replace(/\D/g, '')) {
      throw new Error('Este restaurante não configurou o WhatsApp.')
    }

    const whatsappNumber = formatarTelefoneWhatsApp(restaurant.telefone)
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`
    window.location.href = whatsappUrl
  }

  const uploadPixReceipt = async (file: File) => {
    setReceiptUploading(true)
    setReceiptUploadError(null)

    try {
      if (!sessionAccessToken) {
        throw new Error('Faça login para anexar o comprovante do PIX.')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'comprovantes')

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionAccessToken}`,
        },
        body: formData,
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result?.error || 'Falha no upload do comprovante')
      }

      setOrderForm((current) => ({
        ...current,
        comprovanteUrl: result.url,
        comprovanteKey: result.key,
      }))

      toast({
        title: 'Comprovante anexado',
        description: 'O arquivo foi enviado com sucesso.',
        duration: 2500,
      })
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Erro no upload'
      setReceiptUploadError(message)
    } finally {
      setReceiptUploading(false)
    }
  }

  const submitOrder = async () => {
    if (!restaurant?.id || !restaurant?.telefone?.trim()) {
      setError(
        'Este cardápio não foi encontrado ou não está disponível no momento. Atualize a página e tente novamente.'
      )
      return
    }

    if (!canSubmit) {
      setError('Preencha os dados necessários para enviar o pedido.')
      return
    }

    if (orderForm.customerPhone.trim() && !isValidBrazilPhone(orderForm.customerPhone)) {
      setError('Digite um telefone válido com DDD para continuar.')
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
        forma_pagamento: orderForm.formaPagamentoNaEntrega
          ? orderForm.formaPagamentoNaEntrega
          : undefined,
        troco_para:
          orderForm.formaPagamentoNaEntrega === 'dinheiro' && orderForm.trocoPara.trim()
            ? (() => {
                const v = parseFloat(orderForm.trocoPara.replace(',', '.'))
                return !isNaN(v) && v > 0 ? v : undefined
              })()
            : undefined,
        comprovante_url: orderForm.comprovanteUrl || undefined,
        comprovante_key: orderForm.comprovanteKey || undefined,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Erro ao salvar pedido')
      }

      const message = buildWhatsAppMessage(result?.numero_pedido)
      openWhatsApp(message)

      trackEvent('order_placed', {
        restaurant_id: restaurant.id,
        total: result?.total ?? 0,
        items_count: cart.length,
      })

      setCart([])
      setOrderForm(createInitialOrderForm(isTableOrder))
      setIsCartOpen(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Erro ao enviar pedido. Tente novamente.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="bg-background min-h-screen w-full min-w-0 overflow-x-hidden">
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
              sizes="100vw"
            />
          ) : (
            <div
              className={`h-full w-full bg-linear-to-br ${presentation.template.accentClassName}`}
            />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.7))]" />

          <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-4 py-8 sm:px-6 sm:py-10">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                  {presentation.badge}
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight wrap-break-word text-white sm:text-4xl md:text-5xl">
                {restaurant.nome || presentation.heroTitle}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 wrap-break-word text-white/90 sm:text-base md:text-lg">
                {presentation.heroDescription || restaurant.slogan}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10 mx-auto -mt-12 max-w-5xl min-w-0 px-4 sm:px-6">
        <div
          className={cn(
            'grid min-w-0 gap-4',
            sectionVisibility.service ? 'grid-cols-1 md:grid-cols-[1.2fr_0.8fr]' : 'grid-cols-1'
          )}
        >
          <div className="border-border bg-card min-w-0 rounded-3xl border p-4 shadow-lg sm:p-6">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="bg-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl shadow-md sm:h-24 sm:w-24">
                {restaurant.logo_url ? (
                  <Image
                    src={restaurant.logo_url}
                    alt={restaurant.nome}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 80px, 96px"
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
        <section className="mx-auto max-w-5xl min-w-0 px-4 py-8 sm:px-6">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-primary text-sm font-semibold tracking-[0.18em] uppercase">
                {presentation.template.nomeCanal}
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

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      restaurant={restaurant}
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

      {(restaurant.endereco_texto || restaurant.google_maps_url || restaurant.telefone) && (
        <footer className="border-border from-muted/30 to-muted/60 mx-auto max-w-5xl min-w-0 border-t bg-linear-to-b px-4 py-12 pb-36 sm:px-6 lg:py-16">
          <div className="mb-6 text-center sm:text-left md:mb-8">
            <h2 className="text-foreground text-xl font-bold sm:text-2xl">Localização e contato</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Venha nos visitar ou finalize seu pedido para falar conosco
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[1fr_320px]">
            {(restaurant.endereco_texto || restaurant.google_maps_url) && (
              <div className="border-border bg-card overflow-hidden rounded-2xl border shadow-xl ring-1 ring-black/5">
                <div className="bg-muted relative aspect-16/10 w-full sm:aspect-video">
                  {mapLinks.embedUrl ? (
                    <iframe
                      title="Localização no mapa"
                      src={mapLinks.embedUrl}
                      className="absolute inset-0 h-full w-full"
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div className="from-muted to-muted/60 flex h-full w-full flex-col items-center justify-center gap-4 bg-linear-to-br px-6 text-center">
                      <div className="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                        <MapPin className="text-primary h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Ver localização no mapa
                        </p>
                        {restaurant.endereco_texto && (
                          <p className="text-muted-foreground mt-1 max-w-xs text-xs">
                            {restaurant.endereco_texto}
                          </p>
                        )}
                      </div>
                      {mapLinks.openUrl && (
                        <a
                          href={mapLinks.openUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
                        >
                          <MapPin className="h-4 w-4" />
                          Abrir no Google Maps
                        </a>
                      )}
                    </div>
                  )}
                </div>
                {restaurant.endereco_texto && (
                  <div className="border-border bg-card/80 flex items-center gap-3 border-t px-4 py-3 backdrop-blur-sm">
                    <MapPin className="text-primary h-5 w-5 shrink-0" />
                    <p className="text-foreground text-sm font-medium">
                      {restaurant.endereco_texto}
                    </p>
                  </div>
                )}
                {mapLinks.openUrl && (
                  <a
                    href={mapLinks.openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border hover:bg-muted flex items-center justify-center gap-2 border-t px-4 py-3 text-sm font-medium transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    Abrir no Google Maps
                  </a>
                )}
              </div>
            )}
            {restaurant.telefone && (
              <div className="border-border bg-card flex flex-col justify-center rounded-2xl border p-6 shadow-lg ring-1 ring-black/5 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/15 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
                    <Phone className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                      Finalize o pedido para entrar em contato
                    </p>
                    <a
                      href={`tel:+55${restaurant.telefone.replace(/\D/g, '')}`}
                      className="text-foreground hover:text-primary mt-2 block text-lg font-bold transition-colors"
                    >
                      {formatPhone(restaurant.telefone)}
                    </a>
                    <a
                      href={`https://api.whatsapp.com/send?phone=${formatarTelefoneWhatsApp(restaurant.telefone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 mt-2 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Falar no WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </footer>
      )}

      {/* Botão flutuante do carrinho - abre o drawer de pedido */}
      {!isCartOpen && totalItems > 0 && (
        <div
          className="fixed right-4 left-4 z-40 transition-[bottom] duration-300"
          style={{ bottom: 'calc(1.5rem + var(--cookie-banner-offset, 0px))' }}
        >
          <button
            data-testid="btn-open-cart"
            onClick={() => {
              trackEvent('checkout_started', {
                restaurant_id: restaurant.id,
                items_count: totalItems,
              })
              setIsCartOpen(true)
            }}
            className="bg-primary text-primary-foreground mx-auto flex w-full max-w-md items-center justify-between rounded-2xl px-5 py-4 font-semibold shadow-lg transition-opacity hover:opacity-90"
          >
            <span className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span
                  data-testid="cart-badge"
                  className="text-primary absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold"
                >
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
          receiptUploading={receiptUploading}
          receiptUploadError={receiptUploadError}
          sessionAccessToken={sessionAccessToken}
          onClose={() => setIsCartOpen(false)}
          onIncrement={incrementItem}
          onDecrement={decrementItem}
          onRemove={removeItem}
          onOrderFormChange={updateOrderForm}
          onUploadPixReceipt={(file) => {
            void uploadPixReceipt(file)
          }}
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
  restaurant: CardapioRestaurant
  onAdd: () => void
}

function ProductCard({ product, restaurant, onAdd }: ProductCardProps) {
  return (
    <div className="group bg-card border-border hover:border-primary/30 flex min-w-0 gap-3 rounded-xl border p-3 transition-all duration-300 hover:shadow-md sm:gap-4 sm:p-4">
      {/* Image */}
      {product.imagem_url && (
        <div className="bg-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-28">
          <Image
            src={product.imagem_url}
            alt={product.nome}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 96px, 112px"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="text-foreground group-hover:text-primary font-semibold transition-colors">
          {product.nome}
        </h3>

        {product.descricao && (
          <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{product.descricao}</p>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
          <span className="text-primary text-base font-bold sm:text-lg">
            {formatCurrency(product.preco)}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            data-testid="btn-add-product"
            className="border-border bg-background hover:bg-muted flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all active:scale-95"
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
  receiptUploading: boolean
  receiptUploadError: string | null
  sessionAccessToken: string | null
  onClose: () => void
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
  onOrderFormChange: <Key extends keyof OrderFormState>(
    field: Key,
    value: OrderFormState[Key]
  ) => void
  onUploadPixReceipt: (file: File) => void
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
  receiptUploading,
  receiptUploadError,
  sessionAccessToken,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
  onOrderFormChange,
  onUploadPixReceipt,
  onSubmit,
  canSubmit,
}: CartDrawerProps) {
  const [touchedStreet, setTouchedStreet] = useState(false)
  const [touchedDistrict, setTouchedDistrict] = useState(false)

  return (
    <div className="fixed inset-0 z-50" data-testid="cart-drawer">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-background absolute top-0 right-0 bottom-0 left-0 flex w-full flex-col shadow-2xl sm:left-auto sm:max-w-md">
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
            <div
              data-testid="cart-empty"
              className="flex h-full flex-col items-center justify-center text-center"
            >
              <ShoppingCart className="text-muted-foreground/30 mb-4 h-12 w-12" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
              <p className="text-muted-foreground/60 mt-1 text-sm">
                Adicione itens do canal digital para fazer seu pedido
              </p>
              <button
                onClick={onClose}
                className="text-primary mt-4 text-sm font-medium hover:underline"
              >
                Ver canal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  data-testid="cart-item"
                  className="bg-card border-border flex items-start gap-3 rounded-xl border p-3"
                >
                  {item.product.imagem_url && (
                    <div className="bg-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={item.product.imagem_url}
                        alt={item.product.nome}
                        fill
                        className="object-cover"
                        sizes="64px"
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
                type="tel"
                value={orderForm.customerPhone}
                onChange={(value) => onOrderFormChange('customerPhone', value)}
                hint={
                  orderForm.customerPhone.trim() && !isValidBrazilPhone(orderForm.customerPhone)
                    ? 'Digite um telefone válido com DDD'
                    : undefined
                }
                hintTone={
                  orderForm.customerPhone.trim() && !isValidBrazilPhone(orderForm.customerPhone)
                    ? 'error'
                    : 'muted'
                }
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
                    onBlur={() => setTouchedStreet(true)}
                    hint={
                      touchedStreet && !orderForm.addressStreet.trim()
                        ? 'Informe a rua e o número para entrega'
                        : undefined
                    }
                    hintTone="error"
                  />
                  <InputField
                    label="Bairro"
                    value={orderForm.addressDistrict}
                    onChange={(value) => onOrderFormChange('addressDistrict', value)}
                    onBlur={() => setTouchedDistrict(true)}
                    hint={
                      touchedDistrict && !orderForm.addressDistrict.trim()
                        ? 'Informe o bairro para entrega'
                        : undefined
                    }
                    hintTone="error"
                  />
                  <InputField
                    label="Complemento"
                    value={orderForm.addressComplement}
                    onChange={(value) => onOrderFormChange('addressComplement', value)}
                  />
                </div>
              )}

              <div className="border-border bg-muted/30 rounded-2xl border p-4">
                <label className="text-foreground mb-2 block text-sm font-semibold">
                  Observações do pedido
                </label>
                <textarea
                  rows={4}
                  value={orderForm.notes}
                  onChange={(event) => onOrderFormChange('notes', event.target.value)}
                  placeholder="Ex: sem cebola, ponto da carne, retirar embalagem, tocar campainha, ponto de referência para entrega..."
                  className="border-border bg-background text-foreground focus:ring-primary w-full rounded-xl border px-4 py-3 focus:border-transparent focus:ring-2"
                />

                <div className="space-y-2">
                  <p className="text-foreground text-sm font-medium">
                    Como prefere pagar na{' '}
                    {orderForm.fulfillment === 'entrega'
                      ? 'entrega'
                      : isTableOrder
                        ? 'mesa'
                        : 'retirada'}
                    ?
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Escolha a forma de pagamento para o restaurante já preparar.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['dinheiro', 'pix', 'cartao'] as const).map((forma) => (
                      <label
                        key={forma}
                        className={`border-border flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 transition-colors ${
                          orderForm.formaPagamentoNaEntrega === forma
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="forma-pagamento-na-entrega"
                          checked={orderForm.formaPagamentoNaEntrega === forma}
                          onChange={() => onOrderFormChange('formaPagamentoNaEntrega', forma)}
                          className="sr-only"
                        />
                        <span className="text-lg">
                          {forma === 'dinheiro' && '💵'}
                          {forma === 'pix' && '📱'}
                          {forma === 'cartao' && '💳'}
                        </span>
                        <span className="text-foreground text-xs font-medium">
                          {forma === 'dinheiro' && 'Dinheiro'}
                          {forma === 'pix' && 'PIX'}
                          {forma === 'cartao' && 'Cartão'}
                        </span>
                      </label>
                    ))}
                  </div>
                  {orderForm.formaPagamentoNaEntrega === 'dinheiro' && (
                    <div className="pt-2">
                      <label className="text-muted-foreground mb-1 block text-xs">
                        Troco para (opcional)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 50,00"
                        value={orderForm.trocoPara}
                        onChange={(e) => onOrderFormChange('trocoPara', e.target.value)}
                        className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
                      />
                    </div>
                  )}

                  {orderForm.formaPagamentoNaEntrega === 'pix' && (
                    <div className="border-border bg-background rounded-2xl border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-foreground text-sm font-semibold">
                            Comprovante do PIX
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs leading-5">
                            Anexe a imagem do comprovante para enviar junto com o pedido.
                          </p>
                        </div>
                        {receiptUploading ? (
                          <Loader2 className="text-primary h-4 w-4 animate-spin" />
                        ) : null}
                      </div>

                      <input
                        id="pix-receipt-upload"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) {
                            onUploadPixReceipt(file)
                          }
                        }}
                      />

                      <label
                        htmlFor="pix-receipt-upload"
                        className="border-border hover:bg-muted/50 mt-3 flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-medium transition-colors"
                      >
                        {orderForm.comprovanteUrl ? 'Trocar comprovante' : 'Anexar comprovante'}
                      </label>

                      {orderForm.comprovanteUrl ? (
                        <a
                          href={orderForm.comprovanteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary mt-2 block text-xs font-medium break-all"
                        >
                          Ver comprovante anexado
                        </a>
                      ) : null}

                      {receiptUploadError ? (
                        <p className="text-destructive mt-2 text-xs">{receiptUploadError}</p>
                      ) : null}

                      {!sessionAccessToken ? (
                        <p className="text-muted-foreground mt-2 text-xs">
                          Faça login para anexar o comprovante automaticamente.
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
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
                <span data-testid="cart-total" className="text-primary">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            <button
              data-testid="btn-submit-order"
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
  type = 'text',
  hint,
  hintTone = 'muted',
  onBlur,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'tel' | 'email'
  hint?: string
  hintTone?: 'muted' | 'error'
  onBlur?: () => void
}) {
  const displayValue = type === 'tel' ? formatPhoneMask(value) : value

  return (
    <div>
      <label className="text-foreground mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        inputMode={type === 'tel' ? 'tel' : undefined}
        data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        value={displayValue}
        onChange={(event) =>
          onChange(type === 'tel' ? normalizePhoneDigits(event.target.value) : event.target.value)
        }
        autoComplete={type === 'tel' ? 'tel' : undefined}
        onBlur={onBlur}
        title={label}
        aria-label={label}
        placeholder={label}
        className="border-border bg-background text-foreground focus:ring-primary w-full rounded-xl border px-4 py-3 focus:border-transparent focus:ring-2"
      />
      {hint ? (
        <p
          className={cn(
            'mt-1 text-xs',
            hintTone === 'error' ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {hint}
        </p>
      ) : null}
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

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient, type Restaurant } from '@/lib/supabase/client'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Package,
  Rocket,
  Store,
} from 'lucide-react'
import {
  buildTemplatePreviewProducts,
  mergeTemplateProductsWithSaved,
  resolveCardapioProductsForPreview,
  type CardapioProduct,
  type CardapioRestaurant,
} from '@/lib/cardapio-renderer'
import {
  CardapioEditorPreview,
  type EditorBlockId,
  type EditorFieldId,
  type InlineImageField,
  type InlineProductDraft,
  type InlineProductSaveStatus,
  type InlineTextField,
  type PreviewDataBlock,
} from '@/components/template-editor/cardapio-editor-preview'
import {
  buildRestaurantCustomizationSeed,
  getRestaurantPresentation,
  normalizeTemplateSlug,
  type RestaurantCustomization,
  type RestaurantTemplateSlug,
} from '@/lib/restaurant-customization'
import { validateImageUrl, type ImageValidationResult } from '@/lib/image-validation'
import { cn } from '@/lib/utils'

type EditorBlockIdShort = EditorBlockId
type EditorFieldIdShort = EditorFieldId

interface FormState {
  nome: string
  telefone: string
  endereco_texto: string
  google_maps_url: string
  logo_url: string
  banner_url: string
  slogan: string
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

const DATA_BLOCK_TO_EDITOR: Record<string, EditorBlockIdShort> = {
  header: 'negocio',
  banner: 'branding',
  hero: 'hero',
  service: 'service',
  products: 'products',
  'product-card': 'products',
  about: 'about',
  address: 'negocio',
}

export default function EditorVisualPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [products, setProducts] = useState<CardapioProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>({
    nome: '',
    telefone: '',
    endereco_texto: '',
    google_maps_url: '',
    logo_url: '',
    banner_url: '',
    slogan: '',
    badge: '',
    heroTitle: '',
    heroDescription: '',
    sectionTitle: '',
    sectionDescription: '',
    aboutTitle: '',
    aboutDescription: '',
    primaryCtaLabel: 'Fazer pedido',
    secondaryCtaLabel: 'Abrir WhatsApp',
    deliveryLabel: 'Entrega',
    pickupLabel: 'Retirada',
    dineInLabel: 'Consumir no local',
  })
  const [panelHidden, setPanelHidden] = useState(true)
  const [savedTemplateProductIds, setSavedTemplateProductIds] = useState<Record<string, string>>({})
  const [selectedBlock, setSelectedBlock] = useState<EditorBlockIdShort>('hero')
  const [selectedField, setSelectedField] = useState<EditorFieldIdShort | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [productDrafts, setProductDrafts] = useState<Record<string, InlineProductDraft>>({})
  const [productSaveState, setProductSaveState] = useState<Record<string, InlineProductSaveStatus>>({})
  const [inlineTextDrafts, setInlineTextDrafts] = useState<Partial<Record<InlineTextField, string>>>({})
  const [inlineImageDrafts, setInlineImageDrafts] = useState<Partial<Record<InlineImageField, string>>>({})
  const [activeInlineTextField, setActiveInlineTextField] = useState<InlineTextField | null>(null)
  const [activeInlineImageField, setActiveInlineImageField] = useState<InlineImageField | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const lastSavedRef = useRef('')
  const supabase = useMemo(() => createClient(), [])

  const loadData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: rest } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (!rest) return

    setRestaurant(rest as Restaurant)
    const pres = getRestaurantPresentation({
      nome: rest.nome,
      template_slug: rest.template_slug,
      customizacao: rest.customizacao,
    })

    setForm({
      nome: rest.nome || '',
      telefone: rest.telefone || '',
      endereco_texto: rest.endereco_texto || '',
      google_maps_url: rest.google_maps_url || '',
      logo_url: rest.logo_url || '',
      banner_url: rest.banner_url || '',
      slogan: rest.slogan || '',
      badge: pres.badge || '',
      heroTitle: pres.heroTitle || '',
      heroDescription: pres.heroDescription || '',
      sectionTitle: pres.sectionTitle || '',
      sectionDescription: pres.sectionDescription || '',
      aboutTitle: pres.aboutTitle || '',
      aboutDescription: pres.aboutDescription || '',
      primaryCtaLabel: pres.primaryCtaLabel || 'Fazer pedido',
      secondaryCtaLabel: pres.secondaryCtaLabel || 'Abrir WhatsApp',
      deliveryLabel: pres.deliveryLabel || 'Entrega',
      pickupLabel: pres.pickupLabel || 'Retirada',
      dineInLabel: pres.dineInLabel || 'Consumir no local',
    })

    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', rest.id)
      .order('ordem')
      .order('nome')

    setProducts((prods || []) as CardapioProduct[])
    lastSavedRef.current = JSON.stringify({
      nome: rest.nome,
      telefone: rest.telefone,
      endereco_texto: rest.endereco_texto,
      google_maps_url: rest.google_maps_url,
      logo_url: rest.logo_url,
      banner_url: rest.banner_url,
      slogan: rest.slogan,
      customizacao: rest.customizacao,
    })
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    queueMicrotask(() => loadData())
  }, [loadData])

  const customization = useMemo((): RestaurantCustomization => ({
    sections: { hero: true, service: true, categories: true, about: true },
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
  }), [form])

  const previewRestaurant = useMemo<CardapioRestaurant | null>(() => {
    if (!restaurant) return null
    return {
      ...restaurant,
      nome: form.nome || restaurant.nome || 'Seu restaurante',
      telefone: form.telefone || null,
      endereco_texto: form.endereco_texto?.trim() || null,
      google_maps_url: form.google_maps_url?.trim() || null,
      logo_url: form.logo_url || null,
      banner_url: form.banner_url || null,
      slogan: form.slogan || null,
      customizacao: customization as Record<string, unknown>,
    } as CardapioRestaurant
  }, [restaurant, form, customization])

  const previewProducts = useMemo(
    () => (previewRestaurant ? resolveCardapioProductsForPreview(previewRestaurant, products) : []),
    [previewRestaurant, products]
  )

  const mergedProducts = useMemo(
    () =>
      previewRestaurant
        ? mergeTemplateProductsWithSaved(previewRestaurant, products, savedTemplateProductIds)
        : [],
    [previewRestaurant, products, savedTemplateProductIds]
  )

  useEffect(() => {
    if (!previewRestaurant || products.length === 0) return
    const templateProducts = buildTemplatePreviewProducts(previewRestaurant.template_slug, previewRestaurant.id)
    const saved = [...products].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0) || (a.categoria || '').localeCompare(b.categoria || ''))
    const mapping: Record<string, string> = {}
    const n = Math.min(templateProducts.length, saved.length)
    for (let i = 0; i < n; i++) {
      mapping[templateProducts[i].id] = saved[i].id
    }
    queueMicrotask(() =>
      setSavedTemplateProductIds((prev) => (Object.keys(prev).length === 0 ? mapping : prev))
    )
  }, [previewRestaurant, products])

  const persistRestaurant = useCallback(
    async (payload?: Partial<FormState>) => {
      if (!restaurant) return
      const logoUrl = payload?.logo_url ?? form.logo_url
      const bannerUrl = payload?.banner_url ?? form.banner_url
      const sloganVal = payload?.slogan ?? form.slogan
      const toSave = {
        nome: payload?.nome ?? form.nome,
        telefone: (payload?.telefone ?? form.telefone ?? '').toString().replace(/\D/g, '') || null,
        endereco_texto: (payload?.endereco_texto ?? form.endereco_texto)?.trim() || null,
        google_maps_url: (payload?.google_maps_url ?? form.google_maps_url)?.trim() || null,
        logo_url: logoUrl?.trim() || null,
        banner_url: bannerUrl?.trim() || null,
        slogan: sloganVal?.trim() || null,
        customizacao: customization,
      }
      await supabase.from('restaurants').update(toSave).eq('id', restaurant.id)
      lastSavedRef.current = JSON.stringify(toSave)
    },
    [restaurant, form, customization, supabase]
  )

  useEffect(() => {
    if (!restaurant || loading) return
    const key = JSON.stringify({ ...form, customizacao: customization })
    if (key === lastSavedRef.current) return
    const t = setTimeout(() => {
      persistRestaurant(form)
    }, 1500)
    return () => clearTimeout(t)
  }, [form, customization, restaurant, loading, persistRestaurant])

  const handleSelectContext = useCallback(
    ({ dataBlock, field, productId }: { dataBlock: PreviewDataBlock; field?: EditorFieldId; productId?: string }) => {
      setSelectedBlock(DATA_BLOCK_TO_EDITOR[dataBlock] || 'hero')
      setSelectedField(field ?? null)
      setSelectedProductId(productId ?? null)
      if (field === 'logo_url' || field === 'banner_url') {
        setActiveInlineImageField(field)
        setActiveInlineTextField(null)
        const url = field === 'logo_url' ? form.logo_url : form.banner_url
        setInlineImageDrafts((prev) => ({ ...prev, [field]: url || '' }))
      } else {
        setActiveInlineImageField(null)
      }
      if (productId && !productDrafts[productId]) {
        const p = products.find((x) => x.id === productId) ?? mergedProducts.find((x) => x.id === productId)
        if (p) {
          setProductDrafts((prev) => ({
            ...prev,
            [productId]: {
              nome: p.nome,
              descricao: p.descricao || '',
              preco: Number(p.preco).toFixed(2).replace('.', ','),
            },
          }))
        }
      }
    },
    [products, mergedProducts, productDrafts, form.logo_url, form.banner_url]
  )

  const handleInlineProductChange = useCallback(
    (productId: string, field: keyof InlineProductDraft, value: string) => {
      setProductDrafts((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || { nome: '', descricao: '', preco: '0,00' }),
          [field]: value,
        },
      }))
      setProductSaveState((prev) => ({ ...prev, [productId]: 'idle' }))
    },
    []
  )

  const handleInlineProductSave = useCallback(
    async (productId: string) => {
      const draft = productDrafts[productId]
      if (!draft || !draft.nome.trim()) return
      const preco = parseFloat(draft.preco.replace(',', '.'))
      if (!Number.isFinite(preco)) return
      if (!restaurant) return

      setProductSaveState((prev) => ({ ...prev, [productId]: 'saving' }))

      const isPreviewProduct = productId.startsWith('preview-')
        const templateProduct = mergedProducts.find((p) => p.id === productId)

      if (isPreviewProduct && templateProduct) {
        const { data: inserted, error } = await supabase
          .from('products')
          .insert({
            restaurant_id: restaurant.id,
            nome: draft.nome,
            descricao: draft.descricao || null,
            preco,
            categoria: templateProduct.categoria || 'Geral',
            imagem_url: (draft.imagem_url?.trim() || templateProduct.imagem_url) || null,
            ordem: templateProduct.ordem ?? 0,
            ativo: true,
          })
          .select('id')
          .single()

        if (error) {
          setProductSaveState((prev) => ({ ...prev, [productId]: 'error' }))
          return
        }
        if (inserted?.id) {
          setSavedTemplateProductIds((prev) => ({ ...prev, [productId]: inserted.id }))
        }
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .order('ordem')
          .order('nome')
        setProducts((prods || []) as CardapioProduct[])
        setProductDrafts((prev) => {
          const next = { ...prev }
          delete next[productId]
          return next
        })
        setSelectedProductId(null)
      } else {
        const updatePayload: { nome: string; descricao: string | null; preco: number; imagem_url?: string | null } = {
          nome: draft.nome,
          descricao: draft.descricao || null,
          preco,
        }
        if (draft.imagem_url !== undefined) {
          updatePayload.imagem_url = draft.imagem_url?.trim() || null
        }
        const { error } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', productId)

        if (error) {
          setProductSaveState((prev) => ({ ...prev, [productId]: 'error' }))
          return
        }
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  nome: draft.nome,
                  descricao: draft.descricao || null,
                  preco,
                  imagem_url: updatePayload.imagem_url ?? p.imagem_url,
                }
              : p
          )
        )
        setProductDrafts((prev) => ({
          ...prev,
          [productId]: {
            nome: draft.nome,
            descricao: draft.descricao || '',
            preco: draft.preco,
            imagem_url: draft.imagem_url,
          },
        }))
      }
      setProductSaveState((prev) => ({ ...prev, [productId]: 'saved' }))
    },
    [productDrafts, supabase, restaurant, mergedProducts]
  )

  const handleInlineProductCancel = useCallback((productId: string) => {
    const p = products.find((x) => x.id === productId) ?? mergedProducts.find((x) => x.id === productId)
    if (p) {
      setProductDrafts((prev) => ({
        ...prev,
        [productId]: {
          nome: p.nome,
          descricao: p.descricao || '',
          preco: Number(p.preco).toFixed(2).replace('.', ','),
          imagem_url: p.imagem_url ?? undefined,
        },
      }))
    }
    setProductSaveState((prev) => ({ ...prev, [productId]: 'idle' }))
    setSelectedProductId(null)
  }, [products, mergedProducts])

  const handleInlineTextChange = useCallback((field: InlineTextField, value: string) => {
    setInlineTextDrafts((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleInlineTextSave = useCallback((field: InlineTextField) => {
    const v = (inlineTextDrafts[field] ?? form[field as keyof FormState])?.toString().trim()
    if (v !== undefined) {
      setForm((prev) => ({ ...prev, [field]: v }))
      setInlineTextDrafts((prev) => ({ ...prev, [field]: undefined }))
    }
    setActiveInlineTextField(null)
  }, [inlineTextDrafts, form])

  const handleInlineTextCancel = useCallback((field: InlineTextField) => {
    setInlineTextDrafts((prev) => ({ ...prev, [field]: undefined }))
    setActiveInlineTextField(null)
  }, [])

  const handleInlineImageChange = useCallback((field: InlineImageField, value: string) => {
    setInlineImageDrafts((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleInlineImageSave = useCallback(
    (field: InlineImageField) => {
      const value = (inlineImageDrafts[field] ?? (field === 'logo_url' ? form.logo_url : form.banner_url) ?? '').trim()
      setForm((prev) => ({ ...prev, [field]: value }))
      if (field === 'logo_url') setLogoError(null)
      else setBannerError(null)
      setInlineImageDrafts((prev) => ({ ...prev, [field]: undefined }))
      setActiveInlineImageField(null)
    },
    [inlineImageDrafts, form.logo_url, form.banner_url]
  )

  const handleInlineImageCancel = useCallback((field: InlineImageField) => {
    setInlineImageDrafts((prev) => ({ ...prev, [field]: undefined }))
    setActiveInlineImageField(null)
  }, [])

  const validateLogoUrl = useCallback((url: string): ImageValidationResult => {
    const r = validateImageUrl(url)
    if (!r.valid) return r
    if (!url.trim()) return { valid: true }
    return { valid: true }
  }, [])

  const validateBannerUrl = useCallback((url: string): ImageValidationResult => {
    return validateImageUrl(url)
  }, [])

  const handleLogoChange = (value: string) => {
    setForm((prev) => ({ ...prev, logo_url: value }))
    const r = validateLogoUrl(value)
    setLogoError(r.valid ? null : r.error)
  }

  const handleBannerChange = (value: string) => {
    setForm((prev) => ({ ...prev, banner_url: value }))
    const r = validateBannerUrl(value)
    setBannerError(r.valid ? null : r.error)
  }

  const cardapioUrl = restaurant ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${restaurant.slug}` : ''
  const copyAndPublish = () => {
    if (!cardapioUrl) return
    navigator.clipboard.writeText(cardapioUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Restaurante não encontrado.</p>
        <Link href="/painel" className="text-primary hover:underline">
          Voltar ao painel
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:h-screen min-w-0 overflow-hidden">
      {/* Header */}
      <header className="border-border flex shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setPanelHidden((p) => !p)}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-lg p-2 transition-colors"
            title={panelHidden ? 'Mostrar formulário lateral' : 'Esconder formulário (editar direto no template)'}
          >
            {panelHidden ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
          <Store className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">Editor Visual</h1>
            <p className="text-muted-foreground text-xs">
              {panelHidden ? 'Clique nos textos do template para editar' : 'Ou use o formulário à esquerda'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/painel/produtos"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm transition-colors sm:gap-2 sm:px-3"
          >
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Produtos</span>
          </Link>
          <button
            onClick={copyAndPublish}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-xl px-3 py-2 font-semibold transition-colors sm:gap-2 sm:px-5 sm:py-2.5"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span className="sm:inline">Link copiado!</span>
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                <span className="sm:inline">Publicar</span>
                <span className="hidden sm:inline"> meu cardápio agora</span>
              </>
            )}
          </button>
          <a
            href={cardapioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
            title="Abrir cardápio"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      </header>

      {/* Split layout */}
      <div className="flex min-h-0 flex-1 min-w-0 overflow-hidden">
        {/* Left panel - Edit */}
        {!panelHidden && (
        <aside className="border-border flex w-full shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r bg-muted/20 lg:w-[320px] xl:w-[380px]">
          <div className="space-y-6 p-3 sm:p-4">
            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Negócio</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Nome</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Nome do estabelecimento"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">WhatsApp</label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => setForm((p) => ({ ...p, telefone: e.target.value }))}
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Slogan</label>
                  <input
                    type="text"
                    value={form.slogan}
                    onChange={(e) => setForm((p) => ({ ...p, slogan: e.target.value }))}
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Ex: O melhor da cidade"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Logo e Banner</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">URL do logo</label>
                  <input
                    type="url"
                    value={form.logo_url}
                    onChange={(e) => handleLogoChange(e.target.value)}
                    className={cn(
                      'border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm',
                      logoError && 'border-red-500'
                    )}
                    placeholder="https://..."
                  />
                  {logoError && (
                    <p className="mt-1 text-xs text-red-600">❌ {logoError}</p>
                  )}
                  {form.logo_url && !logoError && (
                    <div className="mt-2 h-12 w-12 overflow-hidden rounded-lg">
                      <Image
                        src={form.logo_url}
                        alt="Logo"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">URL do banner</label>
                  <input
                    type="url"
                    value={form.banner_url}
                    onChange={(e) => handleBannerChange(e.target.value)}
                    className={cn(
                      'border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm',
                      bannerError && 'border-red-500'
                    )}
                    placeholder="https://..."
                  />
                  {bannerError && (
                    <p className="mt-1 text-xs text-red-600">❌ {bannerError}</p>
                  )}
                  {form.banner_url && !bannerError && (
                    <div className="mt-2 h-20 w-full overflow-hidden rounded-lg">
                      <Image
                        src={form.banner_url}
                        alt="Banner"
                        width={200}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Rodapé e Contato</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Endereço</label>
                  <input
                    type="text"
                    value={form.endereco_texto}
                    onChange={(e) => setForm((p) => ({ ...p, endereco_texto: e.target.value }))}
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Av. Exemplo, 123 - Bairro - Cidade - SP"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Link do Google Maps</label>
                  <input
                    type="url"
                    value={form.google_maps_url}
                    onChange={(e) => setForm((p) => ({ ...p, google_maps_url: e.target.value }))}
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </section>

          </div>
        </aside>
        )}

        {/* Right panel - Preview */}
        <main className="flex min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-muted/30 p-2 sm:p-4">
          {previewRestaurant && (
            <div className={cn(
              'mx-auto w-full min-w-0 flex-1',
              panelHidden ? 'max-w-2xl lg:max-w-4xl' : 'max-w-lg'
            )}>
              <CardapioEditorPreview
                restaurant={previewRestaurant}
                products={mergedProducts}
                selectedBlock={selectedBlock}
                selectedField={selectedField}
                selectedProductId={selectedProductId}
                activeInlineTextField={activeInlineTextField}
                activeInlineImageField={activeInlineImageField}
                productDrafts={productDrafts}
                inlineTextDrafts={inlineTextDrafts}
                inlineImageDrafts={inlineImageDrafts}
                productSaveState={productSaveState}
                onSelectContext={handleSelectContext}
                onInlineTextChange={handleInlineTextChange}
                onInlineTextSave={handleInlineTextSave}
                onInlineTextCancel={handleInlineTextCancel}
                onInlineImageChange={handleInlineImageChange}
                onInlineImageSave={handleInlineImageSave}
                onInlineImageCancel={handleInlineImageCancel}
                onInlineProductChange={handleInlineProductChange}
                onInlineProductSave={handleInlineProductSave}
                onInlineProductCancel={handleInlineProductCancel}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient, type Restaurant } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Package,
  Rocket,
  Save,
  Store,
  WandSparkles,
} from 'lucide-react'
import type { CardapioProduct, CardapioRestaurant } from '@/lib/cardapio-renderer'
import {
  CardapioEditorPreview,
  type EditorBlockId,
  type EditorFieldId,
  INLINE_TEXT_FIELDS,
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
  TEMPLATE_PRESETS,
  type RestaurantCustomization,
  type RestaurantTemplateSlug,
} from '@/lib/restaurant-customization'
import { ImageUploader } from '@/components/shared/image-uploader'

interface FormState {
  nome: string
  telefone: string
  slogan: string
  logo_url: string
  banner_url: string
  cor_primaria: string
  cor_secundaria: string
  template_slug: RestaurantTemplateSlug
  google_maps_url: string
  endereco_texto: string
  badge: string
  heroVisible: boolean
  serviceVisible: boolean
  categoriesVisible: boolean
  aboutVisible: boolean
  heroTitle: string
  heroDescription: string
  sectionTitle: string
  sectionDescription: string
  aboutTitle: string
  aboutDescription: string
  emptyStateTitle: string
  emptyStateDescription: string
  primaryCtaLabel: string
  secondaryCtaLabel: string
  deliveryLabel: string
  pickupLabel: string
  dineInLabel: string
}

type EditorSidebarGroupId = 'structure' | 'negocio' | 'branding' | 'template-content' | 'products'

const DATA_BLOCK_TO_EDITOR_BLOCK: Record<PreviewDataBlock, EditorBlockId> = {
  header: 'negocio',
  banner: 'branding',
  colors: 'branding',
  hero: 'hero',
  service: 'service',
  products: 'products',
  'product-card': 'products',
  about: 'about',
  address: 'negocio',
}

const DATA_BLOCK_TO_SIDEBAR_GROUP: Record<PreviewDataBlock, EditorSidebarGroupId> = {
  header: 'negocio',
  banner: 'branding',
  colors: 'branding',
  hero: 'template-content',
  service: 'template-content',
  products: 'products',
  'product-card': 'products',
  about: 'template-content',
  address: 'negocio',
}

const DATA_BLOCK_DEFAULT_FIELD: Partial<Record<PreviewDataBlock, EditorFieldId>> = {
  header: 'nome',
  banner: 'banner_url',
  colors: 'cor_primaria',
  hero: 'heroTitle',
  service: 'deliveryLabel',
  products: 'sectionTitle',
  about: 'aboutTitle',
  address: 'endereco_texto',
}

const EDITOR_BLOCK_TO_SIDEBAR_GROUP: Record<EditorBlockId, EditorSidebarGroupId> = {
  structure: 'structure',
  negocio: 'negocio',
  branding: 'branding',
  hero: 'template-content',
  service: 'template-content',
  products: 'products',
  about: 'template-content',
}

function formatInlineProductPrice(value: number): string {
  return Number(value).toFixed(2).replace('.', ',')
}

function parseInlineProductPrice(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  const parsed = Number.parseFloat(normalized)

  return Number.isFinite(parsed) ? parsed : null
}

function createInlineProductDraft(product: CardapioProduct): InlineProductDraft {
  return {
    nome: product.nome,
    descricao: product.descricao || '',
    preco: formatInlineProductPrice(product.preco),
  }
}

const INLINE_TEXT_FIELD_SET = new Set<InlineTextField>(INLINE_TEXT_FIELDS)

function isInlineTextField(field: EditorFieldId | undefined): field is InlineTextField {
  return field ? INLINE_TEXT_FIELD_SET.has(field as InlineTextField) : false
}

function getInlineTextValue(form: FormState, field: InlineTextField): string {
  return form[field]
}

function createEmptyForm(): FormState {
  const seed = buildRestaurantCustomizationSeed('restaurante')

  return {
    nome: '',
    telefone: '',
    slogan: '',
    logo_url: '',
    banner_url: '',
    cor_primaria: '#f97316',
    cor_secundaria: '#ea580c',
    template_slug: 'restaurante',
    google_maps_url: '',
    endereco_texto: '',
    badge: seed.badge || '',
    heroVisible: seed.sections?.hero ?? true,
    serviceVisible: seed.sections?.service ?? true,
    categoriesVisible: seed.sections?.categories ?? true,
    aboutVisible: seed.sections?.about ?? true,
    heroTitle: '',
    heroDescription: seed.heroDescription || '',
    sectionTitle: seed.sectionTitle || '',
    sectionDescription: seed.sectionDescription || '',
    aboutTitle: seed.aboutTitle || '',
    aboutDescription: seed.aboutDescription || '',
    emptyStateTitle: seed.emptyStateTitle || '',
    emptyStateDescription: seed.emptyStateDescription || '',
    primaryCtaLabel: seed.primaryCtaLabel || '',
    secondaryCtaLabel: seed.secondaryCtaLabel || '',
    deliveryLabel: seed.deliveryLabel || 'Entrega',
    pickupLabel: seed.pickupLabel || 'Retirada',
    dineInLabel: seed.dineInLabel || 'Consumir no local',
  }
}

export default function ConfiguracoesPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [products, setProducts] = useState<CardapioProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaveState, setAutoSaveState] = useState<
    'idle' | 'pending' | 'saving' | 'saved' | 'error'
  >('idle')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState<FormState>(createEmptyForm())
  const [selectedBlock, setSelectedBlock] = useState<EditorBlockId>('hero')
  const [selectedField, setSelectedField] = useState<EditorFieldId | null>(null)
  const [selectedSidebarGroup, setSelectedSidebarGroup] =
    useState<EditorSidebarGroupId>('template-content')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [activeInlineTextField, setActiveInlineTextField] = useState<InlineTextField | null>(null)
  const [activeInlineImageField, setActiveInlineImageField] = useState<InlineImageField | null>(
    null
  )
  const [productDrafts, setProductDrafts] = useState<Record<string, InlineProductDraft>>({})
  const [inlineTextDrafts, setInlineTextDrafts] = useState<
    Partial<Record<InlineTextField, string>>
  >({})
  const [inlineImageDrafts, setInlineImageDrafts] = useState<
    Partial<Record<InlineImageField, string>>
  >({})
  const [productSaveState, setProductSaveState] = useState<Record<string, InlineProductSaveStatus>>(
    {}
  )
  const supabase = useMemo(() => createClient(), [])
  const hydratedRef = useRef(false)
  const lastSavedPayloadRef = useRef('')

  const buildCustomization = useCallback(
    (currentForm: FormState): RestaurantCustomization => ({
      sections: {
        hero: currentForm.heroVisible,
        service: currentForm.serviceVisible,
        categories: currentForm.categoriesVisible,
        about: currentForm.aboutVisible,
      },
      badge: currentForm.badge,
      heroTitle: currentForm.heroTitle,
      heroDescription: currentForm.heroDescription,
      sectionTitle: currentForm.sectionTitle,
      sectionDescription: currentForm.sectionDescription,
      aboutTitle: currentForm.aboutTitle,
      aboutDescription: currentForm.aboutDescription,
      emptyStateTitle: currentForm.emptyStateTitle,
      emptyStateDescription: currentForm.emptyStateDescription,
      primaryCtaLabel: currentForm.primaryCtaLabel,
      secondaryCtaLabel: currentForm.secondaryCtaLabel,
      deliveryLabel: currentForm.deliveryLabel,
      pickupLabel: currentForm.pickupLabel,
      dineInLabel: currentForm.dineInLabel,
    }),
    []
  )

  const buildRestaurantPayload = useCallback(
    (currentForm: FormState) => ({
      nome: currentForm.nome,
      telefone: currentForm.telefone.replace(/\D/g, ''),
      slogan: currentForm.slogan || null,
      logo_url: currentForm.logo_url || null,
      banner_url: currentForm.banner_url || null,
      cor_primaria: currentForm.cor_primaria,
      cor_secundaria: currentForm.cor_secundaria,
      template_slug: currentForm.template_slug,
      google_maps_url: currentForm.google_maps_url || null,
      endereco_texto: currentForm.endereco_texto || null,
      customizacao: buildCustomization(currentForm),
    }),
    [buildCustomization]
  )

  const loadRestaurant = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (data) {
      const presentation = getRestaurantPresentation({
        nome: data.nome,
        template_slug: data.template_slug,
        customizacao: data.customizacao,
      })

      const nextForm = {
        nome: data.nome || '',
        telefone: data.telefone || '',
        slogan: data.slogan || '',
        logo_url: data.logo_url || '',
        banner_url: data.banner_url || '',
        cor_primaria: data.cor_primaria || '#f97316',
        cor_secundaria: data.cor_secundaria || '#ea580c',
        template_slug: normalizeTemplateSlug(data.template_slug),
        google_maps_url: data.google_maps_url || '',
        endereco_texto: data.endereco_texto || '',
        badge: presentation.badge,
        heroVisible: presentation.sectionVisibility.hero,
        serviceVisible: presentation.sectionVisibility.service,
        categoriesVisible: presentation.sectionVisibility.categories,
        aboutVisible: presentation.sectionVisibility.about,
        heroTitle: presentation.heroTitle,
        heroDescription: presentation.heroDescription,
        sectionTitle: presentation.sectionTitle,
        sectionDescription: presentation.sectionDescription,
        aboutTitle: presentation.aboutTitle,
        aboutDescription: presentation.aboutDescription,
        emptyStateTitle: presentation.emptyStateTitle,
        emptyStateDescription: presentation.emptyStateDescription,
        primaryCtaLabel: presentation.primaryCtaLabel,
        secondaryCtaLabel: presentation.secondaryCtaLabel,
        deliveryLabel: presentation.deliveryLabel,
        pickupLabel: presentation.pickupLabel,
        dineInLabel: presentation.dineInLabel,
      } satisfies FormState

      setRestaurant(data as Restaurant)

      const { data: productRows } = await supabase
        .from('products')
        .select('id, restaurant_id, nome, descricao, preco, imagem_url, categoria, ativo, ordem')
        .eq('restaurant_id', data.id)
        .order('ordem')
        .order('nome')

      setProducts((productRows || []) as CardapioProduct[])
      setForm(nextForm)
      lastSavedPayloadRef.current = JSON.stringify(buildRestaurantPayload(nextForm))
      hydratedRef.current = true
      setAutoSaveState('idle')
    }

    setLoading(false)
  }, [buildRestaurantPayload, supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRestaurant()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadRestaurant])

  const cardapioUrl =
    restaurant && typeof window !== 'undefined'
      ? `${window.location.origin}/r/${restaurant.slug}`
      : ''

  const handleSelectContext = useCallback((block: EditorBlockId, field?: EditorFieldId) => {
    setSelectedBlock(block)
    setSelectedField(field ?? null)
    setSelectedSidebarGroup(EDITOR_BLOCK_TO_SIDEBAR_GROUP[block])
    setActiveInlineTextField(null)

    if (block !== 'products') {
      setSelectedProductId(null)
    }
  }, [])

  const handleSelectPreviewContext = useCallback(
    ({
      dataBlock,
      field,
      productId,
    }: {
      dataBlock: PreviewDataBlock
      field?: EditorFieldId
      productId?: string
    }) => {
      const block = DATA_BLOCK_TO_EDITOR_BLOCK[dataBlock]

      setSelectedBlock(block)
      setSelectedSidebarGroup(DATA_BLOCK_TO_SIDEBAR_GROUP[dataBlock])
      setSelectedField(field ?? DATA_BLOCK_DEFAULT_FIELD[dataBlock] ?? null)

      if (field && isInlineTextField(field)) {
        setActiveInlineTextField(field)
        setInlineTextDrafts((current) => ({
          ...current,
          [field]: current[field] ?? getInlineTextValue(form, field),
        }))
      } else {
        setActiveInlineTextField(null)
      }

      if (productId) {
        setSelectedProductId(productId)
        setActiveInlineTextField(null)

        if (!productId.startsWith('preview-')) {
          const product = products.find((item) => item.id === productId)

          if (product) {
            setProductDrafts((current) =>
              current[productId]
                ? current
                : { ...current, [productId]: createInlineProductDraft(product) }
            )
          }
        }

        return
      }

      if (block !== 'products') {
        setSelectedProductId(null)
      }
    },
    [form, products]
  )

  useEffect(() => {
    if (!selectedField) return

    const fieldContainer = document.querySelector(
      `[data-editor-field="${selectedField}"]`
    ) as HTMLElement | null

    if (!fieldContainer) return

    fieldContainer.scrollIntoView({ behavior: 'smooth', block: 'center' })

    if (activeInlineTextField && activeInlineTextField === selectedField) {
      return
    }

    const focusable = fieldContainer.querySelector(
      'input, textarea, select, button'
    ) as HTMLElement | null

    focusable?.focus({ preventScroll: true })
  }, [activeInlineTextField, selectedField])

  useEffect(() => {
    if (selectedField) return

    const groupContainer = document.querySelector(
      `[data-editor-group="${selectedSidebarGroup}"]`
    ) as HTMLElement | null

    if (!groupContainer) return

    groupContainer.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [selectedField, selectedSidebarGroup])

  const previewRestaurant = useMemo<CardapioRestaurant | null>(() => {
    if (!restaurant) return null

    const restaurantRecord = restaurant as Restaurant & { user_id?: string; ativo?: boolean }

    return {
      id: restaurant.id,
      user_id: restaurantRecord.user_id || '',
      nome: form.nome || restaurant.nome || 'Seu restaurante',
      slug: restaurant.slug,
      telefone: form.telefone || null,
      logo_url: form.logo_url || null,
      banner_url: form.banner_url || null,
      slogan: form.slogan || null,
      cor_primaria: form.cor_primaria,
      cor_secundaria: form.cor_secundaria,
      template_slug: form.template_slug,
      google_maps_url: form.google_maps_url || null,
      endereco_texto: form.endereco_texto || null,
      customizacao: buildCustomization(form) as Record<string, unknown>,
      ativo: restaurantRecord.ativo ?? true,
    }
  }, [buildCustomization, form, restaurant])

  const handleInlineProductChange = useCallback(
    (productId: string, field: keyof InlineProductDraft, value: string) => {
      const product = products.find((item) => item.id === productId)

      if (!product) return

      setProductDrafts((current) => ({
        ...current,
        [productId]: {
          ...(current[productId] || createInlineProductDraft(product)),
          [field]: value,
        },
      }))
      setProductSaveState((current) => ({ ...current, [productId]: 'idle' }))
    },
    [products]
  )

  const updateInlineField = useCallback(
    (field: InlineTextField, value: string, target: 'draft' | 'form' = 'draft') => {
      if (target === 'form') {
        setForm((current) => ({
          ...current,
          [field]: value,
        }))
        return
      }

      setInlineTextDrafts((current) => ({ ...current, [field]: value }))
    },
    []
  )

  const handleInlineTextChange = useCallback(
    (field: InlineTextField, value: string) => {
      updateInlineField(field, value)
    },
    [updateInlineField]
  )

  const handleInlineTextCancel = useCallback(
    (field: InlineTextField) => {
      setInlineTextDrafts((current) => ({
        ...current,
        [field]: getInlineTextValue(form, field),
      }))
      setActiveInlineTextField(null)
    },
    [form]
  )

  const handleInlineTextSave = useCallback(
    (field: InlineTextField) => {
      const nextValue = (inlineTextDrafts[field] ?? getInlineTextValue(form, field)).trim()

      updateInlineField(field, nextValue, 'form')
      updateInlineField(field, nextValue)
      setActiveInlineTextField(null)
    },
    [form, inlineTextDrafts, updateInlineField]
  )

  // Image inline editing handlers
  const handleInlineImageChange = useCallback((field: InlineImageField, value: string) => {
    setInlineImageDrafts((current) => ({ ...current, [field]: value }))
  }, [])

  const handleInlineImageCancel = useCallback(
    (field: InlineImageField) => {
      const originalValue = field === 'logo_url' ? form.logo_url : form.banner_url
      setInlineImageDrafts((current) => ({ ...current, [field]: originalValue }))
      setActiveInlineImageField(null)
    },
    [form.logo_url, form.banner_url]
  )

  const handleInlineImageSave = useCallback(
    (field: InlineImageField) => {
      const draftValue = inlineImageDrafts[field]
      const currentValue = field === 'logo_url' ? form.logo_url : form.banner_url
      const nextValue = (draftValue ?? currentValue).trim()

      setForm((current) => ({ ...current, [field]: nextValue }))
      setInlineImageDrafts((current) => ({ ...current, [field]: nextValue }))
      setActiveInlineImageField(null)
    },
    [form.logo_url, form.banner_url, inlineImageDrafts]
  )

  const handleInlineProductCancel = useCallback(
    (productId: string) => {
      if (productId.startsWith('preview-')) {
        setSelectedProductId(null)
        return
      }

      const product = products.find((item) => item.id === productId)

      setProductDrafts((current) => {
        if (!product) return current

        return {
          ...current,
          [productId]: createInlineProductDraft(product),
        }
      })
      setProductSaveState((current) => ({ ...current, [productId]: 'idle' }))
      setSelectedProductId(null)
    },
    [products]
  )

  const handleInlineProductSave = useCallback(
    async (productId: string) => {
      if (productId.startsWith('preview-')) return

      const draft = productDrafts[productId]
      const parsedPrice = parseInlineProductPrice(draft?.preco || '')

      if (!draft || !draft.nome.trim() || parsedPrice === null) {
        setProductSaveState((current) => ({ ...current, [productId]: 'error' }))
        return
      }

      setProductSaveState((current) => ({ ...current, [productId]: 'saving' }))

      const payload = {
        nome: draft.nome.trim(),
        descricao: draft.descricao.trim() || null,
        preco: parsedPrice,
      }

      const { error } = await supabase.from('products').update(payload).eq('id', productId)

      if (error) {
        console.error('Erro ao salvar produto inline:', error)
        setProductSaveState((current) => ({ ...current, [productId]: 'error' }))
        return
      }

      setProducts((current) =>
        current.map((product) =>
          product.id === productId
            ? { ...product, ...payload, descricao: payload.descricao }
            : product
        )
      )
      setProductDrafts((current) => ({
        ...current,
        [productId]: {
          nome: payload.nome,
          descricao: payload.descricao || '',
          preco: formatInlineProductPrice(payload.preco),
        },
      }))
      setProductSaveState((current) => ({ ...current, [productId]: 'saved' }))
    },
    [productDrafts, supabase]
  )

  const editorBlocks: Array<{ id: EditorBlockId; title: string; description: string }> = [
    {
      id: 'negocio',
      title: 'Base do negócio',
      description: 'Nome, WhatsApp, nicho, slogan e localização.',
    },
    {
      id: 'branding',
      title: 'Visual e mídia',
      description: 'Logo, banner e cores da identidade visual.',
    },
    {
      id: 'hero',
      title: 'Hero principal',
      description: 'Badge, título e descrição da abertura.',
    },
    {
      id: 'service',
      title: 'Modos de atendimento',
      description: 'Entrega, retirada e consumo no local.',
    },
    {
      id: 'products',
      title: 'Produtos e categorias',
      description: 'Organização do cardápio e itens visíveis.',
    },
    {
      id: 'about',
      title: 'Bloco institucional',
      description: 'Texto de apoio, mapa e posicionamento.',
    },
    {
      id: 'structure',
      title: 'Visibilidade',
      description: 'Ligar ou desligar blocos do template.',
    },
  ]

  const applyTemplatePreset = (templateSlug: RestaurantTemplateSlug) => {
    const seed = buildRestaurantCustomizationSeed(templateSlug, form.nome || 'Seu restaurante')

    setForm((current) => ({
      ...current,
      template_slug: templateSlug,
      badge: seed.badge || current.badge,
      heroTitle: seed.heroTitle || current.heroTitle,
      heroDescription: seed.heroDescription || current.heroDescription,
      sectionTitle: seed.sectionTitle || current.sectionTitle,
      sectionDescription: seed.sectionDescription || current.sectionDescription,
      aboutTitle: seed.aboutTitle || current.aboutTitle,
      aboutDescription: seed.aboutDescription || current.aboutDescription,
      emptyStateTitle: seed.emptyStateTitle || current.emptyStateTitle,
      emptyStateDescription: seed.emptyStateDescription || current.emptyStateDescription,
      primaryCtaLabel: seed.primaryCtaLabel || '',
      secondaryCtaLabel: seed.secondaryCtaLabel || '',
      deliveryLabel: seed.deliveryLabel || current.deliveryLabel,
      pickupLabel: seed.pickupLabel || current.pickupLabel,
      dineInLabel: seed.dineInLabel || current.dineInLabel,
    }))
  }

  const persistRestaurant = useCallback(
    async (currentForm: FormState, options?: { silent?: boolean }) => {
      if (!restaurant) return false

      const payload = buildRestaurantPayload(currentForm)
      const payloadKey = JSON.stringify(payload)

      if (payloadKey === lastSavedPayloadRef.current) {
        return true
      }

      if (options?.silent) {
        setAutoSaveState('saving')
      } else {
        setSaving(true)
      }

      const { error } = await supabase.from('restaurants').update(payload).eq('id', restaurant.id)

      if (error) {
        console.error('Erro ao salvar configurações:', error)
        if (options?.silent) {
          setAutoSaveState('error')
        }
        if (!options?.silent) {
          setSaving(false)
        }
        return false
      }

      lastSavedPayloadRef.current = payloadKey
      setRestaurant((current) =>
        current ? ({ ...current, ...payload } as unknown as Restaurant) : current
      )

      if (options?.silent) {
        setAutoSaveState('saved')
      } else {
        setSaving(false)
        setAutoSaveState('saved')
      }

      return true
    },
    [buildRestaurantPayload, restaurant, supabase]
  )

  const handleSave = async () => {
    if (!restaurant) return

    await persistRestaurant(form)
  }

  useEffect(() => {
    if (!restaurant || loading || !hydratedRef.current) {
      return
    }

    const payloadKey = JSON.stringify(buildRestaurantPayload(form))
    if (payloadKey === lastSavedPayloadRef.current) {
      return
    }

    const pendingTimer = setTimeout(() => {
      setAutoSaveState('pending')
    }, 0)

    const timer = setTimeout(() => {
      void persistRestaurant(form, { silent: true })
    }, 1200)

    return () => {
      clearTimeout(pendingTimer)
      clearTimeout(timer)
    }
  }, [buildRestaurantPayload, form, loading, persistRestaurant, restaurant])

  const copyLink = () => {
    if (!cardapioUrl) return

    navigator.clipboard.writeText(cardapioUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="border-border bg-background flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/painel"
            className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
            title="Voltar ao painel"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Store className="text-primary h-5 w-5 shrink-0" />
          <div>
            <h1 className="text-foreground text-base font-semibold">Editor do Cardápio</h1>
            <p className="text-muted-foreground text-xs">
              {autoSaveState === 'saving' && 'Salvando...'}
              {autoSaveState === 'saved' && '✓ Alterações salvas'}
              {autoSaveState === 'pending' && 'Aguardando salvar...'}
              {autoSaveState === 'error' && '⚠ Erro ao salvar'}
              {autoSaveState === 'idle' && 'Clique nos textos do preview para editar'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {saving ? 'Publicando...' : 'Publicar'}
          </button>
          <a
            href={cardapioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
            title="Abrir cardápio em nova aba"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      </header>

      {/* ── Main split ──────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: property panel */}
        <aside className="border-border flex w-95 shrink-0 flex-col overflow-hidden border-r">
          {/* Block nav tabs */}
          <nav className="border-border shrink-0 border-b p-3">
            <div className="flex flex-wrap gap-1.5">
              {editorBlocks.map((block) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => handleSelectContext(block.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedBlock === block.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {block.title}
                </button>
              ))}
            </div>
          </nav>

          {/* Scrollable form area */}
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <section
              data-editor-group="structure"
              className={`border-border bg-card space-y-4 rounded-xl border p-4 ${
                selectedBlock === 'structure' ? 'ring-primary ring-2 ring-inset' : ''
              }`}
            >
              <div>
                <h2 className="text-foreground text-sm font-semibold">Estrutura do template</h2>
                <p className="text-muted-foreground text-xs">
                  Ative ou desative blocos inteiros sem mexer no layout base.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <ToggleCard
                  label="Hero principal"
                  description="Banner, badge, título e CTAs da abertura."
                  checked={form.heroVisible}
                  editorField="heroVisible"
                  isSelected={selectedField === 'heroVisible'}
                  onChange={(checked: boolean) => setForm({ ...form, heroVisible: checked })}
                />
                <ToggleCard
                  label="Modos de atendimento"
                  description="Entrega, retirada e consumo no local."
                  checked={form.serviceVisible}
                  editorField="serviceVisible"
                  isSelected={selectedField === 'serviceVisible'}
                  onChange={(checked: boolean) => setForm({ ...form, serviceVisible: checked })}
                />
                <ToggleCard
                  label="Categorias e produtos"
                  description="Navegação por categorias e grade de itens."
                  checked={form.categoriesVisible}
                  editorField="categoriesVisible"
                  isSelected={selectedField === 'categoriesVisible'}
                  onChange={(checked: boolean) => setForm({ ...form, categoriesVisible: checked })}
                />
                <ToggleCard
                  label="Bloco institucional"
                  description="Texto de apoio, mapa e WhatsApp no rodapé."
                  checked={form.aboutVisible}
                  editorField="aboutVisible"
                  isSelected={selectedField === 'aboutVisible'}
                  onChange={(checked: boolean) => setForm({ ...form, aboutVisible: checked })}
                />
              </div>
            </section>

            <section
              data-editor-group="negocio"
              className={`border-border bg-card space-y-4 rounded-xl border p-4 ${
                selectedBlock === 'negocio' ? 'ring-primary ring-2 ring-inset' : ''
              }`}
            >
              <div>
                <h2 className="text-foreground text-sm font-semibold">Base do negócio</h2>
                <p className="text-muted-foreground text-xs">
                  Dados que aparecem no cardápio público.
                </p>
              </div>

              <TextInput
                id="nome-restaurante"
                label="Nome do estabelecimento"
                value={form.nome}
                editorField="nome"
                isSelected={selectedField === 'nome'}
                onChange={(value) => setForm({ ...form, nome: value })}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  id="telefone-whatsapp"
                  label="WhatsApp principal"
                  value={form.telefone}
                  editorField="telefone"
                  isSelected={selectedField === 'telefone'}
                  onChange={(value) => setForm({ ...form, telefone: value })}
                />
                <div
                  data-editor-field="template"
                  className={
                    selectedField === 'template' ? 'ring-primary rounded-xl ring-2 ring-inset' : ''
                  }
                >
                  <label
                    htmlFor="template-slug"
                    className="text-foreground mb-1 block text-sm font-medium"
                  >
                    Nicho do template
                  </label>
                  <select
                    id="template-slug"
                    value={form.template_slug}
                    onChange={(e) => applyTemplatePreset(e.target.value as RestaurantTemplateSlug)}
                    className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
                  >
                    {Object.values(TEMPLATE_PRESETS).map((preset) => (
                      <option key={preset.slug} value={preset.slug}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <TextInput
                id="slogan-restaurante"
                label="Slogan curto"
                value={form.slogan}
                editorField="slogan"
                isSelected={selectedField === 'slogan'}
                onChange={(value) => setForm({ ...form, slogan: value })}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  id="maps-url"
                  label="Link do Google Maps"
                  value={form.google_maps_url}
                  editorField="google_maps_url"
                  isSelected={selectedField === 'google_maps_url'}
                  onChange={(value) => setForm({ ...form, google_maps_url: value })}
                />
                <TextInput
                  id="endereco-texto"
                  label="Endereço para exibição"
                  value={form.endereco_texto}
                  editorField="endereco_texto"
                  isSelected={selectedField === 'endereco_texto'}
                  onChange={(value) => setForm({ ...form, endereco_texto: value })}
                />
              </div>
            </section>

            <section
              data-editor-group="branding"
              className={`border-border bg-card space-y-4 rounded-xl border p-4 ${
                selectedBlock === 'branding' ? 'ring-primary ring-2 ring-inset' : ''
              }`}
            >
              <div>
                <h2 className="text-foreground text-sm font-semibold">Visual e mídia</h2>
                <p className="text-muted-foreground text-xs">
                  Logo, banner e cores da identidade visual.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ImageUploader
                  label="Logo"
                  value={form.logo_url}
                  folder="logos"
                  aspect="1:1"
                  editorField="logo_url"
                  isSelected={selectedField === 'logo_url'}
                  onChange={(value) => setForm({ ...form, logo_url: value })}
                />
                <ImageUploader
                  label="Banner"
                  value={form.banner_url}
                  folder="banners"
                  aspect="3:1"
                  editorField="banner_url"
                  isSelected={selectedField === 'banner_url'}
                  onChange={(value) => setForm({ ...form, banner_url: value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <ColorInput
                  id="cor-primaria"
                  label="Cor primária"
                  value={form.cor_primaria}
                  editorField="cor_primaria"
                  isSelected={selectedField === 'cor_primaria'}
                  onChange={(value) => setForm({ ...form, cor_primaria: value })}
                />
                <ColorInput
                  id="cor-secundaria"
                  label="Cor secundária"
                  value={form.cor_secundaria}
                  editorField="cor_secundaria"
                  isSelected={selectedField === 'cor_secundaria'}
                  onChange={(value) => setForm({ ...form, cor_secundaria: value })}
                />
              </div>
            </section>

            <section
              data-editor-group="template-content"
              className={`border-border bg-card space-y-4 rounded-xl border p-4 ${
                ['hero', 'service', 'about'].includes(selectedBlock)
                  ? 'ring-primary ring-2 ring-inset'
                  : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <WandSparkles className="text-primary h-4 w-4" />
                <h2 className="text-foreground text-sm font-semibold">Textos do template</h2>
              </div>

              <TextInput
                id="badge"
                label="Badge superior"
                value={form.badge}
                editorField="badge"
                isSelected={selectedField === 'badge'}
                onChange={(value) => setForm({ ...form, badge: value })}
              />

              {(selectedBlock === 'hero' ||
                selectedBlock === 'negocio' ||
                selectedBlock === 'branding') && (
                <>
                  <TextInput
                    id="hero-title"
                    label="Título principal"
                    value={form.heroTitle}
                    editorField="heroTitle"
                    isSelected={selectedField === 'heroTitle'}
                    onChange={(value) => setForm({ ...form, heroTitle: value })}
                  />
                  <TextAreaInput
                    id="hero-description"
                    label="Descrição principal"
                    value={form.heroDescription}
                    rows={3}
                    editorField="heroDescription"
                    isSelected={selectedField === 'heroDescription'}
                    onChange={(value) => setForm({ ...form, heroDescription: value })}
                  />
                </>
              )}

              {(selectedBlock === 'products' || selectedBlock === 'hero') && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    id="section-title"
                    label="Título da seção de categorias"
                    value={form.sectionTitle}
                    editorField="sectionTitle"
                    isSelected={selectedField === 'sectionTitle'}
                    onChange={(value) => setForm({ ...form, sectionTitle: value })}
                  />
                  <TextAreaInput
                    id="section-description"
                    label="Descrição da seção"
                    value={form.sectionDescription}
                    rows={3}
                    editorField="sectionDescription"
                    isSelected={selectedField === 'sectionDescription'}
                    onChange={(value) => setForm({ ...form, sectionDescription: value })}
                  />
                </div>
              )}

              {selectedBlock === 'about' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    id="about-title"
                    label="Título do bloco institucional"
                    value={form.aboutTitle}
                    editorField="aboutTitle"
                    isSelected={selectedField === 'aboutTitle'}
                    onChange={(value) => setForm({ ...form, aboutTitle: value })}
                  />
                  <TextAreaInput
                    id="about-description"
                    label="Descrição do bloco"
                    value={form.aboutDescription}
                    rows={3}
                    editorField="aboutDescription"
                    isSelected={selectedField === 'aboutDescription'}
                    onChange={(value) => setForm({ ...form, aboutDescription: value })}
                  />
                </div>
              )}

              {selectedBlock === 'products' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextInput
                    id="empty-title"
                    label="Título de cardápio vazio"
                    value={form.emptyStateTitle}
                    onChange={(value) => setForm({ ...form, emptyStateTitle: value })}
                  />
                  <TextAreaInput
                    id="empty-description"
                    label="Descrição de cardápio vazio"
                    value={form.emptyStateDescription}
                    rows={3}
                    onChange={(value) => setForm({ ...form, emptyStateDescription: value })}
                  />
                </div>
              )}

              {selectedBlock === 'service' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextInput
                    id="delivery-label"
                    label="Rótulo de entrega"
                    value={form.deliveryLabel}
                    editorField="deliveryLabel"
                    isSelected={selectedField === 'deliveryLabel'}
                    onChange={(value) => setForm({ ...form, deliveryLabel: value })}
                  />
                  <TextInput
                    id="pickup-label"
                    label="Rótulo de retirada"
                    value={form.pickupLabel}
                    editorField="pickupLabel"
                    isSelected={selectedField === 'pickupLabel'}
                    onChange={(value) => setForm({ ...form, pickupLabel: value })}
                  />
                  <TextInput
                    id="dinein-label"
                    label="Rótulo de consumo local"
                    value={form.dineInLabel}
                    editorField="dineInLabel"
                    isSelected={selectedField === 'dineInLabel'}
                    onChange={(value) => setForm({ ...form, dineInLabel: value })}
                  />
                </div>
              )}
            </section>

            <section
              data-editor-group="products"
              className={`border-border bg-card rounded-xl border p-4 ${
                selectedBlock === 'products' ? 'ring-primary ring-2 ring-inset' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                    <Package className="h-4 w-4" />
                    Produtos e categorias
                  </h2>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Clique em um card do preview para editar preço, nome e descrição inline.
                  </p>
                </div>
                <a
                  href="/painel/produtos"
                  className="bg-secondary hover:bg-secondary/80 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium"
                >
                  Gerenciar
                </a>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="border-border rounded-xl border p-3">
                  <p className="text-muted-foreground text-[10px] tracking-[0.18em] uppercase">
                    Produtos ativos
                  </p>
                  <p className="text-foreground mt-1 text-xl font-semibold">
                    {products.filter((product) => product.ativo).length}
                  </p>
                </div>
                <div className="border-border rounded-xl border p-3">
                  <p className="text-muted-foreground text-[10px] tracking-[0.18em] uppercase">
                    Categorias
                  </p>
                  <p className="text-foreground mt-1 text-xl font-semibold">
                    {
                      new Set(
                        products
                          .filter((product) => product.ativo)
                          .map((product) => product.categoria)
                      ).size
                    }
                  </p>
                </div>
              </div>
            </section>

            {/* Link público */}
            <section className="border-border bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <h2 className="text-foreground text-sm font-semibold">Link público</h2>
                <span className="inline-flex items-center rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-400">
                  🔒 Permanente
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  id="cardapio-url"
                  type="text"
                  readOnly
                  value={cardapioUrl}
                  title="Link público do cardápio"
                  aria-label="Link público do cardápio"
                  className="border-border bg-background text-foreground flex-1 rounded-lg border px-3 py-2 text-xs"
                />
                <button
                  onClick={copyLink}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-2"
                  title="Copiar link"
                  aria-label="Copiar link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </section>
          </div>

          {/* Sticky save button at bottom of panel */}
          <div className="border-border shrink-0 border-t p-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar e publicar'}
            </button>
          </div>
        </aside>

        {/* Right: live preview */}
        <main className="bg-muted/20 flex flex-1 flex-col items-center overflow-y-auto">
          <div className="w-full max-w-2xl px-4 py-6">
            {previewRestaurant ? (
              <CardapioEditorPreview
                restaurant={previewRestaurant}
                products={products}
                selectedBlock={selectedBlock}
                selectedField={selectedField}
                selectedProductId={selectedProductId}
                activeInlineTextField={activeInlineTextField}
                activeInlineImageField={activeInlineImageField}
                productDrafts={productDrafts}
                inlineTextDrafts={inlineTextDrafts}
                inlineImageDrafts={inlineImageDrafts}
                productSaveState={productSaveState}
                onSelectContext={handleSelectPreviewContext}
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
            ) : null}
            <p className="text-muted-foreground mt-4 text-center text-xs">
              Clique em qualquer bloco do preview para editar direto no cardápio
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

function TextInput({
  id,
  label,
  value,
  editorField,
  isSelected = false,
  onChange,
}: {
  id: string
  label: string
  value: string
  editorField?: EditorFieldId
  isSelected?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div
      data-editor-field={editorField}
      className={isSelected ? 'ring-primary rounded-xl ring-2 ring-inset' : ''}
    >
      <label htmlFor={id} className="text-foreground mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
      />
    </div>
  )
}

function TextAreaInput({
  id,
  label,
  value,
  rows,
  editorField,
  isSelected = false,
  onChange,
}: {
  id: string
  label: string
  value: string
  rows: number
  editorField?: EditorFieldId
  isSelected?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div
      data-editor-field={editorField}
      className={isSelected ? 'ring-primary rounded-xl ring-2 ring-inset' : ''}
    >
      <label htmlFor={id} className="text-foreground mb-1 block text-sm font-medium">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
      />
    </div>
  )
}

function ColorInput({
  id,
  label,
  value,
  editorField,
  isSelected = false,
  onChange,
}: {
  id: string
  label: string
  value: string
  editorField?: EditorFieldId
  isSelected?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div
      data-editor-field={editorField}
      className={isSelected ? 'ring-primary rounded-xl ring-2 ring-inset' : ''}
    >
      <label htmlFor={id} className="text-foreground mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          title={label}
          aria-label={label}
          placeholder="#f97316"
          className="border-border bg-background text-foreground flex-1 rounded-lg border px-4 py-2"
        />
      </div>
    </div>
  )
}

function ToggleCard({
  label,
  description,
  checked,
  editorField,
  isSelected = false,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  editorField?: EditorFieldId
  isSelected?: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      data-editor-field={editorField}
      className={`rounded-xl border p-4 text-left transition-colors ${
        isSelected
          ? 'ring-primary ring-2 ring-inset'
          : checked
            ? 'border-primary bg-primary/5'
            : 'border-border hover:bg-secondary/40'
      }`}
      aria-label={`${label}: ${checked ? 'ativo' : 'oculto'}`}
      title={label}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-foreground text-sm font-semibold">{label}</p>
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        </div>
        <span
          className={`inline-flex min-w-16 justify-center rounded-full px-3 py-1 text-xs font-semibold ${
            checked ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
          }`}
        >
          {checked ? 'Ativo' : 'Oculto'}
        </span>
      </div>
    </button>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
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
  Pencil,
  Plus,
  Rocket,
  Store,
  Trash2,
} from 'lucide-react'
import {
  buildTemplatePreviewProducts,
  mergeTemplateProductsWithSaved,
  resolveCardapioProductsForPreview,
  type CardapioProduct,
  type CardapioRestaurant,
} from '@/lib/cardapio-renderer'
import { getRestaurantTemplateConfig } from '@/lib/templates-config'
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
  HERO_SLOGAN_PRESETS,
  normalizeTemplateSlug,
  type HeroSloganPresetId,
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
    heroSloganPreset: 'custom',
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
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<{ old: string; value: string } | null>(null)
  const lastSavedRef = useRef('')
  const lastPublishToastRef = useRef(0)
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

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

    const custPreset = (rest.customizacao as { heroSloganPreset?: HeroSloganPresetId } | null)
    setForm({
      nome: rest.nome || '',
      telefone: rest.telefone || '',
      endereco_texto: rest.endereco_texto || '',
      google_maps_url: rest.google_maps_url || '',
      logo_url: rest.logo_url || '',
      banner_url: rest.banner_url || '',
      slogan: rest.slogan || '',
      heroSloganPreset: custPreset?.heroSloganPreset || 'custom',
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
    const custCats = (rest.customizacao as { customCategories?: string[] } | null)?.customCategories
    const templateCats = [
      ...new Set(getRestaurantTemplateConfig(rest.template_slug).sampleProducts.map((p) => p.categoria)),
    ]
    setCustomCategories(custCats != null ? custCats : templateCats)
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
    customCategories: customCategories.length > 0 ? customCategories : undefined,
    heroSloganPreset: form.heroSloganPreset,
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
  }), [form, customCategories])

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
      const { error } = await supabase.from('restaurants').update(toSave).eq('id', restaurant.id)
      lastSavedRef.current = JSON.stringify(toSave)
      if (!error && Date.now() - lastPublishToastRef.current > 4000) {
        lastPublishToastRef.current = Date.now()
        toast({
          title: 'Publicado!',
          description: 'O cardápio online já está atualizado.',
        })
      }
    },
    [restaurant, form, customization, supabase, toast]
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
              categoria: p.categoria || 'Geral',
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
        const categoria = (draft.categoria?.trim() || templateProduct.categoria || 'Geral')
        const { data: inserted, error } = await supabase
          .from('products')
          .insert({
            restaurant_id: restaurant.id,
            nome: draft.nome,
            descricao: draft.descricao || null,
            preco,
            categoria,
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
        toast({
          title: 'Produto adicionado!',
          description: 'O cardápio online já está atualizado.',
        })
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
        const updatePayload: {
          nome: string
          descricao: string | null
          preco: number
          categoria?: string
          imagem_url?: string | null
        } = {
          nome: draft.nome,
          descricao: draft.descricao || null,
          preco,
        }
        if (draft.categoria !== undefined && draft.categoria.trim()) {
          updatePayload.categoria = draft.categoria.trim()
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
        toast({
          title: 'Produto atualizado!',
          description: 'O cardápio online já está atualizado.',
        })
        setProducts((prev) =>
          prev.map((p) =>
            p.id === productId
              ? {
                  ...p,
                  nome: draft.nome,
                  descricao: draft.descricao || null,
                  preco,
                  categoria: updatePayload.categoria ?? p.categoria,
                  imagem_url: updatePayload.imagem_url ?? p.imagem_url,
                }
              : p
          )
        )
        const existingProduct = products.find((p) => p.id === productId)
        setProductDrafts((prev) => ({
          ...prev,
          [productId]: {
            nome: draft.nome,
            descricao: draft.descricao || '',
            preco: draft.preco,
            categoria: draft.categoria ?? existingProduct?.categoria ?? 'Geral',
            imagem_url: draft.imagem_url,
          },
        }))
      }
      setProductSaveState((prev) => ({ ...prev, [productId]: 'saved' }))
    },
    [productDrafts, products, supabase, restaurant, mergedProducts, toast]
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
          categoria: p.categoria || 'Geral',
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

  const loadProducts = useCallback(async () => {
    if (!restaurant) return
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('ordem')
      .order('nome')
    setProducts((data || []) as CardapioProduct[])
  }, [restaurant, supabase])

  const handleAddCategory = useCallback(() => {
    const name = newCategoryName.trim()
    if (!name) return
    if (customCategories.includes(name)) {
      toast({ title: 'Categoria já existe', variant: 'destructive' })
      return
    }
    setCustomCategories((prev) => [...prev, name])
    setNewCategoryName('')
    toast({ title: 'Categoria adicionada', description: name })
  }, [newCategoryName, customCategories, toast])

  const handleEditCategory = useCallback(
    async (oldName: string, newName: string) => {
      const trimmed = newName.trim()
      if (!trimmed || trimmed === oldName) {
        setEditingCategory(null)
        return
      }
      if (!restaurant) return
      await supabase
        .from('products')
        .update({ categoria: trimmed })
        .eq('restaurant_id', restaurant.id)
        .eq('categoria', oldName)
      setCustomCategories((prev) => prev.map((c) => (c === oldName ? trimmed : c)))
      setEditingCategory(null)
      await loadProducts()
      toast({ title: 'Categoria renomeada', description: `${oldName} → ${trimmed}` })
    },
    [restaurant, supabase, loadProducts, toast]
  )

  const handleDeleteCategory = useCallback(
    async (name: string) => {
      if (!restaurant) return
      const count = products.filter((p) => p.categoria === name).length
      if (count > 0) {
        await supabase
          .from('products')
          .update({ categoria: 'Geral' })
          .eq('restaurant_id', restaurant.id)
          .eq('categoria', name)
      }
      setCustomCategories((prev) => prev.filter((c) => c !== name))
      await loadProducts()
      toast({ title: 'Categoria removida', description: count > 0 ? `${count} produto(s) movido(s) para Geral` : undefined })
    },
    [restaurant, products, supabase, loadProducts, toast]
  )

  const displayCategories = useMemo(() => {
    const fromProducts = [...new Set(products.map((p) => p.categoria).filter(Boolean))]
    return customCategories.length > 0
      ? [...customCategories, ...fromProducts.filter((c) => !customCategories.includes(c))]
      : [...fromProducts].sort()
  }, [customCategories, products])

  const cardapioUrl = restaurant ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${restaurant.slug}` : ''
  const copyAndPublish = () => {
    if (!cardapioUrl) return
    navigator.clipboard.writeText(cardapioUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    window.open(cardapioUrl, '_blank', 'noopener,noreferrer')
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
              <h3 className="mb-3 text-sm font-semibold text-foreground">Título e descrição da seção de produtos</h3>
              <p className="text-muted-foreground mb-3 text-xs">
                Textos que aparecem acima da lista de categorias no cardápio.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Título</label>
                  <input
                    type="text"
                    value={form.sectionTitle}
                    onChange={(e) => setForm((p) => ({ ...p, sectionTitle: e.target.value }))}
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Ex: Pizzas, bordas e bebidas"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Descrição</label>
                  <textarea
                    rows={2}
                    value={form.sectionDescription}
                    onChange={(e) => setForm((p) => ({ ...p, sectionDescription: e.target.value }))}
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="Ex: Encontre tudo em uma estrutura fácil de percorrer e monte seu pedido em poucos cliques."
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
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Frase do banner</label>
                  <p className="text-muted-foreground mb-2 text-xs">
                    Frase que aparece sob o nome. Escolha uma pronta ou personalize.
                  </p>
                  <select
                    value={form.heroSloganPreset}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        heroSloganPreset: e.target.value as HeroSloganPresetId,
                      }))
                    }
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    {HERO_SLOGAN_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                    <option value="custom">Personalizado</option>
                  </select>
                  {form.heroSloganPreset === 'custom' && (
                    <input
                      type="text"
                      value={form.heroDescription}
                      onChange={(e) => setForm((p) => ({ ...p, heroDescription: e.target.value }))}
                      className="border-border bg-background text-foreground mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      placeholder="Sua frase personalizada"
                    />
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

            <section>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Categorias</h3>
              <p className="text-muted-foreground mb-3 text-xs">
                Adicione, edite ou exclua categorias. Os produtos são organizados por categoria no cardápio.
              </p>
              <div className="space-y-2">
                {displayCategories.map((cat) => (
                  <div
                    key={cat}
                    className="border-border bg-background flex items-center gap-2 rounded-lg border px-3 py-2"
                  >
                    {editingCategory?.old === cat ? (
                      <>
                        <input
                          type="text"
                          value={editingCategory.value}
                          onChange={(e) => setEditingCategory((p) => p ? { ...p, value: e.target.value } : null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditCategory(cat, editingCategory.value)
                            if (e.key === 'Escape') setEditingCategory(null)
                          }}
                          className="border-border text-foreground min-w-0 flex-1 rounded border px-2 py-1 text-sm"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleEditCategory(cat, editingCategory.value)}
                          className="text-primary shrink-0 p-1"
                          title="Salvar"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCategory(null)}
                          className="text-muted-foreground shrink-0 p-1"
                          title="Cancelar"
                        >
                          <span className="text-xs">✕</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-foreground min-w-0 flex-1 truncate text-sm">{cat}</span>
                        <button
                          type="button"
                          onClick={() => setEditingCategory({ old: cat, value: cat })}
                          className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="text-muted-foreground hover:text-destructive shrink-0 rounded p-1"
                          title="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    placeholder="Nova categoria"
                    className="border-border bg-background text-foreground min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="bg-primary text-primary-foreground shrink-0 rounded-lg px-3 py-2"
                    title="Adicionar"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
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

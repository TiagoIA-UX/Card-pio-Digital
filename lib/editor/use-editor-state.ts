'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { createClient, type Restaurant } from '@/lib/supabase/client'
import {
  buildTemplatePreviewProducts,
  mergeTemplateProductsWithSaved,
  resolveCardapioProductsForPreview,
  type CardapioProduct,
} from '@/lib/cardapio-renderer'
import { getRestaurantTemplateConfig } from '@/lib/templates-config'
import type {
  EditorFieldId,
  InlineImageField,
  InlineProductDraft,
  InlineProductSaveStatus,
  InlineTextField,
  PreviewDataBlock,
} from '@/components/template-editor/cardapio-editor-preview'
import { getRestaurantPresentation, type HeroSloganPresetId } from '@/lib/restaurant-customization'
import { validateImageUrl } from '@/lib/image-validation'
import { getActiveRestaurantForUser } from '@/lib/active-restaurant'
import {
  DATA_BLOCK_TO_EDITOR,
  INITIAL_FORM,
  type EditorBlockIdShort,
  type FormState,
} from './types'
import {
  buildCustomizationFromDraft,
  buildDisplayCategories,
  buildPreviewRestaurant,
} from './draft-adapter'

export function useEditorState() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [products, setProducts] = useState<CardapioProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM })
  const [panelHidden, setPanelHidden] = useState(true)
  const [savedTemplateProductIds, setSavedTemplateProductIds] = useState<Record<string, string>>({})
  const [selectedBlock, setSelectedBlock] = useState<EditorBlockIdShort>('hero')
  const [selectedField, setSelectedField] = useState<EditorFieldId | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [productDrafts, setProductDrafts] = useState<Record<string, InlineProductDraft>>({})
  const [productSaveState, setProductSaveState] = useState<Record<string, InlineProductSaveStatus>>(
    {}
  )
  const [inlineTextDrafts, setInlineTextDrafts] = useState<
    Partial<Record<InlineTextField, string>>
  >({})
  const [inlineImageDrafts, setInlineImageDrafts] = useState<
    Partial<Record<InlineImageField, string>>
  >({})
  const [activeInlineTextField, setActiveInlineTextField] = useState<InlineTextField | null>(null)
  const [activeInlineImageField, setActiveInlineImageField] = useState<InlineImageField | null>(
    null
  )
  const [logoError, setLogoError] = useState<string | null>(null)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<{ old: string; value: string } | null>(
    null
  )
  const lastSavedRef = useRef('')
  const lastPublishToastRef = useRef(0)
  const supabase = useMemo(() => createClient(), [])
  const { toast } = useToast()

  // ── Data loading ─────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const rest = await getActiveRestaurantForUser<Restaurant>(supabase, session.user.id)
    if (!rest) return

    setRestaurant(rest as Restaurant)
    const pres = getRestaurantPresentation({
      nome: rest.nome,
      template_slug: rest.template_slug,
      customizacao: rest.customizacao,
    })

    const custPreset = rest.customizacao as { heroSloganPreset?: HeroSloganPresetId } | null
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
      primaryCtaLabel: pres.primaryCtaLabel || '',
      secondaryCtaLabel: pres.secondaryCtaLabel || '',
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
      ...new Set(
        getRestaurantTemplateConfig(rest.template_slug).sampleProducts.map((p) => p.categoria)
      ),
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

  // ── Computed ──────────────────────────────────────────────────────────

  const customization = useMemo(
    () => buildCustomizationFromDraft(form, customCategories),
    [form, customCategories]
  )

  const previewRestaurant = useMemo(
    () => buildPreviewRestaurant(restaurant, form, customization),
    [restaurant, form, customization]
  )

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

  // Map template products to saved products by category+position
  useEffect(() => {
    if (!previewRestaurant || products.length === 0) return
    const templateProducts = buildTemplatePreviewProducts(
      previewRestaurant.template_slug,
      previewRestaurant.id
    )
    const saved = [...products].sort(
      (a, b) =>
        (a.ordem ?? 0) - (b.ordem ?? 0) || (a.categoria || '').localeCompare(b.categoria || '')
    )
    const mapping: Record<string, string> = {}
    const templateByCat: Record<string, typeof templateProducts> = {}
    const savedByCat: Record<string, typeof saved> = {}
    for (const tp of templateProducts) {
      const cat = tp.categoria || 'Geral'
      ;(templateByCat[cat] ??= []).push(tp)
    }
    for (const sp of saved) {
      const cat = sp.categoria || 'Geral'
      ;(savedByCat[cat] ??= []).push(sp)
    }
    for (const cat of Object.keys(templateByCat)) {
      const tps = templateByCat[cat]
      const sps = savedByCat[cat] || []
      const n = Math.min(tps.length, sps.length)
      for (let i = 0; i < n; i++) {
        mapping[tps[i].id] = sps[i].id
      }
    }
    queueMicrotask(() =>
      setSavedTemplateProductIds((prev) => (Object.keys(prev).length === 0 ? mapping : prev))
    )
  }, [previewRestaurant, products])

  const displayCategories = useMemo(
    () =>
      buildDisplayCategories(
        customCategories,
        products.map((p) => p.categoria)
      ),
    [customCategories, products]
  )

  const cardapioUrl = restaurant
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${restaurant.slug}`
    : ''

  // ── Persist ───────────────────────────────────────────────────────────

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
          description: 'O canal digital já está atualizado.',
        })
      }
    },
    [restaurant, form, customization, supabase, toast]
  )

  // Auto-save debounce
  useEffect(() => {
    if (!restaurant || loading) return
    const key = JSON.stringify({ ...form, customizacao: customization })
    if (key === lastSavedRef.current) return
    const t = setTimeout(() => {
      persistRestaurant(form)
    }, 1500)
    return () => clearTimeout(t)
  }, [form, customization, restaurant, loading, persistRestaurant])

  // ── Selection / context handlers ──────────────────────────────────────

  const handleSelectContext = useCallback(
    ({
      dataBlock,
      field,
      productId,
    }: {
      dataBlock: PreviewDataBlock
      field?: EditorFieldId
      productId?: string
    }) => {
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
        const p =
          products.find((x) => x.id === productId) ?? mergedProducts.find((x) => x.id === productId)
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

  // ── Inline product handlers ───────────────────────────────────────────

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
        const categoria = draft.categoria?.trim() || templateProduct.categoria || 'Geral'
        const { data: inserted, error } = await supabase
          .from('products')
          .insert({
            restaurant_id: restaurant.id,
            nome: draft.nome,
            descricao: draft.descricao || null,
            preco,
            categoria,
            imagem_url: draft.imagem_url?.trim() || templateProduct.imagem_url || null,
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
          description: 'O canal digital já está atualizado.',
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
        const { error } = await supabase.from('products').update(updatePayload).eq('id', productId)

        if (error) {
          setProductSaveState((prev) => ({ ...prev, [productId]: 'error' }))
          return
        }
        toast({
          title: 'Produto atualizado!',
          description: 'O canal digital já está atualizado.',
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

  const handleInlineProductCancel = useCallback(
    (productId: string) => {
      const p =
        products.find((x) => x.id === productId) ?? mergedProducts.find((x) => x.id === productId)
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
    },
    [products, mergedProducts]
  )

  // ── Inline text handlers ──────────────────────────────────────────────

  const handleInlineTextChange = useCallback((field: InlineTextField, value: string) => {
    setInlineTextDrafts((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleInlineTextSave = useCallback(
    (field: InlineTextField) => {
      const v = (inlineTextDrafts[field] ?? form[field as keyof FormState])?.toString().trim()
      if (v !== undefined) {
        setForm((prev) => ({ ...prev, [field]: v }))
        setInlineTextDrafts((prev) => ({ ...prev, [field]: undefined }))
      }
      setActiveInlineTextField(null)
    },
    [inlineTextDrafts, form]
  )

  const handleInlineTextCancel = useCallback((field: InlineTextField) => {
    setInlineTextDrafts((prev) => ({ ...prev, [field]: undefined }))
    setActiveInlineTextField(null)
  }, [])

  // ── Inline image handlers ─────────────────────────────────────────────

  const handleInlineImageChange = useCallback((field: InlineImageField, value: string) => {
    setInlineImageDrafts((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleInlineImageSave = useCallback(
    (field: InlineImageField) => {
      const value = (
        inlineImageDrafts[field] ??
        (field === 'logo_url' ? form.logo_url : form.banner_url) ??
        ''
      ).trim()
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

  // ── Logo / Banner validation ──────────────────────────────────────────

  const handleLogoChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, logo_url: value }))
    const r = validateImageUrl(value)
    setLogoError(r.valid ? null : r.error)
  }, [])

  const handleBannerChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, banner_url: value }))
    const r = validateImageUrl(value)
    setBannerError(r.valid ? null : r.error)
  }, [])

  // ── Products reload ───────────────────────────────────────────────────

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

  // ── Category handlers ─────────────────────────────────────────────────

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
      toast({
        title: 'Categoria removida',
        description: count > 0 ? `${count} produto(s) movido(s) para Geral` : undefined,
      })
    },
    [restaurant, products, supabase, loadProducts, toast]
  )

  // ── Copy & Publish ────────────────────────────────────────────────────

  const copyAndPublish = useCallback(() => {
    if (!cardapioUrl) return
    navigator.clipboard.writeText(cardapioUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    window.open(cardapioUrl, '_blank', 'noopener,noreferrer')
  }, [cardapioUrl])

  return {
    // Core data
    restaurant,
    products,
    loading,
    form,
    setForm,

    // Panel
    panelHidden,
    setPanelHidden,

    // Selection
    selectedBlock,
    selectedField,
    selectedProductId,

    // Drafts
    productDrafts,
    productSaveState,
    inlineTextDrafts,
    inlineImageDrafts,
    activeInlineTextField,
    activeInlineImageField,

    // Validation
    logoError,
    bannerError,

    // Publish
    copied,

    // Categories
    customCategories,
    newCategoryName,
    setNewCategoryName,
    editingCategory,
    setEditingCategory,

    // Computed
    customization,
    previewRestaurant,
    previewProducts,
    mergedProducts,
    displayCategories,
    cardapioUrl,

    // Handlers
    handleSelectContext,
    handleInlineProductChange,
    handleInlineProductSave,
    handleInlineProductCancel,
    handleInlineTextChange,
    handleInlineTextSave,
    handleInlineTextCancel,
    handleInlineImageChange,
    handleInlineImageSave,
    handleInlineImageCancel,
    handleLogoChange,
    handleBannerChange,
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
    copyAndPublish,
  }
}

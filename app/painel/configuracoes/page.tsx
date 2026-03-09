'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient, type Restaurant } from '@/lib/supabase/client'
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Package,
  Save,
  Store,
  WandSparkles,
} from 'lucide-react'
import type { CardapioProduct, CardapioRestaurant } from '@/lib/cardapio-renderer'
import {
  CardapioEditorPreview,
  type EditorBlockId,
  type EditorFieldId,
} from '@/components/template-editor/cardapio-editor-preview'
import {
  buildRestaurantCustomizationSeed,
  getRestaurantPresentation,
  normalizeTemplateSlug,
  TEMPLATE_PRESETS,
  type RestaurantCustomization,
  type RestaurantTemplateSlug,
} from '@/lib/restaurant-customization'

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
    primaryCtaLabel: seed.primaryCtaLabel || 'Fazer pedido',
    secondaryCtaLabel: seed.secondaryCtaLabel || 'Abrir WhatsApp',
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
  const supabase = createClient()
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
  }, [])

  useEffect(() => {
    if (!selectedField) return

    const fieldContainer = document.querySelector(
      `[data-editor-field="${selectedField}"]`
    ) as HTMLElement | null

    if (!fieldContainer) return

    fieldContainer.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const focusable = fieldContainer.querySelector(
      'input, textarea, select, button'
    ) as HTMLElement | null

    focusable?.focus({ preventScroll: true })
  }, [selectedField])

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
      primaryCtaLabel: seed.primaryCtaLabel || current.primaryCtaLabel,
      secondaryCtaLabel: seed.secondaryCtaLabel || current.secondaryCtaLabel,
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
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-foreground text-2xl font-bold">Editor do Cardápio</h1>
        <p className="text-muted-foreground max-w-3xl">
          Edite o template já construído com seus dados, textos, banner, links e identidade visual.
          A ideia aqui é colocar o cliente online no mesmo instante, sem depender de refazer layout.
        </p>
        <p className="text-muted-foreground text-xs">
          {autoSaveState === 'saving' && 'Salvando automaticamente...'}
          {autoSaveState === 'saved' && 'Alterações salvas no banco.'}
          {autoSaveState === 'pending' &&
            'Alterações detectadas. Salvamento automático em instantes.'}
          {autoSaveState === 'error' &&
            'Falha no salvamento automático. Use o botão de salvar manualmente.'}
          {autoSaveState === 'idle' && 'Todas as alterações relevantes são persistidas no banco.'}
        </p>
      </div>

      <section className="border-border bg-card mb-6 rounded-xl border p-4">
        <div className="mb-3">
          <h2 className="text-foreground font-semibold">Blocos editáveis</h2>
          <p className="text-muted-foreground text-sm">
            Selecione um bloco na sidebar ou clique diretamente no preview para abrir a edição.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {editorBlocks.map((block) => (
            <button
              key={block.id}
              type="button"
              onClick={() => handleSelectContext(block.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                selectedBlock === block.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-secondary/40'
              }`}
            >
              <p className="text-foreground text-sm font-semibold">{block.title}</p>
              <p className="text-muted-foreground mt-1 text-xs">{block.description}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="border-border bg-card rounded-xl border p-6">
            <div>
              <h2 className="text-foreground font-semibold">Link público</h2>
              <p className="text-muted-foreground text-sm">
                Compartilhe no WhatsApp, Instagram, Google Maps e QR Code de mesa.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <input
                id="cardapio-url"
                type="text"
                readOnly
                value={cardapioUrl}
                title="Link público do cardápio"
                aria-label="Link público do cardápio"
                className="border-border bg-background text-foreground flex-1 rounded-lg border px-4 py-2 text-sm"
              />
              <button
                onClick={copyLink}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg p-2"
                title="Copiar link"
                aria-label="Copiar link"
              >
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
              <a
                href={cardapioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-secondary hover:bg-secondary/80 rounded-lg p-2"
                title="Abrir cardápio"
                aria-label="Abrir cardápio"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
          </section>

          <section
            className={`border-border bg-card space-y-4 rounded-xl border p-6 ${
              selectedBlock === 'structure' ? 'ring-primary ring-2 ring-inset' : ''
            }`}
          >
            <div>
              <h2 className="text-foreground font-semibold">Estrutura do template</h2>
              <p className="text-muted-foreground text-sm">
                Ative ou desative blocos inteiros do cardápio publicado sem mexer no layout base.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
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
            className={`border-border bg-card space-y-4 rounded-xl border p-6 ${
              selectedBlock === 'negocio' ? 'ring-primary ring-2 ring-inset' : ''
            }`}
          >
            <div>
              <h2 className="text-foreground font-semibold">Base do negócio</h2>
              <p className="text-muted-foreground text-sm">
                Esses dados aparecem no cardápio público e alimentam as experiências de contato.
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

            <div className="grid gap-4 md:grid-cols-2">
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
                  className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
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

            <div className="grid gap-4 md:grid-cols-2">
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
            className={`border-border bg-card space-y-4 rounded-xl border p-6 ${
              selectedBlock === 'branding' ? 'ring-primary ring-2 ring-inset' : ''
            }`}
          >
            <div>
              <h2 className="text-foreground font-semibold">Visual e mídia</h2>
              <p className="text-muted-foreground text-sm">
                Logo, banner e cores principais do template publicado.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                id="logo-url"
                label="URL do logo"
                value={form.logo_url}
                editorField="logo_url"
                isSelected={selectedField === 'logo_url'}
                onChange={(value) => setForm({ ...form, logo_url: value })}
              />
              <TextInput
                id="banner-url"
                label="URL do banner"
                value={form.banner_url}
                editorField="banner_url"
                isSelected={selectedField === 'banner_url'}
                onChange={(value) => setForm({ ...form, banner_url: value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
            className={`border-border bg-card space-y-4 rounded-xl border p-6 ${
              ['hero', 'service', 'about'].includes(selectedBlock)
                ? 'ring-primary ring-2 ring-inset'
                : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <WandSparkles className="text-primary h-5 w-5" />
              <div>
                <h2 className="text-foreground font-semibold">Textos do template</h2>
                <p className="text-muted-foreground text-sm">
                  Tudo aqui alimenta a vitrine pública do cardápio para deixar o template pronto
                  para publicar.
                </p>
              </div>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput
                    id="primary-cta"
                    label="CTA principal"
                    value={form.primaryCtaLabel}
                    editorField="primaryCtaLabel"
                    isSelected={selectedField === 'primaryCtaLabel'}
                    onChange={(value) => setForm({ ...form, primaryCtaLabel: value })}
                  />
                  <TextInput
                    id="secondary-cta"
                    label="CTA secundário"
                    value={form.secondaryCtaLabel}
                    editorField="secondaryCtaLabel"
                    isSelected={selectedField === 'secondaryCtaLabel'}
                    onChange={(value) => setForm({ ...form, secondaryCtaLabel: value })}
                  />
                </div>
              </>
            )}

            {(selectedBlock === 'products' || selectedBlock === 'hero') && (
              <div className="grid gap-4 md:grid-cols-2">
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
                  label="Descrição da seção de categorias"
                  value={form.sectionDescription}
                  rows={3}
                  editorField="sectionDescription"
                  isSelected={selectedField === 'sectionDescription'}
                  onChange={(value) => setForm({ ...form, sectionDescription: value })}
                />
              </div>
            )}

            {selectedBlock === 'about' && (
              <div className="grid gap-4 md:grid-cols-2">
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
                  label="Descrição do bloco institucional"
                  value={form.aboutDescription}
                  rows={3}
                  editorField="aboutDescription"
                  isSelected={selectedField === 'aboutDescription'}
                  onChange={(value) => setForm({ ...form, aboutDescription: value })}
                />
              </div>
            )}

            {selectedBlock === 'products' && (
              <div className="grid gap-4 md:grid-cols-2">
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
              <div className="grid gap-4 md:grid-cols-3">
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
            className={`border-border bg-card rounded-xl border p-6 ${
              selectedBlock === 'products' ? 'ring-primary ring-2 ring-inset' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-foreground flex items-center gap-2 font-semibold">
                  <Package className="h-5 w-5" />
                  Produtos e categorias
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  A lista abaixo usa seus produtos reais. Se ainda não houver itens, o preview
                  mostra os produtos de exemplo do template escolhido.
                </p>
              </div>
              <a
                href="/painel/produtos"
                className="bg-secondary hover:bg-secondary/80 inline-flex rounded-lg px-4 py-2 text-sm font-medium"
              >
                Abrir produtos
              </a>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                  Produtos ativos
                </p>
                <p className="text-foreground mt-1 text-2xl font-semibold">
                  {products.filter((product) => product.ativo).length}
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-muted-foreground text-xs tracking-[0.18em] uppercase">
                  Categorias detectadas
                </p>
                <p className="text-foreground mt-1 text-2xl font-semibold">
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

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? 'Salvando editor...' : 'Salvar e publicar alterações'}
          </button>
        </div>

        <aside className="space-y-6">
          <section className="border-border bg-card rounded-xl border p-6">
            <h2 className="text-foreground mb-4 font-semibold">Preview do template</h2>

            {previewRestaurant ? (
              <CardapioEditorPreview
                restaurant={previewRestaurant}
                products={products}
                selectedBlock={selectedBlock}
                selectedField={selectedField}
                onSelectBlock={(block) => handleSelectContext(block)}
                onSelectField={handleSelectContext}
              />
            ) : null}

            <div className="text-muted-foreground mt-4 text-xs">
              Clique em um bloco do preview para abrir o grupo certo de campos na sidebar.
            </div>
          </section>
        </aside>
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

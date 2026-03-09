'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient, type Restaurant } from '@/lib/supabase/client'
import { Check, Copy, ExternalLink, Loader2, Save, Store, WandSparkles } from 'lucide-react'
import {
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
  const preset = TEMPLATE_PRESETS.restaurante

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
    badge: preset.badge,
    heroTitle: '',
    heroDescription: preset.heroDescription,
    sectionTitle: preset.sectionTitle,
    sectionDescription: preset.sectionDescription,
    aboutTitle: preset.aboutTitle,
    aboutDescription: preset.aboutDescription,
    emptyStateTitle: preset.emptyStateTitle,
    emptyStateDescription: preset.emptyStateDescription,
    primaryCtaLabel: 'Fazer pedido',
    secondaryCtaLabel: 'Abrir WhatsApp',
    deliveryLabel: 'Entrega',
    pickupLabel: 'Retirada',
    dineInLabel: 'Consumir no local',
  }
}

export default function ConfiguracoesPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaveState, setAutoSaveState] = useState<
    'idle' | 'pending' | 'saving' | 'saved' | 'error'
  >('idle')
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState<FormState>(createEmptyForm())
  const supabase = createClient()
  const hydratedRef = useRef(false)
  const lastSavedPayloadRef = useRef('')

  const buildCustomization = useCallback(
    (currentForm: FormState): RestaurantCustomization => ({
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

  const previewPresentation = useMemo(
    () =>
      getRestaurantPresentation({
        nome: form.nome || 'Seu restaurante',
        template_slug: form.template_slug,
        customizacao: {
          badge: form.badge,
          heroTitle: form.heroTitle,
          heroDescription: form.heroDescription,
          sectionTitle: form.sectionTitle,
          sectionDescription: form.sectionDescription,
          aboutTitle: form.aboutTitle,
          aboutDescription: form.aboutDescription,
          emptyStateTitle: form.emptyStateTitle,
          emptyStateDescription: form.emptyStateDescription,
          primaryCtaLabel: form.primaryCtaLabel,
          secondaryCtaLabel: form.secondaryCtaLabel,
          deliveryLabel: form.deliveryLabel,
          pickupLabel: form.pickupLabel,
          dineInLabel: form.dineInLabel,
        },
      }),
    [form]
  )

  const applyTemplatePreset = (templateSlug: RestaurantTemplateSlug) => {
    const preset = TEMPLATE_PRESETS[templateSlug]

    setForm((current) => ({
      ...current,
      template_slug: templateSlug,
      badge: preset.badge,
      heroDescription: preset.heroDescription,
      sectionTitle: preset.sectionTitle,
      sectionDescription: preset.sectionDescription,
      aboutTitle: preset.aboutTitle,
      aboutDescription: preset.aboutDescription,
      emptyStateTitle: preset.emptyStateTitle,
      emptyStateDescription: preset.emptyStateDescription,
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

    setAutoSaveState('pending')

    const timer = setTimeout(() => {
      void persistRestaurant(form, { silent: true })
    }, 1200)

    return () => clearTimeout(timer)
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

          <section className="border-border bg-card space-y-4 rounded-xl border p-6">
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
              onChange={(value) => setForm({ ...form, nome: value })}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                id="telefone-whatsapp"
                label="WhatsApp principal"
                value={form.telefone}
                onChange={(value) => setForm({ ...form, telefone: value })}
              />

              <div>
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
              onChange={(value) => setForm({ ...form, slogan: value })}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                id="maps-url"
                label="Link do Google Maps"
                value={form.google_maps_url}
                onChange={(value) => setForm({ ...form, google_maps_url: value })}
              />
              <TextInput
                id="endereco-texto"
                label="Endereço para exibição"
                value={form.endereco_texto}
                onChange={(value) => setForm({ ...form, endereco_texto: value })}
              />
            </div>
          </section>

          <section className="border-border bg-card space-y-4 rounded-xl border p-6">
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
                onChange={(value) => setForm({ ...form, logo_url: value })}
              />
              <TextInput
                id="banner-url"
                label="URL do banner"
                value={form.banner_url}
                onChange={(value) => setForm({ ...form, banner_url: value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ColorInput
                id="cor-primaria"
                label="Cor primária"
                value={form.cor_primaria}
                onChange={(value) => setForm({ ...form, cor_primaria: value })}
              />
              <ColorInput
                id="cor-secundaria"
                label="Cor secundária"
                value={form.cor_secundaria}
                onChange={(value) => setForm({ ...form, cor_secundaria: value })}
              />
            </div>
          </section>

          <section className="border-border bg-card space-y-4 rounded-xl border p-6">
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
              onChange={(value) => setForm({ ...form, badge: value })}
            />
            <TextInput
              id="hero-title"
              label="Título principal"
              value={form.heroTitle}
              onChange={(value) => setForm({ ...form, heroTitle: value })}
            />
            <TextAreaInput
              id="hero-description"
              label="Descrição principal"
              value={form.heroDescription}
              rows={3}
              onChange={(value) => setForm({ ...form, heroDescription: value })}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                id="primary-cta"
                label="CTA principal"
                value={form.primaryCtaLabel}
                onChange={(value) => setForm({ ...form, primaryCtaLabel: value })}
              />
              <TextInput
                id="secondary-cta"
                label="CTA secundário"
                value={form.secondaryCtaLabel}
                onChange={(value) => setForm({ ...form, secondaryCtaLabel: value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                id="section-title"
                label="Título da seção de categorias"
                value={form.sectionTitle}
                onChange={(value) => setForm({ ...form, sectionTitle: value })}
              />
              <TextAreaInput
                id="section-description"
                label="Descrição da seção de categorias"
                value={form.sectionDescription}
                rows={3}
                onChange={(value) => setForm({ ...form, sectionDescription: value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                id="about-title"
                label="Título do bloco institucional"
                value={form.aboutTitle}
                onChange={(value) => setForm({ ...form, aboutTitle: value })}
              />
              <TextAreaInput
                id="about-description"
                label="Descrição do bloco institucional"
                value={form.aboutDescription}
                rows={3}
                onChange={(value) => setForm({ ...form, aboutDescription: value })}
              />
            </div>

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

            <div className="grid gap-4 md:grid-cols-3">
              <TextInput
                id="delivery-label"
                label="Rótulo de entrega"
                value={form.deliveryLabel}
                onChange={(value) => setForm({ ...form, deliveryLabel: value })}
              />
              <TextInput
                id="pickup-label"
                label="Rótulo de retirada"
                value={form.pickupLabel}
                onChange={(value) => setForm({ ...form, pickupLabel: value })}
              />
              <TextInput
                id="dinein-label"
                label="Rótulo de consumo local"
                value={form.dineInLabel}
                onChange={(value) => setForm({ ...form, dineInLabel: value })}
              />
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

            <div className="border-border bg-background overflow-hidden rounded-3xl border shadow-sm">
              <div
                className={`relative min-h-56 bg-linear-to-br p-6 text-white ${TEMPLATE_PRESETS[form.template_slug].accentClassName}`}
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/20">
                    {form.logo_url ? (
                      <img
                        src={form.logo_url}
                        alt={form.nome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Store className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-[0.18em] text-white/80 uppercase">
                      {TEMPLATE_PRESETS[form.template_slug].label}
                    </p>
                    <h3 className="text-lg font-semibold">{form.nome || 'Seu restaurante'}</h3>
                  </div>
                </div>

                <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  {previewPresentation.badge}
                </div>

                <h4 className="mt-4 text-2xl leading-tight font-semibold">
                  {previewPresentation.heroTitle}
                </h4>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/90">
                  {previewPresentation.heroDescription}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black">
                    {previewPresentation.primaryCtaLabel}
                  </span>
                  <span className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white">
                    {previewPresentation.secondaryCtaLabel}
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-6">
                <div>
                  <p className="text-foreground font-semibold">
                    {previewPresentation.sectionTitle}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {previewPresentation.sectionDescription}
                  </p>
                </div>

                <div className="grid gap-3">
                  {[
                    previewPresentation.deliveryLabel,
                    previewPresentation.pickupLabel,
                    previewPresentation.dineInLabel,
                  ].map((item) => (
                    <div
                      key={item}
                      className="border-border bg-secondary/40 text-foreground rounded-2xl border px-4 py-3 text-sm font-medium"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <div className="border-border bg-card rounded-2xl border border-dashed p-4">
                  <p className="text-foreground font-medium">{previewPresentation.aboutTitle}</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {previewPresentation.aboutDescription}
                  </p>
                </div>
              </div>
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
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
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
  onChange,
}: {
  id: string
  label: string
  value: string
  rows: number
  onChange: (value: string) => void
}) {
  return (
    <div>
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
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
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

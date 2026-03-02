"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient, type Restaurant } from "@/lib/supabase/client"
import { Loader2, Save, ExternalLink, Copy, Check } from "lucide-react"

export default function ConfiguracoesPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    slogan: '',
    logo_url: '',
    banner_url: '',
    cor_primaria: '#f97316',
    cor_secundaria: '#ea580c'
  })
  const supabase = createClient()

  const loadRestaurant = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (data) {
      setRestaurant(data)
      setForm({
        nome: data.nome,
        telefone: data.telefone,
        slogan: data.slogan || '',
        logo_url: data.logo_url || '',
        banner_url: data.banner_url || '',
        cor_primaria: data.cor_primaria || '#f97316',
        cor_secundaria: data.cor_secundaria || '#ea580c'
      })
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRestaurant()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadRestaurant])

  const handleSave = async () => {
    if (!restaurant) return
    setSaving(true)

    await supabase
      .from('restaurants')
      .update({
        nome: form.nome,
        telefone: form.telefone.replace(/\D/g, ''),
        slogan: form.slogan || null,
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null,
        cor_primaria: form.cor_primaria,
        cor_secundaria: form.cor_secundaria
      })
      .eq('id', restaurant.id)

    await loadRestaurant()
    setSaving(false)
  }

  const copyLink = () => {
    if (!restaurant) return
    const url = `${window.location.origin}/r/${restaurant.slug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const cardapioUrl = restaurant ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${restaurant.slug}` : ''

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Personalize seu cardápio</p>
      </div>

      <div className="space-y-6">
        {/* Link do Cardápio */}
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
          <h3 className="font-semibold text-foreground mb-2">Link do seu Cardápio</h3>
          <div className="flex items-center gap-2">
            <input
              id="cardapio-url"
              type="text"
              readOnly
              value={cardapioUrl}
              title="Link do cardápio"
              aria-label="Link do cardápio"
              className="flex-1 px-4 py-2 rounded-lg bg-background border border-border text-sm"
            />
            <button
              onClick={copyLink}
              title="Copiar link"
              aria-label="Copiar link"
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
            <a
              href={cardapioUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir cardápio em nova aba"
              aria-label="Abrir cardápio em nova aba"
              className="p-2 rounded-lg bg-secondary hover:bg-secondary/80"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Compartilhe este link com seus clientes!
          </p>
        </div>

        {/* Dados Básicos */}
        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Dados do Restaurante</h3>
          
          <div>
            <label htmlFor="nome-restaurante" className="block text-sm font-medium text-foreground mb-1">Nome do Restaurante</label>
            <input
              id="nome-restaurante"
              type="text"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Pizzaria do Bairro"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="telefone-whatsapp" className="block text-sm font-medium text-foreground mb-1">Telefone WhatsApp</label>
            <input
              id="telefone-whatsapp"
              type="text"
              value={form.telefone}
              onChange={e => setForm({ ...form, telefone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="5511999999999"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Com código do país (55) e DDD
            </p>
          </div>

          <div>
            <label htmlFor="slogan-restaurante" className="block text-sm font-medium text-foreground mb-1">Slogan</label>
            <input
              id="slogan-restaurante"
              type="text"
              value={form.slogan}
              onChange={e => setForm({ ...form, slogan: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="A melhor pizza da cidade!"
            />
          </div>
        </div>

        {/* Imagens */}
        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Imagens</h3>
          
          <div>
            <label htmlFor="logo-url" className="block text-sm font-medium text-foreground mb-1">URL do Logo</label>
            <input
              id="logo-url"
              type="text"
              value={form.logo_url}
              onChange={e => setForm({ ...form, logo_url: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://..."
            />
            {form.logo_url && (
              <img src={form.logo_url} alt="Logo" className="mt-2 w-20 h-20 rounded-full object-cover" />
            )}
          </div>

          <div>
            <label htmlFor="banner-url" className="block text-sm font-medium text-foreground mb-1">URL do Banner</label>
            <input
              id="banner-url"
              type="text"
              value={form.banner_url}
              onChange={e => setForm({ ...form, banner_url: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="https://..."
            />
            {form.banner_url && (
              <img src={form.banner_url} alt="Banner" className="mt-2 w-full h-32 rounded-lg object-cover" />
            )}
          </div>
        </div>

        {/* Cores */}
        <div className="rounded-xl bg-card border border-border p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Cores</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cor-primaria" className="block text-sm font-medium text-foreground mb-1">Cor Primária</label>
              <div className="flex items-center gap-2">
                <input
                  id="cor-primaria"
                  type="color"
                  value={form.cor_primaria}
                  onChange={e => setForm({ ...form, cor_primaria: e.target.value })}
                  title="Selecionar cor primária"
                  aria-label="Selecionar cor primária"
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  id="cor-primaria-texto"
                  type="text"
                  value={form.cor_primaria}
                  onChange={e => setForm({ ...form, cor_primaria: e.target.value })}
                  placeholder="#f97316"
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>
            </div>
            <div>
              <label htmlFor="cor-secundaria" className="block text-sm font-medium text-foreground mb-1">Cor Secundária</label>
              <div className="flex items-center gap-2">
                <input
                  id="cor-secundaria"
                  type="color"
                  value={form.cor_secundaria}
                  onChange={e => setForm({ ...form, cor_secundaria: e.target.value })}
                  title="Selecionar cor secundária"
                  aria-label="Selecionar cor secundária"
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  id="cor-secundaria-texto"
                  type="text"
                  value={form.cor_secundaria}
                  onChange={e => setForm({ ...form, cor_secundaria: e.target.value })}
                  placeholder="#ea580c"
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg bg-secondary/30">
            <p className="text-sm text-muted-foreground mb-2">Preview:</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg text-white text-sm bg-primary">
                Botão Primário
              </button>
              <button className="px-4 py-2 rounded-lg text-white text-sm bg-secondary-foreground">
                Botão Secundário
              </button>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

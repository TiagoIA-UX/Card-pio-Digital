'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MapPin, Plus, Trash2, ToggleLeft, ToggleRight, Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/format-currency'

interface DeliveryZone {
  id: string
  nome: string
  bairros: string[]
  taxa: number
  ativo: boolean
}

interface ZoneForm {
  nome: string
  bairros: string  // comma-separated input
  taxa: string
}

function createEmptyZoneForm(): ZoneForm {
  return { nome: '', bairros: '', taxa: '' }
}

function formatTaxaForInput(taxa: number | null | undefined): string {
  if (taxa == null) return '0'
  return Number(taxa).toFixed(2).replace('.', ',')
}

export default function EntregasPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ZoneForm>(createEmptyZoneForm())
  const [formError, setFormError] = useState<string | null>(null)
  // Default delivery fee (stored in restaurants table)
  const [defaultTaxa, setDefaultTaxa] = useState<string>('0')
  const [savingDefault, setSavingDefault] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const { data: rest } = await supabase
      .from('restaurants')
      .select('id, taxa_entrega')
      .eq('user_id', session.user.id)
      .single()

    if (rest) {
      setRestaurantId(rest.id)
      setDefaultTaxa(formatTaxaForInput(rest.taxa_entrega))

      const res = await fetch('/api/delivery-zones')
      if (res.ok) {
        const data = (await res.json()) as { zones: DeliveryZone[] }
        setZones(data.zones ?? [])
      }
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleSaveDefault = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurantId) return
    setSavingDefault(true)
    const taxa = parseFloat(defaultTaxa.replace(',', '.')) || 0
    await supabase
      .from('restaurants')
      .update({ taxa_entrega: taxa })
      .eq('id', restaurantId)
    setSavingDefault(false)
  }

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)

    const bairros = form.bairros
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean)

    if (bairros.length === 0) {
      setFormError('Informe pelo menos um bairro')
      setSaving(false)
      return
    }

    const taxa = parseFloat(form.taxa.replace(',', '.'))
    if (isNaN(taxa) || taxa < 0) {
      setFormError('Taxa inválida')
      setSaving(false)
      return
    }

    const res = await fetch('/api/delivery-zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: form.nome.trim(), bairros, taxa }),
    })

    const result = (await res.json()) as { zone?: DeliveryZone; error?: string }

    if (!res.ok) {
      setFormError(result.error ?? 'Erro ao criar zona')
    } else {
      setZones((prev) => [...prev, result.zone!])
      setForm(createEmptyZoneForm())
      setShowForm(false)
    }

    setSaving(false)
  }

  const toggleZone = async (zone: DeliveryZone) => {
    const res = await fetch(`/api/delivery-zones?id=${zone.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !zone.ativo }),
    })
    if (res.ok) {
      const { zone: updated } = (await res.json()) as { zone: DeliveryZone }
      setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)))
    }
  }

  const deleteZone = async (id: string) => {
    if (!window.confirm('Excluir esta zona de entrega?')) return
    const res = await fetch(`/api/delivery-zones?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setZones((prev) => prev.filter((z) => z.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Zonas de Entrega</h1>
          <p className="text-muted-foreground text-sm">
            Configure taxas de entrega por bairro. O cliente verá a taxa correspondente ao informar
            o bairro no pedido.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setFormError(null)
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova zona
        </button>
      </div>

      {/* Default fee */}
      <form
        onSubmit={handleSaveDefault}
        className="bg-card border-border mb-6 flex flex-wrap items-end gap-4 rounded-2xl border p-4 sm:p-5"
      >
        <div className="flex-1 min-w-48">
          <label className="text-foreground mb-1 block text-sm font-medium">
            Taxa padrão de entrega (R$)
          </label>
          <p className="text-muted-foreground mb-2 text-xs">
            Aplicada quando o bairro do cliente não está em nenhuma zona configurada.
          </p>
          <input
            type="text"
            inputMode="decimal"
            value={defaultTaxa}
            onChange={(e) => setDefaultTaxa(e.target.value)}
            className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
          />
        </div>
        <button
          type="submit"
          disabled={savingDefault}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {savingDefault ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar taxa padrão
        </button>
      </form>

      {/* Zone Form */}
      {showForm && (
        <form
          onSubmit={handleCreateZone}
          className="bg-card border-border mb-6 rounded-2xl border p-4 sm:p-6"
        >
          <h2 className="text-foreground mb-4 font-semibold">Nova zona de entrega</h2>
          {formError && (
            <div className="bg-destructive/10 text-destructive mb-4 rounded-lg p-3 text-sm">
              {formError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Nome da zona *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Centro, Zona Sul"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              />
            </div>

            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">
                Taxa de entrega (R$) *
              </label>
              <input
                type="text"
                required
                inputMode="decimal"
                placeholder="5,00"
                value={form.taxa}
                onChange={(e) => setForm({ ...form, taxa: e.target.value })}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-foreground mb-1 block text-sm font-medium">
                Bairros cobertos *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Centro, Vila Nova, Jardim América (separados por vírgula)"
                value={form.bairros}
                onChange={(e) => setForm({ ...form, bairros: e.target.value })}
                className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Separe cada bairro por vírgula. O nome deve ser igual ao que o cliente vai digitar.
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Criar zona
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setFormError(null)
              }}
              className="border-border hover:bg-muted rounded-xl border px-5 py-2 text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Zones List */}
      {zones.length === 0 ? (
        <div className="bg-card border-border flex flex-col items-center justify-center rounded-2xl border p-12 text-center">
          <Truck className="text-muted-foreground/30 mb-4 h-12 w-12" />
          <p className="text-foreground font-medium">Nenhuma zona configurada</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Crie zonas para cobrar taxas diferentes por bairro.
            <br />
            Sem zonas, todos os pedidos usam a taxa padrão acima.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`bg-card border-border flex flex-wrap items-start justify-between gap-4 rounded-2xl border p-4 ${
                !zone.ativo ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    zone.ativo ? 'bg-primary/10' : 'bg-muted'
                  }`}
                >
                  <MapPin
                    className={`h-5 w-5 ${zone.ativo ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-foreground font-semibold">{zone.nome}</span>
                    <span className="text-primary font-bold">{formatCurrency(zone.taxa)}</span>
                    {!zone.ativo && (
                      <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                        Desativada
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {zone.bairros.map((b) => (
                      <span
                        key={b}
                        className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => void toggleZone(zone)}
                  title={zone.ativo ? 'Desativar zona' : 'Ativar zona'}
                  className="hover:bg-muted rounded-lg p-2 transition-colors"
                >
                  {zone.ativo ? (
                    <ToggleRight className="text-primary h-6 w-6" />
                  ) : (
                    <ToggleLeft className="text-muted-foreground h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={() => void deleteZone(zone.id)}
                  title="Excluir zona"
                  className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg p-2 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

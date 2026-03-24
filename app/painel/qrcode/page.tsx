'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Printer,
  QrCode,
  Trash2,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateQRCodeUrl, generateTableTemplate, getCardapioUrl } from '@/modules/qrcode'
import { getSiteUrl } from '@/lib/site-url'
import { getActiveRestaurantForUser } from '@/lib/active-restaurant'

interface RestaurantRecord {
  id: string
  nome: string
  slug: string
  logo_url?: string | null
  cor_primaria?: string | null
}

interface Mesa {
  id: string
  numero: number
  label: string | null
  ativa: boolean
}

export default function QRCodePage() {
  const [restaurant, setRestaurant] = useState<RestaurantRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableNumber, setTableNumber] = useState('1')
  const [batchFrom, setBatchFrom] = useState('1')
  const [batchTo, setBatchTo] = useState('10')
  const [copied, setCopied] = useState<'url' | 'qr' | null>(null)
  const supabase = createClient()

  // Gestão de mesas
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loadingMesas, setLoadingMesas] = useState(false)
  const [newMesaNumero, setNewMesaNumero] = useState('')
  const [newMesaLabel, setNewMesaLabel] = useState('')
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null)
  const [savingMesa, setSavingMesa] = useState(false)

  const loadMesas = useCallback(
    async (restaurantId: string) => {
      setLoadingMesas(true)
      const { data } = await supabase
        .from('restaurant_mesas')
        .select('id, numero, label, ativa')
        .eq('restaurant_id', restaurantId)
        .order('numero', { ascending: true })
      setMesas(data || [])
      setLoadingMesas(false)
    },
    [supabase]
  )

  const loadRestaurant = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    const data = await getActiveRestaurantForUser<RestaurantRecord>(
      supabase,
      session.user.id,
      'id, nome, slug, logo_url, cor_primaria'
    )

    setRestaurant(data)
    if (data) void loadMesas(data.id)
    setLoading(false)
  }, [supabase, loadMesas])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRestaurant()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadRestaurant])

  const addMesa = async () => {
    if (!restaurant || savingMesa) return
    const num = parseInt(newMesaNumero, 10)
    if (isNaN(num) || num <= 0 || num > 999) return

    setSavingMesa(true)
    const { error } = await supabase.from('restaurant_mesas').insert({
      restaurant_id: restaurant.id,
      numero: num,
      label: newMesaLabel.trim() || null,
    })

    if (!error) {
      setNewMesaNumero('')
      setNewMesaLabel('')
      void loadMesas(restaurant.id)
    }
    setSavingMesa(false)
  }

  const addMesasBatch = async () => {
    if (!restaurant || savingMesa) return
    const from = parseInt(newMesaNumero, 10) || 1
    const to = parseInt(newMesaLabel, 10) || from

    if (from <= 0 || to <= 0 || from > to || to - from > 50 || to > 999) return

    setSavingMesa(true)
    const existingNumbers = new Set(mesas.map((m) => m.numero))
    const toInsert = []
    for (let i = from; i <= to; i++) {
      if (!existingNumbers.has(i)) {
        toInsert.push({ restaurant_id: restaurant.id, numero: i, label: null })
      }
    }

    if (toInsert.length > 0) {
      await supabase.from('restaurant_mesas').insert(toInsert)
      void loadMesas(restaurant.id)
    }
    setSavingMesa(false)
  }

  const updateMesa = async (mesa: Mesa) => {
    if (!restaurant || savingMesa) return
    setSavingMesa(true)
    await supabase
      .from('restaurant_mesas')
      .update({
        label: mesa.label?.trim() || null,
        ativa: mesa.ativa,
      })
      .eq('id', mesa.id)
    setEditingMesa(null)
    void loadMesas(restaurant.id)
    setSavingMesa(false)
  }

  const deleteMesa = async (mesaId: string) => {
    if (!restaurant || savingMesa) return
    setSavingMesa(true)
    await supabase.from('restaurant_mesas').delete().eq('id', mesaId)
    void loadMesas(restaurant.id)
    setSavingMesa(false)
  }

  const tableUrl = useMemo(() => {
    if (!restaurant) return ''

    const baseUrl = getCardapioUrl(restaurant.slug, getSiteUrl())
    const url = new URL(baseUrl)
    if (tableNumber.trim()) {
      url.searchParams.set('mesa', tableNumber.trim())
    }
    return url.toString()
  }, [restaurant, tableNumber])

  const qrUrl = useMemo(() => {
    if (!restaurant || !tableUrl) return ''

    return generateQRCodeUrl(tableUrl, {
      size: 700,
      color: (restaurant.cor_primaria || '#f97316').replace('#', ''),
      backgroundColor: 'FFFFFF',
      errorCorrection: 'H',
    })
  }, [restaurant, tableUrl])

  const copyValue = async (value: string, target: 'url' | 'qr') => {
    await navigator.clipboard.writeText(value)
    setCopied(target)
    setTimeout(() => setCopied(null), 2000)
  }

  const handlePrint = () => {
    if (!restaurant || !qrUrl) return

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
    if (!printWindow) return

    const html = generateTableTemplate(
      {
        url: qrUrl,
        cardapioUrl: tableUrl,
        tenant: {
          nome: restaurant.nome,
          slug: restaurant.slug,
          logo_url: restaurant.logo_url || undefined,
          cores: {
            primary: restaurant.cor_primaria || '#f97316',
          } as any,
        },
      },
      tableNumber.trim() || undefined
    )

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
  }

  const handleBatchPrint = () => {
    if (!restaurant) return
    const from = parseInt(batchFrom, 10)
    const to = parseInt(batchTo, 10)
    if (isNaN(from) || isNaN(to) || from > to || to - from > 50) return

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
    if (!printWindow) return

    const baseUrl = getCardapioUrl(restaurant.slug, getSiteUrl())
    const pages: string[] = []
    for (let i = from; i <= to; i++) {
      const mesaUrl = new URL(baseUrl)
      mesaUrl.searchParams.set('mesa', String(i))
      const mesaQr = generateQRCodeUrl(mesaUrl.toString(), {
        size: 700,
        color: (restaurant.cor_primaria || '#f97316').replace('#', ''),
        backgroundColor: 'FFFFFF',
        errorCorrection: 'H',
      })
      pages.push(`
        <div style="page-break-after:always;text-align:center;padding:40px 20px;font-family:system-ui,sans-serif;">
          <h2 style="margin:0;font-size:28px;">${restaurant.nome}</h2>
          <p style="margin:8px 0 24px;font-size:48px;font-weight:bold;color:${restaurant.cor_primaria || '#f97316'}">Mesa ${i}</p>
          <img src="${mesaQr}" width="400" height="400" style="border-radius:16px;" alt="Mesa ${i}" />
          <p style="margin:24px 0 0;font-size:16px;color:#666;">Escaneie para abrir o cardápio</p>
        </div>
      `)
    }

    printWindow.document.open()
    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>Mesas ${from}-${to}</title></head><body style="margin:0">${pages.join('')}</body></html>`
    )
    printWindow.document.close()
    printWindow.focus()
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
      <div className="mb-8">
        <h1 className="text-foreground text-2xl font-bold">QR Code de Mesa</h1>
        <p className="text-muted-foreground max-w-3xl">
          Gere um QR por mesa para que o pedido já chegue identificado como consumo local.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="border-border bg-card space-y-4 rounded-xl border p-6">
          <div>
            <label htmlFor="mesa-numero" className="text-foreground mb-1 block text-sm font-medium">
              Número da mesa
            </label>
            <input
              id="mesa-numero"
              type="text"
              value={tableNumber}
              onChange={(event) => setTableNumber(event.target.value)}
              className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
              placeholder="Ex: 7"
            />
          </div>

          <div className="border-border bg-secondary/30 rounded-2xl border p-4">
            <p className="text-foreground font-medium">URL da mesa</p>
            <p className="text-muted-foreground mt-1 text-sm break-all">{tableUrl}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => copyValue(tableUrl, 'url')}
                className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
              >
                {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copiar URL
              </button>
              <a
                href={tableUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir mesa
              </a>
            </div>
          </div>

          <div className="border-border bg-card text-muted-foreground rounded-2xl border border-dashed p-4 text-sm">
            Quando o cliente abrir esse QR Code, o sistema já entenderá que o pedido veio da mesa.
            Se ele entrar pelo link normal do cardápio, o pedido segue como online para entrega ou
            retirada.
          </div>
        </section>

        <section className="border-border bg-card rounded-xl border p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-foreground font-semibold">Preview para impressão</h2>
              <p className="text-muted-foreground text-sm">
                Mesa {tableNumber || 'sem número definido'}
              </p>
            </div>
            <QrCode className="text-primary h-5 w-5" />
          </div>

          <div className="border-border bg-background rounded-3xl border p-6 text-center shadow-sm">
            <p className="text-foreground text-lg font-semibold">
              {restaurant?.nome || 'Seu restaurante'}
            </p>
            <p className="text-primary mt-1 text-3xl font-bold">Mesa {tableNumber || '-'}</p>
            {qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt={`QR Code da mesa ${tableNumber}`}
                className="border-border mx-auto mt-4 h-72 w-72 rounded-2xl border bg-white p-4"
              />
            ) : null}
            <p className="text-muted-foreground mt-4 text-sm">
              Escaneie para abrir o cardápio desta mesa.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => copyValue(qrUrl, 'qr')}
              className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
            >
              {copied === 'qr' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copiar URL do QR
            </button>
            <button
              onClick={handlePrint}
              className="bg-foreground text-background inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            >
              <Printer className="h-4 w-4" />
              Imprimir mesa
            </button>
          </div>
        </section>
      </div>

      {/* Geração em lote */}
      <section className="border-border bg-card mt-6 rounded-xl border p-6">
        <h2 className="text-foreground mb-1 text-lg font-semibold">Imprimir Várias Mesas</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          Gere QR Codes de um intervalo de mesas para imprimir de uma vez.
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="batch-from" className="text-foreground mb-1 block text-sm font-medium">
              De mesa
            </label>
            <input
              id="batch-from"
              type="number"
              min={1}
              value={batchFrom}
              onChange={(e) => setBatchFrom(e.target.value)}
              className="border-border bg-background text-foreground focus:ring-primary w-24 rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="batch-to" className="text-foreground mb-1 block text-sm font-medium">
              Até mesa
            </label>
            <input
              id="batch-to"
              type="number"
              min={1}
              value={batchTo}
              onChange={(e) => setBatchTo(e.target.value)}
              className="border-border bg-background text-foreground focus:ring-primary w-24 rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2"
            />
          </div>
          <button
            onClick={handleBatchPrint}
            disabled={
              !restaurant ||
              parseInt(batchFrom) > parseInt(batchTo) ||
              parseInt(batchTo) - parseInt(batchFrom) > 50
            }
            className="bg-foreground text-background inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Imprimir mesas {batchFrom} a {batchTo}
          </button>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">Máximo de 50 mesas por vez.</p>
      </section>

      {/* Gestão de Mesas */}
      <section className="border-border bg-card mt-6 rounded-xl border p-6">
        <div className="mb-4">
          <h2 className="text-foreground text-lg font-semibold">Mesas Cadastradas</h2>
          <p className="text-muted-foreground text-sm">
            Cadastre suas mesas para validar os QR Codes. Pedidos só serão aceitos de mesas ativas.
          </p>
        </div>

        {/* Adicionar mesa individual */}
        <div className="border-border mb-4 rounded-lg border p-4">
          <p className="text-foreground mb-3 text-sm font-medium">Adicionar mesa</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="new-mesa-num" className="text-muted-foreground mb-1 block text-xs">
                Número
              </label>
              <input
                id="new-mesa-num"
                type="number"
                min={1}
                max={999}
                value={newMesaNumero}
                onChange={(e) => setNewMesaNumero(e.target.value)}
                className="border-border bg-background text-foreground focus:ring-primary w-24 rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
                placeholder="1"
              />
            </div>
            <div>
              <label htmlFor="new-mesa-label" className="text-muted-foreground mb-1 block text-xs">
                Nome (opcional)
              </label>
              <input
                id="new-mesa-label"
                type="text"
                value={newMesaLabel}
                onChange={(e) => setNewMesaLabel(e.target.value)}
                className="border-border bg-background text-foreground focus:ring-primary w-40 rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
                placeholder="Ex: Varanda, VIP"
              />
            </div>
            <button
              onClick={addMesa}
              disabled={savingMesa || !newMesaNumero}
              className="bg-primary text-primary-foreground inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </button>
          </div>

          {/* Adicionar em lote */}
          <div className="border-border mt-3 border-t pt-3">
            <p className="text-muted-foreground mb-2 text-xs">
              Ou adicione várias mesas de uma vez:
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">Da mesa</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={newMesaNumero}
                  onChange={(e) => setNewMesaNumero(e.target.value)}
                  className="border-border bg-background text-foreground focus:ring-primary w-20 rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs">Até mesa</label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={newMesaLabel}
                  onChange={(e) => setNewMesaLabel(e.target.value)}
                  className="border-border bg-background text-foreground focus:ring-primary w-20 rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2"
                  placeholder="10"
                />
              </div>
              <button
                onClick={addMesasBatch}
                disabled={savingMesa}
                className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Adicionar intervalo
              </button>
            </div>
          </div>
        </div>

        {/* Lista de mesas */}
        {loadingMesas ? (
          <div className="flex justify-center py-8">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
          </div>
        ) : mesas.length === 0 ? (
          <div className="border-border rounded-lg border border-dashed py-8 text-center">
            <QrCode className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">Nenhuma mesa cadastrada.</p>
            <p className="text-muted-foreground mt-1 text-xs">
              Sem mesas cadastradas, qualquer número de mesa será aceito nos pedidos.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mesas.map((mesa) => (
              <div
                key={mesa.id}
                className={`border-border flex items-center gap-3 rounded-lg border px-4 py-3 ${
                  !mesa.ativa ? 'opacity-50' : ''
                }`}
              >
                {editingMesa?.id === mesa.id ? (
                  <div className="flex w-full flex-col gap-2">
                    <input
                      type="text"
                      value={editingMesa.label || ''}
                      onChange={(e) => setEditingMesa({ ...editingMesa, label: e.target.value })}
                      className="border-border bg-background text-foreground w-full rounded border px-2 py-1 text-sm"
                      placeholder="Nome (opcional)"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs">
                        <input
                          type="checkbox"
                          checked={editingMesa.ativa}
                          onChange={(e) =>
                            setEditingMesa({ ...editingMesa, ativa: e.target.checked })
                          }
                          className="rounded"
                        />
                        Ativa
                      </label>
                      <button
                        onClick={() => updateMesa(editingMesa)}
                        disabled={savingMesa}
                        className="text-primary ml-auto text-xs font-semibold hover:underline"
                      >
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingMesa(null)}
                        className="text-muted-foreground text-xs hover:underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-primary text-lg font-bold">{mesa.numero}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-medium">
                        Mesa {mesa.numero}
                      </p>
                      {mesa.label && (
                        <p className="text-muted-foreground truncate text-xs">{mesa.label}</p>
                      )}
                      {!mesa.ativa && <p className="text-xs text-amber-500">Desativada</p>}
                    </div>
                    <button
                      onClick={() => setEditingMesa({ ...mesa })}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      title="Editar mesa"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMesa(mesa.id)}
                      disabled={savingMesa}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      title="Excluir mesa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-muted-foreground mt-4 text-xs">
          Quando há mesas cadastradas, o sistema valida se o número da mesa é válido antes de
          aceitar o pedido. Sem mesas cadastradas, qualquer número é aceito.
        </p>
      </section>
    </div>
  )
}

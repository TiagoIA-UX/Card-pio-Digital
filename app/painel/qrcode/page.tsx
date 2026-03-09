'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Copy, ExternalLink, Loader2, Printer, QrCode } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateQRCodeUrl, generateTableTemplate, getCardapioUrl } from '@/modules/qrcode'
import { getSiteUrl } from '@/lib/site-url'

interface RestaurantRecord {
  id: string
  nome: string
  slug: string
  logo_url?: string | null
  cor_primaria?: string | null
}

export default function QRCodePage() {
  const [restaurant, setRestaurant] = useState<RestaurantRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableNumber, setTableNumber] = useState('1')
  const [copied, setCopied] = useState<'url' | 'qr' | null>(null)
  const supabase = createClient()

  const loadRestaurant = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return

    const { data } = await supabase
      .from('restaurants')
      .select('id, nome, slug, logo_url, cor_primaria')
      .eq('user_id', session.user.id)
      .single()

    setRestaurant(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRestaurant()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadRestaurant])

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
    </div>
  )
}

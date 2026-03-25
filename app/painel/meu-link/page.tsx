'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, ExternalLink, Loader2, QrCode, Share2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getActiveRestaurantForUser, getRestaurantScopedHref } from '@/lib/active-restaurant'
import { getCardapioUrl } from '@/modules/qrcode'
import { getSiteUrl } from '@/lib/site-url'

interface RestaurantLinkRecord {
  id: string
  nome: string
  slug: string
}

export default function MeuLinkPage() {
  const supabase = useMemo(() => createClient(), [])
  const [restaurant, setRestaurant] = useState<RestaurantLinkRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const loadRestaurant = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setLoading(false)
      return
    }

    const activeRestaurant = await getActiveRestaurantForUser<RestaurantLinkRecord>(
      supabase,
      session.user.id,
      'id, nome, slug'
    )

    setRestaurant(activeRestaurant)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadRestaurant()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadRestaurant])

  const publicLink = useMemo(() => {
    if (!restaurant?.slug) return ''
    return getCardapioUrl(restaurant.slug, getSiteUrl())
  }, [restaurant])

  const qrCodeHref = useMemo(
    () => getRestaurantScopedHref('/painel/qrcode', restaurant?.id),
    [restaurant?.id]
  )

  const copyLink = async () => {
    if (!publicLink) return
    await navigator.clipboard.writeText(publicLink)
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
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-foreground text-2xl font-bold">Meu Link</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Este é o link principal do seu canal digital público. Use esta página para copiar,
          compartilhar e abrir o link que seus clientes vão acessar.
        </p>
      </div>

      <div className="bg-card border-border mb-6 rounded-2xl border p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Share2 className="text-primary h-5 w-5" />
          <h2 className="text-foreground text-lg font-semibold">Link público do canal digital</h2>
        </div>

        <div className="bg-muted mb-4 overflow-x-auto rounded-xl border px-4 py-3">
          <p className="text-foreground text-sm font-medium break-all">{publicLink || '—'}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyLink}
            disabled={!publicLink}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Link copiado' : 'Copiar link'}
          </button>

          <a
            href={publicLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border bg-card hover:bg-secondary text-foreground inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            Abrir canal
          </a>

          <Link
            href={qrCodeHref}
            className="border-border bg-card hover:bg-secondary text-foreground inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium"
          >
            <QrCode className="h-4 w-4" />
            Gerar QR Code
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-card border-border rounded-2xl border p-4">
          <p className="text-foreground mb-2 text-sm font-semibold">Compartilhar no WhatsApp</p>
          <p className="text-muted-foreground text-sm leading-6">
            Use este link em bio, status, grupos e atendimento para levar o cliente direto ao seu
            canal digital.
          </p>
        </div>

        <div className="bg-card border-border rounded-2xl border p-4">
          <p className="text-foreground mb-2 text-sm font-semibold">Usar em redes sociais</p>
          <p className="text-muted-foreground text-sm leading-6">
            Este é o link mais importante do seu delivery. Ele deve aparecer em Instagram, Google e
            materiais de divulgação.
          </p>
        </div>

        <div className="bg-card border-border rounded-2xl border p-4">
          <p className="text-foreground mb-2 text-sm font-semibold">QR Code para mesa e balcão</p>
          <p className="text-muted-foreground text-sm leading-6">
            Se quiser material impresso, vá para a tela de QR Code e gere códigos para divulgação e
            atendimento local.
          </p>
        </div>
      </div>
    </div>
  )
}

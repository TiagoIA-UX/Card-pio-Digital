'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Package,
  Download,
  ExternalLink,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Settings,
  Unlock,
} from 'lucide-react'
import { EmptyState } from '@/components/shared/empty-state'
import { OrderListSkeleton } from '@/components/shared/loading-skeleton'

interface Purchase {
  id: string
  templateId: string
  templateName: string
  templateSlug: string
  templateImage: string
  status: string
  purchasedAt: string
  licenseKey?: string
}

export default function MeusTemplatesPage() {
  const showDevUnlock = process.env.NODE_ENV === 'development'
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [hasRestaurant, setHasRestaurant] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockMessage, setUnlockMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const supabase = createClient()

  const loadPurchases = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      // Usar router em vez de window.location para consistência
      // O middleware já protege esta rota, mas mantemos por segurança
      return
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    setHasRestaurant(!!restaurant)

    const { data, error } = await supabase
      .from('user_purchases')
      .select(
        `
        id,
        template_id,
        status,
        purchased_at,
        license_key,
        templates (
          name,
          slug,
          image_url
        )
      `
      )
      .eq('user_id', session.user.id)
      .order('purchased_at', { ascending: false })

    if (!error && data) {
      setPurchases(
        data.map((p: any) => ({
          id: p.id,
          templateId: p.template_id,
          templateName: p.templates?.name || 'Template',
          templateSlug: p.templates?.slug || '',
          templateImage: p.templates?.image_url || '',
          status: p.status,
          purchasedAt: p.purchased_at,
          licenseKey: p.license_key,
        }))
      )
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadPurchases()
  }, [loadPurchases])

  const handleUnlockAllTemplates = async () => {
    setUnlocking(true)
    setUnlockMessage(null)
    try {
      const res = await fetch('/api/dev/unlock-all-templates', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setUnlockMessage({ type: 'error', text: data.error || 'Erro ao desbloquear.' })
        return
      }
      setUnlockMessage({
        type: 'success',
        text: data.message || `${data.count} templates liberados!`,
      })
      await loadPurchases()
    } finally {
      setUnlocking(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
            <CheckCircle className="h-3 w-3" />
            Ativo
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-xs font-medium text-yellow-600">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-1 text-xs font-medium text-gray-600">
            <AlertCircle className="h-3 w-3" />
            {status}
          </span>
        )
    }
  }

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      {/* Header */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={hasRestaurant ? '/painel' : '/'}
              className="text-muted-foreground hover:bg-accent rounded-lg p-2 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-foreground font-semibold">Meus Templates</h1>
              <p className="text-muted-foreground text-sm">Templates que você adquiriu</p>
            </div>
          </div>
          {showDevUnlock ? (
            <button
              onClick={handleUnlockAllTemplates}
              disabled={unlocking}
              className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 inline-flex items-center gap-2 self-start rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 sm:self-center"
            >
              {unlocking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              {unlocking ? 'Liberando...' : 'Liberar todos os templates'}
            </button>
          ) : null}
        </div>
        {showDevUnlock && unlockMessage && (
          <div
            className={`mx-auto max-w-4xl px-4 pb-3 text-sm ${unlockMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}
          >
            {unlockMessage.text}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <OrderListSkeleton count={3} />
        ) : purchases.length === 0 ? (
          <EmptyState
            variant="orders"
            title="Você ainda não tem templates"
            description="Os templates que você comprar aparecerão aqui"
            action={{
              label: 'Ver Templates',
              href: '/templates',
            }}
          />
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-card border-border hover:border-primary/30 rounded-2xl border p-5 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Imagem */}
                  <div className="bg-muted h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                    {purchase.templateImage && (
                      <img
                        src={purchase.templateImage}
                        alt={purchase.templateName}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-foreground font-semibold">{purchase.templateName}</h3>
                        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(purchase.purchasedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      {getStatusBadge(purchase.status)}
                    </div>

                    {/* Actions */}
                    {purchase.status === 'active' && (
                      <div className="mt-4 flex gap-3">
                        {hasRestaurant ? (
                          <Link
                            href="/painel"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Acessar Painel
                          </Link>
                        ) : (
                          <Link
                            href={`/painel/criar-restaurante?template=${purchase.templateSlug}`}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            Configurar Meu Cardápio
                          </Link>
                        )}
                        {purchase.licenseKey && (
                          <button
                            onClick={() => navigator.clipboard.writeText(purchase.licenseKey!)}
                            className="bg-secondary text-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                          >
                            <Package className="h-4 w-4" />
                            Copiar Licença
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

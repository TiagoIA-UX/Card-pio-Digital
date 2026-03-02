"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
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
  Unlock
} from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { OrderListSkeleton } from "@/components/shared/loading-skeleton"

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
  const [loading, setLoading] = useState(true)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [hasRestaurant, setHasRestaurant] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockMessage, setUnlockMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  const loadPurchases = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      window.location.href = '/login?redirect=/meus-templates'
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
      .select(`
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
      `)
      .eq('user_id', session.user.id)
      .order('purchased_at', { ascending: false })

    if (!error && data) {
      setPurchases(data.map((p: any) => ({
        id: p.id,
        templateId: p.template_id,
        templateName: p.templates?.name || 'Template',
        templateSlug: p.templates?.slug || '',
        templateImage: p.templates?.image_url || '',
        status: p.status,
        purchasedAt: p.purchased_at,
        licenseKey: p.license_key
      })))
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
      setUnlockMessage({ type: 'success', text: data.message || `${data.count} templates liberados!` })
      await loadPurchases()
    } finally {
      setUnlocking(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
            <CheckCircle className="h-3 w-3" />
            Ativo
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-500/10 text-gray-600 text-xs font-medium">
            <AlertCircle className="h-3 w-3" />
            {status}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href={hasRestaurant ? "/painel" : "/"} 
              className="p-2 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-foreground">Meus Templates</h1>
              <p className="text-sm text-muted-foreground">Templates que você adquiriu</p>
            </div>
          </div>
          <button
            onClick={handleUnlockAllTemplates}
            disabled={unlocking}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {unlocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
            {unlocking ? 'Liberando...' : 'Liberar todos os templates'}
          </button>
        </div>
        {unlockMessage && (
          <div className={`mx-auto max-w-4xl px-4 pb-3 text-sm ${unlockMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
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
              label: "Ver Templates",
              href: "/templates"
            }}
          />
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div 
                key={purchase.id}
                className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 transition-colors"
              >
                <div className="flex gap-4">
                  {/* Imagem */}
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {purchase.templateImage && (
                      <img
                        src={purchase.templateImage}
                        alt={purchase.templateName}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {purchase.templateName}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(purchase.purchasedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      {getStatusBadge(purchase.status)}
                    </div>

                    {/* Actions */}
                    {purchase.status === 'active' && (
                      <div className="flex gap-3 mt-4">
                        {hasRestaurant ? (
                          <Link
                            href="/painel"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Acessar Painel
                          </Link>
                        ) : (
                          <Link
                            href={`/painel/criar-restaurante?template=${purchase.templateSlug}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                          >
                            <Settings className="h-4 w-4" />
                            Configurar Meu Cardápio
                          </Link>
                        )}
                        {purchase.licenseKey && (
                          <button
                            onClick={() => navigator.clipboard.writeText(purchase.licenseKey!)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
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

"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Store, Loader2, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { buildRestaurantInstallation } from "@/lib/restaurant-onboarding"
import { normalizeTemplateSlug } from "@/lib/restaurant-customization"

// ========================================
// ARQUITETURA LIMPA:
// - Middleware: Verifica autenticação (ÚNICO ponto)
// - Esta página: Apenas verifica se já tem restaurante
// ========================================

export default function CriarRestaurantePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateParam = searchParams.get('template')?.trim().toLowerCase()
  const templateSlug = templateParam ? normalizeTemplateSlug(templateParam) : null
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    slug: '',
    telefone: ''
  })
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const checkExistingRestaurant = async () => {
      // NÃO verificar sessão - middleware já fez isso
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Se não tem sessão aqui, deixar middleware lidar
        setChecking(false)
        return
      }

      const [{ count: activePurchases }, { count: approvedOrders }] = await Promise.all([
        supabase
          .from('user_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('status', 'active'),
        supabase
          .from('template_orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('payment_status', 'approved'),
      ])

      const hasActiveAccess = (activePurchases || 0) > 0 || (approvedOrders || 0) > 0

      if (!hasActiveAccess) {
        router.replace('/templates')
        return
      }

      // Verificar se já tem restaurante
      const { data: existing } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      if (existing) {
        router.replace('/painel')
        return
      }

      setChecking(false)
    }
    checkExistingRestaurant()
  }, [router, supabase])

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNomeChange = (nome: string) => {
    setForm({
      ...form,
      nome,
      slug: generateSlug(nome)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const [{ count: activePurchases }, { count: approvedOrders }] = await Promise.all([
        supabase
          .from('user_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('status', 'active'),
        supabase
          .from('template_orders')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('payment_status', 'approved'),
      ])

      const hasActiveAccess = (activePurchases || 0) > 0 || (approvedOrders || 0) > 0
      if (!hasActiveAccess) {
        throw new Error('Seu acesso ao painel ainda não foi liberado. Conclua a compra antes de criar um cardápio.')
      }

      // Verificar se slug está disponível
      const { data: existing } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', form.slug)
        .single()

      if (existing) {
        throw new Error('Este endereço já está em uso. Escolha outro nome.')
      }

      const slug = templateSlug || 'restaurante'
      const installation = buildRestaurantInstallation(slug, form.nome)
      const basePayload = {
        user_id: session.user.id,
        nome: form.nome,
        slug: form.slug,
        telefone: form.telefone.replace(/\D/g, ''),
        template_slug: installation.templateSlug,
        banner_url: installation.restaurantUpdate.banner_url,
        slogan: installation.restaurantUpdate.slogan ?? null,
        cor_primaria: installation.restaurantUpdate.cor_primaria ?? '#f97316',
        cor_secundaria: installation.restaurantUpdate.cor_secundaria ?? '#ea580c',
        customizacao: installation.restaurantUpdate.customizacao ?? {},
      }

      // Criar restaurante
      const { data: inserted, error: insertError } = await supabase
        .from('restaurants')
        .insert(basePayload)
        .select('id')
        .single()

      if (insertError) throw insertError

      // Inserir produtos de exemplo do template
      if (inserted?.id && installation.sampleProducts.length > 0) {
        const products = installation.sampleProducts.map((p) => ({
          restaurant_id: inserted.id,
          nome: p.nome,
          descricao: p.descricao,
          preco: p.preco,
          categoria: p.categoria,
          imagem_url: p.imagem_url ?? null,
          ordem: p.ordem ?? 0,
          ativo: true,
        }))
        await supabase.from('products').insert(products)
      }

      // Redirecionar para o painel
      router.push('/painel')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar cardápio')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Configure seu Cardápio Digital</h1>
          <p className="text-muted-foreground mt-2">
            Preencha os dados basicos do seu estabelecimento e publique a primeira versao em poucos minutos.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl bg-card border border-border p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => handleNomeChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ex: Pizzaria do Joao, Bar do Ze, Acai da Praia"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Endereco do Cardapio
                </label>
                <div className="flex items-center rounded-lg border border-border bg-secondary/30 overflow-hidden">
                  <span className="px-3 text-sm text-muted-foreground">/r/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => setForm({ ...form, slug: e.target.value })}
                    className="flex-1 px-2 py-2 bg-background text-foreground focus:ring-0 border-0 focus:outline-none"
                    placeholder="pizzaria-do-joao"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Seus clientes acessarao: /r/{form.slug || 'seu-estabelecimento'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  WhatsApp *
                </label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={e => setForm({ ...form, telefone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="5511999999999"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Com codigo do pais 55 e DDD. Exemplo: 5511999999999.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !form.nome || !form.slug || !form.telefone}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Criar Cardapio
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="font-semibold text-foreground">O que acontece depois</p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-muted-foreground">Voce entra no painel com checklist para configurar nome, banner, cores e mapa.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-muted-foreground">Depois cadastra produtos e ja pode compartilhar o link do cardapio.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-muted-foreground">Se usar mesas, o QR Code pode ser gerado direto no painel.</p>
                </div>
              </div>
            </div>

            <div className="mt-0 p-4 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">O que voce vai poder fazer:</p>
              <ul className="space-y-1">
                <li>• Adicionar produtos com fotos e precos</li>
                <li>• Receber pedidos pelo WhatsApp</li>
                <li>• Acompanhar historico de pedidos</li>
                <li>• Personalizar cores, logo e apresentacao</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

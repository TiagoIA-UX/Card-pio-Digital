'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Store,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MessageCircle,
  Circle,
} from 'lucide-react'
import { buildRestaurantInstallation } from '@/lib/restaurant-onboarding'
import { normalizeTemplateSlug } from '@/lib/restaurant-customization'
import { resolveRestaurantCreationEntitlements } from '@/lib/commercial-entitlements'
import { seoConfig } from '@/lib/seo'
import { getCreateDeliveryWizardProgress, getCreateDeliveryWizardSteps } from '@/lib/setup-wizard'

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
  const [remainingCredits, setRemainingCredits] = useState(0)
  const [networkExtraUnits, setNetworkExtraUnits] = useState(0)
  const [form, setForm] = useState({
    nome: '',
    slug: '',
    telefone: '',
  })
  const supabase = useMemo(() => createClient(), [])
  const setupSteps = useMemo(
    () => getCreateDeliveryWizardSteps(form, remainingCredits),
    [form, remainingCredits]
  )
  const completedSteps = useMemo(() => getCreateDeliveryWizardProgress(setupSteps), [setupSteps])
  const supportHref = useMemo(() => {
    const message =
      `Olá, preciso de ajuda para configurar meu canal digital.` +
      ` Nome: ${form.nome || 'não informado'}.` +
      ` Link: /r/${form.slug || 'pendente'}.` +
      ` Template: ${templateSlug || 'restaurante'}.`

    return `https://api.whatsapp.com/send?phone=${seoConfig.supportWhatsApp}&text=${encodeURIComponent(message)}`
  }, [form.nome, form.slug, templateSlug])

  useEffect(() => {
    const checkExistingRestaurant = async () => {
      // NÃO verificar sessão - middleware já fez isso
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        // Se não tem sessão aqui, deixar middleware lidar
        setChecking(false)
        return
      }

      const [{ count: activePurchases }, { data: approvedOrders }] = await Promise.all([
        supabase
          .from('user_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('status', 'active'),
        supabase
          .from('template_orders')
          .select('metadata')
          .eq('user_id', session.user.id)
          .eq('payment_status', 'approved'),
      ])

      const approvedOrderRows = (approvedOrders || []) as Array<{
        metadata?: Record<string, unknown> | null
      }>
      const { count: restaurantsCount } = await supabase
        .from('restaurants')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)

      const entitlements = resolveRestaurantCreationEntitlements({
        activePurchasesCount: activePurchases || 0,
        approvedOrderRows,
        restaurantsCount: restaurantsCount || 0,
      })

      const hasActiveAccess = entitlements.totalCredits > 0
      setRemainingCredits(entitlements.remainingCredits)
      setNetworkExtraUnits(entitlements.networkExtraUnits)

      if (!hasActiveAccess) {
        router.replace('/templates')
        return
      }

      const { data: existing } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', session.user.id)
        .limit(1)
        .maybeSingle()

      if (existing && !templateSlug && entitlements.remainingCredits <= 0) {
        router.replace(`/painel?restaurant=${existing.id}`)
        return
      }

      if (entitlements.remainingCredits <= 0) {
        setError(
          'Você já usou todos os canais digitais liberados pela sua compra atual. Compre outra implantação ou solicite um plano de rede para adicionar mais unidades.'
        )
      }

      setChecking(false)
    }
    checkExistingRestaurant()
  }, [router, supabase, templateSlug])

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
      slug: generateSlug(nome),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) throw new Error('Não autenticado')

      const [{ count: activePurchases }, { data: approvedOrders }, { count: restaurantsCount }] =
        await Promise.all([
          supabase
            .from('user_purchases')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', session.user.id)
            .eq('status', 'active'),
          supabase
            .from('template_orders')
            .select('metadata')
            .eq('user_id', session.user.id)
            .eq('payment_status', 'approved'),
          supabase
            .from('restaurants')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', session.user.id),
        ])

      const entitlements = resolveRestaurantCreationEntitlements({
        activePurchasesCount: activePurchases || 0,
        approvedOrderRows: (approvedOrders || []) as Array<{
          metadata?: Record<string, unknown> | null
        }>,
        restaurantsCount: restaurantsCount || 0,
      })

      if (entitlements.totalCredits <= 0) {
        throw new Error(
          'Seu acesso ao painel ainda não foi liberado. Conclua a compra antes de criar um canal digital.'
        )
      }

      if (!entitlements.canCreateRestaurant) {
        throw new Error(
          'Você já usou todos os canais digitais liberados pela sua compra atual. Compre outra implantação ou solicite um plano de rede para adicionar mais unidades.'
        )
      }

      setRemainingCredits(entitlements.remainingCredits)
      setNetworkExtraUnits(entitlements.networkExtraUnits)

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

      if (inserted?.id && typeof window !== 'undefined') {
        window.localStorage.setItem('active_restaurant_id', inserted.id)
      }

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
      router.push(inserted?.id ? `/painel?restaurant=${inserted.id}` : '/painel')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar canal digital')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-primary mb-2 text-xs font-semibold tracking-[0.24em] uppercase">
            Setup guiado
          </p>
          <div className="from-primary to-primary/80 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-linear-to-br">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-foreground text-2xl font-bold">Configure seu Canal Digital</h1>
          <p className="text-muted-foreground mt-2">
            Preencha os dados basicos do seu estabelecimento e publique a primeira versao em poucos
            minutos.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-card border-border rounded-xl border p-6">
            <div className="border-border bg-secondary/20 mb-5 rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-foreground text-sm font-semibold">Progresso da configuração</p>
                  <p className="text-muted-foreground text-xs">
                    {completedSteps} de {setupSteps.length} etapas concluídas antes de entrar no
                    painel.
                  </p>
                </div>
                <span className="bg-background text-foreground rounded-full px-3 py-1 text-xs font-medium">
                  Etapa {Math.min(completedSteps + 1, setupSteps.length)}
                </span>
              </div>

              <div className="space-y-3">
                {setupSteps.map((step, index) => {
                  const isComplete = step.status === 'complete'
                  const isCurrent = step.status === 'current'

                  return (
                    <div
                      key={step.id}
                      className="bg-background/70 flex items-start gap-3 rounded-lg p-3"
                    >
                      <div className="mt-0.5">
                        {isComplete ? (
                          <CheckCircle2 className="text-primary h-5 w-5" />
                        ) : isCurrent ? (
                          <span className="border-primary text-primary flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-semibold">
                            {index + 1}
                          </span>
                        ) : (
                          <Circle className="text-muted-foreground h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">{step.title}</p>
                        <p className="text-muted-foreground text-xs">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                  placeholder="Ex: Pizzaria do Joao, Bar do Ze, Acai da Praia"
                  required
                />
              </div>

              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Endereco do Cardapio
                </label>
                <div className="border-border bg-secondary/30 flex items-center overflow-hidden rounded-lg border">
                  <span className="text-muted-foreground px-3 text-sm">/r/</span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="bg-background text-foreground flex-1 border-0 px-2 py-2 focus:ring-0 focus:outline-none"
                    placeholder="pizzaria-do-joao"
                    required
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Seus clientes acessarao: /r/{form.slug || 'seu-estabelecimento'}
                </p>
              </div>

              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">WhatsApp *</label>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                  placeholder="5511999999999"
                  required
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Com codigo do pais 55 e DDD. Exemplo: 5511999999999.
                </p>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="bg-secondary/30 text-muted-foreground rounded-lg p-3 text-sm">
                <p>
                  Créditos disponíveis para novos canais digitais:{' '}
                  <span className="text-foreground font-semibold">{remainingCredits}</span>
                </p>
                {networkExtraUnits > 0 ? (
                  <p className="mt-1">
                    Unidades extras de rede já liberadas:{' '}
                    <span className="text-foreground font-semibold">{networkExtraUnits}</span>
                  </p>
                ) : null}
              </div>

              <div className="border-border rounded-lg border p-3 text-sm">
                <p className="text-foreground font-medium">Travou em alguma etapa?</p>
                <p className="text-muted-foreground mt-1">
                  Fale com suporte humano no WhatsApp para terminar a configuração sem perder tempo.
                </p>
                <Link
                  href={supportHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary mt-3 inline-flex items-center gap-2 font-medium hover:underline"
                >
                  <MessageCircle className="h-4 w-4" />
                  Pedir ajuda no WhatsApp
                </Link>
              </div>

              <button
                type="submit"
                disabled={
                  loading || remainingCredits <= 0 || !form.nome || !form.slug || !form.telefone
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold disabled:opacity-50"
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
            <div className="border-border bg-card rounded-xl border p-6">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="text-primary h-5 w-5" />
                <p className="text-foreground font-semibold">O que acontece depois</p>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <CheckCircle2 className="text-primary mt-0.5 h-4 w-4" />
                  <p className="text-muted-foreground">
                    Voce entra no painel com checklist para configurar nome, banner, cores e mapa.
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="text-primary mt-0.5 h-4 w-4" />
                  <p className="text-muted-foreground">
                    Depois cadastra produtos e ja pode compartilhar o link do cardapio.
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="text-primary mt-0.5 h-4 w-4" />
                  <p className="text-muted-foreground">
                    Se usar mesas, o QR Code pode ser gerado direto no painel.
                  </p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="text-primary mt-0.5 h-4 w-4" />
                  <p className="text-muted-foreground">
                    Se preferir ajuda humana, o suporte acompanha você no WhatsApp durante a
                    implantação.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 text-muted-foreground mt-0 rounded-xl p-4 text-sm">
              <p className="text-foreground mb-2 font-medium">O que voce vai poder fazer:</p>
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

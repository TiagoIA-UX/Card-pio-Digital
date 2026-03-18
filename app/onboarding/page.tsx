'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  ImagePlus,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  Store,
  Trash2,
} from 'lucide-react'
import { StatusPedido } from '@/components/status-pedido'

const TIPOS_NEGOCIO = [
  'Delivery',
  'Pizzaria',
  'Hamburgueria',
  'Lanchonete',
  'Restaurante',
  'Bar / Pub',
  'Cafeteria',
  'Açaíteria',
  'Doceria',
  'Outro',
] as const

interface Categoria {
  nome: string
  produtos: Array<{
    nome: string
    descricao: string
    preco: string
    adicionais: string
  }>
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [readyForSubmission, setReadyForSubmission] = useState(false)
  const [statusSteps, setStatusSteps] = useState<Array<{
    key: string
    label: string
    done: boolean
    current: boolean
  }> | null>(null)

  const [form, setForm] = useState({
    nome_negocio: '',
    tipo_negocio: '',
    cidade: '',
    estado: '',
    whatsapp: '',
    instagram: '',
    horario_funcionamento: '',
    taxa_entrega: '',
    area_entrega: '',
    tempo_preparo: '',
    categorias: [
      { nome: '', produtos: [{ nome: '', descricao: '', preco: '', adicionais: '' }] },
    ] as Categoria[],
  })

  useEffect(() => {
    if (!checkout) {
      setLoading(false)
      return
    }

    const poll = async () => {
      const res = await fetch(`/api/pagamento/status?checkout=${checkout}`)

      if (res.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent(`/onboarding?checkout=${checkout}`)}`)
        return
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Não foi possível validar sua compra')
        setLoading(false)
        return
      }

      if (data.restaurant_id) {
        setRestaurantId(data.restaurant_id)
      }
      setReadyForSubmission(
        data.payment_status === 'approved' && data.onboarding_status === 'ready'
      )
      setLoading(false)
    }

    void poll()
  }, [checkout, router])

  const addCategoria = () => {
    setForm((f) => ({
      ...f,
      categorias: [
        ...f.categorias,
        { nome: '', produtos: [{ nome: '', descricao: '', preco: '', adicionais: '' }] },
      ],
    }))
  }

  const removeCategoria = (idx: number) => {
    setForm((f) => ({
      ...f,
      categorias: f.categorias.filter((_, i) => i !== idx),
    }))
  }

  const addProduto = (catIdx: number) => {
    setForm((f) => ({
      ...f,
      categorias: f.categorias.map((cat, i) =>
        i === catIdx
          ? {
              ...cat,
              produtos: [...cat.produtos, { nome: '', descricao: '', preco: '', adicionais: '' }],
            }
          : cat
      ),
    }))
  }

  const removeProduto = (catIdx: number, prodIdx: number) => {
    setForm((f) => ({
      ...f,
      categorias: f.categorias.map((cat, i) =>
        i === catIdx
          ? {
              ...cat,
              produtos: cat.produtos.filter((_, j) => j !== prodIdx),
            }
          : cat
      ),
    }))
  }

  const updateCategoria = (idx: number, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      categorias: f.categorias.map((cat, i) => (i === idx ? { ...cat, [field]: value } : cat)),
    }))
  }

  const updateProduto = (catIdx: number, prodIdx: number, field: string, value: string) => {
    setForm((f) => ({
      ...f,
      categorias: f.categorias.map((cat, i) =>
        i === catIdx
          ? {
              ...cat,
              produtos: cat.produtos.map((p, j) => (j === prodIdx ? { ...p, [field]: value } : p)),
            }
          : cat
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const data = {
        nome_negocio: form.nome_negocio.trim(),
        tipo_negocio: form.tipo_negocio,
        cidade: form.cidade.trim(),
        estado: form.estado.trim(),
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        instagram: form.instagram.trim() || undefined,
        horario_funcionamento: form.horario_funcionamento || undefined,
        taxa_entrega: form.taxa_entrega || undefined,
        area_entrega: form.area_entrega || undefined,
        tempo_preparo: form.tempo_preparo || undefined,
        categorias: form.categorias
          .filter((c) => c.nome.trim())
          .map((c) => ({
            nome: c.nome.trim(),
            produtos: c.produtos
              .filter((p) => p.nome.trim())
              .map((p) => ({
                nome: p.nome.trim(),
                descricao: p.descricao.trim() || undefined,
                preco: p.preco.trim(),
                adicionais: p.adicionais.trim() || undefined,
              })),
          }))
          .filter((c) => c.produtos.length > 0),
      }

      const res = await fetch('/api/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkout: checkout || undefined,
          restaurant_id: restaurantId || undefined,
          data,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao enviar')

      if (checkout) {
        const statusRes = await fetch(`/api/onboarding/status?checkout=${checkout}`)
        const statusData = await statusRes.json()
        if (statusData.steps) setStatusSteps(statusData.steps)
      }
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setSubmitting(false)
    }
  }

  if (!checkout && !restaurantId && !loading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="max-w-md px-4 text-center">
          <p className="text-foreground/80 mb-4">
            Esta etapa fica disponível após a compra com implantação pela equipe.
          </p>
          <Link href="/" className="text-primary font-medium hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    )
  }

  if (!loading && checkout && !readyForSubmission) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="max-w-md px-4 text-center">
          <p className="text-foreground/80 mb-4">
            Seu pagamento ainda está em validação. Assim que a liberação for confirmada, este
            formulário ficará disponível.
          </p>
          <Link
            href={`/pagamento/sucesso?checkout=${checkout}`}
            className="text-primary font-medium hover:underline"
          >
            Voltar para a confirmação do pagamento
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b p-4">
        <div className="mx-auto max-w-lg">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-foreground mb-2 text-2xl font-bold">Informações recebidas!</h1>
            <p className="text-foreground/80">
              Nossa equipe vai montar e publicar seu cardápio em até 2 dias úteis após o envio
              completo das informações.
            </p>
          </div>

          {statusSteps && statusSteps.length > 0 && (
            <div className="mb-6">
              <StatusPedido steps={statusSteps} />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link
              href="/painel"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold"
            >
              Acessar meu painel
            </Link>
            {checkout && (
              <Link
                href={`/status?checkout=${checkout}`}
                className="text-primary text-center text-sm hover:underline"
              >
                Acompanhar status do pedido
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/painel"
            className="text-foreground/75 hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="text-foreground font-semibold">Formulário do cardápio</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-foreground text-2xl font-bold">
            Envie as informações do seu negócio
          </h1>
          <p className="text-foreground/80 mt-2">
            Envie os dados completos para nossa equipe montar e publicar seu cardápio em até 48
            horas úteis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações do negócio */}
          <section className="border-border bg-card rounded-2xl border p-6">
            <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
              <Store className="text-primary h-5 w-5" />
              Informações do negócio
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Nome do negócio *
                </label>
                <input
                  type="text"
                  value={form.nome_negocio}
                  onChange={(e) => setForm({ ...form, nome_negocio: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 outline-none"
                  placeholder="Ex: Pizzaria do Centro"
                  required
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Tipo de negócio *
                </label>
                <select
                  aria-label="Tipo de negócio"
                  title="Tipo de negócio"
                  value={form.tipo_negocio}
                  onChange={(e) => setForm({ ...form, tipo_negocio: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 outline-none"
                  required
                >
                  <option value="">Selecione</option>
                  {TIPOS_NEGOCIO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Cidade e estado *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="border-border bg-background text-foreground focus:border-primary flex-1 rounded-xl border px-4 py-3 outline-none"
                    placeholder="Cidade"
                    required
                  />
                  <input
                    type="text"
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="border-border bg-background text-foreground focus:border-primary w-20 rounded-xl border px-4 py-3 outline-none"
                    placeholder="UF"
                    maxLength={2}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  WhatsApp para pedidos *
                </label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 outline-none"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Instagram ou rede social
                </label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 outline-none"
                  placeholder="@seunegocio"
                />
              </div>
            </div>
          </section>

          {/* Informações do delivery */}
          <section className="border-border bg-card rounded-2xl border p-6">
            <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
              <MapPin className="text-primary h-5 w-5" />
              Informações do delivery
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Horário de funcionamento
                </label>
                <input
                  type="text"
                  value={form.horario_funcionamento}
                  onChange={(e) => setForm({ ...form, horario_funcionamento: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 outline-none"
                  placeholder="Ex: 18h às 23h"
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Taxa de entrega
                </label>
                <input
                  type="text"
                  value={form.taxa_entrega}
                  onChange={(e) => setForm({ ...form, taxa_entrega: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 outline-none"
                  placeholder="Ex: R$ 5 ou grátis acima de R$ 50"
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Área de entrega
                </label>
                <input
                  type="text"
                  value={form.area_entrega}
                  onChange={(e) => setForm({ ...form, area_entrega: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 outline-none"
                  placeholder="Ex: Centro e bairros próximos"
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  Tempo médio de preparo
                </label>
                <input
                  type="text"
                  value={form.tempo_preparo}
                  onChange={(e) => setForm({ ...form, tempo_preparo: e.target.value })}
                  className="border-border bg-background text-foreground focus:border-primary w-full rounded-xl border px-4 py-3 outline-none"
                  placeholder="Ex: 30 a 45 min"
                />
              </div>
            </div>
          </section>

          {/* Cardápio */}
          <section className="border-border bg-card rounded-2xl border p-6">
            <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
              <MessageCircle className="text-primary h-5 w-5" />
              Cardápio
            </h2>
            <p className="text-foreground/80 mb-4 text-sm">
              Adicione categorias e produtos. As fotos podem ser enviadas depois pelo WhatsApp.
            </p>

            {form.categorias.map((cat, catIdx) => (
              <div key={catIdx} className="border-border bg-muted/30 mb-6 rounded-xl border p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={cat.nome}
                    onChange={(e) => updateCategoria(catIdx, 'nome', e.target.value)}
                    className="border-border bg-background text-foreground focus:border-primary flex-1 rounded-lg border px-3 py-2 outline-none"
                    placeholder="Nome da categoria (ex: Pizzas)"
                  />
                  <button
                    type="button"
                    onClick={() => removeCategoria(catIdx)}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                    aria-label="Remover categoria"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {cat.produtos.map((prod, prodIdx) => (
                  <div
                    key={prodIdx}
                    className="border-border/50 bg-background mb-3 ml-4 rounded-lg border p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={prod.nome}
                        onChange={(e) => updateProduto(catIdx, prodIdx, 'nome', e.target.value)}
                        placeholder="Nome do produto"
                        className="border-border focus:border-primary rounded-lg border px-3 py-2 text-sm outline-none"
                      />
                      <input
                        type="text"
                        value={prod.preco}
                        onChange={(e) => updateProduto(catIdx, prodIdx, 'preco', e.target.value)}
                        placeholder="Preço (ex: 29,90)"
                        className="border-border focus:border-primary rounded-lg border px-3 py-2 text-sm outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={prod.descricao}
                      onChange={(e) => updateProduto(catIdx, prodIdx, 'descricao', e.target.value)}
                      placeholder="Descrição (opcional)"
                      className="border-border focus:border-primary mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    />
                    <input
                      type="text"
                      value={prod.adicionais}
                      onChange={(e) => updateProduto(catIdx, prodIdx, 'adicionais', e.target.value)}
                      placeholder="Adicionais/complementos (opcional)"
                      className="border-border focus:border-primary mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeProduto(catIdx, prodIdx)}
                      className="mt-2 text-xs text-red-500 hover:underline"
                    >
                      Remover produto
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addProduto(catIdx)}
                  className="text-primary mt-2 flex items-center gap-1 text-sm hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar produto
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addCategoria}
              className="border-primary/50 text-primary hover:border-primary hover:bg-primary/5 flex items-center gap-2 rounded-xl border-2 border-dashed px-4 py-3"
            >
              <Plus className="h-5 w-5" />
              Adicionar categoria
            </button>
          </section>

          {/* Upload - placeholder para envio via WhatsApp */}
          <section className="border-border bg-card rounded-2xl border p-6">
            <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
              <ImagePlus className="text-primary h-5 w-5" />
              Logo e fotos
            </h2>
            <p className="text-foreground/80 text-sm">
              Envie a logo e as fotos dos produtos pelo WhatsApp após o formulário. Nossa equipe
              cuida da configuração.
            </p>
          </section>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 font-semibold transition disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Enviar informações
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}

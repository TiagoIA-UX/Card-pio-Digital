'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()
  const checkout = searchParams.get('checkout')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [statusSteps, setStatusSteps] = useState<Array<{ key: string; label: string; done: boolean; current: boolean }> | null>(null)

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
    categorias: [{ nome: '', produtos: [{ nome: '', descricao: '', preco: '', adicionais: '' }] }] as Categoria[],
  })

  useEffect(() => {
    if (!checkout) {
      setLoading(false)
      return
    }

    const poll = async () => {
      const res = await fetch(`/api/pagamento/status?checkout=${checkout}`)
      const data = await res.json()
      if (data.restaurant_id) {
        setRestaurantId(data.restaurant_id)
      }
      setLoading(false)
    }

    poll()
  }, [checkout])

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
              produtos: [
                ...cat.produtos,
                { nome: '', descricao: '', preco: '', adicionais: '' },
              ],
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
      categorias: f.categorias.map((cat, i) =>
        i === idx ? { ...cat, [field]: value } : cat
      ),
    }))
  }

  const updateProduto = (
    catIdx: number,
    prodIdx: number,
    field: string,
    value: string
  ) => {
    setForm((f) => ({
      ...f,
      categorias: f.categorias.map((cat, i) =>
        i === catIdx
          ? {
              ...cat,
              produtos: cat.produtos.map((p, j) =>
                j === prodIdx ? { ...p, [field]: value } : p
              ),
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="max-w-md px-4 text-center">
          <p className="text-muted-foreground mb-4">
            Acesse esta página após concluir sua compra do plano Feito Pra Você.
          </p>
          <Link
            href="/"
            className="text-primary hover:underline font-medium"
          >
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
        <div className="mx-auto max-w-lg">
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Informações recebidas!
            </h1>
            <p className="text-muted-foreground">
              Seu cardápio está sendo preparado. Nossa equipe monta e publica em até 48
              horas úteis.
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
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Acessar meu painel
            </Link>
            {checkout && (
              <Link
                href={`/status?checkout=${checkout}`}
                className="text-center text-sm text-primary hover:underline"
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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/painel"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <span className="font-semibold text-foreground">Formulário do cardápio</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Complete as informações do seu negócio
          </h1>
          <p className="text-muted-foreground mt-2">
            O prazo de produção começa após o envio completo das informações solicitadas.
            Após o envio, nossa equipe monta e publica seu cardápio digital em até 48
            horas úteis.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações do negócio */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <Store className="h-5 w-5 text-primary" />
              Informações do negócio
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Nome do negócio *
                </label>
                <input
                  type="text"
                  value={form.nome_negocio}
                  onChange={(e) => setForm({ ...form, nome_negocio: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                  placeholder="Ex: Pizzaria do Centro"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Tipo de negócio *
                </label>
                <select
                  value={form.tipo_negocio}
                  onChange={(e) => setForm({ ...form, tipo_negocio: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
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
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Cidade e estado *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                    placeholder="Cidade"
                    required
                  />
                  <input
                    type="text"
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                    className="w-20 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                    placeholder="UF"
                    maxLength={2}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  WhatsApp para pedidos *
                </label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Instagram ou rede social
                </label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                  placeholder="@seunegocio"
                />
              </div>
            </div>
          </section>

          {/* Informações do delivery */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              Informações do delivery
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Horário de funcionamento
                </label>
                <input
                  type="text"
                  value={form.horario_funcionamento}
                  onChange={(e) =>
                    setForm({ ...form, horario_funcionamento: e.target.value })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                  placeholder="Ex: 18h às 23h"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Taxa de entrega
                </label>
                <input
                  type="text"
                  value={form.taxa_entrega}
                  onChange={(e) => setForm({ ...form, taxa_entrega: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                  placeholder="Ex: R$ 5 ou grátis acima de R$ 50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Área de entrega
                </label>
                <input
                  type="text"
                  value={form.area_entrega}
                  onChange={(e) => setForm({ ...form, area_entrega: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                  placeholder="Ex: Centro e bairros próximos"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Tempo médio de preparo
                </label>
                <input
                  type="text"
                  value={form.tempo_preparo}
                  onChange={(e) => setForm({ ...form, tempo_preparo: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
                  placeholder="Ex: 30 a 45 min"
                />
              </div>
            </div>
          </section>

          {/* Cardápio */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <MessageCircle className="h-5 w-5 text-primary" />
              Cardápio
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Adicione categorias e produtos. Você pode enviar fotos dos produtos depois
              via WhatsApp.
            </p>

            {form.categorias.map((cat, catIdx) => (
              <div
                key={catIdx}
                className="mb-6 rounded-xl border border-border bg-muted/30 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={cat.nome}
                    onChange={(e) =>
                      updateCategoria(catIdx, 'nome', e.target.value)
                    }
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
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
                    className="mb-3 ml-4 rounded-lg border border-border/50 bg-background p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={prod.nome}
                        onChange={(e) =>
                          updateProduto(catIdx, prodIdx, 'nome', e.target.value)
                        }
                        placeholder="Nome do produto"
                        className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <input
                        type="text"
                        value={prod.preco}
                        onChange={(e) =>
                          updateProduto(catIdx, prodIdx, 'preco', e.target.value)
                        }
                        placeholder="Preço (ex: 29,90)"
                        className="rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <input
                      type="text"
                      value={prod.descricao}
                      onChange={(e) =>
                        updateProduto(catIdx, prodIdx, 'descricao', e.target.value)
                      }
                      placeholder="Descrição (opcional)"
                      className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <input
                      type="text"
                      value={prod.adicionais}
                      onChange={(e) =>
                        updateProduto(catIdx, prodIdx, 'adicionais', e.target.value)
                      }
                      placeholder="Adicionais/complementos (opcional)"
                      className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
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
                  className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar produto
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addCategoria}
              className="flex items-center gap-2 rounded-xl border-2 border-dashed border-primary/50 px-4 py-3 text-primary hover:border-primary hover:bg-primary/5"
            >
              <Plus className="h-5 w-5" />
              Adicionar categoria
            </button>
          </section>

          {/* Upload - placeholder para envio via WhatsApp */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
              <ImagePlus className="h-5 w-5 text-primary" />
              Logo e fotos
            </h2>
            <p className="text-muted-foreground text-sm">
              Você pode enviar a logo do seu negócio e fotos dos produtos pelo WhatsApp
              após enviar este formulário. Nossa equipe irá configurar tudo.
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
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
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Store,
  User,
  Mail,
  Phone,
  DollarSign,
  FileText,
  ExternalLink,
} from 'lucide-react'

const TEMPLATE_OPTIONS = [
  { value: 'restaurante', label: 'Restaurante / Marmitaria' },
  { value: 'pizzaria', label: 'Pizzaria' },
  { value: 'lanchonete', label: 'Hamburgueria / Lanchonete' },
  { value: 'bar', label: 'Bar / Pub' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'acai', label: 'Açaíteria' },
  { value: 'sushi', label: 'Japonês / Sushi' },
  { value: 'adega', label: 'Adega / Delivery de Bebidas' },
  { value: 'mercadinho', label: 'Mercadinho / Minimercado' },
  { value: 'padaria', label: 'Padaria / Confeitaria' },
  { value: 'sorveteria', label: 'Sorveteria' },
  { value: 'acougue', label: 'Açougue / Casa de Carnes' },
  { value: 'hortifruti', label: 'Hortifruti' },
  { value: 'petshop', label: 'Pet Shop' },
  { value: 'doceria', label: 'Doceria / Confeitaria' },
]

const PLAN_OPTIONS = [
  { value: 'basico', label: 'Básico' },
  { value: 'pro', label: 'Pro' },
  { value: 'premium', label: 'Premium' },
]

interface Resultado {
  restaurant: { id: string; slug: string; nome: string; url: string }
  owner: { id: string; email: string }
  message: string
}

export default function VendaDiretaPage() {
  const supabase = createClient()
  const router = useRouter()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    restaurantName: '',
    customerName: '',
    email: '',
    phone: '',
    templateSlug: 'restaurante',
    planSlug: 'basico',
    valorPago: 197,
    observacao: '',
  })

  const checkAdmin = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (!adminCheck) {
      router.push('/painel')
      return
    }

    setIsAdmin(true)
    setLoading(false)
  }, [router, supabase])

  useEffect(() => {
    checkAdmin()
  }, [checkAdmin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setResultado(null)

    try {
      const res = await fetch('/api/admin/venda-direta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro desconhecido')
        return
      }

      setResultado(data)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: name === 'valorPago' ? Number(value) : value,
    }))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-card border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="hover:bg-secondary rounded-lg p-2">
              <ArrowLeft className="text-muted-foreground h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-foreground text-xl font-bold">Venda Direta</h1>
              <p className="text-muted-foreground text-sm">
                100% da receita fica com você — sem comissão de afiliado
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Info box */}
        <div className="mb-8 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex gap-3">
            <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                Venda direta = 100% receita sua
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Quando você cadastra um cliente por aqui, a venda é marcada como
                &quot;admin_direct&quot;. Nenhuma comissão de afiliado é gerada — nem agora, nem nas
                renovações futuras.
              </p>
            </div>
          </div>
        </div>

        {resultado ? (
          /* Resultado de sucesso */
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <h2 className="text-lg font-bold text-green-700 dark:text-green-400">
                  Cliente criado com sucesso!
                </h2>
                <p className="text-muted-foreground text-sm">{resultado.message}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <p>
                <strong>Restaurante:</strong> {resultado.restaurant.nome}
              </p>
              <p>
                <strong>Slug:</strong> /{resultado.restaurant.slug}
              </p>
              <p>
                <strong>Email do dono:</strong> {resultado.owner.email}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={resultado.restaurant.url}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                <ExternalLink className="h-4 w-4" />
                Ver Canal
              </Link>
              <button
                onClick={() => {
                  setResultado(null)
                  setForm({
                    restaurantName: '',
                    customerName: '',
                    email: '',
                    phone: '',
                    templateSlug: 'restaurante',
                    planSlug: 'basico',
                    valorPago: 197,
                    observacao: '',
                  })
                }}
                className="bg-secondary text-foreground inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
              >
                Cadastrar outro cliente
              </button>
            </div>
          </div>
        ) : (
          /* Formulário */
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Dados do cliente */}
            <div className="bg-card rounded-xl border p-6">
              <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
                <User className="h-5 w-5" />
                Dados do Cliente
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Nome do cliente
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    required
                    placeholder="João Silva"
                    className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    <Mail className="mr-1 inline h-3.5 w-3.5" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="joao@email.com"
                    className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    <Phone className="mr-1 inline h-3.5 w-3.5" />
                    WhatsApp / Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="12999887766"
                    className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Dados do restaurante */}
            <div className="bg-card rounded-xl border p-6">
              <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
                <Store className="h-5 w-5" />
                Dados do Restaurante
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Nome do restaurante
                  </label>
                  <input
                    type="text"
                    name="restaurantName"
                    value={form.restaurantName}
                    onChange={handleChange}
                    required
                    placeholder="Pizzaria do João"
                    className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">Template</label>
                  <select
                    name="templateSlug"
                    title="Template"
                    value={form.templateSlug}
                    onChange={handleChange}
                    className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    {TEMPLATE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">Plano</label>
                  <select
                    name="planSlug"
                    title="Plano"
                    value={form.planSlug}
                    onChange={handleChange}
                    className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  >
                    {PLAN_OPTIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="bg-card rounded-xl border p-6">
              <h2 className="text-foreground mb-4 flex items-center gap-2 font-semibold">
                <DollarSign className="h-5 w-5" />
                Pagamento
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Valor pago (R$)
                  </label>
                  <input
                    type="number"
                    name="valorPago"
                    title="Valor pago"
                    value={form.valorPago}
                    onChange={handleChange}
                    min={0}
                    step={0.01}
                    className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex items-end">
                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-sm text-green-600">
                    💰 100% = R$ {form.valorPago.toFixed(2)} para você
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    <FileText className="mr-1 inline h-3.5 w-3.5" />
                    Observação (opcional)
                  </label>
                  <textarea
                    name="observacao"
                    value={form.observacao}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Ex: Venda presencial na pizzaria, pagou no Pix"
                    className="bg-background w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Criando restaurante...
                </>
              ) : (
                <>
                  <Store className="h-5 w-5" />
                  Cadastrar Cliente (Venda Direta)
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Store, Loader2, ArrowRight } from "lucide-react"

export default function CriarRestaurantePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    slug: '',
    telefone: ''
  })
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Verificar se já tem restaurante
      const { data: existing } = await supabase
        .from('restaurants')
        .select('id, status_pagamento')
        .eq('user_id', session.user.id)
        .single()

      if (existing) {
        // Se já tem restaurante, verificar se precisa pagar
        if (existing.status_pagamento !== 'ativo') {
          router.push('/checkout')
        } else {
          router.push('/painel')
        }
        return
      }

      setCheckingAuth(false)
    }
    checkAuth()
  }, [])

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

      // Verificar se slug está disponível
      const { data: existing } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', form.slug)
        .single()

      if (existing) {
        throw new Error('Este endereço já está em uso. Escolha outro nome.')
      }

      // Criar restaurante
      const { data: inserted, error: insertError } = await supabase
        .from('restaurants')
        .insert({
          user_id: session.user.id,
          nome: form.nome,
          slug: form.slug,
          telefone: form.telefone.replace(/\D/g, ''),
          status_pagamento: 'pendente',
          plano: 'free',
          plan_slug: 'basico'
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // Registrar evento de ativação: restaurante criado
      if (inserted?.id) {
        await supabase.from('activation_events').insert({
          user_id: session.user.id,
          restaurant_id: inserted.id,
          event_type: 'created_restaurant'
        })
      }

      // Redirecionar para checkout
      router.push('/checkout')
    } catch (err: any) {
      setError(err.message || 'Erro ao criar cardápio')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Configure seu Cardápio Digital</h1>
          <p className="text-muted-foreground mt-2">
            Preencha os dados básicos do seu estabelecimento
          </p>
        </div>

        {/* Form */}
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
                placeholder="Ex: Pizzaria do João, Bar do Zé, Açaí da Praia..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Endereço do Cardápio
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
                Seus clientes acessarão: /r/{form.slug || 'seu-estabelecimento'}
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
                Com código do país (55) e DDD. Ex: 5511999999999
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
                  Criar Cardápio
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 rounded-xl bg-secondary/30 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">✨ O que você vai poder fazer:</p>
          <ul className="space-y-1">
            <li>• Adicionar produtos com fotos e preços</li>
            <li>• Receber pedidos pelo WhatsApp</li>
            <li>• Acompanhar histórico de pedidos</li>
            <li>• Personalizar cores e logo</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

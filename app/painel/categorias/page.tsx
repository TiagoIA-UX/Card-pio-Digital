'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient, type Restaurant } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Loader2, X, FolderOpen, Package } from 'lucide-react'
import { getRestaurantTemplateConfig } from '@/lib/templates-config'

type ProductRow = { id: string; categoria: string }

export default function CategoriasPage() {
  const [categories, setCategories] = useState<string[]>([])
  const [products, setProducts] = useState<{ id: string; categoria: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const { data: rest } = await supabase
      .from('restaurants')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (!rest) return
    setRestaurant(rest as Restaurant)

    const cust = (rest.customizacao as { customCategories?: string[] } | null)?.customCategories
    const templateCats = [
      ...new Set(getRestaurantTemplateConfig(rest.template_slug).sampleProducts.map((p) => p.categoria)),
    ]
    const savedCategories = cust != null ? cust : templateCats

    const { data: prods } = await supabase
      .from('products')
      .select('id, categoria')
      .eq('restaurant_id', rest.id)

    setProducts(prods || [])
    const productCategories = [...new Set((prods || []).map((p: ProductRow) => p.categoria).filter(Boolean))] as string[]
    const merged =
      savedCategories.length > 0
        ? [...savedCategories, ...productCategories.filter((c: string) => !savedCategories.includes(c))]
        : [...productCategories].sort()
    setCategories(merged)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => void loadData(), 0)
    return () => clearTimeout(timer)
  }, [loadData])

  const openModal = (category?: string) => {
    if (category) {
      setEditingCategory(category)
      setFormName(category)
    } else {
      setEditingCategory(null)
      setFormName('')
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormName('')
  }

  const persistCategories = useCallback(
    async (newCategories: string[]) => {
      if (!restaurant) return
      const cust = (restaurant.customizacao as Record<string, unknown>) || {}
      await supabase
        .from('restaurants')
        .update({
          customizacao: {
            ...cust,
            customCategories: newCategories.length > 0 ? newCategories : [],
          },
        })
        .eq('id', restaurant.id)
    },
    [restaurant, supabase]
  )

  const handleSave = async () => {
    const name = formName.trim()
    if (!name) return
    setSaving(true)

    if (editingCategory) {
      if (name !== editingCategory) {
        await supabase
          .from('products')
          .update({ categoria: name })
          .eq('restaurant_id', restaurant!.id)
          .eq('categoria', editingCategory)
        const newCategories = categories.map((c) => (c === editingCategory ? name : c))
        setCategories(newCategories)
        await persistCategories(newCategories)
      }
    } else {
      if (categories.includes(name)) {
        setSaving(false)
        return
      }
      const newCategories = [...categories, name]
      setCategories(newCategories)
      await persistCategories(newCategories)
    }

    await loadData()
    closeModal()
    setSaving(false)
  }

  const handleDelete = async (name: string) => {
    if (!confirm(`Excluir a categoria "${name}"? Os produtos serão movidos para "Geral".`)) return

    const count = products.filter((p) => p.categoria === name).length
    if (count > 0) {
      await supabase
        .from('products')
        .update({ categoria: 'Geral' })
        .eq('restaurant_id', restaurant!.id)
        .eq('categoria', name)
    }

    const newCategories = categories.filter((c) => c !== name)
    setCategories(newCategories)
    await persistCategories(newCategories)
    await loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl min-w-0 px-4 py-6 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">{categories.length} categorias cadastradas</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/painel/produtos"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition-colors"
          >
            <Package className="h-4 w-4" />
            Produtos
          </Link>
          <button
          onClick={() => openModal()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            Nova Categoria
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="space-y-6">
          <div className="bg-card border-border rounded-xl border py-12 text-center">
            <div className="bg-secondary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <FolderOpen className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 font-semibold">Nenhuma categoria ainda</h3>
            <p className="text-muted-foreground mb-4">
              Crie categorias para organizar seus produtos no cardápio (ex: Pizzas, Bebidas, Sobremesas).
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => openModal()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2"
              >
                Adicionar Categoria
              </button>
              <Link
                href="/painel/produtos"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm transition-colors"
              >
                <Package className="h-4 w-4" />
                Ir para Produtos
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const productCount = products.filter((p) => p.categoria === cat).length
            return (
              <div
                key={cat}
                className="bg-card border-border flex items-center gap-4 rounded-xl border p-4"
              >
                <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-lg">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-foreground font-semibold">{cat}</h3>
                  <p className="text-muted-foreground text-sm">
                    {productCount} {productCount === 1 ? 'produto' : 'produtos'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal(cat)}
                    className="hover:bg-secondary rounded-lg p-2"
                    title="Editar"
                  >
                    <Pencil className="h-5 w-5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="hover:bg-destructive/10 rounded-lg p-2"
                    title="Excluir"
                  >
                    <Trash2 className="h-5 w-5 text-destructive" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="bg-background relative m-4 w-full max-w-lg rounded-xl shadow-xl">
            <div className="border-border flex items-center justify-between border-b p-4">
              <h3 className="text-foreground text-lg font-bold">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={closeModal}
                className="hover:bg-secondary rounded-lg p-2"
                title="Fechar modal"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Nome *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                  placeholder="Ex: Pizzas Doces"
                />
              </div>
            </div>
            <div className="border-border flex justify-end gap-2 border-t p-4">
              <button
                onClick={closeModal}
                className="hover:bg-secondary text-foreground rounded-lg px-4 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

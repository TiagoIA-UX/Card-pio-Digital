'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient, type Product, type Restaurant } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, X, Upload } from 'lucide-react'

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [planLimitMessage, setPlanLimitMessage] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: '',
    imagem_url: '',
    ativo: true,
  })
  const supabase = createClient()

  const loadProducts = useCallback(async () => {
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
    setRestaurantId(rest.id)
    setRestaurant(rest as any)

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', rest.id)
      .order('categoria')
      .order('ordem')

    setProducts(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProducts()
    }, 0)

    return () => clearTimeout(timer)
  }, [loadProducts])

  const maxProductsAllowed = useMemo(() => {
    const slug = restaurant?.plan_slug || 'basico'
    if (slug === 'basico') return 60
    if (slug === 'pro') return 200
    return null // premium = ilimitado
  }, [restaurant])

  const openModal = (product?: Product) => {
    if (!product && maxProductsAllowed !== null && products.length >= maxProductsAllowed) {
      setPlanLimitMessage(
        restaurant?.plan_slug === 'basico'
          ? 'Você atingiu o limite de 60 produtos do plano Básico. Para cadastrar mais itens, faça upgrade para o plano Profissional.'
          : 'Você atingiu o limite de produtos do seu plano. Para cadastrar mais itens, faça upgrade para um plano superior.'
      )
      return
    }

    if (product) {
      setEditingProduct(product)
      setForm({
        nome: product.nome,
        descricao: product.descricao || '',
        preco: (product.preco ?? product.preco_base).toString(),
        categoria: product.categoria ?? '',
        imagem_url: product.imagem_url || '',
        ativo: product.ativo ?? product.disponivel,
      })
    } else {
      setEditingProduct(null)
      setForm({ nome: '', descricao: '', preco: '', categoria: '', imagem_url: '', ativo: true })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setForm({ nome: '', descricao: '', preco: '', categoria: '', imagem_url: '', ativo: true })
  }

  const handleSave = async () => {
    if (!restaurantId || !form.nome || !form.preco || !form.categoria) return
    setSaving(true)

    // Validação adicional no cliente para evitar estouro de limite
    if (!editingProduct && maxProductsAllowed !== null && products.length >= maxProductsAllowed) {
      setPlanLimitMessage(
        restaurant?.plan_slug === 'basico'
          ? 'Você atingiu o limite de 60 produtos do plano Básico. Para cadastrar mais itens, faça upgrade para o plano Profissional.'
          : 'Você atingiu o limite de produtos do seu plano. Para cadastrar mais itens, faça upgrade para um plano superior.'
      )
      setSaving(false)
      return
    }

    const productData = {
      restaurant_id: restaurantId,
      nome: form.nome,
      descricao: form.descricao || null,
      preco: parseFloat(form.preco.replace(',', '.')),
      categoria: form.categoria,
      imagem_url: form.imagem_url || null,
      ativo: form.ativo,
    }

    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id)
    } else {
      await supabase.from('products').insert(productData)
    }

    await loadProducts()
    closeModal()
    setSaving(false)
  }

  const toggleActive = async (product: Product) => {
    await supabase.from('products').update({ ativo: !product.ativo }).eq('id', product.id)
    await loadProducts()
  }

  const deleteProduct = async (product: Product) => {
    if (!confirm(`Excluir "${product.nome}"?`)) return
    await supabase.from('products').delete().eq('id', product.id)
    await loadProducts()
  }

  // Agrupar por categoria
  const categories = [...new Set(products.map((p) => p.categoria))]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">{products.length} produtos cadastrados</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2"
        >
          <Plus className="h-4 w-4" />
          Novo Produto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-card border-border rounded-xl border py-12 text-center">
          <div className="bg-secondary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Plus className="text-muted-foreground h-8 w-8" />
          </div>
          <h3 className="text-foreground mb-2 font-semibold">Nenhum produto ainda</h3>
          <p className="text-muted-foreground mb-4">Comece adicionando seu primeiro produto</p>
          <button
            onClick={() => openModal()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2"
          >
            Adicionar Produto
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat}>
              <h2 className="text-foreground border-border mb-4 border-b pb-2 text-lg font-semibold">
                {cat}
              </h2>
              <div className="grid gap-4">
                {products
                  .filter((p) => p.categoria === cat)
                  .map((product) => (
                    <div
                      key={product.id}
                      className={`bg-card border-border flex items-center gap-4 rounded-xl border p-4 ${!product.ativo ? 'opacity-50' : ''}`}
                    >
                      {product.imagem_url ? (
                        <img
                          src={product.imagem_url}
                          alt={product.nome}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="bg-secondary text-muted-foreground flex h-20 w-20 items-center justify-center rounded-lg">
                          Sem foto
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-foreground font-semibold">{product.nome}</h3>
                          {!product.ativo && (
                            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-600">
                              Inativo
                            </span>
                          )}
                        </div>
                        {product.descricao && (
                          <p className="text-muted-foreground line-clamp-1 text-sm">
                            {product.descricao}
                          </p>
                        )}
                        <p className="text-primary mt-1 font-bold">
                          R$ {Number(product.preco).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(product)}
                          className="hover:bg-secondary rounded-lg p-2"
                          title={product.ativo ? 'Desativar' : 'Ativar'}
                        >
                          {product.ativo ? (
                            <ToggleRight className="h-5 w-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="text-muted-foreground h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => openModal(product)}
                          className="hover:bg-secondary rounded-lg p-2"
                          title="Editar"
                        >
                          <Pencil className="h-5 w-5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product)}
                          className="hover:bg-destructive/10 rounded-lg p-2"
                          title="Excluir"
                        >
                          <Trash2 className="text-destructive h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="bg-background relative m-4 max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl shadow-xl">
            <div className="border-border flex items-center justify-between border-b p-4">
              <h3 className="text-foreground text-lg font-bold">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
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
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                  placeholder="Ex: Pizza Margherita"
                />
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                  rows={3}
                  placeholder="Descreva o produto..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">Preço *</label>
                  <input
                    type="text"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                    className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="text-foreground mb-1 block text-sm font-medium">
                    Categoria *
                  </label>
                  <input
                    type="text"
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                    placeholder="Ex: Pizzas"
                    list="categorias"
                  />
                  <datalist id="categorias">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="text-foreground mb-1 block text-sm font-medium">
                  URL da Imagem
                </label>
                <input
                  type="text"
                  value={form.imagem_url}
                  onChange={(e) => setForm({ ...form, imagem_url: e.target.value })}
                  className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:border-transparent focus:ring-2"
                  placeholder="https://..."
                />
                {form.imagem_url && (
                  <img
                    src={form.imagem_url}
                    alt="Preview"
                    className="mt-2 h-20 w-20 rounded-lg object-cover"
                  />
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="border-border text-primary focus:ring-primary h-4 w-4 rounded"
                />
                <span className="text-foreground text-sm">Produto ativo (visível no cardápio)</span>
              </label>
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
                disabled={saving || !form.nome || !form.preco || !form.categoria}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {planLimitMessage && (
        <div className="fixed right-4 bottom-4 max-w-sm rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-800 shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <p>{planLimitMessage}</p>
            <button
              onClick={() => setPlanLimitMessage(null)}
              className="text-xs text-amber-700 hover:text-amber-900"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

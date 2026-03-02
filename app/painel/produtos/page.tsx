"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient, type Product, type Restaurant } from "@/lib/supabase/client"
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, X, Upload } from "lucide-react"

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
    ativo: true
  })
  const supabase = createClient()

  const loadProducts = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
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
        preco: product.preco.toString(),
        categoria: product.categoria,
        imagem_url: product.imagem_url || '',
        ativo: product.ativo
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
      ativo: form.ativo
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
  const categories = [...new Set(products.map(p => p.categoria))]

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">{products.length} produtos cadastrados</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Produto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-card border border-border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Nenhum produto ainda</h3>
          <p className="text-muted-foreground mb-4">Comece adicionando seu primeiro produto</p>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Adicionar Produto
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map(cat => (
            <div key={cat}>
              <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">{cat}</h2>
              <div className="grid gap-4">
                {products.filter(p => p.categoria === cat).map(product => (
                  <div 
                    key={product.id} 
                    className={`flex items-center gap-4 p-4 rounded-xl bg-card border border-border ${!product.ativo ? 'opacity-50' : ''}`}
                  >
                    {product.imagem_url ? (
                      <img src={product.imagem_url} alt={product.nome} className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                        Sem foto
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{product.nome}</h3>
                        {!product.ativo && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-600">Inativo</span>
                        )}
                      </div>
                      {product.descricao && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{product.descricao}</p>
                      )}
                      <p className="font-bold text-primary mt-1">
                        R$ {Number(product.preco).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(product)}
                        className="p-2 rounded-lg hover:bg-secondary"
                        title={product.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {product.ativo ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => openModal(product)}
                        className="p-2 rounded-lg hover:bg-secondary"
                        title="Editar"
                      >
                        <Pencil className="h-5 w-5 text-blue-600" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product)}
                        className="p-2 rounded-lg hover:bg-destructive/10"
                        title="Excluir"
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
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
          <div className="relative w-full max-w-lg bg-background rounded-xl shadow-xl m-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-bold text-foreground">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-secondary rounded-lg" title="Fechar modal" aria-label="Fechar modal">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nome *</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ex: Pizza Margherita"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder="Descreva o produto..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Preço *</label>
                  <input
                    type="text"
                    value={form.preco}
                    onChange={e => setForm({ ...form, preco: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Categoria *</label>
                  <input
                    type="text"
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ex: Pizzas"
                    list="categorias"
                  />
                  <datalist id="categorias">
                    {categories.map(cat => <option key={cat} value={cat} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={form.imagem_url}
                  onChange={e => setForm({ ...form, imagem_url: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://..."
                />
                {form.imagem_url && (
                  <img src={form.imagem_url} alt="Preview" className="mt-2 w-20 h-20 rounded-lg object-cover" />
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={e => setForm({ ...form, ativo: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Produto ativo (visível no cardápio)</span>
              </label>
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-lg hover:bg-secondary text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.nome || !form.preco || !form.categoria}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {planLimitMessage && (
        <div className="fixed bottom-4 right-4 max-w-sm p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-sm text-amber-800 shadow-lg">
          <div className="flex justify-between items-start gap-3">
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

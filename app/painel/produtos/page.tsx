'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient, type Product, type Restaurant } from '@/lib/shared/supabase/client'
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  Package,
  Store,
  FolderOpen,
} from 'lucide-react'
import { validateImageUrl } from '@/lib/domains/image/image-validation'
import { getRestaurantTemplateConfig } from '@/lib/domains/marketing/templates-config'
import { ImageUploader } from '@/components/shared/image-uploader'
import { getMaxProducts, PLAN_LIMITS } from '@/lib/domains/marketing/pricing'
import { resolveTemplateProductImageUrl } from '@/lib/domains/image/template-product-images'
import {
  getActiveRestaurantForUser,
  getRestaurantScopedHref,
} from '@/lib/domains/core/active-restaurant'

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [planLimitMessage, setPlanLimitMessage] = useState<string | null>(null)
  const [imagemError, setImagemError] = useState<string | null>(null)
  const [importingTemplate, setImportingTemplate] = useState(false)
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

    const rest = await getActiveRestaurantForUser<Restaurant>(supabase, session.user.id)

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
    return getMaxProducts(slug)
  }, [restaurant])

  const openModal = (product?: Product) => {
    if (!product && products.length >= maxProductsAllowed) {
      const planLabel =
        PLAN_LIMITS[restaurant?.plan_slug as keyof typeof PLAN_LIMITS]?.label ?? 'atual'
      setPlanLimitMessage(
        `Você atingiu o limite de ${maxProductsAllowed} produtos do plano ${planLabel}. Para cadastrar mais itens, faça upgrade para um plano superior.`
      )
      return
    }

    if (product) {
      setEditingProduct(product)
      const imgUrl = product.imagem_url || ''
      setForm({
        nome: product.nome,
        descricao: product.descricao || '',
        preco: (product.preco ?? product.preco_base).toString(),
        categoria: product.categoria ?? '',
        imagem_url: imgUrl,
        ativo: product.ativo ?? product.disponivel,
      })
      const imgValidation = imgUrl.trim() ? validateImageUrl(imgUrl) : null
      setImagemError(imgValidation && !imgValidation.valid ? imgValidation.error : null)
    } else {
      setEditingProduct(null)
      setForm({ nome: '', descricao: '', preco: '', categoria: '', imagem_url: '', ativo: true })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setImagemError(null)
    setForm({ nome: '', descricao: '', preco: '', categoria: '', imagem_url: '', ativo: true })
  }

  const handleSave = async () => {
    if (!restaurantId || !form.nome || !form.preco || !form.categoria) return
    setSaving(true)

    // Validação adicional no cliente para evitar estouro de limite
    if (!editingProduct && products.length >= maxProductsAllowed) {
      const planLabel =
        PLAN_LIMITS[restaurant?.plan_slug as keyof typeof PLAN_LIMITS]?.label ?? 'atual'
      setPlanLimitMessage(
        `Você atingiu o limite de ${maxProductsAllowed} produtos do plano ${planLabel}. Para cadastrar mais itens, faça upgrade para um plano superior.`
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
      await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
        .eq('restaurant_id', restaurantId)
    } else {
      await supabase.from('products').insert(productData)
    }

    await loadProducts()
    closeModal()
    setSaving(false)
  }

  const toggleActive = async (product: Product) => {
    if (!restaurantId) return

    await supabase
      .from('products')
      .update({ ativo: !product.ativo })
      .eq('id', product.id)
      .eq('restaurant_id', restaurantId)

    await loadProducts()
  }

  const deleteProduct = async (product: Product) => {
    if (!confirm(`Excluir "${product.nome}"?`)) return
    if (!restaurantId) return

    await supabase.from('products').delete().eq('id', product.id).eq('restaurant_id', restaurantId)
    await loadProducts()
  }

  const templateConfig = useMemo(
    () =>
      restaurant?.template_slug ? getRestaurantTemplateConfig(restaurant.template_slug) : null,
    [restaurant]
  )
  const templateSampleProducts = useMemo(
    () => templateConfig?.sampleProducts ?? [],
    [templateConfig]
  )

  // Calcular produtos faltantes do template
  const missingTemplateProducts = useMemo(() => {
    if (templateSampleProducts.length === 0) return []
    const existingNames = new Set(products.map((p) => `${p.nome}::${p.categoria}`))
    return templateSampleProducts.filter((p) => !existingNames.has(`${p.nome}::${p.categoria}`))
  }, [templateSampleProducts, products])

  const syncFromTemplate = async () => {
    if (!restaurantId) return
    const toSync = products.length === 0 ? templateSampleProducts : missingTemplateProducts
    if (toSync.length === 0) return
    if (products.length + toSync.length > maxProductsAllowed) {
      setPlanLimitMessage('Os produtos do template excedem o limite do seu plano.')
      return
    }
    setImportingTemplate(true)
    const toInsert = toSync.map((p) => ({
      restaurant_id: restaurantId,
      nome: p.nome,
      descricao: p.descricao || null,
      preco: p.preco,
      categoria: p.categoria || 'Geral',
      imagem_url: templateConfig
        ? resolveTemplateProductImageUrl({
            templateSlug: templateConfig.slug,
            product: p,
            fallbackTemplateImageUrl: templateConfig.imageUrl,
          })
        : null,
      ordem: p.ordem ?? 0,
      ativo: true,
    }))
    await supabase.from('products').insert(toInsert)
    await loadProducts()
    setImportingTemplate(false)
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
    <div className="mx-auto max-w-6xl min-w-0 px-4 py-6 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-foreground text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            {products.length} de {maxProductsAllowed} produtos cadastrados no plano atual
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={getRestaurantScopedHref('/painel/categorias', restaurant?.id)}
            className="text-muted-foreground hover:text-foreground border-border flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors"
          >
            <FolderOpen className="h-4 w-4" />
            Categorias
          </Link>
          <button
            onClick={() => openModal()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-blue-500/40 bg-blue-500/10 p-3 text-sm text-blue-800">
        Fazer upgrade não altera o editor nem o canal digital já publicado. O sistema apenas
        destrava a quantidade extra de produtos que esta unidade pode cadastrar conforme o plano.
      </div>

      {products.length === 0 ? (
        <div className="space-y-6">
          {templateSampleProducts.length > 0 && (
            <div className="bg-primary/5 border-primary/20 rounded-xl border p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">
                      Produtos do template disponíveis
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Seu template inclui {templateSampleProducts.length} produtos de exemplo.
                      Importe-os para começar a editar ou adicione os seus do zero.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={syncFromTemplate}
                    disabled={importingTemplate}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium disabled:opacity-50"
                  >
                    {importingTemplate ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                    Importar produtos do template
                  </button>
                  <Link
                    href={getRestaurantScopedHref('/painel/editor', restaurant?.id)}
                    className="text-muted-foreground hover:text-foreground border-border inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors"
                  >
                    <Store className="h-4 w-4" />
                    Editar pelo preview do canal digital
                  </Link>
                </div>
              </div>
            </div>
          )}
          <div className="bg-card border-border rounded-xl border py-12 text-center">
            <div className="bg-secondary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Plus className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground mb-2 font-semibold">Nenhum produto ainda</h3>
            <p className="text-muted-foreground mb-4">
              {templateSampleProducts.length > 0
                ? 'Importe os produtos do template acima ou adicione manualmente'
                : 'Comece adicionando seu primeiro produto'}
            </p>
            <button
              onClick={() => openModal()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2"
            >
              Adicionar Produto
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {missingTemplateProducts.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-6 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Package className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <h3 className="text-foreground text-sm font-semibold">
                      {missingTemplateProducts.length} produtos do template ainda não foram
                      importados
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Seu template tem {templateSampleProducts.length} produtos. Clique para
                      adicionar os {missingTemplateProducts.length} que faltam sem alterar os seus
                      produtos atuais.
                    </p>
                  </div>
                </div>
                <button
                  onClick={syncFromTemplate}
                  disabled={importingTemplate}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {importingTemplate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  Sincronizar produtos faltantes
                </button>
              </div>
            </div>
          )}
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
                        <Image
                          src={product.imagem_url}
                          alt={product.nome}
                          width={80}
                          height={80}
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
                <ImageUploader
                  label="Imagem do produto"
                  value={form.imagem_url}
                  folder="pratos"
                  aspect="1:1"
                  allowUrlInput={false}
                  onChange={(value) => {
                    setForm({ ...form, imagem_url: value })
                    if (value.trim()) {
                      const r = validateImageUrl(value)
                      setImagemError(r.valid ? null : r.error)
                    } else {
                      setImagemError(null)
                    }
                  }}
                />
                {imagemError && <p className="mt-1 text-sm text-red-600">❌ {imagemError}</p>}
                {form.imagem_url && !imagemError && (
                  <Image
                    src={form.imagem_url}
                    alt="Preview"
                    width={80}
                    height={80}
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
                <span className="text-foreground text-sm">
                  Produto ativo (visível no canal digital)
                </span>
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

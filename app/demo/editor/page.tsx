'use client'

/**
 * Editor visual interativo — demonstração ao vivo.
 * Clique em qualquer elemento para editar: foto, nome, descrição, preço.
 * Clonar produto = duplicar. Lixeira = apagar. Câmera = trocar foto.
 * Nenhum dado é salvo no banco. Apenas estado local (React).
 */
import { useRef, useState } from 'react'
import Link from 'next/link'
import {
  Camera,
  Check,
  ChevronLeft,
  Copy,
  ExternalLink,
  Globe,
  ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Rocket,
  Store,
  Trash2,
} from 'lucide-react'
import { buildTemplateDemoData } from '@/lib/templates-config'

// ─── Tipos locais ─────────────────────────────────────────────────────────────

interface EditProduct {
  id: string
  nome: string
  descricao: string
  preco: number
  imagem_url: string | null
  categoria: string
  ativo: boolean
  ordem: number
}

interface EditRestaurant {
  nome: string
  slogan: string
  telefone: string
  cor_primaria: string
  cor_secundaria: string
  endereco_texto: string
  banner_url: string | null
  google_maps_url: string
}

// ─── Inicialização com dados demo ─────────────────────────────────────────────

const DEMO = buildTemplateDemoData('pizzaria')

function initRestaurant(): EditRestaurant {
  const r = DEMO.restaurant
  return {
    nome: r.nome,
    slogan: r.slogan ?? '',
    telefone: '(12) 99688-7993',
    cor_primaria: r.cor_primaria ?? '#dc2626',
    cor_secundaria: r.cor_secundaria ?? '#ea580c',
    endereco_texto: r.endereco_texto ?? '',
    banner_url: r.banner_url ?? null,
    google_maps_url: r.google_maps_url ?? '',
  }
}

function initProducts(): EditProduct[] {
  return DEMO.products.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: (p.descricao as string | undefined) ?? '',
    preco: typeof p.preco === 'string' ? parseFloat(p.preco as string) : (p.preco as number),
    imagem_url: (p.imagem_url as string | null) ?? null,
    categoria: p.categoria,
    ativo: p.ativo,
    ordem: (p.ordem as number | undefined) ?? 0,
  }))
}

const EMOJI_MAP: Record<string, string> = {
  'Pizzas Tradicionais': '🍕',
  'Pizzas Especiais': '⭐',
  'Pizzas Doces': '🍫',
  'Calzones & Esfihas': '🫓',
  'Bordas Recheadas': '🧀',
  Bebidas: '🥤',
  Combos: '🎁',
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function DemoEditorPage() {
  const [restaurant, setRestaurant] = useState<EditRestaurant>(initRestaurant)
  const [products, setProducts] = useState<EditProduct[]>(initProducts)
  const [published, setPublished] = useState(false)

  const categories = [...new Set(products.map((p) => p.categoria))]

  function handlePublish() {
    setPublished(true)
    setTimeout(() => setPublished(false), 2000)
  }

  function updateRestaurant(patch: Partial<EditRestaurant>) {
    setRestaurant((prev) => ({ ...prev, ...patch }))
  }

  function updateProduct(id: string, patch: Partial<EditProduct>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function cloneProduct(product: EditProduct) {
    const clone: EditProduct = {
      ...product,
      id: `clone-${Date.now()}`,
      nome: `${product.nome} (cópia)`,
    }
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === product.id)
      const next = [...prev]
      next.splice(idx + 1, 0, clone)
      return next
    })
  }

  function deleteProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function addProduct(categoria: string) {
    const maxOrdem = products
      .filter((p) => p.categoria === categoria)
      .reduce((m, p) => Math.max(m, p.ordem), 0)
    setProducts((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        nome: 'Novo produto',
        descricao: 'Clique para adicionar uma descrição',
        preco: 0,
        imagem_url: null,
        categoria,
        ativo: true,
        ordem: maxOrdem + 1,
      },
    ])
  }

  function handleProductImage(id: string, file: File) {
    updateProduct(id, { imagem_url: URL.createObjectURL(file) })
  }

  function handleBannerImage(file: File) {
    updateRestaurant({ banner_url: URL.createObjectURL(file) })
  }

  function renameCategory(oldName: string, newName: string) {
    if (!newName.trim() || newName === oldName) return
    setProducts((prev) =>
      prev.map((p) => (p.categoria === oldName ? { ...p, categoria: newName.trim() } : p))
    )
  }

  function cloneCategory(catName: string) {
    const catProducts = products.filter((p) => p.categoria === catName)
    const newName = `${catName} (cópia)`
    const clones = catProducts.map((p) => ({
      ...p,
      id: `clone-cat-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      categoria: newName,
    }))
    setProducts((prev) => [...prev, ...clones])
  }

  function deleteCategory(catName: string) {
    setProducts((prev) => prev.filter((p) => p.categoria !== catName))
  }

  function addNewCategory() {
    const newName = `Nova Categoria`
    setProducts((prev) => [
      ...prev,
      {
        id: `new-cat-${Date.now()}`,
        nome: 'Novo produto',
        descricao: 'Clique para editar',
        preco: 0,
        imagem_url: null,
        categoria: newName,
        ativo: true,
        ordem: 0,
      },
    ])
  }

  return (
    <div className="bg-background flex min-h-screen flex-col">
      {/* Banner demo */}
      <div className="bg-amber-500 py-1.5 text-center text-xs font-semibold text-black">
        🔒 MODO DEMONSTRAÇÃO — Nenhum dado é gravado. Edições acontecem só aqui.
      </div>

      {/* Barra superior */}
      <div className="border-border bg-muted/30 flex items-center justify-between border-b px-4 py-2">
        <Link
          href="/demo"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
        <span className="text-muted-foreground hidden text-xs sm:block">
          Clique em qualquer elemento para editar ao vivo
        </span>
      </div>

      {/* Header */}
      <header className="border-border bg-background flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Store className="text-primary h-5 w-5" />
          <div>
            <p className="text-foreground text-sm font-semibold">Editor Visual</p>
            <p className="text-muted-foreground text-xs">
              📷 foto · ✏️ nome · 💲 preço · 🗑️ apagar · 📋 clonar
            </p>
          </div>
        </div>
        <Link
          href="/comprar/pizzaria"
          onClick={handlePublish}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95"
        >
          {published ? (
            <>
              <Check className="h-4 w-4" />
              <span>Perfeito!</span>
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Publicar meu canal agora</span>
              <span className="sm:hidden">Publicar</span>
            </>
          )}
        </Link>
      </header>

      {/* Layout split */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Painel esquerdo */}
        <aside className="border-border bg-muted/20 hidden w-72 shrink-0 overflow-y-auto border-r lg:block xl:w-75">
          <LeftPanel
            restaurant={restaurant}
            onChange={updateRestaurant}
            categories={categories}
            productCount={products.length}
            onRenameCategory={renameCategory}
            onCloneCategory={cloneCategory}
            onDeleteCategory={deleteCategory}
            onAddCategory={addNewCategory}
          />
        </aside>

        {/* Canvas de edição */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-white dark:bg-zinc-900">
          <EditorCanvas
            restaurant={restaurant}
            products={products}
            categories={categories}
            onClone={cloneProduct}
            onDelete={deleteProduct}
            onUpdate={updateProduct}
            onProductImage={handleProductImage}
            onBannerImage={handleBannerImage}
            onAddProduct={addProduct}
            onRenameCategory={renameCategory}
            onCloneCategory={cloneCategory}
            onDeleteCategory={deleteCategory}
          />
        </main>
      </div>
    </div>
  )
}

// ─── Painel esquerdo ──────────────────────────────────────────────────────────

function LeftPanel({
  restaurant,
  onChange,
  categories,
  productCount,
  onRenameCategory,
  onCloneCategory,
  onDeleteCategory,
  onAddCategory,
}: {
  restaurant: EditRestaurant
  onChange: (patch: Partial<EditRestaurant>) => void
  categories: string[]
  productCount: number
  onRenameCategory: (oldName: string, newName: string) => void
  onCloneCategory: (catName: string) => void
  onDeleteCategory: (catName: string) => void
  onAddCategory: () => void
}) {
  return (
    <div className="space-y-5 p-4">
      {/* Negócio */}
      <section>
        <h3 className="text-foreground mb-3 text-sm font-semibold">Negócio</h3>
        <div className="space-y-2">
          <InlineField
            label="Nome"
            value={restaurant.nome}
            onChange={(v) => onChange({ nome: v })}
          />
          <InlineField
            label="WhatsApp"
            value={restaurant.telefone}
            onChange={(v) => onChange({ telefone: v })}
          />
          <InlineField
            label="Slogan"
            value={restaurant.slogan}
            onChange={(v) => onChange({ slogan: v })}
          />
        </div>
      </section>

      {/* Cores */}
      <section>
        <h3 className="text-foreground mb-3 text-sm font-semibold">Cores</h3>
        <div className="flex gap-4">
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">Primária</label>
            <label className="relative block h-9 w-16 cursor-pointer overflow-hidden rounded-lg border shadow-sm transition-transform hover:scale-105">
              <div className="h-full w-full" style={{ backgroundColor: restaurant.cor_primaria }} />
              <input
                type="color"
                aria-label="Cor primária"
                title="Cor primária"
                value={restaurant.cor_primaria}
                onChange={(e) => onChange({ cor_primaria: e.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
          <div>
            <label className="text-muted-foreground mb-1 block text-xs">Secundária</label>
            <label className="relative block h-9 w-16 cursor-pointer overflow-hidden rounded-lg border shadow-sm transition-transform hover:scale-105">
              <div
                className="h-full w-full"
                style={{ backgroundColor: restaurant.cor_secundaria }}
              />
              <input
                type="color"
                aria-label="Cor secundária"
                title="Cor secundária"
                value={restaurant.cor_secundaria}
                onChange={(e) => onChange({ cor_secundaria: e.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-foreground text-sm font-semibold">Categorias</h3>
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            {productCount} produtos
          </span>
        </div>
        <div className="space-y-1.5">
          {categories.map((cat) => (
            <CategoryRow
              key={cat}
              name={cat}
              emoji={EMOJI_MAP[cat] ?? '📦'}
              onRename={(newName) => onRenameCategory(cat, newName)}
              onClone={() => onCloneCategory(cat)}
              onDelete={() => onDeleteCategory(cat)}
            />
          ))}
        </div>
        <button
          onClick={onAddCategory}
          className="border-border text-primary hover:bg-primary/5 mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova categoria
        </button>
      </section>

      {/* Endereço */}
      <section>
        <h3 className="text-foreground mb-3 text-sm font-semibold">Endereço</h3>
        <InlineField
          label=""
          value={restaurant.endereco_texto}
          onChange={(v) => onChange({ endereco_texto: v })}
          multiline
        />
      </section>
    </div>
  )
}

// ─── CategoryRow (painel esquerdo) ───────────────────────────────────────────

function CategoryRow({
  name,
  emoji,
  onRename,
  onClone,
  onDelete,
}: {
  name: string
  emoji: string
  onRename: (newName: string) => void
  onClone: () => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  function commit() {
    setEditing(false)
    onRename(draft)
  }

  return (
    <div className="border-border bg-background hover:border-primary/40 hover:bg-primary/5 flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors">
      <span className="text-base leading-none">{emoji}</span>
      {editing ? (
        <input
          autoFocus
          aria-label="Nome da categoria"
          placeholder="Nome da categoria"
          className="border-primary min-w-0 flex-1 rounded border px-1 py-0.5 text-xs focus:outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
      ) : (
        <button
          onClick={() => {
            setDraft(name)
            setEditing(true)
          }}
          className="min-w-0 flex-1 text-left"
          title="Renomear categoria"
        >
          <span className="text-foreground truncate text-xs font-medium">{name}</span>
        </button>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={onClone}
          title="Duplicar categoria"
          className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-zinc-700"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          title="Excluir categoria"
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-zinc-700"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// ─── CategoryHeader (canvas) ─────────────────────────────────────────────────

function CategoryHeader({
  name,
  emoji,
  count,
  onRename,
  onClone,
  onDelete,
}: {
  name: string
  emoji: string
  count: number
  onRename: (newName: string) => void
  onClone: () => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)

  function commit() {
    setEditing(false)
    onRename(draft)
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xl">{emoji}</span>
      {editing ? (
        <input
          autoFocus
          aria-label="Nome da categoria"
          placeholder="Nome da categoria"
          className="border-primary rounded-lg border px-2 py-1 text-lg font-bold focus:outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
        />
      ) : (
        <button
          onClick={() => {
            setDraft(name)
            setEditing(true)
          }}
          className="text-foreground text-lg font-bold hover:underline"
          title="Renomear categoria"
        >
          {name}
        </button>
      )}
      <span className="text-muted-foreground text-sm font-normal">({count})</span>
      <div className="ml-1 flex items-center gap-1">
        <button
          onClick={onClone}
          title="Duplicar categoria"
          className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-500 hover:bg-blue-100 hover:text-blue-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Duplicar</span>
        </button>
        <button
          onClick={onDelete}
          title="Excluir categoria"
          className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-500 hover:bg-red-100 hover:text-red-600 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Excluir</span>
        </button>
      </div>
    </div>
  )
}

// ─── Bloco Google Maps ────────────────────────────────────────────────────────

function MapsBlock({
  endereco,
  mapsUrl,
  onEnderecoChange: _onEnderecoChange,
}: {
  endereco: string
  mapsUrl: string
  onEnderecoChange: (v: string) => void
}) {
  const query = encodeURIComponent(endereco || 'Caraguatatuba, SP')
  const linkUrl = mapsUrl || `https://www.google.com/maps/search/?api=1&query=${query}`

  return (
    <div
      className="mx-4 my-6 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/20"
      style={{ background: '#111827' }}
    >
      {/* Cabeçalho escuro */}
      <div
        className="flex items-center justify-between border-b border-white/10 px-4 py-3"
        style={{ background: '#0f172a' }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Localização</span>
        </div>
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Abrir no Maps
        </a>
      </div>

      {/* Card clicável — substitui iframe */}
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-48 w-full flex-col items-center justify-center gap-3 overflow-hidden transition-all hover:brightness-95"
        aria-label="Ver localização no Google Maps"
      >
        {/* Fundo escuro estilo mapa noturno */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #1a2230 0%, #1e2d3d 35%, #162130 65%, #1a2840 100%)',
          }}
        />

        {/* Grade sutil clara */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,179,237,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.4) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Linhas decorativas */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/3 right-0 left-0 h-0.5 bg-blue-300/50" />
          <div className="absolute top-2/3 right-0 left-0 h-px bg-blue-300/30" />
          <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-blue-300/50" />
          <div className="absolute top-0 bottom-0 left-2/3 w-px bg-blue-300/30" />
        </div>

        {/* Conteúdo central */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          {/* Ícone globo com pulso */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 shadow-lg ring-4 ring-slate-700/60 ring-offset-0">
              <Globe className="h-7 w-7 text-blue-400" />
            </div>
          </div>

          {/* Pino de localização sobreposto */}
          <div className="-mt-4 translate-x-5 -translate-y-2">
            <MapPin className="h-5 w-5 fill-red-500 text-red-400 drop-shadow" />
          </div>

          {/* CTA */}
          <div className="mt-1 flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 shadow-md ring-1 ring-white/10 transition-shadow group-hover:shadow-lg">
            <ExternalLink className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Ver localização no Google Maps</span>
          </div>

          <p className="text-xs font-medium text-slate-400">Clique para abrir no mapa</p>
        </div>
      </a>

      {/* Endereço */}
      <div
        className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
        style={{ background: '#0f172a' }}
      >
        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
        <span className="text-sm text-slate-300">{endereco || 'Endereço não informado'}</span>
      </div>
    </div>
  )
}

// ─── Campo inline editável ────────────────────────────────────────────────────

function InlineField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function open() {
    setDraft(value)
    setEditing(true)
  }

  function commit() {
    setEditing(false)
    onChange(draft)
  }

  return (
    <div>
      {label && <label className="text-muted-foreground mb-1 block text-xs">{label}</label>}
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            aria-label={label || 'Campo de texto'}
            placeholder="Digite aqui..."
            className="border-primary w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
          />
        ) : (
          <input
            autoFocus
            aria-label={label || 'Campo de texto'}
            placeholder="Digite aqui..."
            className="border-primary w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
          />
        )
      ) : (
        <button
          onClick={open}
          className="border-border bg-background hover:border-primary/50 flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors"
        >
          <span className="text-foreground min-w-0 flex-1 truncate text-sm">{value || '—'}</span>
          <Pencil className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        </button>
      )}
    </div>
  )
}

// ─── Canvas de edição (painel direito) ────────────────────────────────────────

function EditorCanvas({
  restaurant,
  products,
  categories,
  onClone,
  onDelete,
  onUpdate,
  onProductImage,
  onBannerImage,
  onAddProduct,
  onRenameCategory,
  onCloneCategory,
  onDeleteCategory,
}: {
  restaurant: EditRestaurant
  products: EditProduct[]
  categories: string[]
  onClone: (p: EditProduct) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<EditProduct>) => void
  onProductImage: (id: string, file: File) => void
  onBannerImage: (file: File) => void
  onAddProduct: (categoria: string) => void
  onRenameCategory: (oldName: string, newName: string) => void
  onCloneCategory: (catName: string) => void
  onDeleteCategory: (catName: string) => void
}) {
  const bannerInputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      {/* Capa */}
      <div className="group relative h-44 overflow-hidden sm:h-56">
        {restaurant.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={restaurant.banner_url} alt="Capa" className="h-full w-full object-cover" />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${restaurant.cor_primaria}, ${restaurant.cor_secundaria})`,
            }}
          />
        )}

        {/* Overlay trocar foto */}
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
        >
          <span className="flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-lg">
            <Camera className="h-4 w-4" />
            Trocar foto de capa
          </span>
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          aria-label="Trocar foto de capa"
          title="Trocar foto de capa"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onBannerImage(e.target.files[0])}
        />

        {/* Nome + slogan sobre a capa */}
        <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/70 to-transparent p-4">
          <h1 className="text-xl font-bold text-white drop-shadow-sm">{restaurant.nome}</h1>
          {restaurant.slogan && <p className="text-sm text-white/80">{restaurant.slogan}</p>}
        </div>
      </div>

      {/* Lista de produtos por categoria */}
      <div className="divide-border divide-y px-4 pb-8">
        {categories.map((categoria) => {
          const catProducts = products.filter((p) => p.categoria === categoria)
          return (
            <section key={categoria} className="py-6">
              <CategoryHeader
                name={categoria}
                emoji={EMOJI_MAP[categoria] ?? '📦'}
                count={catProducts.length}
                onRename={(newName) => onRenameCategory(categoria, newName)}
                onClone={() => onCloneCategory(categoria)}
                onDelete={() => onDeleteCategory(categoria)}
              />

              <div className="space-y-3">
                {catProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    primaryColor={restaurant.cor_primaria}
                    onClone={onClone}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                    onImageChange={onProductImage}
                  />
                ))}
              </div>

              {/* Botão adicionar produto */}
              <button
                onClick={() => onAddProduct(categoria)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-3 text-sm text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600 dark:border-zinc-700 dark:hover:border-zinc-500"
              >
                <Plus className="h-4 w-4" />
                Adicionar produto em &ldquo;{categoria}&rdquo;
              </button>
            </section>
          )
        })}
      </div>

      {/* Rodapé — Localização */}
      <MapsBlock
        endereco={restaurant.endereco_texto}
        mapsUrl={restaurant.google_maps_url}
        onEnderecoChange={(v) => {
          /* readonly no canvas — edita no painel */ void v
        }}
      />

      {/* Espaço final */}
      <div className="h-8" />
    </div>
  )
}

// ─── Card de produto editável ─────────────────────────────────────────────────

function ProductCard({
  product,
  primaryColor,
  onClone,
  onDelete,
  onUpdate,
  onImageChange,
}: {
  product: EditProduct
  primaryColor: string
  onClone: (p: EditProduct) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: Partial<EditProduct>) => void
  onImageChange: (id: string, file: File) => void
}) {
  const imgRef = useRef<HTMLInputElement>(null)
  const [editingField, setEditingField] = useState<'nome' | 'descricao' | 'preco' | null>(null)
  const [draft, setDraft] = useState('')

  function startEdit(field: 'nome' | 'descricao' | 'preco') {
    setDraft(field === 'preco' ? product.preco.toFixed(2) : (product[field] as string))
    setEditingField(field)
  }

  function commit() {
    if (!editingField) return
    if (editingField === 'preco') {
      const val = parseFloat(draft.replace(',', '.'))
      if (!isNaN(val) && val >= 0) onUpdate(product.id, { preco: val })
    } else {
      onUpdate(product.id, { [editingField]: draft })
    }
    setEditingField(null)
  }

  return (
    <div className="group relative flex items-start gap-3 rounded-2xl border border-transparent bg-white p-3 shadow-sm transition-all hover:border-gray-200 hover:shadow-md dark:bg-zinc-800 dark:hover:border-zinc-700">
      {/* Foto */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-24">
        {product.imagem_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imagem_url} alt={product.nome} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-zinc-700">
            <ImageIcon className="h-7 w-7 text-gray-300" />
          </div>
        )}
        {/* Overlay câmera */}
        <button
          onClick={() => imgRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
          title="Trocar foto"
        >
          <Camera className="h-5 w-5 text-white" />
        </button>
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          aria-label="Trocar foto do produto"
          title="Trocar foto do produto"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onImageChange(product.id, e.target.files[0])}
        />
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        {/* Nome */}
        {editingField === 'nome' ? (
          <input
            autoFocus
            aria-label="Nome do produto"
            placeholder="Nome do produto"
            className="mb-1 w-full rounded border border-blue-400 px-1 py-0.5 text-sm font-semibold focus:outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
          />
        ) : (
          <button
            onClick={() => startEdit('nome')}
            className="mb-1 flex items-start gap-1 text-left"
            title="Editar nome"
          >
            <span className="text-foreground text-sm leading-snug font-semibold">
              {product.nome}
            </span>
            <Pencil className="mt-0.5 h-3 w-3 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}

        {/* Descrição */}
        {editingField === 'descricao' ? (
          <textarea
            autoFocus
            aria-label="Descrição do produto"
            placeholder="Descrição do produto"
            className="w-full rounded border border-blue-400 px-1 py-0.5 text-xs text-gray-500 focus:outline-none"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
          />
        ) : (
          <button
            onClick={() => startEdit('descricao')}
            className="flex items-start gap-1 text-left"
            title="Editar descrição"
          >
            <span className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
              {product.descricao || 'Clique para adicionar uma descrição'}
            </span>
            <Pencil className="mt-0.5 h-3 w-3 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}

        {/* Preço + ações */}
        <div className="mt-2 flex items-center justify-between">
          {/* Preço */}
          {editingField === 'preco' ? (
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold text-gray-400">R$</span>
              <input
                autoFocus
                type="number"
                step="0.01"
                min="0"
                aria-label="Preço"
                placeholder="0.00"
                className="w-20 rounded border border-blue-400 px-1 py-0.5 text-sm font-bold focus:outline-none"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => e.key === 'Enter' && commit()}
              />
            </div>
          ) : (
            <button
              onClick={() => startEdit('preco')}
              className="flex items-center gap-1"
              title="Editar preço"
            >
              <span className="text-sm font-bold" style={{ color: primaryColor }}>
                {product.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <Pencil className="h-3 w-3 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}

          {/* Ações: clonar + apagar */}
          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <button
              onClick={() => onClone(product)}
              title="Duplicar produto"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-zinc-700"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              title="Excluir produto"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-zinc-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

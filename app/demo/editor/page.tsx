'use client'

/**
 * Demonstração do editor visual para screenshots da landing page.
 */
import Image from 'next/image'
import { Store, Package, Rocket, ExternalLink, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function DemoEditorPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <div className="border-border bg-muted/30 flex items-center justify-between border-b px-4 py-2">
        <Link
          href="/demo"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
        <span className="text-muted-foreground text-sm">Demonstração do editor</span>
      </div>

      {/* Header do editor */}
      <header className="border-border flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground text-sm">Editor Visual</span>
          <button className="text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <Package className="h-4 w-4" />
            Produtos
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-primary text-primary-foreground flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold">
            <Rocket className="h-4 w-4" />
            Publicar meu cardápio agora
          </button>
          <a href="#" className="text-muted-foreground hover:text-foreground rounded-lg p-2">
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
      </header>

      {/* Split: painel lateral + preview */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Painel de edição */}
        <aside className="border-border bg-muted/20 flex w-full shrink-0 flex-col overflow-y-auto border-r lg:w-[320px] xl:w-[380px]">
          <div className="space-y-6 p-4">
            <section>
              <h3 className="text-foreground mb-3 text-sm font-semibold">Negócio</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Nome</label>
                  <input
                    type="text"
                    value="Pizzaria do João"
                    readOnly
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">WhatsApp</label>
                  <input
                    type="tel"
                    value="(11) 99999-9999"
                    readOnly
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Slogan</label>
                  <input
                    type="text"
                    value="A melhor pizza da cidade"
                    readOnly
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-foreground mb-3 text-sm font-semibold">Logo e Banner</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">URL do logo</label>
                  <div className="border-border flex h-12 w-12 items-center justify-center rounded-lg border bg-zinc-100">
                    <Store className="text-muted-foreground h-6 w-6" />
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">URL do banner</label>
                  <div className="border-border h-20 w-full overflow-hidden rounded-lg border bg-zinc-100">
                    <Image
                      src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=120&fit=crop"
                      alt="Banner"
                      width={400}
                      height={120}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-foreground mb-3 text-sm font-semibold">Rodapé e Contato</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-muted-foreground mb-1 block text-xs">Endereço</label>
                  <input
                    type="text"
                    value="Av. Exemplo, 123 - Centro"
                    readOnly
                    className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </section>
          </div>
        </aside>

        {/* Preview do cardápio */}
        <main className="bg-muted/30 flex min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          <div className="bg-background mx-auto w-full max-w-md overflow-hidden rounded-2xl shadow-xl">
            {/* Banner com imagem real */}
            <div className="relative h-48 overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=300&fit=crop&q=85"
                alt="Banner da Pizzaria do João"
                fill
                className="object-cover"
                priority
              />
              {/* Gradiente sobre o banner */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Logo + nome */}
              <div className="absolute bottom-4 left-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 shadow-lg ring-2 ring-white">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white drop-shadow">Pizzaria do João</h2>
                  <p className="text-xs text-orange-200">A melhor pizza da cidade</p>
                </div>
              </div>
            </div>

            {/* Categorias */}
            <div className="flex gap-2 overflow-x-auto border-b border-zinc-100 px-4 py-3">
              {['Pizzas', 'Bebidas', 'Sobremesas'].map((cat, i) => (
                <span
                  key={cat}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    i === 0 ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {cat}
                </span>
              ))}
            </div>

            {/* Produtos */}
            <div className="space-y-3 p-4">
              {[
                {
                  name: 'Margherita',
                  desc: 'Molho de tomate, mussarela e manjericão fresco',
                  price: 'R$ 45,00',
                  img: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=120&h=120&fit=crop&q=70',
                },
                {
                  name: 'Calabresa',
                  desc: 'Calabresa artesanal, cebola roxa e orégano',
                  price: 'R$ 42,00',
                  img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=120&h=120&fit=crop&q=70',
                },
                {
                  name: 'Portuguesa',
                  desc: 'Presunto, ovos, azeitonas e pimentão',
                  price: 'R$ 48,00',
                  img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=120&h=120&fit=crop&q=70',
                },
              ].map((p) => (
                <div
                  key={p.name}
                  className="border-border flex items-center gap-3 rounded-xl border p-3 shadow-sm"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <Image src={p.img} alt={p.name} fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground text-sm font-semibold">{p.name}</p>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">{p.desc}</p>
                    <p className="text-primary mt-1 text-sm font-bold">{p.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

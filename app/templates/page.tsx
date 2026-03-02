"use client"

import React from "react"
import Link from "next/link"
import { 
  Store, 
  Pizza, 
  UtensilsCrossed,
  Beer,
  Coffee,
  IceCream,
  Fish,
  ArrowRight,
  Eye,
  ShoppingCart,
  Sparkles
} from "lucide-react"
import { TemplateCard } from "@/components/templates/template-card"
import { CartButton } from "@/components/cart/cart-button"
import type { Template } from "@/types/template"

const templates: Template[] = [
  {
    id: "restaurante",
    slug: "restaurante",
    name: "Restaurante / Marmitaria",
    description: "Cardápio ideal para restaurantes, marmitarias e self-service. Organizado por pratos executivos, porções e bebidas.",
    shortDescription: "Para restaurantes e marmitarias",
    price: 247,
    originalPrice: 297,
    category: "restaurante",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
    previewUrl: "/templates/restaurante",
    features: ["Pratos executivos", "Marmitas", "Porções", "Bebidas", "Sobremesas"],
    isFeatured: true,
    isNew: false,
    isBestseller: true,
    salesCount: 156,
    ratingAvg: 4.8,
    ratingCount: 42,
    status: "active"
  },
  {
    id: "pizzaria",
    slug: "pizzaria",
    name: "Pizzaria",
    description: "Cardápio completo para pizzarias com opções de tamanhos, sabores e bordas recheadas.",
    shortDescription: "Para pizzarias",
    price: 247,
    originalPrice: 297,
    category: "pizzaria",
    imageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    previewUrl: "/templates/pizzaria",
    features: ["Pizzas tradicionais", "Pizzas especiais", "Bordas recheadas", "Bebidas", "Combos"],
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    salesCount: 89,
    ratingAvg: 4.7,
    ratingCount: 28,
    status: "active"
  },
  {
    id: "lanchonete",
    slug: "lanchonete",
    name: "Hamburgueria / Lanchonete",
    description: "Cardápio para lanchonetes e hamburguerias artesanais. Com adicionais e combos personalizados.",
    shortDescription: "Para lanchonetes e hamburguerias",
    price: 247,
    originalPrice: 297,
    category: "lanchonete",
    imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
    previewUrl: "/templates/lanchonete",
    features: ["Hambúrgueres", "Hot dogs", "Porções", "Bebidas", "Combos"],
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    salesCount: 67,
    ratingAvg: 4.9,
    ratingCount: 19,
    status: "active"
  },
  {
    id: "bar",
    slug: "bar",
    name: "Bar / Pub",
    description: "Cardápio para bares, pubs e casas noturnas. Com drinks, cervejas artesanais e petiscos.",
    shortDescription: "Para bares e pubs",
    price: 247,
    originalPrice: 297,
    category: "bar",
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80",
    previewUrl: "/templates/bar",
    features: ["Cervejas", "Drinks", "Porções", "Sem álcool", "Happy hour"],
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    salesCount: 34,
    ratingAvg: 4.6,
    ratingCount: 12,
    status: "active"
  },
  {
    id: "cafeteria",
    slug: "cafeteria",
    name: "Cafeteria",
    description: "Cardápio para cafeterias, padarias e confeitarias. Com cafés especiais, doces e salgados.",
    shortDescription: "Para cafeterias e padarias",
    price: 247,
    originalPrice: 297,
    category: "cafeteria",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80",
    previewUrl: "/templates/cafeteria",
    features: ["Cafés", "Doces", "Salgados", "Sanduíches", "Bebidas"],
    isFeatured: false,
    isNew: true,
    isBestseller: false,
    salesCount: 45,
    ratingAvg: 4.8,
    ratingCount: 15,
    status: "active"
  },
  {
    id: "acai",
    slug: "acai",
    name: "Açaíteria",
    description: "Cardápio para açaíterias e lanchonetes naturais. Com tigelas, copos e adicionais.",
    shortDescription: "Para açaíterias",
    price: 247,
    originalPrice: 297,
    category: "acai",
    imageUrl: "https://images.unsplash.com/photo-1590080874088-eec64895b423?w=600&auto=format&fit=crop&q=80",
    previewUrl: "/templates/acai",
    features: ["Açaí no copo", "Tigelas", "Adicionais", "Vitaminas", "Bebidas"],
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    salesCount: 28,
    ratingAvg: 4.5,
    ratingCount: 9,
    status: "active"
  },
  {
    id: "sushi",
    slug: "sushi",
    name: "Japonês / Sushi",
    description: "Cardápio para restaurantes japoneses e sushis. Com sashimis, rolls e temakis.",
    shortDescription: "Para restaurantes japoneses",
    price: 247,
    originalPrice: 297,
    category: "sushi",
    imageUrl: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&auto=format&fit=crop&q=80",
    previewUrl: "/templates/sushi",
    features: ["Sushis", "Sashimis", "Rolls", "Temakis", "Combos"],
    isFeatured: true,
    isNew: false,
    isBestseller: false,
    salesCount: 52,
    ratingAvg: 4.7,
    ratingCount: 18,
    status: "active"
  }
]

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
            ← Voltar
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/ofertas" className="text-sm text-primary font-medium hover:underline">
              Ver Pacotes
            </Link>
            <CartButton variant="outline" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            7 Templates Profissionais
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Escolha o Template Perfeito
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Templates prontos e personalizáveis para seu negócio. Compre individualmente ou economize com nossos pacotes.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/ofertas"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Ver Pacotes com Desconto
            </Link>
          </div>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Stats */}
          <div className="mb-8 flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">7</div>
              <div className="text-sm text-muted-foreground">Templates</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">500+</div>
              <div className="text-sm text-muted-foreground">Clientes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">4.8</div>
              <div className="text-sm text-muted-foreground">Avaliação média</div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => (
              <TemplateCard 
                key={template.id}
                template={template}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-12 bg-primary/5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Economize com nossos Pacotes
          </h2>
          <p className="text-muted-foreground mb-6">
            Compre 3 templates e economize R$ 394, ou tenha acesso ilimitado a todos os templates por um preço único.
          </p>
          <Link 
            href="/ofertas"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Ver Ofertas Especiais
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Demo Info */}
      <section className="px-4 py-8 border-t border-border">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Eye className="h-4 w-4" />
            Demonstração disponível
          </div>
          <p className="text-sm text-muted-foreground">
            Clique em &quot;Ver Demo&quot; para testar cada template antes de comprar.
          </p>
        </div>
      </section>
    </main>
  )
}

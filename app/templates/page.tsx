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
  Eye
} from "lucide-react"

export const metadata = {
  title: "Templates de Cardápio Digital | Demonstração",
  description: "Veja exemplos de cardápios digitais funcionais para restaurantes, pizzarias, lanchonetes, bares, cafeterias e mais.",
}

const templates = [
  {
    id: "restaurante",
    name: "Restaurante / Marmitaria",
    description: "Cardápio ideal para restaurantes, marmitarias e self-service. Organizado por pratos executivos, porções e bebidas.",
    icon: Store,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
    features: ["Pratos executivos", "Marmitas", "Porções", "Bebidas", "Sobremesas"]
  },
  {
    id: "pizzaria",
    name: "Pizzaria",
    description: "Cardápio completo para pizzarias com opções de tamanhos, sabores e bordas recheadas.",
    icon: Pizza,
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    features: ["Pizzas tradicionais", "Pizzas especiais", "Bordas recheadas", "Bebidas", "Combos"]
  },
  {
    id: "lanchonete",
    name: "Lanchonete / Hamburgueria",
    description: "Cardápio para lanchonetes e hamburguerias artesanais. Com adicionais e combos personalizados.",
    icon: UtensilsCrossed,
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
    features: ["Hambúrgueres", "Hot dogs", "Porções", "Bebidas", "Combos"]
  },
  {
    id: "bar",
    name: "Bar / Pub",
    description: "Cardápio para bares, pubs e casas noturnas. Com drinks, cervejas artesanais e petiscos.",
    icon: Beer,
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&auto=format&fit=crop&q=80",
    features: ["Cervejas", "Drinks", "Porções", "Sem álcool", "Happy hour"]
  },
  {
    id: "cafeteria",
    name: "Cafeteria",
    description: "Cardápio para cafeterias, padarias e confeitarias. Com cafés especiais, doces e salgados.",
    icon: Coffee,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80",
    features: ["Cafés", "Doces", "Salgados", "Sanduíches", "Bebidas"]
  },
  {
    id: "acai",
    name: "Açaíteria",
    description: "Cardápio para açaíterias e lanchonetes naturais. Com tigelas, copos e adicionais.",
    icon: IceCream,
    image: "https://images.unsplash.com/photo-1590080874088-eec64895b423?w=600&auto=format&fit=crop&q=80",
    features: ["Açaí no copo", "Tigelas", "Adicionais", "Vitaminas", "Bebidas"]
  },
  {
    id: "sushi",
    name: "Japonês / Sushi",
    description: "Cardápio para restaurantes japoneses e sushis. Com sashimis, rolls e temakis.",
    icon: Fish,
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&auto=format&fit=crop&q=80",
    features: ["Sushis", "Sashimis", "Rolls", "Temakis", "Combos"]
  }
]

export default function TemplatesPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
            ← Voltar para o site
          </Link>
          <span className="text-sm text-muted-foreground">Área de Demonstração</span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Eye className="h-4 w-4" />
            Demonstração
          </div>
          <h1 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Templates de Cardápio Digital
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Veja como seu cardápio digital pode ficar. Escolha um modelo abaixo e navegue como se fosse seu cliente.
          </p>
        </div>
      </section>

      {/* Templates Grid */}
      <section className="px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const IconComponent = template.icon
              return (
                <Link 
                  key={template.id}
                  href={`/templates/${template.id}`}
                  className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/50"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={template.image}
                      alt={template.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                      <IconComponent className="h-6 w-6" />
                      <span className="font-semibold text-lg">{template.name}</span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <p className="text-muted-foreground mb-4">
                      {template.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.features.map((feature) => (
                        <span 
                          key={feature}
                          className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                      <span>Ver demonstração</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="px-4 py-12 bg-secondary/50">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-foreground">
            Como funciona a demonstração?
          </h2>
          <p className="text-muted-foreground mb-6">
            Navegue pelos templates como se fosse um cliente do seu restaurante. 
            Adicione itens ao carrinho e veja como o pedido é formatado para o WhatsApp.
          </p>
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> Os preços e produtos são apenas exemplos. 
            Seu cardápio será personalizado com seus próprios itens e valores.
          </p>
        </div>
      </section>
    </main>
  )
}

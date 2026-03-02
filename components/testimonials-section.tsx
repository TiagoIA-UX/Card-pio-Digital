import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Lucas Silva",
    role: "Desenvolvedor Freelancer",
    content: "Os templates de Next.js me economizaram semanas de trabalho. Código limpo e bem documentado. Recomendo muito!",
    rating: 5,
  },
  {
    name: "Ana Costa",
    role: "Empreendedora Digital",
    content: "Comprei o template de Notion e transformou completamente minha produtividade. Vale cada centavo investido.",
    rating: 5,
  },
  {
    name: "Pedro Santos",
    role: "UI/UX Designer",
    content: "O UI Kit do Figma é incrível. Muito bem organizado e fácil de customizar. Uso em todos os meus projetos.",
    rating: 5,
  },
  {
    name: "Mariana Oliveira",
    role: "Dono de Restaurante",
    content: "O template para restaurantes ficou perfeito para o meu negócio. Suporte rápido e atencioso.",
    rating: 5,
  },
  {
    name: "Rafael Lima",
    role: "Gestor Financeiro",
    content: "A planilha de controle financeiro é a mais completa que já vi. Simples de usar e muito funcional.",
    rating: 5,
  },
  {
    name: "Juliana Ferreira",
    role: "Startup Founder",
    content: "Lançamos nossa landing page em 2 dias graças ao template SaaS. Qualidade profissional impressionante.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
            O que nossos clientes dizem
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Mais de 500 clientes satisfeitos com nossos templates.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="mt-4 text-muted-foreground">&quot;{testimonial.content}&quot;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

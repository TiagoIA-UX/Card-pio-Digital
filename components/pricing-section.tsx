import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Básico',
    description: 'Operação enxuta para colocar o cardápio no ar rápido',
    price: 'R$ 49',
    priceDescription: '/mês',
    features: [
      '1 restaurante ativo',
      'Editor visual do cardápio',
      'QR Code e link público',
      'Pedidos via WhatsApp',
      'Hospedagem incluída',
    ],
    cta: 'Escolher template',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'Mais volume, mais produtos e suporte melhor',
    price: 'R$ 99',
    priceDescription: '/mês',
    features: [
      'Tudo do plano Básico',
      'Mais capacidade de produtos',
      'Template com instalação inicial',
      'Suporte prioritário',
      'Acompanhamento de ativação',
      'Melhor custo para lançamento',
    ],
    cta: 'Começar com Pro',
    popular: true,
  },
  {
    name: 'Premium',
    description: 'Para operação madura ou múltiplas necessidades internas',
    price: 'R$ 199',
    priceDescription: '/mês',
    features: [
      'Tudo do plano Pro',
      'Mais recursos administrativos',
      'Suporte dedicado',
      'Maior previsibilidade operacional',
      'Estrutura pronta para expansão',
      'Prioridade nas melhorias',
    ],
    cta: 'Falar sobre Premium',
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="precos" className="border-border bg-secondary/30 border-y py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Planos e Preços
          </h2>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            O produto agora opera em assinatura SaaS recorrente, sem pacotes vitalícios.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`border-border bg-card relative ${plan.popular ? 'border-accent ring-accent ring-1' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium">
                    Mais Popular
                  </span>
                </div>
              )}
              <CardHeader className="p-6">
                <h3 className="text-foreground text-xl font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-foreground text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {plan.priceDescription}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="text-accent mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-muted-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Link href="/templates" className="w-full">
                  <Button
                    className={`w-full ${plan.popular ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

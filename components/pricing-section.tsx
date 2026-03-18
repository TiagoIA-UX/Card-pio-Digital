import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { getTemplateCatalog } from '@/lib/templates-config'
import { getTemplatePricing, PUBLIC_SUBSCRIPTION_PRICES } from '@/lib/pricing'
import type { RestaurantTemplateSlug } from '@/lib/restaurant-customization'

export function PricingSection() {
  const templates = getTemplateCatalog()
  const selfPix = templates.map(
    (template) => getTemplatePricing(template.slug as RestaurantTemplateSlug).selfService.pix
  )
  const selfCard = templates.map(
    (template) => getTemplatePricing(template.slug as RestaurantTemplateSlug).selfService.card
  )
  const fpvcPix = templates.map(
    (template) => getTemplatePricing(template.slug as RestaurantTemplateSlug).feitoPraVoce.pix
  )
  const fpvcCard = templates.map(
    (template) => getTemplatePricing(template.slug as RestaurantTemplateSlug).feitoPraVoce.card
  )

  const plans = [
    {
      name: 'Você configura',
      description: 'Você configura, publica e ajusta pelo painel.',
      price: `R$ ${Math.min(...selfPix)}`,
      priceDescription: 'hoje no PIX',
      priceFootnote: 'PIX no menor valor · outros meios via Mercado Pago · crédito até 12x',
      recurringFootnote: `depois R$ ${PUBLIC_SUBSCRIPTION_PRICES.basico.monthly}/mês`,
      features: [
        '1 restaurante ativo',
        'Editor visual com atualizações rápidas',
        'Link público e QR Code prontos para uso',
        'Pedidos direto no WhatsApp do negócio',
        'Infraestrutura incluída no plano ativo',
      ],
      cta: 'Escolher template',
      popular: false,
    },
    {
      name: 'Equipe configura',
      description: 'A equipe da Zairyx conduz a implantação inicial para você.',
      price: `R$ ${Math.min(...fpvcPix)}`,
      priceDescription: 'hoje no PIX',
      priceFootnote: 'PIX no menor valor · outros meios via Mercado Pago · crédito até 12x',
      recurringFootnote: `depois R$ ${PUBLIC_SUBSCRIPTION_PRICES.pro.monthly}/mês`,
      features: [
        'Tudo da opção Você configura',
        'Montagem conduzida pela nossa equipe',
        'Envio de material no seu tempo após a compra',
        'Acompanhamento de ativação e publicação',
        'Suporte prioritário',
      ],
      cta: 'Ver opções de compra',
      popular: true,
    },
  ]

  return (
    <section id="precos" className="border-border bg-secondary/30 border-y py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-foreground text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Ofertas e preços
          </h2>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            Veja quanto paga hoje e quanto mantém por mês, sem surpresa.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:mx-auto lg:max-w-4xl">
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
                  <p className="text-muted-foreground mt-1 text-xs">{plan.priceFootnote}</p>
                  <p className="text-foreground/75 mt-2 text-sm font-medium">
                    {plan.recurringFootnote}
                  </p>
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

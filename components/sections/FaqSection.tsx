'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQ_ITEMS = [
  {
    question: 'Preciso saber mexer com tecnologia?',
    answer:
      'Não. Se você sabe usar WhatsApp, consegue usar o painel. É só escolher o modelo, trocar os textos e preços, e publicar. Sem programação, sem complicação.',
  },
  {
    question: 'Funciona no celular?',
    answer:
      'Sim, 100%. O painel funciona no celular e no computador. Você edita preços, fotos e categorias de qualquer lugar. E seus clientes acessam o cardápio direto pelo celular.',
  },
  {
    question: 'Quanto tempo leva pra colocar no ar?',
    answer:
      'Menos de 30 minutos. Você escolhe o modelo do seu segmento, personaliza os produtos e publica. Se preferir, nossa equipe faz a configuração inicial pra você.',
  },
  {
    question: 'Como meus clientes fazem o pedido?',
    answer:
      'O cliente navega pelo cardápio no celular, monta o pedido e envia direto no seu WhatsApp. Chega organizado com itens, quantidades e observações. Sem confusão.',
  },
  {
    question: 'Tem taxa por pedido?',
    answer:
      'Zero. Diferente de apps de delivery que cobram de 12% a 27% por pedido, aqui você paga uma assinatura fixa. O valor integral de cada venda vai direto pro seu caixa.',
  },
  {
    question: 'E se eu quiser cancelar?',
    answer:
      'Você tem 30 dias de garantia. Se não gostar, devolvemos o valor integral, sem perguntas e sem burocracia. Simples assim.',
  },
] as const

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 md:py-28" data-testid="faq-section">
      <div className="container-premium">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-bold tracking-[0.2em] uppercase text-orange-600">
              Tire suas dúvidas
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Perguntas frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index
              return (
                <div
                  key={index}
                  className={`overflow-hidden rounded-2xl border transition-colors duration-200 ${
                    isOpen
                      ? 'border-orange-200 bg-orange-50/50'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    data-testid={`faq-toggle-${index}`}
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold text-zinc-900">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`grid transition-all duration-200 ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-7 text-zinc-600">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

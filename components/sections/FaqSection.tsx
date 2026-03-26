'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQ_ITEMS = [
  {
    question: 'Preciso saber mexer com tecnologia?',
    answer:
      'Não. Se você sabe usar WhatsApp, consegue usar o painel. É só escolher o modelo, trocar os textos e preços, e publicar. Sem programação, sem complicação. Se precisar, nossa equipe configura pra você.',
  },
  {
    question: 'Funciona no celular?',
    answer:
      'Sim, 100%. O painel funciona no celular e no computador. Você edita preços, fotos e categorias de qualquer lugar. E seus clientes acessam o catálogo direto pelo celular — sem baixar nada.',
  },
  {
    question: 'Quanto tempo leva pra colocar no ar?',
    answer:
      'Menos de 30 minutos. Escolha o modelo do seu nicho, troque produtos e preços, e publique. Enquanto seu concorrente ainda pensa, você já está vendendo.',
  },
  {
    question: 'Como meus clientes fazem o pedido?',
    answer:
      'O cliente navega pelo catálogo no celular, monta o pedido e conclui direto no cardápio digital. O pedido chega organizado com itens, quantidades e observações — sem confusão.',
  },
  {
    question: 'O que é a IA assistente? Preciso pagar a mais?',
    answer:
      'É um assistente inteligente que fica dentro do seu cardápio. Responde dúvidas dos clientes, sugere produtos e ajuda a fechar pedidos — 24 horas por dia, inclusive de madrugada. Já está incluso na assinatura, sem custo extra.',
  },
  {
    question: 'Quanto custa? Tem taxa por pedido?',
    answer:
      'R$ 59/mês fixo. ZERO comissão por pedido — pra sempre. Diferente de apps que cobram ~15% de CADA venda (Plano Básico iFood), aqui o valor integral vai pro seu caixa. Faturou R$ 20.000? Ficou com R$ 20.000.',
  },
  {
    question: 'E se eu não gostar? Tem contrato?',
    answer:
      'Sem contrato de fidelidade. Você tem 30 dias de garantia total. Se não gostar, devolvemos cada centavo — sem perguntas e sem burocracia. O risco é zero.',
  },
  {
    question: 'Posso aceitar pagamento online (PIX)?',
    answer:
      'Sim. O sistema suporta geração de cobranças PIX diretamente no fluxo de pedido. Seu cliente paga na hora e você recebe o valor integral — sem intermediário.',
  },
  {
    question: 'E se eu já uso iFood, Rappi ou outro app?',
    answer:
      'Você pode manter e usar os dois ao mesmo tempo. Mas cada pedido que migrar pro seu canal próprio é comissão que você deixa de pagar. Se você já tem motoboy próprio e fatura R$ 20k/mês, a comissão do iFood (Plano Básico) chega a R$ 3.000. Na Zairyx, são R$ 59.',
  },
] as const

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 md:py-28" data-testid="faq-section">
      <div className="container-premium">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
              Ainda com dúvidas?
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Respostas diretas — sem enrolação
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
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    data-testid={`faq-toggle-${index}`}
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold text-zinc-900">{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-zinc-600 transition-transform duration-200 ${
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
                      <p className="px-6 pb-5 text-base leading-7 text-zinc-700">{item.answer}</p>
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

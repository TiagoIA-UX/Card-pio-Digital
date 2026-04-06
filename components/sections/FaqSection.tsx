'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { COMMERCIAL_COPY } from '@/lib/domains/marketing/commercial-copy'

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
      'É a Zai, agente de IA que vai de brinde no seu canal digital. Ela responde dúvidas, organiza o pedido e faz sugestões leves para vender melhor, sem forçar a compra. Se perceber que uma bebida ficou para trás, por exemplo, ela pode sugerir isso com inteligência para ajudar o delivery a faturar mais.',
  },
  {
    question: 'Quanto custa? Tem taxa por pedido?',
    answer:
      `R$ 147/mês fixo. ${COMMERCIAL_COPY.noPlatformCommission}. Diferente de apps que cobram percentual sobre cada venda, aqui o plano é fixo. Taxas de gateway de pagamento e logística, quando existirem, continuam separadas.`,
  },
  {
    question: 'E se eu não gostar? Tem contrato?',
    answer:
      `Sem contrato de fidelidade. ${COMMERCIAL_COPY.withdrawalExplainer} Depois disso, valem as regras de cancelamento descritas nos termos vigentes.`,
  },
  {
    question: 'Posso aceitar pagamento online (PIX)?',
    answer:
      'Sim. O sistema suporta cobrança via gateway no fluxo de pedido. Seu cliente pode pagar na hora, e o repasse segue as regras e taxas do provedor de pagamento configurado.',
  },
  {
    question: 'E se eu já uso iFood, Rappi ou outro app?',
    answer:
      'Não precisa sair. Use o iFood para atrair cliente novo e traga o cliente fiel para o seu canal digital. Em um exemplo conservador, 100 pedidos por mês de clientes fiéis com ticket de R$ 50 representam algo perto de R$ 750 em comissão recuperada. Tirando a assinatura de R$ 147, ainda sobra ganho real no caixa, fora o faturamento extra que a Zai pode gerar com upsell leve, como sugerir uma bebida quando percebe uma oportunidade natural no pedido.',
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
                    aria-expanded={isOpen ? 'true' : 'false'}
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

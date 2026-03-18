'use client'

import Link from 'next/link'
import { Store, ArrowLeft } from 'lucide-react'
import { COMPANY_NAME, PAYMENT_DESCRIPTOR_NOTE, PRODUCT_ENDORSEMENT } from '@/lib/brand'

export default function TermosPage() {
  return (
    <main className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="from-primary to-primary/80 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-foreground text-xl font-bold">Cardápio Digital</span>
          </Link>
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold">Termos de Uso</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <p>{PRODUCT_ENDORSEMENT}</p>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou usar o Cardápio Digital, você concorda com estes Termos de Uso. Se não
              concordar, não utilize nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">2. Descrição do Serviço</h2>
            <p>
              O Cardápio Digital oferece templates profissionais e painel de gestão para
              restaurantes, pizzarias, hamburguerias e outros negócios alimentícios.
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Publicar um cardápio digital com sua marca</li>
              <li>Gerenciar produtos, categorias e identidade visual</li>
              <li>Receber pedidos e encaminhá-los para WhatsApp</li>
              <li>Acompanhar o provisioning e a ativação do painel após o pagamento</li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">3. Cadastro e Conta</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Você deve ter 18 anos ou mais para criar uma conta</li>
              <li>Você é responsável por manter a segurança da sua conta</li>
              <li>As informações fornecidas devem ser verdadeiras e atualizadas</li>
              <li>As compras ficam vinculadas à conta autenticada usada no checkout</li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">4. Uso Aceitável</h2>
            <p>Você concorda em NÃO usar o serviço para:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Atividades ilegais ou fraudulentas</li>
              <li>Publicar conteúdo ofensivo, discriminatório ou ilegal</li>
              <li>Violar direitos de propriedade intelectual</li>
              <li>Distribuir malware ou realizar ataques</li>
              <li>Coletar dados de outros usuários sem consentimento</li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">5. Propriedade Intelectual</h2>
            <p>
              O Cardápio Digital e seus componentes são protegidos por direitos autorais. Você
              mantém os direitos sobre o conteúdo que publica (produtos, imagens, textos).
            </p>
            <p className="mt-4">
              Ao publicar conteúdo, você nos concede licença não-exclusiva para exibi-lo e
              processá-lo conforme necessário para o funcionamento do serviço.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">
              6. Prazo de Entrega (Implantação pela equipe)
            </h2>
            <p>
              Para clientes que contratam a implantação pela equipe, em que montamos o cardápio
              digital:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                O prazo de produção começa após o envio completo das informações solicitadas no
                formulário de onboarding.
              </li>
              <li>
                O cardápio digital será publicado em até <strong>2 (dois) dias úteis</strong> após o
                recebimento das informações.
              </li>
              <li>Horas úteis consideram dias úteis (segunda a sexta), excluindo feriados.</li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">7. Planos e Pagamentos</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                A contratação pública combina taxa inicial de implantação e plano mensal conforme o
                modelo e o template escolhidos
              </li>
              <li>
                Os modelos disponíveis no checkout são implantação pelo cliente e implantação pela
                equipe
              </li>
              <li>
                O checkout exibe o valor da implantação e a referência do plano mensal antes da
                compra
              </li>
              <li>
                O acesso ao painel é liberado somente após a confirmação do pagamento pelo Mercado
                Pago
              </li>
              <li>{PAYMENT_DESCRIPTOR_NOTE}</li>
              <li>
                Na implantação pela equipe, o prazo de produção começa após o envio completo do
                onboarding
              </li>
              <li>
                A continuidade de uso do cardápio depende de manter o plano mensal correspondente
                ativo, conforme comunicação comercial vigente
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">8. Suporte</h2>
            <p>
              O suporte é oferecido conforme o plano contratado, prioritariamente via WhatsApp. O
              tempo de resposta varia conforme a demanda e não garantimos atendimento imediato ou em
              tempo real. Nos esforçamos para responder em dias úteis.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">9. Limitação de Responsabilidade</h2>
            <p>O serviço é fornecido &quot;como está&quot;. Não garantimos:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Disponibilidade ininterrupta do serviço</li>
              <li>Ausência de erros ou bugs</li>
              <li>Resultados específicos de negócio</li>
            </ul>
            <p className="mt-4">
              Nossa responsabilidade é limitada ao valor pago pelo serviço nos últimos 12 meses.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">10. Encerramento</h2>
            <p>
              Podemos suspender ou encerrar sua conta por violação destes termos. Você pode encerrar
              sua conta a qualquer momento nas configurações.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">11. Alterações nos Termos</h2>
            <p>
              Podemos atualizar estes termos periodicamente. Notificaremos sobre mudanças
              significativas por email ou aviso no serviço.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">12. Lei Aplicável</h2>
            <p>Estes termos são regidos pelas leis do Brasil. Foro: comarca de São Paulo/SP.</p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">13. Contato e documentação</h2>
            <p>
              <strong>Email:</strong> contato@cardapio.digital
            </p>
            <p className="mt-2">
              <strong>Empresa responsável:</strong> {COMPANY_NAME}
            </p>
            <p className="mt-2">
              Para informações sobre hospedagem, domínio e o que está incluso no serviço (cardápio
              digital, Google Maps etc.), consulte nossa{' '}
              <Link href="/politica" className="text-primary font-medium hover:underline">
                Política de Transparência
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

"use client"

import Link from "next/link"
import { Store, ArrowLeft } from "lucide-react"

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Cardápio Digital</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Aceitação dos Termos</h2>
            <p>Ao acessar ou usar o Cardápio Digital, você concorda com estes Termos de Uso. Se não concordar, não utilize nossos serviços.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Descrição do Serviço</h2>
            <p>O Cardápio Digital é uma plataforma SaaS que permite a restaurantes e estabelecimentos de alimentação:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Criar cardápios digitais personalizados</li>
              <li>Gerenciar produtos e categorias</li>
              <li>Receber e gerenciar pedidos</li>
              <li>Integrar com WhatsApp para comunicação</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Cadastro e Conta</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Você deve ter 18 anos ou mais para criar uma conta</li>
              <li>Você é responsável por manter a segurança da sua conta</li>
              <li>As informações fornecidas devem ser verdadeiras e atualizadas</li>
              <li>Uma pessoa ou empresa pode ter apenas uma conta gratuita</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Uso Aceitável</h2>
            <p>Você concorda em NÃO usar o serviço para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Atividades ilegais ou fraudulentas</li>
              <li>Publicar conteúdo ofensivo, discriminatório ou ilegal</li>
              <li>Violar direitos de propriedade intelectual</li>
              <li>Distribuir malware ou realizar ataques</li>
              <li>Coletar dados de outros usuários sem consentimento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Propriedade Intelectual</h2>
            <p>O Cardápio Digital e seus componentes são protegidos por direitos autorais. Você mantém os direitos sobre o conteúdo que publica (produtos, imagens, textos).</p>
            <p className="mt-4">Ao publicar conteúdo, você nos concede licença não-exclusiva para exibi-lo e processá-lo conforme necessário para o funcionamento do serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Planos e Pagamentos</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>O plano gratuito possui limitações de uso</li>
              <li>Planos pagos são cobrados mensalmente</li>
              <li>Cancelamentos podem ser feitos a qualquer momento</li>
              <li>Não há reembolso proporcional ao cancelar</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Limitação de Responsabilidade</h2>
            <p>O serviço é fornecido &quot;como está&quot;. Não garantimos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Disponibilidade ininterrupta do serviço</li>
              <li>Ausência de erros ou bugs</li>
              <li>Resultados específicos de negócio</li>
            </ul>
            <p className="mt-4">Nossa responsabilidade é limitada ao valor pago pelo serviço nos últimos 12 meses.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Encerramento</h2>
            <p>Podemos suspender ou encerrar sua conta por violação destes termos. Você pode encerrar sua conta a qualquer momento nas configurações.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">9. Alterações nos Termos</h2>
            <p>Podemos atualizar estes termos periodicamente. Notificaremos sobre mudanças significativas por email ou aviso no serviço.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">10. Lei Aplicável</h2>
            <p>Estes termos são regidos pelas leis do Brasil. Foro: comarca de São Paulo/SP.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">11. Contato e documentação</h2>
            <p>
              <strong>Email:</strong> contato@cardapio.digital
            </p>
            <p className="mt-2">
              Para informações sobre hospedagem, domínio e o que está incluso no serviço (cardápio digital, Google Maps etc.), consulte nossa{" "}
              <Link href="/politica" className="text-primary font-medium hover:underline">Política de Transparência</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

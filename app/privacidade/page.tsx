'use client'

import Link from 'next/link'
import { Store, ArrowLeft } from 'lucide-react'
import { COMPANY_NAME, PAYMENT_OPERATOR_NOTE, PRODUCT_ENDORSEMENT } from '@/lib/brand'

export default function PrivacidadePage() {
  return (
    <main className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="from-primary to-primary/80 flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-foreground text-xl font-bold">Zairyx — Canal Digital</span>
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
        <h1 className="mb-8 text-3xl font-bold">Política de Privacidade</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">Última atualização: 18 de março de 2026</p>

          <p>{PRODUCT_ENDORSEMENT}</p>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">1. Informações que Coletamos</h2>
            <p>Coletamos informações que você nos fornece diretamente:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Dados de conta:</strong> nome, email (via login Google)
              </li>
              <li>
                <strong>Dados do negócio:</strong> nome, telefone, logo, endereço
              </li>
              <li>
                <strong>Dados de produtos:</strong> nome, descrição, preços, imagens
              </li>
              <li>
                <strong>Dados de pedidos:</strong> itens, valores, informações de entrega
              </li>
            </ul>

            <p className="mt-4">Também coletamos automaticamente:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Endereço IP e dados de conexão:</strong> registros de acesso conforme Marco
                Civil da Internet (Art. 15)
              </li>
              <li>
                <strong>Navegador e sistema operacional:</strong> tipo de dispositivo e user-agent
              </li>
              <li>
                <strong>Dados do perfil Google:</strong> nome e email fornecidos automaticamente ao
                fazer login via Google OAuth
              </li>
              <li>
                <strong>Navegação no site:</strong> páginas acessadas e tempo de permanência (via
                Vercel Analytics, quando ativo — dados agregados)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">2. Como Usamos suas Informações</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Fornecer e manter nossos serviços</li>
              <li>Processar pedidos e transações</li>
              <li>Enviar comunicações relacionadas ao serviço</li>
              <li>Melhorar nossos produtos e serviços</li>
              <li>Proteger contra fraudes e abusos</li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">3. Compartilhamento de Dados</h2>
            <p>Não vendemos suas informações pessoais. Compartilhamos dados apenas:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Com prestadores de serviços (hospedagem, banco de dados)</li>
              <li>
                Com parceiros de pagamento para processar cobranças da plataforma, como o Mercado
                Pago
              </li>
              <li>Quando exigido por lei</li>
              <li>Com seu consentimento explícito</li>
            </ul>
            <p className="mt-4">
              <strong>Terceiros que acessam seus dados:</strong> Supabase (banco de dados), Vercel
              (hospedagem), Cloudflare R2 (armazenamento de imagens), Mercado Pago (processamento de
              pagamentos), Groq (processamento de mensagens do chat IA). Nenhum dado é vendido a
              terceiros.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">4. Cookies e Tecnologias Similares</h2>
            <p>Utilizamos cookies para:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Cookies essenciais:</strong> autenticação e segurança
              </li>
              <li>
                <strong>Cookies de preferências:</strong> lembrar suas configurações
              </li>
              <li>
                <strong>Cookies de análise:</strong> entender como você usa o serviço
              </li>
            </ul>
            <p className="mt-4">
              Você pode controlar cookies nas configurações do navegador. Para mais detalhes,
              consulte nossa{' '}
              <Link href="/cookies" className="text-primary hover:underline">
                Política de Cookies
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">5. Segurança dos Dados</h2>
            <p>Implementamos medidas de segurança incluindo:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Criptografia de dados em trânsito (HTTPS)</li>
              <li>Controle de acesso baseado em funções (RLS)</li>
              <li>Autenticação segura via OAuth 2.0</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">6. Seus Direitos (LGPD Art. 18)</h2>
            <p>Conforme a Lei Geral de Proteção de Dados, você tem direito a:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
              <li>
                Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos
              </li>
              <li>Portabilidade dos dados a outro fornecedor de serviço</li>
              <li>Eliminação dos dados tratados com base no consentimento</li>
              <li>Informação sobre com quais entidades seus dados são compartilhados</li>
              <li>
                Informação sobre a possibilidade de não fornecer consentimento e suas consequências
              </li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>
                Opor-se ao tratamento quando realizado sem consentimento e em desconformidade com a
                LGPD
              </li>
              <li>Peticionar perante a Autoridade Nacional de Proteção de Dados (ANPD)</li>
            </ul>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">7. Retenção de Dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta,
              removemos seus dados em até 30 dias, exceto quando a retenção for necessária por
              obrigações legais.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">8. Contato</h2>
            <p>Para questões sobre privacidade, entre em contato:</p>
            <p className="mt-2">{PAYMENT_OPERATOR_NOTE}</p>
            <p className="mt-2">
              <strong>Controladora responsável:</strong> {COMPANY_NAME}
            </p>
            <p className="mt-2">
              <strong>Email:</strong> zairyx.ai@gmail.com
            </p>
            <p className="mt-2">
              <strong>WhatsApp:</strong> (12) 99688-7993
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">
              9. Transferência Internacional de Dados
            </h2>
            <p>
              Utilizamos serviços de terceiros que podem armazenar dados fora do Brasil, incluindo:
              Supabase (banco de dados — EUA), Vercel (hospedagem — EUA), Cloudflare R2
              (armazenamento — EUA), Mercado Pago (pagamentos — Argentina/EUA) e Groq (inteligência
              artificial — EUA). Todos adotam salvaguardas adequadas conforme LGPD Art. 33.
            </p>
          </section>

          <section>
            <h2 className="mt-8 mb-4 text-xl font-semibold">10. Base Legal do Tratamento</h2>
            <p>
              Tratamos seus dados com base nas seguintes hipóteses legais (LGPD Art. 7º): execução
              de contrato (Art. 7º V) para dados necessários à prestação do serviço; consentimento
              (Art. 7º I) para cookies não essenciais e comunicações de marketing; cumprimento de
              obrigação legal (Art. 7º II) para dados fiscais e registros de acesso.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

"use client"

import Link from "next/link"
import { Store, ArrowLeft } from "lucide-react"

export default function PrivacidadePage() {
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
        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">1. Informações que Coletamos</h2>
            <p>Coletamos informações que você nos fornece diretamente:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de conta:</strong> nome, email (via login Google)</li>
              <li><strong>Dados do restaurante:</strong> nome, telefone, logo, endereço</li>
              <li><strong>Dados de produtos:</strong> nome, descrição, preços, imagens</li>
              <li><strong>Dados de pedidos:</strong> itens, valores, informações de entrega</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">2. Como Usamos suas Informações</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fornecer e manter nossos serviços</li>
              <li>Processar pedidos e transações</li>
              <li>Enviar comunicações relacionadas ao serviço</li>
              <li>Melhorar nossos produtos e serviços</li>
              <li>Proteger contra fraudes e abusos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">3. Compartilhamento de Dados</h2>
            <p>Não vendemos suas informações pessoais. Compartilhamos dados apenas:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Com prestadores de serviços (hospedagem, banco de dados)</li>
              <li>Quando exigido por lei</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">4. Cookies e Tecnologias Similares</h2>
            <p>Utilizamos cookies para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cookies essenciais:</strong> autenticação e segurança</li>
              <li><strong>Cookies de preferências:</strong> lembrar suas configurações</li>
              <li><strong>Cookies de análise:</strong> entender como você usa o serviço</li>
            </ul>
            <p className="mt-4">Você pode controlar cookies nas configurações do navegador.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">5. Segurança dos Dados</h2>
            <p>Implementamos medidas de segurança incluindo:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Criptografia de dados em trânsito (HTTPS)</li>
              <li>Controle de acesso baseado em funções (RLS)</li>
              <li>Autenticação segura via OAuth 2.0</li>
              <li>Backups regulares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">6. Seus Direitos (LGPD)</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou incorretos</li>
              <li>Solicitar exclusão dos seus dados</li>
              <li>Revogar consentimento a qualquer momento</li>
              <li>Portabilidade dos dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">7. Retenção de Dados</h2>
            <p>Mantemos seus dados enquanto sua conta estiver ativa. Após exclusão da conta, removemos seus dados em até 30 dias, exceto quando a retenção for necessária por obrigações legais.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mt-8 mb-4">8. Contato</h2>
            <p>Para questões sobre privacidade, entre em contato:</p>
            <p className="mt-2">
              <strong>Email:</strong> privacidade@cardapio.digital
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

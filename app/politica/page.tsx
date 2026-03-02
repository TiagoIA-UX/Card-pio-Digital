"use client"

import Link from "next/link"
import { Store, ArrowLeft, Shield, Globe, MapPin, Layout, FileText } from "lucide-react"

export default function PoliticaPage() {
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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Política de Transparência</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Informações claras para sua confiança</p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-10">
          Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
          {/* Destaque: site profissional */}
          <section className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mt-0">
              <Layout className="h-5 w-5 text-primary" />
              Site profissional com cardápio digital incluso
            </h2>
            <p className="text-foreground/90 mt-2">
              Você recebe um <strong>site profissional</strong> pronto para uso, com <strong>cardápio digital incluso</strong>, 
              pensado para restaurantes, lanchonetes, bares e estabelecimentos de alimentação. O cardápio é moderno, 
              responsivo e integrado ao WhatsApp para receber pedidos. Incluímos ainda integração com <strong>Google Maps</strong>, 
              para que seus clientes localizem seu endereço com um toque.
            </p>
          </section>

          {/* Hospedagem e domínio */}
          <section>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mt-8 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              1. Hospedagem e domínio
            </h2>
            <p className="text-foreground/90">
              A hospedagem do seu cardápio é <strong>personalizada</strong> para você: cada estabelecimento tem sua 
              própria página e URL de acesso. No entanto, é importante deixarmos claro:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90 mt-4">
              <li>
                <strong>O endereço do site utiliza o domínio da plataforma (Vercel)</strong> — por exemplo, no formato 
                que inclui <code className="px-1.5 py-0.5 rounded bg-muted text-sm">vercel.app</code> ou similar, 
                e não um domínio particular (ex.: <code className="px-1.5 py-0.5 rounded bg-muted text-sm">seudominio.com.br</code>) registrado em seu nome.
              </li>
              <li>
                A infraestrutura é profissional e estável, mas o <strong>nome de domínio exibido na barra do navegador</strong> 
                é da rede em que o serviço está hospedado (Vercel), e não um domínio próprio contratado separadamente por você.
              </li>
              <li>
                Caso deseje um domínio exclusivo (ex.: <code className="px-1.5 py-0.5 rounded bg-muted text-sm">meurestaurante.com.br</code>), 
                isso pode envolver contratação e configuração adicional, fora do escopo padrão do plano.
              </li>
            </ul>
            <p className="text-foreground/90 mt-4">
              Informamos isso de forma transparente para que você saiba exatamente o que está incluso e o que seria 
              um serviço adicional, reforçando nossa preocupação com a clareza e a confiabilidade.
            </p>
          </section>

          {/* O que está incluso */}
          <section>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mt-8 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              2. O que está incluso no serviço
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90">
              <li><strong>Site profissional</strong> com layout moderno e responsivo (celular e computador).</li>
              <li><strong>Cardápio digital</strong> incluso, com categorias, produtos, preços e fotos.</li>
              <li><strong>Integração com WhatsApp</strong> para o cliente enviar o pedido direto pelo app.</li>
              <li><strong>Google Maps integrado</strong>, para o cliente localizar o endereço do estabelecimento com facilidade.</li>
              <li>Painel para você cadastrar e editar produtos, categorias e informações do negócio.</li>
              <li>Hospedagem personalizada (sua página com sua identificação), no domínio da plataforma, conforme descrito acima.</li>
            </ul>
          </section>

          {/* Transparência e confiabilidade */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">3. Compromisso com transparência e confiabilidade</h2>
            <p className="text-foreground/90">
              Nosso objetivo é que você tenha todas as informações necessárias para decidir com segurança. Por isso:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-foreground/90 mt-4">
              <li>Deixamos explícito o modelo de hospedagem e de domínio (plataforma Vercel, não domínio particular).</li>
              <li>Informamos de forma clara o que está incluso (site profissional, cardápio digital, WhatsApp, Google Maps).</li>
              <li>Mantemos termos de uso e políticas acessíveis, para você conhecer seus direitos e deveres.</li>
              <li>Buscamos oferecer um serviço estável e profissional, com suporte quando aplicável ao seu plano.</li>
            </ul>
          </section>

          {/* Google Maps */}
          <section className="p-6 rounded-2xl bg-muted/50 border border-border">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 mt-0">
              <MapPin className="h-5 w-5 text-primary" />
              4. Google Maps integrado
            </h2>
            <p className="text-foreground/90 mt-2">
              O cardápio digital inclui <strong>integração com Google Maps</strong>. Assim, o cliente pode abrir a 
              localização do seu estabelecimento no mapa com um clique, facilitando quem vai buscar o pedido ou 
              quer saber o endereço. O uso do Google Maps está sujeito às políticas do Google; nós apenas 
              integramos o recurso ao seu site de forma profissional.
            </p>
          </section>

          {/* Resumo */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">5. Resumo</h2>
            <p className="text-foreground/90">
              Você contrata um <strong>site profissional com cardápio digital incluso e Google Maps integrado</strong>. 
              A hospedagem é personalizada (sua página, sua marca), mas o endereço na internet utiliza o domínio da 
              plataforma (Vercel), e não um domínio particular. Todas essas informações são divulgadas nesta política 
              em nome da transparência e da confiança. Em caso de dúvidas, consulte os Termos de Uso ou entre em contato.
            </p>
          </section>

          {/* Contato */}
          <section className="pt-6 border-t border-border">
            <h2 className="text-xl font-semibold text-foreground mt-8 mb-4">Contato</h2>
            <p className="text-foreground/90">
              Dúvidas sobre esta política ou sobre o serviço? Acesse os{" "}
              <Link href="/termos" className="text-primary font-medium hover:underline">
                Termos de Uso
              </Link>{" "}
              ou entre em contato pelo email: <strong>contato@cardapio.digital</strong>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

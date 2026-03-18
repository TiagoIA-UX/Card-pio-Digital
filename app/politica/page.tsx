'use client'

import Link from 'next/link'
import { Store, ArrowLeft, Shield, Globe, MapPin, Layout, FileText } from 'lucide-react'

export default function PoliticaPage() {
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
        <div className="mb-2 flex items-center gap-3">
          <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-xl">
            <Shield className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-foreground text-3xl font-bold">Política de Transparência</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Informações claras para sua confiança
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mb-10 text-sm">
          Última atualização:{' '}
          {new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-10">
          {/* Destaque: site profissional */}
          <section className="bg-primary/5 border-primary/10 rounded-2xl border p-6">
            <h2 className="text-foreground mt-0 flex items-center gap-2 text-xl font-semibold">
              <Layout className="text-primary h-5 w-5" />
              Site profissional com cardápio digital incluso
            </h2>
            <p className="text-foreground/90 mt-2">
              Você recebe um <strong>site profissional</strong> pronto para uso, com{' '}
              <strong>cardápio digital incluso</strong>, pensado para restaurantes, lanchonetes,
              bares e estabelecimentos de alimentação. O cardápio é moderno, responsivo e integrado
              ao WhatsApp para receber pedidos. Incluímos ainda integração com{' '}
              <strong>Google Maps</strong>, para que seus clientes localizem seu endereço com um
              toque.
            </p>
          </section>

          {/* Hospedagem e domínio */}
          <section>
            <h2 className="text-foreground mt-8 mb-4 flex items-center gap-2 text-xl font-semibold">
              <Globe className="text-primary h-5 w-5" />
              1. Hospedagem e domínio
            </h2>
            <p className="text-foreground/90">
              A hospedagem do seu cardápio é <strong>personalizada</strong> para você: cada
              estabelecimento tem sua própria página e URL de acesso. No entanto, é importante
              deixarmos claro:
            </p>
            <ul className="text-foreground/90 mt-4 list-disc space-y-2 pl-6">
              <li>
                <strong>O endereço do site utiliza o domínio da plataforma (Vercel)</strong> — por
                exemplo, no formato que inclui{' '}
                <code className="bg-muted rounded px-1.5 py-0.5 text-sm">vercel.app</code> ou
                similar, e não um domínio particular (ex.:{' '}
                <code className="bg-muted rounded px-1.5 py-0.5 text-sm">seudominio.com.br</code>)
                registrado em seu nome.
              </li>
              <li>
                A infraestrutura é profissional e estável, mas o{' '}
                <strong>nome de domínio exibido na barra do navegador</strong>é da rede em que o
                serviço está hospedado (Vercel), e não um domínio próprio contratado separadamente
                por você.
              </li>
              <li>
                Caso deseje um domínio exclusivo (ex.:{' '}
                <code className="bg-muted rounded px-1.5 py-0.5 text-sm">
                  meurestaurante.com.br
                </code>
                ), isso pode envolver contratação e configuração adicional, fora do escopo padrão do
                plano.
              </li>
            </ul>
            <p className="text-foreground/90 mt-4">
              Informamos isso de forma transparente para que você saiba exatamente o que está
              incluso e o que seria um serviço adicional, reforçando nossa preocupação com a clareza
              e a confiabilidade.
            </p>
          </section>

          {/* Prazo de entrega */}
          <section className="bg-primary/5 border-primary/10 rounded-2xl border p-6">
            <h2 className="text-foreground mt-0 flex items-center gap-2 text-xl font-semibold">
              <FileText className="text-primary h-5 w-5" />
              Prazo de entrega (Implantação pela equipe)
            </h2>
            <p className="text-foreground/90 mt-2">
              Após o envio completo das informações no formulário de onboarding, nossa equipe monta
              e publica seu cardápio digital em até <strong>2 (dois) dias úteis</strong>. O prazo
              considera dias úteis (segunda a sexta), excluindo feriados.
            </p>
          </section>

          {/* Modelo comercial atual */}
          <section className="rounded-2xl border border-green-500/10 bg-green-500/5 p-6">
            <h2 className="text-foreground mt-0 flex items-center gap-2 text-xl font-semibold">
              <FileText className="h-5 w-5 text-green-600" />
              Modelo comercial atual
            </h2>
            <p className="text-foreground/90 mt-2">
              O fluxo público vigente comunica duas etapas com clareza: uma{' '}
              <strong>implantação inicial</strong>, paga no checkout, e o{' '}
              <strong>plano mensal da plataforma</strong>, que mantém o cardápio hospedado, editável
              e ativo após a liberação. Isso evita a leitura errada de que o cliente paga uma vez e
              fica para sempre sem custo recorrente. Detalhes complementares estão em nossos{' '}
              <Link href="/termos" className="text-primary font-medium hover:underline">
                Termos de Uso
              </Link>
              .
            </p>
          </section>

          {/* O que está incluso */}
          <section>
            <h2 className="text-foreground mt-8 mb-4 flex items-center gap-2 text-xl font-semibold">
              <FileText className="text-primary h-5 w-5" />
              2. O que está incluso no serviço
            </h2>
            <ul className="text-foreground/90 list-disc space-y-2 pl-6">
              <li>
                <strong>Site profissional</strong> com layout moderno e responsivo (celular e
                computador).
              </li>
              <li>
                <strong>Cardápio digital</strong> incluso, com categorias, produtos, preços e fotos.
              </li>
              <li>
                <strong>Integração com WhatsApp</strong> para o cliente enviar o pedido direto pelo
                app.
              </li>
              <li>
                <strong>Google Maps integrado</strong>, para o cliente localizar o endereço do
                estabelecimento com facilidade.
              </li>
              <li>
                Painel para você cadastrar e editar produtos, categorias e informações do negócio.
              </li>
              <li>
                Hospedagem personalizada (sua página com sua identificação), no domínio da
                plataforma, conforme descrito acima.
              </li>
            </ul>
          </section>

          {/* Transparência e confiabilidade */}
          <section>
            <h2 className="text-foreground mt-8 mb-4 text-xl font-semibold">
              3. Compromisso com transparência e confiabilidade
            </h2>
            <p className="text-foreground/90">
              Nosso objetivo é que você tenha todas as informações necessárias para decidir com
              segurança. Por isso:
            </p>
            <ul className="text-foreground/90 mt-4 list-disc space-y-2 pl-6">
              <li>
                Deixamos explícitos o modelo de hospedagem, domínio, implantação inicial e plano
                mensal correspondente.
              </li>
              <li>
                Informamos de forma clara o que está incluso (site profissional, cardápio digital,
                WhatsApp, Google Maps).
              </li>
              <li>
                Mantemos termos de uso e políticas acessíveis, para você conhecer seus direitos e
                deveres.
              </li>
              <li>
                Buscamos oferecer um serviço estável e profissional, com suporte quando aplicável ao
                seu plano.
              </li>
            </ul>
          </section>

          {/* Google Maps */}
          <section className="bg-muted/50 border-border rounded-2xl border p-6">
            <h2 className="text-foreground mt-0 flex items-center gap-2 text-xl font-semibold">
              <MapPin className="text-primary h-5 w-5" />
              4. Google Maps integrado
            </h2>
            <p className="text-foreground/90 mt-2">
              O cardápio digital inclui <strong>integração com Google Maps</strong>. Assim, o
              cliente pode abrir a localização do seu estabelecimento no mapa com um clique,
              facilitando quem vai buscar o pedido ou quer saber o endereço. O uso do Google Maps
              está sujeito às políticas do Google; nós apenas integramos o recurso ao seu site de
              forma profissional.
            </p>
          </section>

          {/* Resumo */}
          <section>
            <h2 className="text-foreground mt-8 mb-4 text-xl font-semibold">5. Resumo</h2>
            <p className="text-foreground/90">
              Você contrata um{' '}
              <strong>
                site profissional com cardápio digital incluso e Google Maps integrado
              </strong>
              . A hospedagem é personalizada (sua página, sua marca), mas o endereço na internet
              utiliza o domínio da plataforma (Vercel), e não um domínio particular. Todas essas
              informações são divulgadas nesta política em nome da transparência e da confiança. Em
              caso de dúvidas, consulte os Termos de Uso ou entre em contato.
            </p>
          </section>

          {/* Contato */}
          <section className="border-border border-t pt-6">
            <h2 className="text-foreground mt-8 mb-4 text-xl font-semibold">Contato</h2>
            <p className="text-foreground/90">
              Dúvidas sobre esta política ou sobre o serviço? Acesse os{' '}
              <Link href="/termos" className="text-primary font-medium hover:underline">
                Termos de Uso
              </Link>{' '}
              ou entre em contato pelo email: <strong>contato@cardapio.digital</strong>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

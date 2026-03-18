import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle,
  Crown,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react'

const WA_REVENDEDOR =
  'https://wa.me/5512996887993?text=Ol%C3%A1%2C+quero+ser+revendedor+do+Card%C3%A1pio+Digital'

const DIFERENCAS = [
  {
    icon: Store,
    afiliado: 'Indica restaurantes e recebe comissão',
    revendedor: 'Vende o serviço como parte do seu portfólio',
  },
  {
    icon: LayoutDashboard,
    afiliado: 'Painel de afiliado individual',
    revendedor: 'Gerencia múltiplos clientes em nome próprio',
  },
  {
    icon: BadgeCheck,
    afiliado: '30% de comissão recorrente',
    revendedor: 'Modelo de precificação combinado com a Zairyx',
  },
  {
    icon: Users,
    afiliado: 'Indicação pessoal, link exclusivo',
    revendedor: 'Carteira de clientes sob sua marca',
  },
]

const BENEFICIOS = [
  {
    icon: Briefcase,
    title: 'Produto validado',
    desc: 'Ofereça um cardápio digital completo — QR Code, pedidos online, editor visual — sem precisar desenvolvê-lo.',
  },
  {
    icon: TrendingUp,
    title: 'Receita recorrente',
    desc: 'Cada restaurante que você cadastrar gera receita mensal para o seu negócio — enquanto o cliente ficar ativo.',
  },
  {
    icon: LayoutDashboard,
    title: 'Painel de gestão',
    desc: 'Acesso a um painel dedicado para gerenciar todos os restaurantes da sua carteira em um só lugar.',
  },
  {
    icon: ShieldCheck,
    title: 'Suporte da Zairyx',
    desc: 'Você tem suporte técnico da equipe Zairyx para atender seus clientes com confiança.',
  },
  {
    icon: Crown,
    title: 'Marca própria (em breve)',
    desc: 'Possibilidade de apresentar o produto sob o nome da sua agência ou empresa.',
  },
  {
    icon: MessageCircle,
    title: 'Canal exclusivo',
    desc: 'Acesso direto ao time de parceiros Zairyx via WhatsApp para negociações e suporte prioritário.',
  },
]

export default function Revendedores() {
  return (
    <div className="from-background to-secondary/20 min-h-screen bg-linear-to-b">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-border bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-primary-foreground text-sm font-bold">CD</span>
            </div>
            <span className="text-foreground text-xl font-bold">Cardápio Digital</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/afiliados"
              className="text-foreground/60 hover:text-foreground hidden text-sm transition-colors sm:block"
            >
              Programa de afiliados
            </Link>
            <a
              href={WA_REVENDEDOR}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Falar com a equipe
            </a>
          </div>
        </div>
      </header>

      <main>

        {/* ══════════════════════════════════════════════════════ HERO */}
        <section className="px-4 pt-16 pb-20 text-center md:pt-24 md:pb-28">
          <div className="mx-auto max-w-3xl">
            <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
              <Briefcase className="h-4 w-4" />
              Parceria comercial · Para empresas e agências
            </div>

            <h1 className="text-foreground mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Revenda o Cardápio Digital{' '}
              <span className="text-primary">para seus clientes</span>
            </h1>

            <p className="text-foreground/70 mx-auto mb-10 max-w-2xl text-xl leading-relaxed">
              Se você tem uma agência, presta serviços a restaurantes ou quer adicionar uma solução
              de cardápio digital ao portfólio da sua empresa, o programa de revendedores foi feito
              para você.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={WA_REVENDEDOR}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-7 py-4 text-base font-semibold shadow-lg transition-colors"
              >
                Quero ser revendedor
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/afiliados"
                className="border-border text-foreground hover:bg-secondary inline-flex items-center gap-2 rounded-xl border px-7 py-4 text-base font-medium transition-colors"
              >
                Prefiro ser afiliado
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════ AFILIADO vs REVENDEDOR */}
        <section className="border-border bg-secondary/40 border-y px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-foreground mb-2 text-center text-3xl font-bold">
              Afiliado ou Revendedor?
            </h2>
            <p className="text-foreground/55 mb-12 text-center text-sm">
              Entenda qual modelo faz mais sentido para o seu perfil.
            </p>

            <div className="border-border bg-card rounded-2xl border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-3 border-b border-border">
                <div className="p-4 text-foreground/40 text-xs" />
                <div className="bg-secondary/50 border-l border-border p-4 text-center">
                  <div className="text-foreground font-bold">Afiliado</div>
                  <div className="text-foreground/50 text-xs mt-0.5">Individual</div>
                </div>
                <div className="bg-primary/5 border-l border-border p-4 text-center">
                  <div className="text-primary font-bold">Revendedor</div>
                  <div className="text-foreground/50 text-xs mt-0.5">Empresarial</div>
                </div>
              </div>

              {DIFERENCAS.map((row, i) => {
                const Icon = row.icon
                return (
                  <div
                    key={i}
                    className={`grid grid-cols-3 border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-secondary/20'}`}
                  >
                    <div className="flex items-center gap-2 p-4">
                      <Icon className="text-foreground/40 h-4 w-4 shrink-0" />
                    </div>
                    <div className="border-l border-border p-4 text-sm text-foreground/70">
                      {row.afiliado}
                    </div>
                    <div className="border-l border-border p-4 text-sm text-foreground/90 font-medium">
                      {row.revendedor}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-foreground/50 mt-4 text-center text-xs">
              Não sabe qual escolher?{' '}
              <a
                href={WA_REVENDEDOR}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Fale com a gente
              </a>{' '}
              e te orientamos.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════ BENEFÍCIOS */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-foreground mb-2 text-center text-3xl font-bold">
              Por que ser revendedor?
            </h2>
            <p className="text-foreground/55 mb-12 text-center text-sm">
              Adicione uma solução completa ao portfólio da sua empresa.
            </p>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {BENEFICIOS.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="border-border bg-card rounded-xl border p-5">
                    <div className="bg-primary/10 mb-3 inline-flex rounded-xl p-2.5">
                      <Icon className="text-primary h-5 w-5" />
                    </div>
                    <h3 className="text-foreground mb-1 font-semibold">{item.title}</h3>
                    <p className="text-foreground/60 text-sm leading-5">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════ ELEGIBILIDADE */}
        <section className="border-border bg-secondary/40 border-y px-4 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-foreground mb-2 text-center text-3xl font-bold">
              Quem pode ser revendedor?
            </h2>
            <p className="text-foreground/55 mb-8 text-center text-sm">
              O programa é pensado para parceiros que atendem restaurantes de forma recorrente.
            </p>
            <div className="border-border bg-card rounded-2xl border p-6">
              <ul className="space-y-4">
                {[
                  'Agências de marketing e comunicação que atendem bares e restaurantes.',
                  'Prestadores de serviço de tecnologia para o setor de alimentação.',
                  'Consultores de gestão com carteira de restaurantes.',
                  'Empresas de impressão / gráfica que já fornecem cardápios físicos.',
                  'Criadores de sites e aplicativos locais.',
                  'Qualquer empresa com interesse em oferecer cardápio digital como serviço.',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-foreground/75">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════ CTA FINAL */}
        <section className="px-4 py-24">
          <div className="mx-auto max-w-3xl">
            <div className="bg-primary rounded-3xl p-10 text-center text-white shadow-2xl">
              <Briefcase className="mx-auto mb-4 h-10 w-10 text-white/70" />
              <h2 className="mb-3 text-3xl font-bold">Vamos conversar?</h2>
              <p className="mb-8 text-lg text-white/80">
                Fale com a equipe Zairyx e descubra como estruturar a parceria para o seu negócio.
              </p>
              <a
                href={WA_REVENDEDOR}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-semibold text-primary shadow transition-colors hover:bg-white/90"
              >
                Falar via WhatsApp
                <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-6 text-sm text-white/50">
                Prefere e-mail?{' '}
                <a
                  href="mailto:zairyx.ai@gmail.com"
                  className="underline hover:text-white/80"
                >
                  zairyx.ai@gmail.com
                </a>
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

import Link from 'next/link'
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ExternalLink,
  Flame,
  MessageCircle,
  Shield,
  Sparkles,
  Star,
  Store,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { COMMERCIAL_COPY } from '@/lib/domains/marketing/commercial-copy'

export const metadata = {
  title: 'Comparativo Real — Zairyx vs iFood, Anota AI, Consumer, Saipos e mais',
  description:
    'Compare preços, comissões, reputação no Reclame Aqui e funcionalidades reais entre Zairyx, iFood, Anota AI, Consumer, Saipos, Kyte e apps regionais. Dados públicos e verificáveis.',
}

/* ── Dados estruturados dos concorrentes ────────────────────────────────────── */

const MARKETPLACES = [
  {
    name: 'iFood',
    type: 'Marketplace',
    commission: '12–27%',
    monthly: 'R$ 110–150',
    costAt20k: 'R$ 3.150 (simulação)',
    ownChannel: false,
    clientIsYours: false,
    competitorsVisible: true,
    ownBrand: false,
    aiAssistant: false,
    guarantee: false,
    cancellation: 'Variável',
    source: 'blog-parceiros.ifood.com.br',
    highlight: 'Ótimo para ser encontrado. Ruim para margem de quem já tem entregador.',
    color: 'red',
  },
  {
    name: 'Apps regionais',
    type: 'Marketplace local',
    commission: 'Variável',
    monthly: 'Variável',
    costAt20k: 'Depende do app',
    ownChannel: false,
    clientIsYours: false,
    competitorsVisible: true,
    ownBrand: false,
    aiAssistant: false,
    guarantee: false,
    cancellation: 'Variável',
    source: 'Sites oficiais',
    highlight: 'Presença local, mas os clientes continuam sendo do app — não seus.',
    color: 'zinc',
  },
] as const

const SAAS_COMPETITORS = [
  {
    name: 'Anota AI',
    clients: '50.000+',
    reclameAquiScore: 6.0,
    reclameAquiLabel: 'Regular',
    reclameAquiColor: 'text-red-600',
    complaints6m: 752,
    resolution: '60,3%',
    wouldReturn: '43%',
    responseTime: '3 dias 7h',
    topComplaint: 'Cobrança indevida e cancelamento difícil',
    priceRange: '~R$ 99–299/mês',
    pricePublic: false,
    commission: '0%',
    focus: 'Food service',
    aiType: 'Bot WhatsApp',
    catalogReady: false,
    cancellationEasy: false,
  },
  {
    name: 'Consumer',
    clients: '30.000+',
    reclameAquiScore: 9.3,
    reclameAquiLabel: 'Ótimo',
    reclameAquiColor: 'text-green-600',
    complaints6m: 51,
    resolution: '91,7%',
    wouldReturn: '91,7%',
    responseTime: '2 dias 1h',
    topComplaint: '—',
    priceRange: 'R$ 49,90–64,90/mês',
    pricePublic: true,
    commission: '0%',
    focus: 'Food service — 15+ anos',
    aiType: 'ChatGPT WhatsApp',
    catalogReady: false,
    cancellationEasy: true,
  },
  {
    name: 'Saipos',
    clients: '—',
    reclameAquiScore: 8.3,
    reclameAquiLabel: 'Ótimo',
    reclameAquiColor: 'text-green-600',
    complaints6m: 227,
    resolution: '95,1%',
    wouldReturn: '72,8%',
    responseTime: '17 dias 2h',
    topComplaint: 'Suporte lento e bot trava',
    priceRange: '~R$ 99–399/mês',
    pricePublic: false,
    commission: '0%',
    focus: 'Food service',
    aiType: '—',
    catalogReady: false,
    cancellationEasy: false,
  },
  {
    name: 'Cardápio Web',
    clients: '—',
    reclameAquiScore: 8.3,
    reclameAquiLabel: 'Ótimo',
    reclameAquiColor: 'text-green-600',
    complaints6m: 96,
    resolution: '89,1%',
    wouldReturn: '78,2%',
    responseTime: '11 dias 12h',
    topComplaint: 'Cancelamentos automáticos e suporte lento',
    priceRange: '~R$ 79–149/mês',
    pricePublic: false,
    commission: '0%',
    focus: 'Food marketing + gestão',
    aiType: 'Chatbot',
    catalogReady: false,
    cancellationEasy: false,
  },
  {
    name: 'Goomer',
    clients: '—',
    reclameAquiScore: 9.0,
    reclameAquiLabel: 'Ótimo',
    reclameAquiColor: 'text-green-600',
    complaints6m: 49,
    resolution: '96,3%',
    wouldReturn: '85,2%',
    responseTime: '13 dias',
    topComplaint: 'Cancelamento e cobrança',
    priceRange: 'Sob consulta',
    pricePublic: false,
    commission: '0%',
    focus: 'Food service',
    aiType: '—',
    catalogReady: false,
    cancellationEasy: false,
  },
  {
    name: 'Kyte',
    clients: '40.000+',
    reclameAquiScore: null,
    reclameAquiLabel: '—',
    reclameAquiColor: 'text-zinc-400',
    complaints6m: null,
    resolution: '—',
    wouldReturn: '—',
    responseTime: '—',
    topComplaint: '—',
    priceRange: 'R$ 49,90–99,90/mês',
    pricePublic: true,
    commission: '0%',
    focus: 'Generalista — não é food',
    aiType: 'IA "Kai" WhatsApp',
    catalogReady: false,
    cancellationEasy: true,
  },
] as const

const ZAIRYX_DATA = {
  name: 'Zairyx',
  price: 'R$ 147/mês',
  commission: '0%',
  pricePublic: true,
  reclameAquiScore: null,
  reclameAquiLabel: 'Novo no mercado',
  catalogReady: true,
  catalogCount: 16,
  aiType: 'IA dentro do cardápio',
  cancellationEasy: true,
  cancellationDetail: 'Pelo painel, sem burocracia',
  guarantee: COMMERCIAL_COPY.withdrawalShort,
  focus: '100% delivery',
  ownChannel: true,
} as const

/* ── Dores do mercado extraídas do Reclame Aqui ────────────────────────────── */
const MARKET_PAINS = [
  {
    icon: TrendingDown,
    pain: 'Cobrança indevida',
    detail:
      'A maior dor do setor. Clientes relatam cobranças após cancelamento em múltiplas plataformas.',
    brands: 'Recorrente em: Anota AI, Saipos',
    zairyx: 'Cancelamento pelo painel com efeito no fim do período vigente. Sem cobrança surpresa.',
  },
  {
    icon: MessageCircle,
    pain: 'Suporte lento ou robótico',
    detail: 'Tempo de resposta médio do setor varia de 2 a 17 dias. Alguns usam apenas bot.',
    brands: 'Saipos: ~17 dias · Cardápio Web: ~11 dias · Goomer: ~13 dias',
    zairyx: 'Atendimento priorizado pela equipe. Sem fila de bot interminável.',
  },
  {
    icon: AlertTriangle,
    pain: 'Cancelamento difícil',
    detail:
      '43% dos clientes de um dos líderes de mercado dizem que não voltariam a fazer negócio.',
    brands: 'Anota AI: 43% não voltariam · Saipos: 72,8% voltariam',
    zairyx: 'Sem fidelidade. Cancele pelo painel quando quiser.',
  },
  {
    icon: X,
    pain: 'Preço escondido',
    detail:
      'Várias plataformas não publicam preços. Você só descobre o valor depois de preencher formulário.',
    brands: 'Anota AI, Saipos e Goomer: sob consulta',
    zairyx: 'R$ 147/mês — público, fixo, sem surpresa.',
  },
] as const

export default function ComparativoPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Store className="h-6 w-6 text-orange-500" />
            <span className="text-xl font-bold text-zinc-900">Zairyx</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/precos"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
            >
              Preços
            </Link>
            <Link
              href="/templates"
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              Ver modelos
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        {/* ═══ HERO — Contexto e credibilidade ═══════════════════════════ */}
        <div className="mx-auto mb-16 max-w-3xl text-center md:mb-24">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
            <Star className="h-4 w-4" />
            Dados públicos · Verificáveis · Atualizados em Abril/2026
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl lg:text-6xl">
            Sabe qual sistema escolher
            <br />
            <span className="text-orange-500">para o seu delivery?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Reunimos dados reais de preço, reputação e funcionalidades dos principais sistemas do
            mercado para você decidir com informação — não com achismo. Todos os dados de reputação
            vêm do <span className="font-semibold text-zinc-800">Reclame Aqui</span> e os preços dos{' '}
            <span className="font-semibold text-zinc-800">sites oficiais</span>.
          </p>
        </div>

        {/* ═══ BLOCO 1: Marketplace vs Canal Próprio ════════════════════ */}
        <section className="mb-20">
          <div className="mb-8">
            <p className="text-sm font-bold tracking-[0.2em] text-red-600 uppercase">
              O custo da dependência
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Quanto do seu faturamento vai para o marketplace?
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
              Marketplaces ajudam a captar novos clientes. Mas quando o cliente já conhece seu
              delivery, cada pedido intermediado é margem que você perde.
            </p>
          </div>

          {/* Simulação visual de custo */}
          <div className="mb-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6">
              <p className="text-sm font-bold text-red-800">iFood (Plano Básico)*</p>
              <p className="mt-1 text-xs text-red-600">Faturamento: R$ 20.000/mês</p>
              <div className="mt-3 flex items-baseline gap-1">
                <p className="text-4xl font-bold text-red-700">R$ 3.150</p>
                <p className="text-sm text-red-500">/mês em taxas</p>
              </div>
              <p className="mt-2 text-xs text-red-500">
                12% comissão + 3,2% online + R$ 110 mensalidade
              </p>
            </div>
            <div className="rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-6">
              <p className="text-sm font-bold text-zinc-800">iFood (Plano Entrega)*</p>
              <p className="mt-1 text-xs text-zinc-500">Faturamento: R$ 20.000/mês</p>
              <div className="mt-3 flex items-baseline gap-1">
                <p className="text-4xl font-bold text-zinc-700">R$ 5.400</p>
                <p className="text-sm text-zinc-500">/mês em taxas</p>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Até 27% comissão (inclui logística do iFood)
              </p>
            </div>
            <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-6">
              <p className="text-sm font-bold text-green-800">Zairyx (canal próprio)</p>
              <p className="mt-1 text-xs text-green-600">Faturamento: R$ 20.000/mês</p>
              <div className="mt-3 flex items-baseline gap-1">
                <p className="text-4xl font-bold text-green-700">R$ 147</p>
                <p className="text-sm text-green-500">/mês fixo</p>
              </div>
              <p className="mt-2 text-xs text-green-600">Zero comissão da Zairyx por pedido</p>
            </div>
          </div>

          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-center">
            <p className="text-sm font-semibold text-orange-800">
              <TrendingUp className="mr-1 inline h-4 w-4" />
              Economia potencial: até <strong>R$ 3.000+/mês</strong> migrando pedidos recorrentes
              para o canal próprio
            </p>
          </div>

          <p className="mt-3 text-center text-xs text-zinc-400">
            *Plano Básico iFood (entrega própria): 12% + 3,2% online + R$ 110/mês. Plano Entrega:
            até 27%, inclui logística. Fonte: blog-parceiros.ifood.com.br (Mar/2026).
          </p>
        </section>

        {/* ═══ BLOCO 2: Ranking de Reputação — Reclame Aqui ═════════════ */}
        <section className="mb-20">
          <div className="mb-8">
            <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
              O que os clientes dos concorrentes dizem
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Reputação no Reclame Aqui — dados públicos
            </h2>
            <p className="mt-3 max-w-2xl text-base text-zinc-600">
              Antes de escolher um sistema, vale verificar o que os clientes reais relatam. Estes
              são dados públicos consultados em abril de 2026.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-4 text-left font-bold text-zinc-700">Sistema</th>
                  <th className="px-4 py-4 text-center font-bold text-zinc-700">Nota</th>
                  <th className="px-4 py-4 text-center font-bold text-zinc-700">
                    Reclamações (6m)
                  </th>
                  <th className="px-4 py-4 text-center font-bold text-zinc-700">Resolvidas</th>
                  <th className="px-4 py-4 text-center font-bold text-zinc-700">Voltariam?</th>
                  <th className="px-4 py-4 text-center font-bold text-zinc-700">Tempo resposta</th>
                  <th className="px-4 py-4 text-left font-bold text-zinc-700">Principal queixa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {SAAS_COMPETITORS.map((c) => (
                  <tr key={c.name} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3 font-semibold text-zinc-900">{c.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${c.reclameAquiColor}`}>
                        {c.reclameAquiScore ?? '—'} {c.reclameAquiLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-600">{c.complaints6m ?? '—'}</td>
                    <td className="px-4 py-3 text-center text-zinc-600">{c.resolution}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          c.wouldReturn !== '—' && parseFloat(c.wouldReturn) < 50
                            ? 'font-bold text-red-600'
                            : 'text-zinc-600'
                        }
                      >
                        {c.wouldReturn}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-zinc-600">{c.responseTime}</td>
                    <td className="px-4 py-3 text-sm text-zinc-500">{c.topComplaint}</td>
                  </tr>
                ))}
                {/* Zairyx row */}
                <tr className="bg-green-50/50">
                  <td className="px-4 py-3 font-bold text-green-700">Zairyx</td>
                  <td className="px-4 py-3 text-center text-zinc-500">Novo no mercado</td>
                  <td className="px-4 py-3 text-center text-zinc-500">—</td>
                  <td className="px-4 py-3 text-center text-zinc-500">—</td>
                  <td className="px-4 py-3 text-center text-zinc-500">—</td>
                  <td className="px-4 py-3 text-center text-zinc-500">—</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-700">
                    Cancelamento pelo painel, sem fidelidade
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-center text-xs text-zinc-400">
            Dados do Reclame Aqui consultados em Abril/2026. Classificações e métricas podem mudar.
          </p>
        </section>

        {/* ═══ BLOCO 3: Dores do mercado ════════════════════════════════ */}
        <section className="mb-20">
          <div className="mb-8">
            <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
              As 4 maiores dores do mercado
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Os problemas que fazem donos de delivery trocar de sistema
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {MARKET_PAINS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.pain}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                      <Icon className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900">{item.pain}</h3>
                  </div>
                  <p className="text-sm leading-6 text-zinc-600">{item.detail}</p>
                  <p className="mt-2 text-xs text-zinc-400">{item.brands}</p>
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3">
                    <p className="flex items-start gap-2 text-sm font-medium text-green-800">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>
                        <strong>Na Zairyx:</strong> {item.zairyx}
                      </span>
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══ BLOCO 4: Comparativo detalhado — Funcionalidades ══════════ */}
        <section className="mb-20">
          <div className="mb-8">
            <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
              Funcionalidades lado a lado
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              O que cada sistema oferece — sem marketing
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="px-4 py-4 text-left font-bold text-zinc-700">Recurso</th>
                  <th className="px-4 py-4 text-center font-bold text-zinc-600">Anota AI</th>
                  <th className="px-4 py-4 text-center font-bold text-zinc-600">Consumer</th>
                  <th className="px-4 py-4 text-center font-bold text-zinc-600">Saipos</th>
                  <th className="px-4 py-4 text-center font-bold text-zinc-600">Kyte</th>
                  <th className="bg-green-50 px-4 py-4 text-center font-bold text-green-700">
                    Zairyx
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="px-4 py-3 font-semibold text-zinc-900">Preço mensal</td>
                  <td className="px-4 py-3 text-center text-zinc-600">~R$ 99–299*</td>
                  <td className="px-4 py-3 text-center text-zinc-600">R$ 49,90</td>
                  <td className="px-4 py-3 text-center text-zinc-600">~R$ 99–399*</td>
                  <td className="px-4 py-3 text-center text-zinc-600">R$ 49,90–99,90</td>
                  <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                    R$ 147
                  </td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="px-4 py-3 font-semibold text-zinc-900">Publica o preço?</td>
                  <td className="px-4 py-3 text-center text-red-500">Não</td>
                  <td className="px-4 py-3 text-center text-green-600">Sim</td>
                  <td className="px-4 py-3 text-center text-red-500">Não</td>
                  <td className="px-4 py-3 text-center text-green-600">Sim</td>
                  <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                    Sim
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-zinc-900">
                    Catálogo pronto do nicho
                  </td>
                  <td className="px-4 py-3 text-center text-red-400">
                    <X className="mx-auto h-4 w-4" />
                  </td>
                  <td className="px-4 py-3 text-center text-red-400">
                    <X className="mx-auto h-4 w-4" />
                  </td>
                  <td className="px-4 py-3 text-center text-red-400">
                    <X className="mx-auto h-4 w-4" />
                  </td>
                  <td className="px-4 py-3 text-center text-red-400">
                    <X className="mx-auto h-4 w-4" />
                  </td>
                  <td className="bg-green-50/50 px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-green-700">
                      <CheckCircle className="h-4 w-4" /> 16 nichos
                    </span>
                  </td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="px-4 py-3 font-semibold text-zinc-900">IA no cardápio</td>
                  <td className="px-4 py-3 text-center text-zinc-600">Bot WhatsApp</td>
                  <td className="px-4 py-3 text-center text-zinc-600">ChatGPT WhatsApp</td>
                  <td className="px-4 py-3 text-center text-red-400">
                    <X className="mx-auto h-4 w-4" />
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-600">IA WhatsApp</td>
                  <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                    IA dentro do cardápio
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-zinc-900">Editor visual mobile</td>
                  <td className="px-4 py-3 text-center text-zinc-600">Sim</td>
                  <td className="px-4 py-3 text-center text-zinc-600">Sim</td>
                  <td className="px-4 py-3 text-center text-zinc-600">Sim</td>
                  <td className="px-4 py-3 text-center text-zinc-600">Sim</td>
                  <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                    Sim
                  </td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="px-4 py-3 font-semibold text-zinc-900">Canal 100% próprio</td>
                  <td className="px-4 py-3 text-center text-zinc-600">Parcial</td>
                  <td className="px-4 py-3 text-center text-zinc-600">Parcial</td>
                  <td className="px-4 py-3 text-center text-zinc-600">Parcial</td>
                  <td className="px-4 py-3 text-center text-green-600">Sim</td>
                  <td className="bg-green-50/50 px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-green-700">
                      <CheckCircle className="h-4 w-4" /> Sim — sua marca
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-zinc-900">Foco em food service</td>
                  <td className="px-4 py-3 text-center text-green-600">Sim</td>
                  <td className="px-4 py-3 text-center text-green-600">Sim — 15+ anos</td>
                  <td className="px-4 py-3 text-center text-green-600">Sim</td>
                  <td className="px-4 py-3 text-center text-red-500">Não — generalista</td>
                  <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                    Sim — 100% delivery
                  </td>
                </tr>
                <tr className="bg-zinc-50/50">
                  <td className="px-4 py-3 font-semibold text-zinc-900">Pagamento online</td>
                  <td className="px-4 py-3 text-center text-green-600">Sim</td>
                  <td className="px-4 py-3 text-center text-green-600">Sim</td>
                  <td className="px-4 py-3 text-center text-green-600">Sim</td>
                  <td className="px-4 py-3 text-center text-green-600">Sim</td>
                  <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                    Mercado Pago nativo
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-zinc-900">Garantia contratual</td>
                  <td className="px-4 py-3 text-center text-zinc-600">7 dias (CDC)</td>
                  <td className="px-4 py-3 text-center text-zinc-600">7 dias (CDC)</td>
                  <td className="px-4 py-3 text-center text-zinc-600">7 dias (CDC)</td>
                  <td className="px-4 py-3 text-center text-zinc-600">7 dias (CDC)</td>
                  <td className="bg-green-50/50 px-4 py-3 text-center font-bold text-green-700">
                    {COMMERCIAL_COPY.withdrawalShort}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-center text-xs text-zinc-400">
            *Preços estimados (não publicam valores). Features verificadas em sites oficiais e
            reviews públicos (Abr/2026).
          </p>
        </section>

        {/* ═══ BLOCO 5: Estratégia Inteligente ══════════════════════════ */}
        <section className="mb-20">
          <div className="rounded-3xl border-2 border-orange-200 bg-orange-50 p-8 md:p-12">
            <p className="text-sm font-bold tracking-[0.2em] text-orange-700 uppercase">
              A estratégia que funciona
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Use cada plataforma para o que ela faz melhor
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700">
              Não é sobre abandonar o iFood amanhã. É sobre construir um canal próprio que reduz sua
              dependência gradualmente — e protege sua margem.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-orange-500">01</p>
                <p className="mt-2 text-sm font-bold text-zinc-800">Capte no marketplace</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Use iFood e apps regionais para ser encontrado por novos clientes.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-orange-500">02</p>
                <p className="mt-2 text-sm font-bold text-zinc-800">Direcione para seu canal</p>
                <p className="mt-1 text-sm text-zinc-600">
                  QR Code na embalagem, post no Instagram, mensagem pós-venda com link do seu
                  cardápio.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-orange-500">03</p>
                <p className="mt-2 text-sm font-bold text-zinc-800">Fidelize sem intermediário</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Da segunda compra em diante, o pedido vem pelo seu canal. Sem comissão, sem
                  concorrentes na tela.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-orange-500">04</p>
                <p className="mt-2 text-sm font-bold text-zinc-800">Reduza a dependência</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Com o tempo, sua base própria cresce e a dependência de marketplace diminui
                  naturalmente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ BLOCO 6: Por que a Zairyx é diferente ════════════════════ */}
        <section className="mb-20">
          <div className="mb-8 text-center">
            <p className="text-sm font-bold tracking-[0.2em] text-orange-600 uppercase">
              O que só a Zairyx oferece
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl">
              Nenhum outro sistema entrega tudo isso junto
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-6 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-orange-500" />
              <p className="text-3xl font-bold text-orange-600">16</p>
              <p className="mt-1 text-sm font-bold text-zinc-800">Catálogos prontos por nicho</p>
              <p className="mt-2 text-xs text-zinc-600">
                Pizzaria, hamburgueria, bar, cafeteria, açaíteria, mercadinho e mais. Já vem com
                produtos — só editar.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-green-500" />
              <p className="text-3xl font-bold text-green-600">24h</p>
              <p className="mt-1 text-sm font-bold text-zinc-800">IA dentro do cardápio</p>
              <p className="mt-2 text-xs text-zinc-600">
                Responde dúvidas, sugere combos e ajuda a fechar pedidos. Inclusa no plano, sem
                custo extra.
              </p>
            </div>
            <div className="rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-6 text-center">
              <Shield className="mx-auto mb-3 h-8 w-8 text-zinc-600" />
              <p className="text-3xl font-bold text-zinc-700">0%</p>
              <p className="mt-1 text-sm font-bold text-zinc-800">Comissão da Zairyx por pedido</p>
              <p className="mt-2 text-xs text-zinc-600">
                Mensalidade fixa. Vendeu R$ 1.000 ou R$ 100.000 — o valor não muda.
              </p>
            </div>
          </div>
        </section>

        {/* ═══ CTA final ════════════════════════════════════════════════ */}
        <section>
          <div className="rounded-3xl bg-zinc-950 p-8 text-center md:p-14">
            <Flame className="mx-auto mb-4 h-10 w-10 text-orange-400" />
            <h2 className="text-3xl font-bold text-white md:text-4xl">Já sabe qual escolher?</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-zinc-300">
              Se você já tem entregador fixo e quer parar de pagar comissão por pedido, o canal
              próprio é a saída mais inteligente. Comece hoje — leva menos de 30 minutos.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600"
              >
                <Sparkles className="h-5 w-5" />
                Escolher meu modelo agora
              </Link>
              <Link
                href="/precos"
                className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-600 px-7 py-4 text-base font-bold text-white transition-all hover:bg-zinc-800"
              >
                Ver preços e planos
              </Link>
            </div>
            <p className="mt-5 text-xs text-zinc-500">
              <Shield className="mr-1 inline h-3.5 w-3.5" />
              {COMMERCIAL_COPY.withdrawalOnline}. Sem fidelidade. Cancele pelo painel.
            </p>
          </div>
        </section>

        {/* ═══ Disclaimer final ═════════════════════════════════════════ */}
        <div className="mt-10 rounded-xl border border-zinc-100 bg-zinc-50 p-6">
          <p className="text-xs leading-5 text-zinc-400">
            <strong className="text-zinc-500">Nota sobre os dados:</strong> Todas as informações de
            reputação foram coletadas do Reclame Aqui em abril de 2026. Preços e funcionalidades
            foram verificados nos sites oficiais dos respectivos sistemas na mesma data. Condições
            comerciais podem mudar. A Zairyx não possui vínculo com nenhuma das empresas citadas.
            Este comparativo tem fins informativos e utiliza apenas dados publicamente disponíveis.
          </p>
        </div>
      </main>
    </div>
  )
}

import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CheckCircle2,
  Coins,
  LineChart,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

const HOW_IT_WORKS = [
  {
    title: '1. Você entra e pega seu link',
    description:
      'Crie sua conta, acesse o painel e copie seu link exclusivo para indicar novos deliverys.',
  },
  {
    title: '2. O sistema registra a indicação',
    description:
      'Quando a pessoa entra pelo seu link, o rastreamento salva a referência e protege o fluxo contra autoindicação.',
  },
  {
    title: '3. Você acompanha comissão e aprovação',
    description:
      'O painel mostra volume indicado, aprovação em 30 dias, pagamentos e alertas operacionais em cada etapa.',
  },
] as const

const PROGRAM_GUARDS = [
  'Comissão recorrente base de 30% nas indicações diretas aprovadas.',
  'Janela operacional de 30 dias para aprovação antes de liberar payout.',
  'Validação de PIX, backlog e batches monitorada pelo ForgeOps.',
  'Proteção contra self-referral e uso inválido do código de indicação.',
] as const

export default function AfiliadosPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.14),transparent_28%),linear-gradient(180deg,#fffdf8_0%,#fff7ed_36%,#ffffff_100%)]">
      <main>
        <section className="px-4 pt-16 pb-16 md:pt-24 md:pb-24">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-2 text-sm font-semibold text-orange-700 shadow-sm">
                <BadgeCheck className="h-4 w-4" />
                Programa de Afiliados Zairyx
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-tight text-zinc-950 md:text-6xl">
                Indique novos deliverys, ganhe comissão recorrente e acompanhe tudo sem planilha.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-700">
                O programa de afiliados foi desenhado para operação individual. Você indica, o
                sistema registra o link, acompanha a janela de 30 dias e organiza comissão, payout e
                validação operacional em camadas.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-6 py-4 text-base font-semibold text-white transition hover:bg-zinc-800"
                >
                  Quero ser afiliado
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/revendedores"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-300 bg-white px-6 py-4 text-base font-semibold text-zinc-900 transition hover:bg-zinc-50"
                >
                  Sou empresa, quero revender
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-orange-200 bg-white/85 p-4 shadow-sm">
                  <p className="text-2xl font-black text-zinc-950">30%</p>
                  <p className="mt-1 text-sm text-zinc-600">de comissão recorrente base</p>
                </div>
                <div className="rounded-2xl border border-orange-200 bg-white/85 p-4 shadow-sm">
                  <p className="text-2xl font-black text-zinc-950">30d</p>
                  <p className="mt-1 text-sm text-zinc-600">para aprovação operacional</p>
                </div>
                <div className="rounded-2xl border border-orange-200 bg-white/85 p-4 shadow-sm">
                  <p className="text-2xl font-black text-zinc-950">0%</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    de comissão da Zairyx por pedido do cliente final
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-4xl border border-zinc-200 bg-white/90 p-6 shadow-xl shadow-orange-100">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                <Coins className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Comissão organizada por etapa</p>
                  <p className="text-sm text-emerald-900/80">
                    Indicação, aprovação, batch e pagamento com trilha operacional clara.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {HOW_IT_WORKS.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <p className="text-sm font-semibold text-zinc-950">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{step.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="flex items-start gap-2 font-medium">
                  <BellRing className="mt-0.5 h-4 w-4 shrink-0" />O ForgeOps já monitora backlog de
                  aprovação, afiliado ativo sem PIX e batches pendentes para validação operacional
                  contínua.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-zinc-200 bg-white px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
                Como funciona
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
                Uma operação individual, com rastreamento real e validação em cada etapa.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
                <div className="flex items-center gap-3 text-zinc-950">
                  <UserRound className="h-5 w-5" />
                  <h3 className="text-lg font-bold">O que o afiliado faz</h3>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-zinc-700">
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> Indica
                    operações com seu link exclusivo.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> Acompanha
                    quem entrou, quem aprovou e quanto já virou renda.
                  </li>
                  <li className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" /> Recebe
                    quando a comissão entra na janela operacional de payout.
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
                <div className="flex items-center gap-3 text-zinc-950">
                  <ShieldCheck className="h-5 w-5" />
                  <h3 className="text-lg font-bold">O que o sistema valida</h3>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-zinc-700">
                  {PROGRAM_GUARDS.map((item) => (
                    <li key={item} className="flex gap-3">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-zinc-950">
                <LineChart className="h-5 w-5" />
                <h2 className="text-xl font-bold">Sinais de prontidão do programa</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                O núcleo já existe e está operacional no admin, no payout e na observabilidade. O
                que estava faltando era a camada pública própria de entrada em /afiliados.
              </p>
              <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
                Painel, tiers, comissão, aprovação, batches e auditoria já estão integrados ao
                ForgeOps para teste e validação contínua.
              </div>
            </div>

            <div className="rounded-4xl bg-zinc-950 p-8 text-white shadow-2xl shadow-zinc-950/20">
              <p className="text-sm font-semibold tracking-[0.18em] text-orange-300 uppercase">
                Próximo passo
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Entre, gere seu link e acompanhe a operação no painel.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-300">
                Se você é individual e quer ganhar por indicação, esse é o caminho. Se você tem
                agência ou operação comercial própria, use o fluxo empresarial de revendedores.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-semibold text-zinc-950 transition hover:bg-zinc-100"
                >
                  Quero ser afiliado
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/afiliados/ranking"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 px-6 py-4 text-base font-semibold text-white transition hover:bg-zinc-900"
                >
                  Ver ranking público
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

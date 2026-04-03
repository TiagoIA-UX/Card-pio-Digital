import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Google Meu Negócio | Zairyx Canais Digitais',
  description:
    'Apareça nas buscas locais do Google gratuitamente. Configure seu Google Meu Negócio e receba clientes pelo Google Maps direto no seu cardápio digital — sem intermediário, sem comissão.',
}

const WHATSAPP_NUMBER = '5512996887993'

export default function GoogleMeuNegocioPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <Link
            href="/"
            className="text-base font-bold tracking-tight text-zinc-900"
          >
            Zairyx
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 md:py-24">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
            <Eye className="h-4 w-4" />
            Dica gratuita para seu negócio
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Você já está no{' '}
            <span className="text-blue-600">Google Meu Negócio</span>?
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600">
            Quando alguém digita <strong>"lanche perto de mim"</strong> ou{' '}
            <strong>"pizzaria próxima"</strong> no Google ou Google Maps, os
            resultados vêm do <strong>Google Meu Negócio</strong> — e o cadastro
            é <span className="font-bold text-green-600">100% gratuito</span>.
          </p>
        </div>

        {/* ── Two-column content ──────────────────────────────────────── */}
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left — Education */}
          <div>
            <h2 className="mb-6 text-2xl font-bold text-zinc-900">
              Por que isso importa para o seu delivery?
            </h2>
            <p className="mb-6 text-base leading-relaxed text-zinc-600">
              Com seu perfil otimizado, você aparece para quem está buscando
              exatamente o que você vende, na sua região. E se você adicionar o
              link do seu cardápio digital no perfil, o cliente vai direto pra
              você — sem intermediário, sem comissão.
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                <div>
                  <p className="font-semibold text-zinc-900">
                    Cadastro gratuito no Google
                  </p>
                  <p className="text-sm text-zinc-600">
                    Acesse business.google.com e crie seu perfil em minutos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                <div>
                  <p className="font-semibold text-zinc-900">
                    Apareça em buscas locais
                  </p>
                  <p className="text-sm text-zinc-600">
                    "Delivery perto de mim", "restaurante aberto agora"
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                <div>
                  <p className="font-semibold text-zinc-900">
                    Link direto pro seu cardápio
                  </p>
                  <p className="text-sm text-zinc-600">
                    Cliente encontra no Google e pede direto, sem comissão
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                <div>
                  <p className="font-semibold text-zinc-900">
                    Google Maps integrado
                  </p>
                  <p className="text-sm text-zinc-600">
                    Seu endereço, horários e avaliações aparecem pra quem está
                    perto
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
                <div>
                  <p className="font-semibold text-zinc-900">
                    Avaliações que geram confiança
                  </p>
                  <p className="text-sm text-zinc-600">
                    Clientes deixam avaliações públicas que atraem novos pedidos
                  </p>
                </div>
              </div>
            </div>

            <a
              href="https://business.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-blue-600 px-6 py-3 text-sm font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white"
            >
              Cadastrar meu negócio gratuitamente
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </a>
          </div>

          {/* Right — Service offer */}
          <div className="rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-8 shadow-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-700">
              <Sparkles className="h-4 w-4" />
              Serviço opcional
            </div>
            <h3 className="text-2xl font-bold text-zinc-900">
              Quer que a gente faça o cadastro pra você?
            </h3>
            <p className="mt-3 text-base text-zinc-700">
              Se você não tem tempo ou conhecimento técnico, nossa equipe
              configura seu <strong>Google Meu Negócio</strong>{' '}
              profissionalmente:
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Cadastro completo e otimizado para buscas locais',
                'Fotos, descrição e categorias corretas',
                'Link do seu cardápio digital configurado',
                'Integração com horários de funcionamento',
                'Dicas de como responder avaliações',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-zinc-700">
                  <CheckCircle className="h-4 w-4 shrink-0 text-orange-500" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl bg-white p-6 text-center shadow-inner">
              <p className="text-sm font-medium text-zinc-500">Valor único</p>
              <p className="text-4xl font-bold text-zinc-900">
                R$ 350<span className="text-lg font-normal text-zinc-500">,00</span>
              </p>
              <p className="mt-1 text-sm text-zinc-600">Pagamento via PIX ou cartão</p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Quero o serviço de cadastro no Google Meu Negócio por R$350.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600"
            >
              <MessageCircle className="h-5 w-5" />
              Quero esse serviço
            </a>
            <p className="mt-4 text-center text-xs text-zinc-500">
              Ou faça você mesmo gratuitamente em business.google.com
            </p>
          </div>
        </div>

        {/* ── Back to main product ────────────────────────────────────── */}
        <div className="mt-20 rounded-3xl bg-zinc-900 px-8 py-12 text-center text-white">
          <p className="text-sm font-bold tracking-widest text-orange-400 uppercase">
            Cardápio Digital
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Pronto para ter seu próprio canal de vendas?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-zinc-400">
            Combine o Google Meu Negócio com um cardápio digital próprio e
            receba pedidos sem pagar comissão para nenhum intermediário.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600"
          >
            Conhecer o Cardápio Digital
            <ArrowLeft className="h-5 w-5 rotate-180" />
          </Link>
        </div>
      </main>
    </div>
  )
}

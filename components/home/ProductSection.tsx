import Image from 'next/image'
import { SCREENSHOT_DASHBOARD, SCREENSHOT_EDITOR } from '@/components/home/home-data'

export function ProductSection() {
  return (
    <section
      id="produto"
      className="border-border border-t bg-zinc-50 py-16 md:py-20 dark:bg-zinc-900/50"
    >
      <div className="container-premium">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-[0.18em] text-orange-600 uppercase">
            Nosso Produto
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Dashboard e Editor Visual do Seu Cardápio.
          </h2>
          <p className="text-foreground/80 mx-auto mt-4 max-w-2xl text-base leading-7">
            Se você sabe usar WhatsApp, consegue usar o painel.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Dashboard
              </span>
            </div>
            <div className="relative aspect-16/10">
              <Image
                src={SCREENSHOT_DASHBOARD}
                alt="Dashboard do painel com pedidos e estatísticas"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700">
            <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Editor Visual
              </span>
            </div>
            <div className="relative aspect-16/10">
              <Image
                src={SCREENSHOT_EDITOR}
                alt="Editor visual para editar o cardápio"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
        <div className="bg-card border-border mx-auto mt-10 max-w-2xl rounded-2xl border p-6 shadow-sm">
          <p className="text-foreground mb-4 text-center font-semibold">
            Diferenciais do Seu Canal Próprio:
          </p>
          <ul className="text-foreground/80 grid gap-2 sm:grid-cols-2 sm:gap-x-8">
            <li className="flex items-center gap-2">
              <span className="text-primary">✔</span> 0% de comissão por pedido
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✔</span> Painel visual fácil de usar
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✔</span> Funciona no celular e no PC
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✔</span> QR Code e link compartilhável
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✔</span> Pedidos organizados no WhatsApp
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">✔</span> Pronto para picos de demanda sazonal
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

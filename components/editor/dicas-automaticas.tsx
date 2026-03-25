'use client'

import { useMemo } from 'react'
import { Check, ImagePlus, Sparkles } from 'lucide-react'

export interface DicaAutomatica {
  id: string
  tipo: 'sucesso' | 'sugestao' | 'aviso'
  mensagem: string
  icon?: 'check' | 'sparkles' | 'image'
}

interface DicasAutomaticasProps {
  produtosCount: number
  produtosComFoto: number
  temLogo: boolean
  temBanner: boolean
  temNome: boolean
  temTelefone: boolean
}

export function DicasAutomaticas({
  produtosCount,
  produtosComFoto,
  temLogo,
  temBanner,
  temNome,
  temTelefone,
}: DicasAutomaticasProps) {
  const dicas = useMemo((): DicaAutomatica[] => {
    const lista: DicaAutomatica[] = []

    if (temNome && temTelefone && produtosCount >= 3) {
      lista.push({
        id: 'pronto',
        tipo: 'sucesso',
        mensagem: 'Seu canal digital já está pronto para publicação.',
        icon: 'check',
      })
      lista.push({
        id: 'publicar',
        tipo: 'sugestao',
        mensagem: 'Você pode publicar agora ou continuar editando.',
        icon: 'sparkles',
      })
    }

    if (produtosCount > 0 && produtosComFoto < produtosCount) {
      lista.push({
        id: 'fotos',
        tipo: 'sugestao',
        mensagem: 'Adicione fotos aos produtos para aumentar as vendas.',
        icon: 'image',
      })
    }

    if (!temLogo && temNome) {
      lista.push({
        id: 'logo',
        tipo: 'aviso',
        mensagem: 'Adicione um logotipo para fortalecer sua marca.',
        icon: 'image',
      })
    }

    if (!temBanner && temNome) {
      lista.push({
        id: 'banner',
        tipo: 'aviso',
        mensagem: 'Um banner de destaque deixa o canal digital mais atraente.',
        icon: 'image',
      })
    }

    if (produtosCount < 3 && produtosCount > 0) {
      lista.push({
        id: 'mais-produtos',
        tipo: 'sugestao',
        mensagem: 'Cadastre mais produtos para um canal digital completo.',
        icon: 'sparkles',
      })
    }

    if (produtosCount === 0) {
      lista.push({
        id: 'primeiro-produto',
        tipo: 'aviso',
        mensagem: 'Adicione seus primeiros produtos para publicar.',
        icon: 'sparkles',
      })
    }

    return lista
  }, [produtosCount, produtosComFoto, temLogo, temBanner, temNome, temTelefone])

  if (dicas.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">Dicas</p>
      <ul className="space-y-2">
        {dicas.map((dica) => {
          const Icon = dica.icon === 'check' ? Check : dica.icon === 'image' ? ImagePlus : Sparkles
          const bgClass =
            dica.tipo === 'sucesso'
              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
              : dica.tipo === 'aviso'
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'bg-primary/10 text-primary'
          return (
            <li
              key={dica.id}
              className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm ${bgClass}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{dica.mensagem}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

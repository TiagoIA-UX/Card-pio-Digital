"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { 
  ShoppingBag, 
  Search, 
  Package, 
  AlertCircle,
  FolderOpen,
  Heart
} from "lucide-react"
import { cn } from "@/lib/utils"

type EmptyStateVariant = 
  | 'cart' 
  | 'search' 
  | 'orders' 
  | 'templates' 
  | 'error' 
  | 'favorites'
  | 'custom'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  icon?: ReactNode
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

const variants: Record<EmptyStateVariant, { 
  icon: ReactNode
  title: string
  description: string
}> = {
  cart: {
    icon: <ShoppingBag className="h-12 w-12" />,
    title: "Seu carrinho está vazio",
    description: "Adicione templates ao seu carrinho para continuar com a compra"
  },
  search: {
    icon: <Search className="h-12 w-12" />,
    title: "Nenhum resultado encontrado",
    description: "Tente buscar com outros termos ou explore nossos templates"
  },
  orders: {
    icon: <Package className="h-12 w-12" />,
    title: "Você ainda não tem pedidos",
    description: "Quando você fizer uma compra, seus pedidos aparecerão aqui"
  },
  templates: {
    icon: <FolderOpen className="h-12 w-12" />,
    title: "Nenhum template disponível",
    description: "Novos templates serão adicionados em breve"
  },
  error: {
    icon: <AlertCircle className="h-12 w-12" />,
    title: "Algo deu errado",
    description: "Não foi possível carregar os dados. Tente novamente mais tarde"
  },
  favorites: {
    icon: <Heart className="h-12 w-12" />,
    title: "Nenhum favorito ainda",
    description: "Salve seus templates favoritos para acessar rapidamente"
  },
  custom: {
    icon: <FolderOpen className="h-12 w-12" />,
    title: "Vazio",
    description: "Não há nada aqui ainda"
  }
}

export function EmptyState({
  variant = 'custom',
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  const defaultConfig = variants[variant]

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {/* Ícone */}
      <div className="mb-4 rounded-full bg-muted p-6 text-muted-foreground">
        {icon || defaultConfig.icon}
      </div>

      {/* Título */}
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {title || defaultConfig.title}
      </h3>

      {/* Descrição */}
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        {description || defaultConfig.description}
      </p>

      {/* Ação */}
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}

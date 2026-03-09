"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Store, ShoppingBag } from "lucide-react"

/**
 * PÁGINA DEPRECADA
 * 
 * Esta página de checkout de restaurante foi desativada.
 * O sistema agora usa um modelo diferente:
 * - Templates são comprados em /finalizar-compra
 * - Restaurantes são criados gratuitamente em /painel/criar-restaurante
 * 
 * Esta página existe apenas para evitar erros 404 e loops de redirect.
 */
export default function CheckoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect após 5 segundos
    const timer = setTimeout(() => {
      router.push('/painel')
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Store className="w-8 h-8 text-orange-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Página Atualizada
        </h1>
        
        <p className="text-gray-600 mb-6">
          O checkout de restaurantes foi movido. Agora você pode criar seu cardápio digital diretamente no painel.
        </p>
        
        <div className="space-y-3">
          <Link 
            href="/painel"
            className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Ir para o Painel
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link 
            href="/templates"
            className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Ver Templates
          </Link>
        </div>
        
        <p className="text-sm text-gray-400 mt-6">
          Redirecionando em 5 segundos...
        </p>
      </div>
    </div>
  )
}

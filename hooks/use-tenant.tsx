// =====================================================
// USE TENANT HOOK
// Gerencia contexto do tenant atual
// =====================================================

'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Tenant, CardapioPublico } from '@/types/database'
import { getCardapioPublico, getTenantBySlug } from '@/services'
import { checkIsOpen } from '@/lib/shared/check-is-open'
import type { HorarioFuncionamento } from '@/types/database'

// Contexto
interface TenantContextValue {
  tenant: Tenant | null
  cardapio: CardapioPublico | null
  isLoading: boolean
  error: Error | null
  isOpen: boolean
  refresh: () => Promise<void>
}

const TenantContext = createContext<TenantContextValue | null>(null)

// Provider Props
interface TenantProviderProps {
  children: React.ReactNode
  slug: string
}

/**
 * Provider para contexto do tenant
 */
export function TenantProvider({ children, slug }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [cardapio, setCardapio] = useState<CardapioPublico | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isOpen, setIsOpen] = useState(true)

  const loadTenant = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Carrega tenant básico
      const tenantResult = await getTenantBySlug(slug)

      if (!tenantResult.data) {
        throw new Error('Delivery não encontrado')
      }

      const tenantData = tenantResult.data
      setTenant(tenantData)
      setIsOpen(checkIsOpen(tenantData.horario_funcionamento as HorarioFuncionamento | null))

      // Carrega cardápio completo
      const cardapioResult = await getCardapioPublico(slug)
      if (cardapioResult.data) {
        setCardapio(cardapioResult.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar delivery'))
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  // Carrega dados iniciais
  useEffect(() => {
    loadTenant()
  }, [loadTenant])

  // Atualiza status de aberto/fechado a cada minuto
  useEffect(() => {
    if (!tenant) return

    const interval = setInterval(() => {
      setIsOpen(checkIsOpen(tenant.horario_funcionamento as HorarioFuncionamento | null))
    }, 60000) // 1 minuto

    return () => clearInterval(interval)
  }, [tenant])

  const value: TenantContextValue = {
    tenant,
    cardapio,
    isLoading,
    error,
    isOpen,
    refresh: loadTenant,
  }

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

/**
 * Hook para acessar contexto do tenant
 */
export function useTenant() {
  const context = useContext(TenantContext)

  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider')
  }

  return context
}

/**
 * Hook para dados do tenant sem provider (para páginas únicas)
 */
export function useTenantData(slug: string) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [cardapio, setCardapio] = useState<CardapioPublico | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        const tenantResult = await getTenantBySlug(slug)

        if (!tenantResult.data) {
          throw new Error('Delivery não encontrado')
        }

        const tenantData = tenantResult.data
        setTenant(tenantData)

        const cardapioResult = await getCardapioPublico(slug)
        if (cardapioResult.data) {
          setCardapio(cardapioResult.data)
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao carregar'))
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      loadData()
    }
  }, [slug])

  const isOpen = tenant
    ? checkIsOpen(tenant.horario_funcionamento as HorarioFuncionamento | null)
    : true

  return {
    tenant,
    cardapio,
    isLoading,
    error,
    isOpen,
  }
}

export default useTenant

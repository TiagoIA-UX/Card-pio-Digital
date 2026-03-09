// =====================================================
// USE TENANT HOOK
// Gerencia contexto do tenant atual
// =====================================================

'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Tenant, HorarioFuncionamento, CardapioPublico } from '@/types/database'
import { getCardapioPublico, getTenantBySlug } from '@/services'

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
 * Verifica se restaurante está aberto
 */
function checkIsOpen(horarios: HorarioFuncionamento | null | undefined): boolean {
  if (!horarios) return true // Se não tem horário configurado, assume aberto

  const now = new Date()
  const dayOfWeek = now.getDay()
  const currentTime = now.toTimeString().slice(0, 5) // HH:mm

  const dayMap: Record<number, keyof HorarioFuncionamento> = {
    0: 'domingo',
    1: 'segunda',
    2: 'terca',
    3: 'quarta',
    4: 'quinta',
    5: 'sexta',
    6: 'sabado',
  }

  const todayKey = dayMap[dayOfWeek]
  const todayHorario = horarios[todayKey]

  if (!todayHorario || !todayHorario.aberto) return false

  return currentTime >= todayHorario.abre && currentTime <= todayHorario.fecha
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
        throw new Error('Restaurante não encontrado')
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
      setError(err instanceof Error ? err : new Error('Erro ao carregar restaurante'))
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
          throw new Error('Restaurante não encontrado')
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

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/shared/supabase/client'

export interface SubscriptionCheckResult {
  canEdit: boolean
  isBlocked: boolean
  reason: string | null
  daysUntilBlock: number
}

type CheckState = 'idle' | 'loading' | 'blocked' | 'allowed' | 'error'

export function useSubscriptionCheck(restaurantId: string | null) {
  const [checkState, setCheckState] = useState<CheckState>('idle')
  const [blockInfo, setBlockInfo] = useState<SubscriptionCheckResult | null>(null)
  const supabaseRef = useRef(createClient())

  const checkSubscription = useCallback(async () => {
    if (!restaurantId) {
      setCheckState('idle')
      return
    }

    setCheckState('loading')

    try {
      const supabase = supabaseRef.current
      const { data, error } = await supabase.rpc('can_edit_restaurant', {
        p_restaurant_id: restaurantId,
      })

      if (error) {
        console.error('[useSubscriptionCheck] RPC error:', error)
        setCheckState('error')
        return
      }

      const status = Array.isArray(data) ? data[0] : data

      const result: SubscriptionCheckResult = {
        canEdit: status?.can_edit ?? false,
        isBlocked: status?.is_blocked ?? false,
        reason: status?.reason ?? null,
        daysUntilBlock: status?.days_until_block ?? 0,
      }

      setBlockInfo(result)
      setCheckState(result.isBlocked ? 'blocked' : 'allowed')
    } catch (err) {
      console.error('[useSubscriptionCheck] Error:', err)
      setCheckState('error')
    }
  }, [restaurantId])

  // Check on mount and when restaurantId changes
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void checkSubscription()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [checkSubscription])

  return {
    checkState,
    blockInfo,
    isAllowed: checkState === 'allowed',
    isBlocked: checkState === 'blocked',
    isLoading: checkState === 'loading',
    refetch: checkSubscription,
  }
}


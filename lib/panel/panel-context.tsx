'use client'

import { createContext, useContext } from 'react'
import type { PanelCapabilities } from './capabilities'
import { resolvePanelCapabilities } from './capabilities'

export interface PanelAccessContext {
  capabilities: PanelCapabilities
  restaurantId: string | null
}

const PanelCtx = createContext<PanelAccessContext>({
  capabilities: resolvePanelCapabilities({
    activePurchasesCount: 0,
    approvedOrdersCount: 0,
    restaurantsCount: 0,
  }),
  restaurantId: null,
})

export const PanelAccessProvider = PanelCtx.Provider

export function usePanelAccess(): PanelAccessContext {
  return useContext(PanelCtx)
}

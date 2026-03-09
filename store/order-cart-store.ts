// =====================================================
// ORDER CART STORE
// Carrinho de pedidos para cardápio digital pizzaria
// =====================================================

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type {
  Product,
  ProductSize,
  ProductCrust,
  ProductFlavor,
  AddOn,
  PersonalizacaoPizza,
} from '@/types/database'

// =====================================================
// TIPOS
// =====================================================

export interface OrderCartItem {
  id: string
  tenantId: string
  type: 'product' | 'pizza_custom'

  // Produto simples
  product?: Product

  // Pizza customizada
  pizza?: {
    size: ProductSize
    crust: ProductCrust
    flavors: ProductFlavor[]
    personalizacao: PersonalizacaoPizza
  }

  // Adicionais
  addOns: AddOn[]

  // Quantidades e preço
  quantity: number
  unitPrice: number
  observation?: string
  addedAt: string
}

interface OrderCartState {
  items: OrderCartItem[]
  tenantId: string | null
  tenantSlug: string | null
  isOpen: boolean
}

interface OrderCartActions {
  // Tenant
  setTenant: (tenantId: string, slug: string) => void
  clearTenant: () => void

  // Items
  addProduct: (product: Product, quantity?: number, observation?: string, addOns?: AddOn[]) => void
  addPizza: (
    size: ProductSize,
    crust: ProductCrust,
    flavors: ProductFlavor[],
    personalizacao: PersonalizacaoPizza,
    basePrice: number,
    addOns?: AddOn[],
    observation?: string
  ) => void
  removeItem: (itemId: string) => void
  updateItemQuantity: (itemId: string, quantity: number) => void
  updateItemObservation: (itemId: string, observation: string) => void
  clearCart: () => void

  // UI
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void

  // Computed
  getSubtotal: () => number
  getTotal: () => number
  getItemCount: () => number
  getItemsForTenant: () => OrderCartItem[]
}

// =====================================================
// HELPERS
// =====================================================

/**
 * Calcula preço de uma pizza customizada
 */
function calculatePizzaPrice(
  size: ProductSize,
  crust: ProductCrust,
  flavors: ProductFlavor[],
  addOns: AddOn[],
  basePrice: number = 30 // Preço base caso não tenha
): number {
  // Preço base multiplicado pelo tamanho
  let price = basePrice * size.multiplicador_preco

  // Adicional da borda
  if (crust.preco_adicional) {
    price += crust.preco_adicional
  }

  // Preço dos sabores (maior preço ou média, dependendo da config)
  // Por padrão, usa o maior preço entre os sabores
  if (flavors.length > 0) {
    const maxFlavorPrice = Math.max(...flavors.map((f) => f.preco || 0))
    price += maxFlavorPrice
  }

  // Adicionais
  const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.preco, 0)
  price += addOnsTotal

  return price
}

/**
 * Gera ID único para item
 */
function generateItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Gera nome descritivo para pizza
 */
export function getPizzaName(item: OrderCartItem): string {
  if (item.type !== 'pizza_custom' || !item.pizza) {
    return item.product?.nome || 'Item'
  }

  const { size, flavors } = item.pizza
  const flavorNames = flavors.map((f) => f.nome).join(' / ')

  return `Pizza ${size.nome} - ${flavorNames}`
}

// =====================================================
// STORE
// =====================================================

const ORDER_CART_KEY = 'pizzaria-order-cart'

export const useOrderCart = create<OrderCartState & OrderCartActions>()(
  persist(
    immer((set, get) => ({
      // Estado inicial
      items: [],
      tenantId: null,
      tenantSlug: null,
      isOpen: false,

      // Define tenant atual
      setTenant: (tenantId, slug) => {
        const state = get()

        // Se mudou de tenant, limpa carrinho
        if (state.tenantId && state.tenantId !== tenantId) {
          set((s) => {
            s.items = []
          })
        }

        set((s) => {
          s.tenantId = tenantId
          s.tenantSlug = slug
        })
      },

      clearTenant: () => {
        set((s) => {
          s.tenantId = null
          s.tenantSlug = null
          s.items = []
        })
      },

      // Adiciona produto simples
      addProduct: (product, quantity = 1, observation, addOns = []) => {
        const { tenantId } = get()
        if (!tenantId) return

        const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.preco, 0)

        set((state) => {
          state.items.push({
            id: generateItemId(),
            tenantId,
            type: 'product',
            product,
            addOns,
            quantity,
            unitPrice: product.preco_base + addOnsTotal,
            observation,
            addedAt: new Date().toISOString(),
          })
        })
      },

      // Adiciona pizza customizada
      addPizza: (size, crust, flavors, personalizacao, basePrice, addOns = [], observation) => {
        const { tenantId } = get()
        if (!tenantId) return

        const unitPrice = calculatePizzaPrice(size, crust, flavors, addOns, basePrice)

        set((state) => {
          state.items.push({
            id: generateItemId(),
            tenantId,
            type: 'pizza_custom',
            pizza: {
              size,
              crust,
              flavors,
              personalizacao,
            },
            addOns,
            quantity: 1, // Pizza é sempre 1 por vez
            unitPrice,
            observation,
            addedAt: new Date().toISOString(),
          })
        })
      },

      // Remove item
      removeItem: (itemId) => {
        set((state) => {
          state.items = state.items.filter((item) => item.id !== itemId)
        })
      },

      // Atualiza quantidade
      updateItemQuantity: (itemId, quantity) => {
        if (quantity < 1) {
          get().removeItem(itemId)
          return
        }

        set((state) => {
          const item = state.items.find((i) => i.id === itemId)
          if (item) {
            item.quantity = quantity
          }
        })
      },

      // Atualiza observação
      updateItemObservation: (itemId, observation) => {
        set((state) => {
          const item = state.items.find((i) => i.id === itemId)
          if (item) {
            item.observation = observation
          }
        })
      },

      // Limpa carrinho
      clearCart: () => {
        set((state) => {
          state.items = []
        })
      },

      // UI
      toggleCart: () => {
        set((state) => {
          state.isOpen = !state.isOpen
        })
      },

      openCart: () => {
        set((state) => {
          state.isOpen = true
        })
      },

      closeCart: () => {
        set((state) => {
          state.isOpen = false
        })
      },

      // Valores computados
      getSubtotal: () => {
        const { items, tenantId } = get()
        return items
          .filter((item) => item.tenantId === tenantId)
          .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      },

      getTotal: () => {
        // Por enquanto igual ao subtotal (sem taxas/descontos)
        return get().getSubtotal()
      },

      getItemCount: () => {
        const { items, tenantId } = get()
        return items
          .filter((item) => item.tenantId === tenantId)
          .reduce((sum, item) => sum + item.quantity, 0)
      },

      getItemsForTenant: () => {
        const { items, tenantId } = get()
        return items.filter((item) => item.tenantId === tenantId)
      },
    })),
    {
      name: ORDER_CART_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        tenantId: state.tenantId,
        tenantSlug: state.tenantSlug,
      }),
    }
  )
)

// =====================================================
// HOOKS AUXILIARES
// =====================================================

/**
 * Hook para totais do carrinho
 */
export const useOrderCartTotals = () => {
  const store = useOrderCart()
  return {
    subtotal: store.getSubtotal(),
    total: store.getTotal(),
    itemCount: store.getItemCount(),
    items: store.getItemsForTenant(),
  }
}

/**
 * Hook para verificar se carrinho tem itens
 */
export const useHasCartItems = () => {
  const itemCount = useOrderCart((state) => {
    if (!state.tenantId) return 0
    return state.items.filter((i) => i.tenantId === state.tenantId).length
  })
  return itemCount > 0
}

/**
 * Formata preço em reais
 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { CartStore, CartItem, AppliedCoupon } from '@/types/cart'

const CART_STORAGE_KEY = 'cardapio-digital-cart'

interface CartStoreState {
  items: CartItem[]
  coupon: AppliedCoupon | null
  isOpen: boolean
  isLoading: boolean
  isSyncing: boolean
}

interface CartStoreActions {
  // Item actions
  addItem: (template: CartItem['template']) => void
  removeItem: (templateId: string) => void
  updateQuantity: (templateId: string, quantity: number) => void
  clearCart: () => void
  
  // Coupon actions
  applyCoupon: (code: string) => Promise<boolean>
  removeCoupon: () => void
  
  // UI actions
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  
  // Sync actions
  syncWithServer: (userId: string) => Promise<void>
  loadFromServer: (userId: string) => Promise<void>
  
  // Computed
  getSubtotal: () => number
  getDiscount: () => number
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStoreState & CartStoreActions>()(
  persist(
    immer((set, get) => ({
      // Initial state
      items: [],
      coupon: null,
      isOpen: false,
      isLoading: false,
      isSyncing: false,

      // Add item to cart
      addItem: (template) => {
        set((state) => {
          const existingItem = state.items.find(
            (item) => item.templateId === template.id
          )

          if (existingItem) {
            // Template já existe - não duplicar (cada template compra única)
            return
          }

          // Adicionar novo item
          state.items.push({
            id: `cart-${template.id}-${Date.now()}`,
            templateId: template.id,
            template,
            quantity: 1,
            addedAt: new Date().toISOString()
          })
        })
      },

      // Remove item from cart
      removeItem: (templateId) => {
        set((state) => {
          state.items = state.items.filter(
            (item) => item.templateId !== templateId
          )
        })
      },

      // Update quantity (se aplicável)
      updateQuantity: (templateId, quantity) => {
        if (quantity < 1) {
          get().removeItem(templateId)
          return
        }

        set((state) => {
          const item = state.items.find(
            (item) => item.templateId === templateId
          )
          if (item) {
            item.quantity = quantity
          }
        })
      },

      // Clear all items
      clearCart: () => {
        set((state) => {
          state.items = []
          state.coupon = null
        })
      },

      // Apply coupon
      applyCoupon: async (code) => {
        set((state) => {
          state.isLoading = true
        })

        try {
          const response = await fetch('/api/checkout/validar-cupom', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code, 
              subtotal: get().getSubtotal() 
            })
          })

          const data = await response.json()

          if (data.valid && data.coupon) {
            set((state) => {
              state.coupon = data.coupon
              state.isLoading = false
            })
            return true
          } else {
            set((state) => {
              state.isLoading = false
            })
            return false
          }
        } catch (error) {
          set((state) => {
            state.isLoading = false
          })
          return false
        }
      },

      // Remove coupon
      removeCoupon: () => {
        set((state) => {
          state.coupon = null
        })
      },

      // UI actions
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

      // Sync cart with server (for logged in users)
      syncWithServer: async (userId) => {
        const { items } = get()
        if (items.length === 0) return

        set((state) => {
          state.isSyncing = true
        })

        try {
          await fetch('/api/carrinho/sincronizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, items })
          })
        } catch (error) {
          console.error('Erro ao sincronizar carrinho:', error)
        } finally {
          set((state) => {
            state.isSyncing = false
          })
        }
      },

      // Load cart from server
      loadFromServer: async (userId) => {
        set((state) => {
          state.isLoading = true
        })

        try {
          const response = await fetch(`/api/carrinho?userId=${userId}`)
          const data = await response.json()

          if (data.items && data.items.length > 0) {
            set((state) => {
              // Merge server items with local (local takes priority for new items)
              const localIds = state.items.map((i) => i.templateId)
              const serverItems = data.items.filter(
                (item: CartItem) => !localIds.includes(item.templateId)
              )
              state.items = [...state.items, ...serverItems]
            })
          }
        } catch (error) {
          console.error('Erro ao carregar carrinho:', error)
        } finally {
          set((state) => {
            state.isLoading = false
          })
        }
      },

      // Computed values
      getSubtotal: () => {
        const { items } = get()
        return items.reduce(
          (sum, item) => sum + item.template.price * item.quantity,
          0
        )
      },

      getDiscount: () => {
        const { coupon } = get()
        const subtotal = get().getSubtotal()

        if (!coupon) return 0

        if (coupon.discountType === 'percentage') {
          return Math.round(subtotal * (coupon.discountValue / 100))
        }

        return Math.min(coupon.discountValue, subtotal)
      },

      getTotal: () => {
        return get().getSubtotal() - get().getDiscount()
      },

      getItemCount: () => {
        const { items } = get()
        return items.reduce((sum, item) => sum + item.quantity, 0)
      }
    })),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        coupon: state.coupon
      })
    }
  )
)

// Hook para usar valores computados de forma reativa
export const useCartTotals = () => {
  const store = useCartStore()
  return {
    subtotal: store.getSubtotal(),
    discount: store.getDiscount(),
    total: store.getTotal(),
    itemCount: store.getItemCount()
  }
}

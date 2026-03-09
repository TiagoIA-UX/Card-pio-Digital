// =====================================================
// STORES INDEX
// Exporta todos os stores Zustand
// =====================================================

// Cart de templates (marketplace de sites)
export { useCartStore, useCartTotals } from './cart-store'

// Cart de pedidos (cardápio digital)
export {
  useOrderCart,
  useOrderCartTotals,
  useHasCartItems,
  getPizzaName,
  formatPrice,
  type OrderCartItem,
} from './order-cart-store'

// =====================================================
// SERVICES INDEX
// Exporta todos os services para fácil importação
// =====================================================

// Types re-exported for convenience
export type { CardapioPublico } from '@/types/database'

// Tenant Service
export {
  getTenantBySlug,
  getTenantById,
  createTenant,
  updateTenant,
  isSlugAvailable,
  getCardapioPublico,
  isOpenNow,
} from './tenant.service'

// Product Service
export {
  // Categorias
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  // Produtos
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability,
  toggleProductDestaque,
  // Tamanhos
  getProductSizes,
  createProductSize,
  updateProductSize,
  deleteProductSize,
  // Bordas
  getProductCrusts,
  createProductCrust,
  updateProductCrust,
  deleteProductCrust,
  // Sabores
  getProductFlavors,
  createProductFlavor,
  updateProductFlavor,
  deleteProductFlavor,
  // Adicionais
  getAddOns,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  // Contagem
  countProducts,
  countFlavors,
} from './product.service'

// Order Service
export {
  getOrders,
  getOrderById,
  getOrderByNumero,
  getActiveOrders,
  getTodayOrders,
  createOrder,
  updateOrderStatus,
  updateOrder,
  markAsSentWhatsApp,
  getTodayStats,
  getOrdersByHour,
  getYesterdayComparison,
} from './order.service'

// Subscription Service
export {
  getPlans,
  getPlanBySlug,
  getSubscription,
  createTrialSubscription,
  updateSubscriptionPlan,
  cancelSubscription,
  isInTrial,
  getTrialDaysRemaining,
  isSubscriptionActive,
  getPlanLimits,
  canAddProduct,
  canAddFlavor,
  canCreatePromotion,
  hasReportsAccess,
  hasIntelligenceAccess,
} from './subscription.service'

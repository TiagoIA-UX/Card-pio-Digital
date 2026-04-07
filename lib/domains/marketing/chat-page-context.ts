import {
  isRestaurantTemplateSlug,
  resolveRestaurantTemplateSlug,
  type RestaurantTemplateSlug,
} from '@/lib/domains/core/restaurant-customization'

export type ChatPageType =
  | 'marketing'
  | 'panel'
  | 'demo'
  | 'delivery'
  | 'template-preview'
  | 'checkout'

export interface ChatPageContext {
  restaurantSlug?: string
  templateSlug?: RestaurantTemplateSlug
  pageType: ChatPageType
  pathname?: string
}

export function resolveChatPageContext(pathname: string | null): ChatPageContext | null {
  if (!pathname) return null

  const deliveryMatch = pathname.match(/^\/r\/([^/]+)/i)
  if (deliveryMatch?.[1]) {
    return {
      restaurantSlug: decodeURIComponent(deliveryMatch[1]),
      pageType: 'delivery',
      pathname,
    }
  }

  const templatePreviewMatch = pathname.match(/^\/templates\/([^/]+)/i)
  const resolvedTemplatePreviewSlug = resolveRestaurantTemplateSlug(templatePreviewMatch?.[1])
  if (resolvedTemplatePreviewSlug && isRestaurantTemplateSlug(templatePreviewMatch?.[1])) {
    return {
      pageType: 'template-preview',
      templateSlug: resolvedTemplatePreviewSlug,
      pathname,
    }
  }

  const checkoutMatch = pathname.match(/^\/comprar\/([^/]+)/i)
  const resolvedCheckoutSlug = resolveRestaurantTemplateSlug(checkoutMatch?.[1])
  if (resolvedCheckoutSlug && isRestaurantTemplateSlug(checkoutMatch?.[1])) {
    return {
      pageType: 'checkout',
      templateSlug: resolvedCheckoutSlug,
      pathname,
    }
  }

  if (pathname.startsWith('/demo')) {
    return {
      pageType: 'demo',
      pathname,
    }
  }

  if (pathname.startsWith('/painel')) {
    return {
      pageType: 'panel',
      pathname,
    }
  }

  return {
    pageType: 'marketing',
    pathname,
  }
}

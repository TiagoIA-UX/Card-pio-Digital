interface GoogleMapsLinksInput {
  address?: string | null
  mapUrl?: string | null
}

interface GoogleMapsLinks {
  embedUrl: string | null
  openUrl: string | null
}

function extractQueryParam(url: URL): string | null {
  return url.searchParams.get('query') || url.searchParams.get('q')
}

function extractPlaceFromPath(pathname: string): string | null {
  const marker = '/maps/place/'
  if (!pathname.includes(marker)) return null

  const chunk = pathname.split(marker)[1]?.split('/')[0]
  if (!chunk) return null

  return decodeURIComponent(chunk.replace(/\+/g, ' ')).trim() || null
}

function isCustomGoogleMap(url: URL): boolean {
  const host = url.hostname.toLowerCase()
  const path = url.pathname.toLowerCase()

  return (
    host.includes('maps.app.goo.gl') ||
    path.includes('/maps/d/') ||
    path.includes('/mapsengine/') ||
    path.includes('/mymaps')
  )
}

/**
 * Builds Google Maps open/embed links.
 *
 * NOTE: The legacy `output=embed` format is blocked by Google in most browsers
 * without a Maps Embed API key. We therefore never generate an embedUrl here —
 * the caller should always display the "Abrir no Google Maps" fallback link.
 * Only URLs that are already proper embed URLs (/maps/embed) are forwarded as-is.
 */
export function buildGoogleMapsLinks({ address, mapUrl }: GoogleMapsLinksInput): GoogleMapsLinks {
  const cleanAddress = address?.trim() || ''
  const cleanMapUrl = mapUrl?.trim() || ''

  // Already a proper embed URL — use directly
  if (cleanMapUrl && cleanMapUrl.includes('/maps/embed')) {
    return { embedUrl: cleanMapUrl, openUrl: cleanMapUrl }
  }

  if (cleanMapUrl) {
    const httpLink = /^https?:\/\//i.test(cleanMapUrl)

    if (!httpLink) {
      return {
        embedUrl: null,
        openUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanMapUrl)}`,
      }
    }

    try {
      const parsed = new URL(cleanMapUrl)
      const openUrl = parsed.toString()

      if (isCustomGoogleMap(parsed)) {
        return { embedUrl: null, openUrl }
      }

      const query = extractQueryParam(parsed) || extractPlaceFromPath(parsed.pathname)
      return {
        embedUrl: null,
        openUrl: query
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
          : openUrl,
      }
    } catch {
      return {
        embedUrl: null,
        openUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanMapUrl)}`,
      }
    }
  }

  if (cleanAddress) {
    return {
      embedUrl: null,
      openUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`,
    }
  }

  return { embedUrl: null, openUrl: null }
}

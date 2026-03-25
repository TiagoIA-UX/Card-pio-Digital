interface GoogleMapsLinksInput {
  address?: string | null
  mapUrl?: string | null
}

interface GoogleMapsLinks {
  embedUrl: string | null
  openUrl: string | null
}

function buildEmbedFromQuery(query: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`
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

export function buildGoogleMapsLinks({ address, mapUrl }: GoogleMapsLinksInput): GoogleMapsLinks {
  const cleanAddress = address?.trim() || ''
  const cleanMapUrl = mapUrl?.trim() || ''

  if (cleanAddress) {
    const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress)}`
    return {
      embedUrl: buildEmbedFromQuery(cleanAddress),
      openUrl: searchUrl,
    }
  }

  if (!cleanMapUrl) {
    return { embedUrl: null, openUrl: null }
  }

  const httpLink = /^https?:\/\//i.test(cleanMapUrl)

  if (!httpLink) {
    return {
      embedUrl: buildEmbedFromQuery(cleanMapUrl),
      openUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanMapUrl)}`,
    }
  }

  try {
    const parsed = new URL(cleanMapUrl)
    const openUrl = parsed.toString()

    const query = extractQueryParam(parsed)
    if (query) {
      return {
        embedUrl: buildEmbedFromQuery(query),
        openUrl,
      }
    }

    const place = extractPlaceFromPath(parsed.pathname)
    if (place) {
      return {
        embedUrl: buildEmbedFromQuery(place),
        openUrl,
      }
    }

    if (isCustomGoogleMap(parsed)) {
      return {
        embedUrl: null,
        openUrl,
      }
    }

    return {
      embedUrl: buildEmbedFromQuery(openUrl),
      openUrl,
    }
  } catch {
    return {
      embedUrl: buildEmbedFromQuery(cleanMapUrl),
      openUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanMapUrl)}`,
    }
  }
}

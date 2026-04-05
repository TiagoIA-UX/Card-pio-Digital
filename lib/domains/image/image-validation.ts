/**
 * Validação de imagens para logo, banner e fotos de produtos.
 * Mensagens claras para o usuário quando algo não é aceito.
 */

export const IMAGE_LIMITS = {
  /** Tamanho mínimo recomendado em pixels (largura e altura) */
  MIN_DIMENSION: 800,
  /** Tamanho máximo do arquivo em bytes (5MB) */
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  /** Formatos aceitos */
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  /** Extensões aceitas para URL */
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
} as const

export type ImageValidationResult =
  | { valid: true }
  | { valid: false; error: string }

/**
 * Valida formato de arquivo (upload).
 */
export function validateImageFile(file: File): ImageValidationResult {
  if (!(IMAGE_LIMITS.ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: 'Formato não suportado. Use JPG ou PNG.',
    }
  }

  if (file.size > IMAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Arquivo muito pesado. O limite é ${IMAGE_LIMITS.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
    }
  }

  return { valid: true }
}

/**
 * Valida dimensões da imagem (após carregar).
 */
export function validateImageDimensions(
  width: number,
  height: number,
  context: 'product' | 'logo' | 'banner' = 'product'
): ImageValidationResult {
  const min = IMAGE_LIMITS.MIN_DIMENSION
  const smaller = Math.min(width, height)

  if (smaller < min) {
    const label =
      context === 'logo'
        ? 'Logotipo'
        : context === 'banner'
          ? 'Banner'
          : 'Foto do produto'
    return {
      valid: false,
      error: `${label} muito pequeno. O mínimo recomendado é ${min}x${min} pixels.`,
    }
  }

  return { valid: true }
}

/** Domínios de CDNs de imagens que não usam extensão na URL (Unsplash, Pexels, etc.) */
const KNOWN_IMAGE_CDN_HOSTS = [
  'images.unsplash.com',
  'unsplash.com',
  'images.pexels.com',
  'pexels.com',
  'cdn.pixabay.com',
  'pixabay.com',
  'imgur.com',
  'i.imgur.com',
  'placehold.co',
  'via.placeholder.com',
  'picsum.photos',
  'loremflickr.com',
]

/**
 * Valida URL de imagem (formato e extensão).
 * Aceita URLs com extensão .jpg/.png/.webp ou de CDNs conhecidos (Unsplash, Pexels, etc.).
 */
export function validateImageUrl(url: string): ImageValidationResult {
  if (!url || typeof url !== 'string') {
    return { valid: true }
  }

  const trimmed = url.trim()
  if (!trimmed) return { valid: true }

  try {
    const parsed = new URL(trimmed)
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: 'URL inválida. Use um endereço que comece com https://',
      }
    }

    const path = parsed.pathname.toLowerCase()
    const host = parsed.hostname.toLowerCase()
    const hasValidExt = IMAGE_LIMITS.ALLOWED_EXTENSIONS.some((ext) => path.endsWith(ext))
    const isKnownCdn = KNOWN_IMAGE_CDN_HOSTS.some((h) => host === h || host.endsWith('.' + h))

    if (hasValidExt || isKnownCdn) {
      return { valid: true }
    }

    if (path.includes('.')) {
      return {
        valid: false,
        error: 'Formato não suportado. Use JPG ou PNG.',
      }
    }

    return { valid: true }
  } catch {
    return {
      valid: false,
      error: 'URL inválida. Verifique o endereço da imagem.',
    }
  }
}

/**
 * Carrega imagem e valida dimensões (para upload ou URL).
 */
export function loadAndValidateImage(
  source: File | string,
  context: 'product' | 'logo' | 'banner' = 'product'
): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const objectUrl = typeof source === 'string' ? source : URL.createObjectURL(source)

    img.onload = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(objectUrl)
      }
      const result = validateImageDimensions(img.width, img.height, context)
      resolve(result)
    }

    img.onerror = () => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(objectUrl)
      }
      resolve({
        valid: false,
        error: 'Não foi possível carregar a imagem. Verifique o arquivo ou URL.',
      })
    }

    img.src = objectUrl
  })
}

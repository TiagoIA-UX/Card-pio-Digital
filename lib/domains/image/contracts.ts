// ═══════════════════════════════════════════════════════════════
// CONTRACTS: IMAGE — API pública do domínio de imagens
// ═══════════════════════════════════════════════════════════════

/** Pastas válidas no Cloudflare R2 */
export type R2Folder = 'logos' | 'banners' | 'pratos' | 'restaurantes' | 'comprovantes'

/** Tipos MIME aceitos para upload */
export type AllowedMimeType = 'image/png' | 'image/jpeg' | 'image/webp'

/** Resultado de validação de imagem */
export interface ImageValidationResult {
  valid: boolean
  error?: string
}

/** Resultado de validação de dimensões */
export interface DimensionValidationResult {
  valid: boolean
  error?: string
}

/** Limites de imagem por contexto */
export interface ImageLimits {
  MIN_DIMENSION: number
  MAX_FILE_SIZE_BYTES: number
  ALLOWED_TYPES: readonly AllowedMimeType[]
}

/** Contrato público do serviço de imagens */
export interface IImageService {
  validateImageFile(file: File): ImageValidationResult
  validateImageDimensions(
    width: number,
    height: number,
    context?: string
  ): DimensionValidationResult
  getTemplateProductImages(): Record<string, string>
}


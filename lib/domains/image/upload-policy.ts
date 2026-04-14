export const IMAGE_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024

export const IMAGE_UPLOAD_ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const IMAGE_UPLOAD_ALLOWED_EXTENSIONS = ['PNG', 'JPG', 'JPEG', 'WEBP'] as const

export type AllowedImageMimeType = (typeof IMAGE_UPLOAD_ALLOWED_MIME_TYPES)[number]

export function isAllowedImageMimeType(mimeType: string): mimeType is AllowedImageMimeType {
  return (IMAGE_UPLOAD_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
}

export function getImageUploadFormatsLabel(): string {
  return IMAGE_UPLOAD_ALLOWED_EXTENSIONS.join(', ')
}

export function getImageUploadMaxSizeLabel(): string {
  return `${Math.round(IMAGE_UPLOAD_MAX_SIZE_BYTES / 1024 / 1024)}MB`
}

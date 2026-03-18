/**
 * lib/r2.ts — Cliente Cloudflare R2 (S3-compatível)
 *
 * Variáveis de ambiente necessárias:
 *   R2_ACCOUNT_ID          — ID da conta Cloudflare
 *   R2_ACCESS_KEY_ID       — Access Key do R2
 *   R2_SECRET_ACCESS_KEY   — Secret Access Key do R2
 *   R2_BUCKET_NAME         — Nome do bucket (ex: cardapio-digital)
 *   R2_PUBLIC_URL          — URL pública do bucket (ex: https://cdn.seudominio.com)
 *
 * Uso:
 *   import { uploadFile, deleteFile } from '@/lib/r2'
 *   const url = await uploadFile({ buffer, mimeType, folder: 'pratos', extension: 'jpg' })
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

// ── Pastas permitidas no bucket ───────────────────────────────────────────

export type R2Folder = 'logos' | 'banners' | 'pratos' | 'restaurantes'

export const R2_FOLDERS: R2Folder[] = ['logos', 'banners', 'pratos', 'restaurantes']

// ── Tipos MIME aceitos ────────────────────────────────────────────────────

export const R2_ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export type R2AllowedMimeType = (typeof R2_ALLOWED_MIME_TYPES)[number]

const MIME_TO_EXTENSION: Record<R2AllowedMimeType, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

// ── Config ────────────────────────────────────────────────────────────────

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucketName = process.env.R2_BUCKET_NAME?.trim() || 'cardapio-digital'
  const publicUrl = process.env.R2_PUBLIC_URL?.trim()?.replace(/\/$/, '')

  if (!accountId) throw new Error('R2_ACCOUNT_ID não configurado')
  if (!accessKeyId) throw new Error('R2_ACCESS_KEY_ID não configurado')
  if (!secretAccessKey) throw new Error('R2_SECRET_ACCESS_KEY não configurado')
  if (!publicUrl) throw new Error('R2_PUBLIC_URL não configurado')

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl }
}

function createR2Client() {
  const { accountId, accessKeyId, secretAccessKey } = getR2Config()
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

// ── Log estruturado ───────────────────────────────────────────────────────

function logR2(level: 'info' | 'warn' | 'error', event: string, data: Record<string, unknown>) {
  const entry = JSON.stringify({
    level,
    event,
    ...data,
    timestamp: new Date().toISOString(),
    service: 'lib/r2',
  })
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else console.log(entry)
}

// ── uploadFile ────────────────────────────────────────────────────────────

export interface UploadFileParams {
  /** Conteúdo do arquivo como Buffer */
  buffer: Buffer
  /** MIME type validado */
  mimeType: R2AllowedMimeType
  /** Pasta de destino no bucket */
  folder: R2Folder
  /** Dono do asset para organização de chave no bucket */
  ownerId?: string
  /**
   * Extensão sem ponto (ex: 'jpg', 'png').
   * Se omitido, usa a extensão padrão do mimeType.
   */
  extension?: string
}

export interface UploadFileResult {
  /** URL pública do arquivo no CDN */
  url: string
  /** Chave usada no bucket (ex: pratos/uuid-abc.jpg) */
  key: string
  /** Tamanho em bytes */
  size: number
}

/**
 * Faz upload de um arquivo para o Cloudflare R2.
 * Gera nome único via UUID — sem risco de sobrescrita.
 */
export async function uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
  const { buffer, mimeType, folder } = params
  const { bucketName, publicUrl } = getR2Config()
  const client = createR2Client()

  const ext = params.extension ?? MIME_TO_EXTENSION[mimeType]
  const uid = crypto.randomUUID()
  const ownerSegment = params.ownerId?.replace(/[^a-zA-Z0-9-_]/g, '').trim() || 'anon'
  const key = `${folder}/${ownerSegment}/${Date.now()}-${uid}.${ext}`

  logR2('info', 'r2_upload_started', {
    folder,
    key,
    mime_type: mimeType,
    size_bytes: buffer.byteLength,
  })

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      // Cache longo para assets imutáveis (o UUID garante unicidade)
      CacheControl: 'public, max-age=31536000, immutable',
    })
  )

  const url = `${publicUrl}/${key}`

  logR2('info', 'r2_upload_success', {
    key,
    url,
    size_bytes: buffer.byteLength,
  })

  return { url, key, size: buffer.byteLength }
}

// ── deleteFile ────────────────────────────────────────────────────────────

/**
 * Remove um arquivo do Cloudflare R2 pela chave (ex: "pratos/uuid.jpg").
 * Não lança erro se o arquivo não existir.
 */
export async function deleteFile(key: string): Promise<void> {
  if (!key?.trim()) return

  const { bucketName } = getR2Config()
  const client = createR2Client()

  logR2('info', 'r2_delete_started', { key })

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    )
    logR2('info', 'r2_delete_success', { key })
  } catch (err) {
    logR2('error', 'r2_delete_failed', { key, error: String(err) })
    throw err
  }
}

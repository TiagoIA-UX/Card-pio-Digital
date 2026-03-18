/**
 * POST /api/upload
 *
 * Recebe um arquivo via multipart/form-data, valida e faz upload para o Cloudflare R2.
 *
 * Body (FormData):
 *   file    — File  — obrigatório
 *   folder  — string — "logos" | "banners" | "pratos" | "restaurantes" (padrão: "pratos")
 *
 * Resposta 200:
 *   { success: true, url: "https://cdn.../pratos/uuid.jpg", key: "pratos/uuid.jpg", size: 123456 }
 *
 * Erros possíveis:
 *   400 — arquivo ausente / formato inválido / tamanho excedido / pasta inválida
 *   500 — falha no R2
 *
 * Segurança:
 *   - Rota autenticada: requer Authorization: Bearer <token> (usuário Supabase)
 *   - Nome do arquivo gerado via UUID — sem overwrite possível
 *   - MIME type validado no servidor (não confia no Content-Type do client)
 *   - Limite de 5 MB
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  uploadFile,
  R2_ALLOWED_MIME_TYPES,
  R2_FOLDERS,
  type R2AllowedMimeType,
  type R2Folder,
} from '@/lib/r2'

// ── Constantes ────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB após otimização client-side

// ── Validação de magic bytes ──────────────────────────────────────────────

const MAGIC_BYTES: Record<string, (buf: Uint8Array) => boolean> = {
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) =>
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50,
}

function validateMagicBytes(buffer: ArrayBuffer, declaredMime: string): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 12))
  const check = MAGIC_BYTES[declaredMime]
  return check ? check(bytes) : false
}

// ── Log estruturado ───────────────────────────────────────────────────────

function logUpload(level: 'info' | 'warn' | 'error', event: string, data: Record<string, unknown>) {
  const entry = JSON.stringify({
    level,
    event,
    ...data,
    timestamp: new Date().toISOString(),
    service: 'api/upload',
  })
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else console.log(entry)
}

// ── Auth ──────────────────────────────────────────────────────────────────

async function requireAuth(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ?? null
}

// ── POST ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. Autenticação
  const user = await requireAuth(req)
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Parsing do form
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json(
      { error: 'Corpo da requisição inválido (esperado multipart/form-data)' },
      { status: 400 }
    )
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Campo "file" obrigatório' }, { status: 400 })
  }

  // 3. Validação de pasta
  const folderRaw = (formData.get('folder') as string | null)?.trim() ?? 'pratos'
  if (!(R2_FOLDERS as readonly string[]).includes(folderRaw)) {
    return NextResponse.json(
      { error: `Pasta inválida. Use: ${R2_FOLDERS.join(', ')}` },
      { status: 400 }
    )
  }
  const folder = folderRaw as R2Folder

  // 4. Validação de tipo MIME
  const mimeType = file.type as R2AllowedMimeType
  if (!(R2_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return NextResponse.json(
      { error: `Formato não suportado. Use: ${R2_ALLOWED_MIME_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  // 5. Validação de tamanho
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Arquivo muito grande. Limite: ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB` },
      { status: 400 }
    )
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'Arquivo vazio' }, { status: 400 })
  }

  logUpload('info', 'upload_started', {
    user_id: user.id,
    folder,
    mime_type: mimeType,
    size_bytes: file.size,
  })

  // 6. Upload para R2
  let result: Awaited<ReturnType<typeof uploadFile>>
  try {
    const arrayBuffer = await file.arrayBuffer()

    // Validação de magic bytes: garante que o conteúdo real corresponde ao MIME declarado
    if (!validateMagicBytes(arrayBuffer, mimeType)) {
      logUpload('warn', 'upload_magic_bytes_mismatch', {
        user_id: user.id,
        folder,
        declared_mime: mimeType,
      })
      return NextResponse.json(
        { error: 'Conteúdo do arquivo não corresponde ao formato declarado' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(arrayBuffer)
    result = await uploadFile({ buffer, mimeType, folder, ownerId: user.id })
  } catch (err) {
    logUpload('error', 'upload_failed', {
      user_id: user.id,
      folder,
      mime_type: mimeType,
      error: String(err),
    })
    return NextResponse.json({ error: 'Falha no upload. Tente novamente.' }, { status: 500 })
  }

  logUpload('info', 'upload_success', {
    user_id: user.id,
    folder,
    key: result.key,
    url: result.url,
    size_bytes: result.size,
  })

  // 7. Retorno
  return NextResponse.json({
    success: true,
    url: result.url,
    key: result.key,
    size: result.size,
  })
}

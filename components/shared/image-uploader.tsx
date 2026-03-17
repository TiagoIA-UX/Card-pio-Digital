'use client'

import { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type R2Folder = 'logos' | 'banners' | 'pratos' | 'restaurantes'

interface ImageUploaderProps {
  /** URL atual salva no banco */
  value: string
  /** Pasta do R2 para upload */
  folder: R2Folder
  /** Texto do label */
  label: string
  /** Proporção da preview: '1:1' | '16:9' | '3:1' */
  aspect?: '1:1' | '16:9' | '3:1'
  /** data-editor-field para highlight do editor */
  editorField?: string
  /** Se o campo está selecionado no editor */
  isSelected?: boolean
  /** Callback com a nova URL (após upload ou ao colar URL) */
  onChange: (url: string) => void
  /** Permite inserir URL manualmente (fallback avançado) */
  allowUrlInput?: boolean
}

const ASPECT_CLASSES: Record<string, string> = {
  '1:1': 'aspect-square',
  '16:9': 'aspect-video',
  '3:1': 'aspect-[3/1]',
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function ImageUploader({
  value,
  folder,
  label,
  aspect = '16:9',
  editorField,
  isSelected = false,
  onChange,
  allowUrlInput = true,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadToR2 = useCallback(
    async (file: File) => {
      setError(null)
      setUploading(true)

      try {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError('Formato inválido. Use PNG, JPEG ou WebP.')
          return
        }
        if (file.size > MAX_SIZE_BYTES) {
          setError('Arquivo muito grande. Máximo 5 MB.')
          return
        }

        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          setError('Sessão expirada. Faça login novamente.')
          return
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        })

        const json = (await res.json()) as { success?: boolean; url?: string; error?: string }

        if (!res.ok || !json.success || !json.url) {
          setError(json.error ?? 'Falha no upload. Tente novamente.')
          return
        }

        onChange(json.url)
      } catch {
        setError('Erro de conexão. Tente novamente.')
      } finally {
        setUploading(false)
      }
    },
    [folder, onChange]
  )

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) void uploadToR2(file)
      // Reset input para permitir re-upload do mesmo arquivo
      e.target.value = ''
    },
    [uploadToR2]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file) void uploadToR2(file)
    },
    [uploadToR2]
  )

  const handleUrlConfirm = () => {
    const trimmed = urlInput.trim()
    if (trimmed) {
      onChange(trimmed)
      setUrlInput('')
      setShowUrlInput(false)
      setError(null)
    }
  }

  const handleClear = () => {
    onChange('')
    setError(null)
    setShowUrlInput(false)
    setUrlInput('')
  }

  return (
    <div
      data-editor-field={editorField}
      className={isSelected ? 'ring-primary rounded-xl ring-2 ring-inset' : ''}
    >
      <label className="text-foreground mb-1 block text-sm font-medium">{label}</label>

      {/* Área de preview + drop zone */}
      <div
        className={`border-border bg-background relative w-full overflow-hidden rounded-xl border-2 border-dashed ${ASPECT_CLASSES[aspect]} ${
          uploading ? 'opacity-60' : 'hover:border-primary/50 cursor-pointer'
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label={`Selecionar imagem para ${label}`}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && fileRef.current?.click()}
      >
        {value ? (
          <Image
            src={value}
            alt={label}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized={value.startsWith('https://pub-')}
          />
        ) : (
          <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <ImageIcon className="h-8 w-8 opacity-40" />
                <span className="text-xs">
                  Arraste ou clique para enviar
                  <br />
                  PNG, JPEG ou WebP — máx. 5 MB
                </span>
              </>
            )}
          </div>
        )}

        {/* Overlay com ícone de upload ao hover quando já tem imagem */}
        {value && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/40">
            <Upload className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100" />
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFile}
        aria-label={`Upload de arquivo para ${label}`}
      />

      {/* Barra de ações abaixo da imagem */}
      <div className="mt-1.5 flex items-center gap-2">
        {allowUrlInput ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowUrlInput((v) => !v)
              setError(null)
            }}
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
          >
            {showUrlInput ? 'Cancelar URL' : 'Ou cole uma URL'}
          </button>
        ) : (
          <span className="text-muted-foreground text-xs">Use upload ou arraste e solte</span>
        )}

        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="text-muted-foreground hover:text-destructive ml-auto flex items-center gap-1 text-xs"
            aria-label="Remover imagem"
          >
            <X className="h-3.5 w-3.5" />
            Remover
          </button>
        )}
      </div>

      {allowUrlInput && showUrlInput && (
        <div className="mt-1.5 flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUrlConfirm()}
            placeholder="https://exemplo.com/imagem.jpg"
            className="border-border bg-background text-foreground focus:ring-primary flex-1 rounded-lg border px-3 py-1.5 text-sm focus:border-transparent focus:ring-2"
            autoFocus
          />
          <button
            type="button"
            onClick={handleUrlConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 text-sm font-medium"
          >
            OK
          </button>
        </div>
      )}

      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  )
}

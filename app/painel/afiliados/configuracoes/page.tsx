'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Loader2, CheckCheck, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

// Estados brasileiros (sigla → nome)
const ESTADOS_BR = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
]

// Regex de validação PIX (espelha server-side validatePixKey)
const PIX_PATTERNS = [
  { type: 'CPF', regex: /^\d{11}$/ },
  { type: 'CNPJ', regex: /^\d{14}$/ },
  { type: 'E-mail', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  { type: 'Telefone (+55...)', regex: /^\+55\d{10,11}$/ },
  {
    type: 'Chave aleatória (UUID)',
    regex: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },
]

function getPixType(key: string): string | null {
  if (!key.trim()) return null
  for (const { type, regex } of PIX_PATTERNS) {
    if (regex.test(key.trim())) return type
  }
  return null
}

interface AffiliateConfig {
  chave_pix: string | null
  cidade: string | null
  estado: string | null
  bio: string | null
  avatar_url: string | null
}

export default function AfiliadosConfiguracoes() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [pixTipo, setPixTipo] = useState<string | null>(null)

  const [form, setForm] = useState<AffiliateConfig>({
    chave_pix: '',
    cidade: '',
    estado: '',
    bio: '',
    avatar_url: '',
  })

  useEffect(() => {
    fetch('/api/afiliados/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.affiliate) {
          router.replace('/painel/afiliados')
          return
        }
        const a = data.affiliate
        setForm({
          chave_pix: a.chave_pix ?? '',
          cidade: a.cidade ?? '',
          estado: a.estado ?? '',
          bio: a.bio ?? '',
          avatar_url: a.avatar_url ?? '',
        })
        setPixTipo(getPixType(a.chave_pix ?? ''))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  function handlePixChange(value: string) {
    setForm((f) => ({ ...f, chave_pix: value }))
    setPixTipo(getPixType(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.chave_pix && !getPixType(form.chave_pix)) {
      setError(
        'Chave PIX inválida. Formatos aceitos: CPF (11 dígitos), CNPJ (14 dígitos), e-mail, telefone (+55...) ou chave aleatória (UUID).'
      )
      return
    }

    setSaving(true)
    const res = await fetch('/api/afiliados/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chave_pix: form.chave_pix || null,
        cidade: form.cidade || null,
        estado: form.estado || null,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
      }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(data.error ?? 'Erro ao salvar configurações')
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link
          href="/painel/afiliados"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao painel
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
          <Settings className="text-primary h-5 w-5" />
        </div>
        <div>
          <h1 className="text-foreground text-xl font-bold">Configurações</h1>
          <p className="text-muted-foreground text-sm">Atualize seu perfil de afiliado</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Chave PIX */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-foreground mb-4 font-semibold">Chave PIX para pagamentos</h2>
          <div className="space-y-2">
            <input
              type="text"
              value={form.chave_pix ?? ''}
              onChange={(e) => handlePixChange(e.target.value)}
              placeholder="CPF, CNPJ, e-mail, +55... ou UUID"
              className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
            />
            {form.chave_pix && (
              <p className={`text-xs font-medium ${pixTipo ? 'text-green-600' : 'text-red-500'}`}>
                {pixTipo ? `✓ Tipo reconhecido: ${pixTipo}` : '✗ Formato não reconhecido'}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Formatos aceitos: CPF (11 dígitos), CNPJ (14 dígitos), e-mail, +55XXXXXXXXXXX ou chave
              aleatória (UUID).
            </p>
          </div>
        </div>

        {/* Localização */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-foreground mb-4 font-semibold">Localização</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Cidade</label>
              <input
                type="text"
                value={form.cidade ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, cidade: e.target.value }))}
                placeholder="Ex: São Paulo"
                maxLength={100}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Estado</label>
              <select
                aria-label="Estado"
                value={form.estado ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
              >
                <option value="">Selecione...</option>
                {ESTADOS_BR.map((e) => (
                  <option key={e.uf} value={e.uf}>
                    {e.nome} ({e.uf})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Aparece no mapa público de afiliados.
          </p>
        </div>

        {/* Bio */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-foreground mb-4 font-semibold">Bio</h2>
          <textarea
            value={form.bio ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 280) }))}
            placeholder="Conte brevemente quem você é e como atua no mercado..."
            rows={3}
            maxLength={280}
            className="border-border bg-background text-foreground w-full resize-none rounded-lg border px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
          />
          <p className="text-muted-foreground mt-1 text-right text-xs">
            {(form.bio ?? '').length}/280
          </p>
        </div>

        {/* Avatar */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-foreground mb-4 font-semibold">Foto de perfil</h2>
          <input
            type="url"
            value={form.avatar_url ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, avatar_url: e.target.value }))}
            placeholder="https://exemplo.com/foto.jpg"
            className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
          />
          {form.avatar_url && (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.avatar_url}
                alt="Preview"
                className="h-12 w-12 rounded-full border border-zinc-200 object-cover"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <p className="text-muted-foreground text-xs">Preview da foto</p>
            </div>
          )}
          <p className="text-muted-foreground mt-2 text-xs">
            URL de uma imagem pública (Gravatar, LinkedIn, etc.).
          </p>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            <CheckCheck className="h-4 w-4 shrink-0" />
            Configurações salvas com sucesso!
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-primary-foreground w-full rounded-xl py-2.5 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
            </span>
          ) : (
            'Salvar configurações'
          )}
        </button>
      </form>
    </div>
  )
}

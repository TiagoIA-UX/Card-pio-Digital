'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/shared/supabase/client'
import { Upload, FileCheck, AlertTriangle, Loader2, Save, Shield } from 'lucide-react'

interface FiscalConfig {
  id?: string
  cnpj: string
  razao_social: string
  nome_fantasia: string
  inscricao_estadual: string
  regime_tributario: number
  logradouro: string
  numero: string
  bairro: string
  municipio: string
  codigo_municipio: string
  uf: string
  cep: string
  ambiente: 'homologacao' | 'producao'
  serie_nfce: number
  proximo_numero_nfce: number
  ncm_padrao: string
  cfop_padrao: string
  csosn_padrao: string
  ativo: boolean
  certificado_storage_path: string | null
  certificado_validade: string | null
}

const EMPTY_CONFIG: FiscalConfig = {
  cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  inscricao_estadual: '',
  regime_tributario: 1,
  logradouro: '',
  numero: '',
  bairro: '',
  municipio: '',
  codigo_municipio: '',
  uf: 'SP',
  cep: '',
  ambiente: 'homologacao',
  serie_nfce: 1,
  proximo_numero_nfce: 1,
  ncm_padrao: '21069090',
  cfop_padrao: '5102',
  csosn_padrao: '102',
  ativo: false,
  certificado_storage_path: null,
  certificado_validade: null,
}

const UF_OPTIONS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]

export default function FiscalPage() {
  const [config, setConfig] = useState<FiscalConfig>(EMPTY_CONFIG)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certPassword, setCertPassword] = useState('')

  const supabase = createClient()

  const loadConfig = useCallback(async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!restaurant) return
      setRestaurantId(restaurant.id)

      const { data: fiscal } = await supabase
        .from('fiscal_config')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .maybeSingle()

      if (fiscal) {
        setConfig(fiscal as FiscalConfig)
      }
    } catch (err) {
      console.error('Erro ao carregar config fiscal:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleSave = async () => {
    if (!restaurantId) return
    setSaving(true)
    setMessage(null)

    try {
      const payload = {
        restaurant_id: restaurantId,
        cnpj: config.cnpj.replace(/\D/g, ''),
        razao_social: config.razao_social,
        nome_fantasia: config.nome_fantasia,
        inscricao_estadual: config.inscricao_estadual.replace(/\D/g, ''),
        regime_tributario: config.regime_tributario,
        logradouro: config.logradouro,
        numero: config.numero,
        bairro: config.bairro,
        municipio: config.municipio,
        codigo_municipio: config.codigo_municipio,
        uf: config.uf,
        cep: config.cep.replace(/\D/g, ''),
        ambiente: config.ambiente,
        serie_nfce: config.serie_nfce,
        ncm_padrao: config.ncm_padrao,
        cfop_padrao: config.cfop_padrao,
        csosn_padrao: config.csosn_padrao,
        ativo: config.ativo,
      }

      if (config.id) {
        const { error } = await supabase.from('fiscal_config').update(payload).eq('id', config.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('fiscal_config').insert(payload)

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Configuração fiscal salva com sucesso!' })
      await loadConfig()
    } catch (err) {
      setMessage({ type: 'error', text: `Erro ao salvar: ${err}` })
    } finally {
      setSaving(false)
    }
  }

  const handleUploadCert = async () => {
    if (!certFile || !restaurantId || !certPassword) {
      setMessage({ type: 'error', text: 'Selecione o arquivo .pfx e informe a senha.' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const storagePath = `${restaurantId}/certificado_a1.pfx`

      const { error: uploadError } = await supabase.storage
        .from('fiscal-certificates')
        .upload(storagePath, certFile, {
          upsert: true,
          contentType: 'application/x-pkcs12',
        })

      if (uploadError) throw uploadError

      // Atualizar config com o path do certificado e senha
      const { error: updateError } = await supabase
        .from('fiscal_config')
        .update({
          certificado_storage_path: storagePath,
          certificado_senha_encrypted: certPassword,
        })
        .eq('restaurant_id', restaurantId)

      if (updateError) throw updateError

      setMessage({ type: 'success', text: 'Certificado A1 enviado com sucesso!' })
      setCertFile(null)
      setCertPassword('')
      await loadConfig()
    } catch (err) {
      setMessage({ type: 'error', text: `Erro no upload: ${err}` })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Nota Fiscal (NFC-e)</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Emita notas fiscais direto com o Sefaz — sem custo extra. Você só precisa do seu
          certificado digital A1.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 text-sm ${
            message.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-700'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Certificado A1 */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-zinc-900">Certificado Digital A1</h2>
        </div>

        {config.certificado_storage_path ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3">
            <FileCheck className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-700">Certificado enviado</span>
            {config.certificado_validade && (
              <span className="ml-auto text-xs text-green-500">
                Validade: {new Date(config.certificado_validade).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        ) : (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span className="text-sm text-amber-700">Nenhum certificado enviado</span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cert_file" className="mb-1 block text-xs font-medium text-zinc-600">
              Arquivo .pfx (Certificado A1)
            </label>
            <input
              id="cert_file"
              type="file"
              accept=".pfx,.p12"
              onChange={(e) => setCertFile(e.target.files?.[0] || null)}
              aria-label="Arquivo .pfx (Certificado A1)"
              className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-orange-700 hover:file:bg-orange-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Senha do certificado
            </label>
            <input
              type="password"
              value={certPassword}
              onChange={(e) => setCertPassword(e.target.value)}
              placeholder="Senha do .pfx"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <button
          onClick={handleUploadCert}
          disabled={uploading || !certFile}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? 'Enviando...' : 'Enviar Certificado'}
        </button>
      </section>

      {/* Dados Fiscais do Emitente */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Dados Fiscais do Emitente</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">CNPJ</label>
            <input
              type="text"
              value={config.cnpj}
              onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label htmlFor="ie" className="mb-1 block text-xs font-medium text-zinc-600">
              Inscrição Estadual
            </label>
            <input
              id="ie"
              type="text"
              value={config.inscricao_estadual}
              onChange={(e) => setConfig({ ...config, inscricao_estadual: e.target.value })}
              placeholder="Inscrição Estadual"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="razao_social" className="mb-1 block text-xs font-medium text-zinc-600">
              Razão Social
            </label>
            <input
              id="razao_social"
              type="text"
              value={config.razao_social}
              onChange={(e) => setConfig({ ...config, razao_social: e.target.value })}
              placeholder="Razão Social"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="nome_fantasia" className="mb-1 block text-xs font-medium text-zinc-600">
              Nome Fantasia
            </label>
            <input
              id="nome_fantasia"
              type="text"
              value={config.nome_fantasia}
              onChange={(e) => setConfig({ ...config, nome_fantasia: e.target.value })}
              placeholder="Nome Fantasia"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label htmlFor="regime" className="mb-1 block text-xs font-medium text-zinc-600">
              Regime Tributário
            </label>
            <select
              id="regime"
              value={config.regime_tributario}
              onChange={(e) => setConfig({ ...config, regime_tributario: Number(e.target.value) })}
              aria-label="Regime Tributário"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value={1}>1 — Simples Nacional</option>
              <option value={2}>2 — SN Excesso de Sublimite</option>
              <option value={3}>3 — Regime Normal</option>
            </select>
          </div>
        </div>
      </section>

      {/* Endereço Fiscal */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Endereço Fiscal</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="logradouro" className="mb-1 block text-xs font-medium text-zinc-600">
              Logradouro
            </label>
            <input
              id="logradouro"
              type="text"
              value={config.logradouro}
              onChange={(e) => setConfig({ ...config, logradouro: e.target.value })}
              placeholder="Logradouro"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label htmlFor="numero" className="mb-1 block text-xs font-medium text-zinc-600">
              Número
            </label>
            <input
              id="numero"
              type="text"
              value={config.numero}
              onChange={(e) => setConfig({ ...config, numero: e.target.value })}
              placeholder="S/N"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label htmlFor="bairro" className="mb-1 block text-xs font-medium text-zinc-600">
              Bairro
            </label>
            <input
              id="bairro"
              type="text"
              value={config.bairro}
              onChange={(e) => setConfig({ ...config, bairro: e.target.value })}
              placeholder="Bairro"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label htmlFor="municipio" className="mb-1 block text-xs font-medium text-zinc-600">
              Município
            </label>
            <input
              id="municipio"
              type="text"
              value={config.municipio}
              onChange={(e) => setConfig({ ...config, municipio: e.target.value })}
              placeholder="Município"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Cód. IBGE Município
            </label>
            <input
              type="text"
              value={config.codigo_municipio}
              onChange={(e) => setConfig({ ...config, codigo_municipio: e.target.value })}
              placeholder="7 dígitos"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label htmlFor="uf" className="mb-1 block text-xs font-medium text-zinc-600">
              UF
            </label>
            <select
              id="uf"
              value={config.uf}
              onChange={(e) => setConfig({ ...config, uf: e.target.value })}
              aria-label="UF"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              {UF_OPTIONS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">CEP</label>
            <input
              type="text"
              value={config.cep}
              onChange={(e) => setConfig({ ...config, cep: e.target.value })}
              placeholder="00000-000"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </section>

      {/* Configurações de Emissão */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">Configurações de Emissão</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ambiente" className="mb-1 block text-xs font-medium text-zinc-600">
              Ambiente
            </label>
            <select
              id="ambiente"
              value={config.ambiente}
              onChange={(e) =>
                setConfig({ ...config, ambiente: e.target.value as 'homologacao' | 'producao' })
              }
              aria-label="Ambiente"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="homologacao">Homologação (testes)</option>
              <option value="producao">Produção (real)</option>
            </select>
          </div>
          <div>
            <label htmlFor="serie" className="mb-1 block text-xs font-medium text-zinc-600">
              Série NFC-e
            </label>
            <input
              id="serie"
              type="number"
              value={config.serie_nfce}
              onChange={(e) => setConfig({ ...config, serie_nfce: Number(e.target.value) })}
              min={1}
              placeholder="1"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={config.ativo}
              onChange={(e) => setConfig({ ...config, ativo: e.target.checked })}
              aria-label="Ativar emissão fiscal"
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-zinc-200 peer-checked:bg-orange-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
          <span className="text-sm text-zinc-700">
            {config.ativo ? 'Emissão ativada' : 'Emissão desativada'}
          </span>
        </div>
      </section>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar Configuração Fiscal'}
        </button>
      </div>
    </div>
  )
}

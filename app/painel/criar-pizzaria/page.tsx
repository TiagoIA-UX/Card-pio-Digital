'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import {
  PizzaIcon,
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Store,
  MapPin,
  Clock,
  Truck,
  Palette,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'

// Categorias padrão para pizzarias
const CATEGORIAS_PADRAO = [
  { nome: 'Pizzas Salgadas', icone: '🍕', ordem: 1 },
  { nome: 'Pizzas Doces', icone: '🍫', ordem: 2 },
  { nome: 'Pizzas Especiais', icone: '⭐', ordem: 3 },
  { nome: 'Bebidas', icone: '🥤', ordem: 4 },
  { nome: 'Combos', icone: '🎁', ordem: 5 },
]

// Tamanhos padrão
const TAMANHOS_PADRAO = [
  {
    nome: 'Broto',
    descricao: '4 fatias - serve 1 pessoa',
    multiplicador_preco: 0.6,
    max_sabores: 1,
    ordem: 1,
  },
  {
    nome: 'Média',
    descricao: '6 fatias - serve 2 pessoas',
    multiplicador_preco: 0.8,
    max_sabores: 2,
    ordem: 2,
  },
  {
    nome: 'Grande',
    descricao: '8 fatias - serve 3 pessoas',
    multiplicador_preco: 1.0,
    max_sabores: 2,
    ordem: 3,
  },
  {
    nome: 'Família',
    descricao: '12 fatias - serve 4+ pessoas',
    multiplicador_preco: 1.3,
    max_sabores: 3,
    ordem: 4,
  },
]

// Bordas padrão
const BORDAS_PADRAO = [
  { nome: 'Tradicional', preco_adicional: 0, ordem: 1 },
  { nome: 'Catupiry', preco_adicional: 8, ordem: 2 },
  { nome: 'Cheddar', preco_adicional: 8, ordem: 3 },
  { nome: 'Chocolate', preco_adicional: 10, ordem: 4 },
]

// Cores predefinidas
const CORES_PRESET = [
  { nome: 'Vermelho Clássico', primary: '#DC2626', secondary: '#FEF2F2' },
  { nome: 'Laranja Quente', primary: '#EA580C', secondary: '#FFF7ED' },
  { nome: 'Verde Italiano', primary: '#16A34A', secondary: '#F0FDF4' },
  { nome: 'Azul Moderno', primary: '#2563EB', secondary: '#EFF6FF' },
  { nome: 'Roxo Premium', primary: '#7C3AED', secondary: '#F5F3FF' },
  { nome: 'Dourado', primary: '#CA8A04', secondary: '#FEFCE8' },
]

interface FormData {
  // Step 1 - Dados básicos
  nome: string
  slug: string
  whatsapp: string

  // Step 2 - Localização
  cidade: string
  bairro: string
  endereco: string

  // Step 3 - Funcionamento
  horarioAbertura: string
  horarioFechamento: string
  funcionaSegunda: boolean
  funcionaTerca: boolean
  funcionaQuarta: boolean
  funcionaQuinta: boolean
  funcionaSexta: boolean
  funcionaSabado: boolean
  funcionaDomingo: boolean

  // Step 4 - Delivery
  aceitaEntrega: boolean
  aceitaRetirada: boolean
  taxaEntrega: string
  tempoEntregaMin: string
  pedidoMinimo: string
  raioEntregaKm: string

  // Step 5 - Visual
  corPreset: number
  corPrimaria: string
  logoUrl: string
}

const INITIAL_FORM: FormData = {
  nome: '',
  slug: '',
  whatsapp: '',
  cidade: '',
  bairro: '',
  endereco: '',
  horarioAbertura: '18:00',
  horarioFechamento: '23:00',
  funcionaSegunda: true,
  funcionaTerca: true,
  funcionaQuarta: true,
  funcionaQuinta: true,
  funcionaSexta: true,
  funcionaSabado: true,
  funcionaDomingo: true,
  aceitaEntrega: true,
  aceitaRetirada: true,
  taxaEntrega: '5',
  tempoEntregaMin: '45',
  pedidoMinimo: '30',
  raioEntregaKm: '5',
  corPreset: 0,
  corPrimaria: '#DC2626',
  logoUrl: '',
}

export default function CriarPizzariaPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)
  const [slugDisponivel, setSlugDisponivel] = useState<boolean | null>(null)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalSteps = 5

  // Gerar slug automaticamente a partir do nome
  useEffect(() => {
    if (formData.nome) {
      const slug = formData.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Só atualiza se o slug atual estiver vazio ou for derivado do nome antigo
      setFormData((prev) => {
        if (!prev.slug || prev.slug === slug) {
          return { ...prev, slug }
        }
        return prev
      })
    }
  }, [formData.nome])

  // Verificar disponibilidade do slug
  useEffect(() => {
    const checkSlug = async () => {
      if (!formData.slug || formData.slug.length < 3) {
        setSlugDisponivel(null)
        return
      }

      setIsCheckingSlug(true)
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('tenants')
          .select('slug')
          .eq('slug', formData.slug)
          .single()

        setSlugDisponivel(!data)
      } catch {
        setSlugDisponivel(true) // Se der erro, provavelmente não existe
      } finally {
        setIsCheckingSlug(false)
      }
    }

    const timeout = setTimeout(checkSlug, 500)
    return () => clearTimeout(timeout)
  }, [formData.slug])

  const updateField = (field: keyof FormData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (stepNum) {
      case 1:
        if (!formData.nome) newErrors.nome = 'Nome é obrigatório'
        if (!formData.slug) newErrors.slug = 'URL é obrigatória'
        else if (formData.slug.length < 3) newErrors.slug = 'URL deve ter no mínimo 3 caracteres'
        else if (slugDisponivel === false) newErrors.slug = 'Esta URL já está em uso'
        if (!formData.whatsapp) newErrors.whatsapp = 'WhatsApp é obrigatório'
        else if (!/^\d{10,11}$/.test(formData.whatsapp.replace(/\D/g, ''))) {
          newErrors.whatsapp = 'WhatsApp inválido'
        }
        break
      case 2:
        if (!formData.cidade) newErrors.cidade = 'Cidade é obrigatória'
        if (!formData.bairro) newErrors.bairro = 'Bairro é obrigatório'
        break
      case 3:
        if (!formData.horarioAbertura)
          newErrors.horarioAbertura = 'Horário de abertura é obrigatório'
        if (!formData.horarioFechamento)
          newErrors.horarioFechamento = 'Horário de fechamento é obrigatório'
        break
      case 4:
        if (formData.aceitaEntrega) {
          if (!formData.taxaEntrega) newErrors.taxaEntrega = 'Taxa de entrega é obrigatória'
          if (!formData.tempoEntregaMin) newErrors.tempoEntregaMin = 'Tempo estimado é obrigatório'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) return

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Buscar usuário atual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Montar horário de funcionamento
      const horarioBase = {
        abertura: formData.horarioAbertura,
        fechamento: formData.horarioFechamento,
      }

      const horarioFuncionamento = {
        segunda: formData.funcionaSegunda ? { ...horarioBase, aberto: true } : { aberto: false },
        terca: formData.funcionaTerca ? { ...horarioBase, aberto: true } : { aberto: false },
        quarta: formData.funcionaQuarta ? { ...horarioBase, aberto: true } : { aberto: false },
        quinta: formData.funcionaQuinta ? { ...horarioBase, aberto: true } : { aberto: false },
        sexta: formData.funcionaSexta ? { ...horarioBase, aberto: true } : { aberto: false },
        sabado: formData.funcionaSabado ? { ...horarioBase, aberto: true } : { aberto: false },
        domingo: formData.funcionaDomingo ? { ...horarioBase, aberto: true } : { aberto: false },
      }

      // Cores selecionadas
      const cores = CORES_PRESET[formData.corPreset] || CORES_PRESET[0]

      // 1. Criar tenant (pizzaria)
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          slug: formData.slug,
          nome: formData.nome,
          whatsapp: formData.whatsapp.replace(/\D/g, ''),
          email: user.email,
          endereco: {
            cidade: formData.cidade,
            bairro: formData.bairro,
            rua: formData.endereco,
          },
          horario_funcionamento: horarioFuncionamento,
          aceita_entrega: formData.aceitaEntrega,
          aceita_retirada: formData.aceitaRetirada,
          taxa_entrega: parseFloat(formData.taxaEntrega) || 0,
          tempo_entrega_min: parseInt(formData.tempoEntregaMin) || 45,
          pedido_minimo: parseFloat(formData.pedidoMinimo) || 0,
          raio_entrega_km: parseFloat(formData.raioEntregaKm) || 5,
          cores: {
            primary: cores.primary,
            secondary: cores.secondary,
          },
          logo_url: formData.logoUrl || null,
          config_pizza: {
            permite_meio_a_meio: true,
            preco_meio_a_meio: 'maior',
            max_sabores_por_tamanho: true,
          },
          ativo: true,
          verificado: false,
        })
        .select()
        .single()

      if (tenantError) throw tenantError

      // 2. Vincular usuário ao tenant
      const { error: userError } = await supabase
        .from('users')
        .update({ tenant_id: tenant.id })
        .eq('id', user.id)

      if (userError) throw userError

      // 3. Criar subscription trial
      // Primeiro buscar o plano gratuito
      const { data: planoGratis } = await supabase
        .from('plans')
        .select('id')
        .eq('slug', 'gratis')
        .single()

      if (planoGratis) {
        const trialEnds = new Date()
        trialEnds.setDate(trialEnds.getDate() + 7) // 7 dias de trial

        await supabase.from('subscriptions').insert({
          tenant_id: tenant.id,
          plano_id: planoGratis.id,
          status: 'trial',
          trial_ends_at: trialEnds.toISOString(),
        })
      }

      // 4. Criar categorias padrão
      const categoriasParaInserir = CATEGORIAS_PADRAO.map((cat) => ({
        tenant_id: tenant.id,
        nome: cat.nome,
        icone: cat.icone,
        ordem: cat.ordem,
        ativo: true,
      }))

      await supabase.from('categories').insert(categoriasParaInserir)

      // 5. Criar tamanhos padrão
      const tamanhosParaInserir = TAMANHOS_PADRAO.map((tam) => ({
        tenant_id: tenant.id,
        nome: tam.nome,
        descricao: tam.descricao,
        multiplicador_preco: tam.multiplicador_preco,
        max_sabores: tam.max_sabores,
        ordem: tam.ordem,
        ativo: true,
      }))

      await supabase.from('product_sizes').insert(tamanhosParaInserir)

      // 6. Criar bordas padrão
      const bordasParaInserir = BORDAS_PADRAO.map((borda) => ({
        tenant_id: tenant.id,
        nome: borda.nome,
        preco_adicional: borda.preco_adicional,
        ordem: borda.ordem,
        disponivel: true,
      }))

      await supabase.from('product_crusts').insert(bordasParaInserir)

      toast({
        title: '🎉 Pizzaria criada com sucesso!',
        description: 'Seu site já está no ar. Vamos adicionar os produtos!',
      })

      // Redirecionar para o painel
      router.push('/painel')
      router.refresh()
    } catch (error) {
      console.error('Erro ao criar pizzaria:', error)
      toast({
        title: 'Erro ao criar pizzaria',
        description: error instanceof Error ? error.message : 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Pizzaria *</Label>
              <Input
                id="nome"
                placeholder="Ex: Pizzaria do João"
                value={formData.nome}
                onChange={(e) => updateField('nome', e.target.value)}
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL do seu site *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">pizzadigital.com.br/r/</span>
                <Input
                  id="slug"
                  placeholder="sua-pizzaria"
                  value={formData.slug}
                  onChange={(e) =>
                    updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                  }
                  className={`flex-1 ${errors.slug ? 'border-red-500' : ''}`}
                />
              </div>
              {isCheckingSlug && (
                <p className="flex items-center gap-1 text-sm text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Verificando...
                </p>
              )}
              {!isCheckingSlug && slugDisponivel === true && formData.slug.length >= 3 && (
                <p className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-3 w-3" /> URL disponível!
                </p>
              )}
              {!isCheckingSlug && slugDisponivel === false && (
                <p className="text-sm text-red-500">Esta URL já está em uso</p>
              )}
              {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp para pedidos *</Label>
              <Input
                id="whatsapp"
                placeholder="11999999999"
                value={formData.whatsapp}
                onChange={(e) => updateField('whatsapp', e.target.value.replace(/\D/g, ''))}
                className={errors.whatsapp ? 'border-red-500' : ''}
                maxLength={11}
              />
              <p className="text-xs text-gray-500">Os pedidos serão enviados para este número</p>
              {errors.whatsapp && <p className="text-sm text-red-500">{errors.whatsapp}</p>}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                placeholder="Ex: São Paulo"
                value={formData.cidade}
                onChange={(e) => updateField('cidade', e.target.value)}
                className={errors.cidade ? 'border-red-500' : ''}
              />
              {errors.cidade && <p className="text-sm text-red-500">{errors.cidade}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro *</Label>
              <Input
                id="bairro"
                placeholder="Ex: Centro"
                value={formData.bairro}
                onChange={(e) => updateField('bairro', e.target.value)}
                className={errors.bairro ? 'border-red-500' : ''}
              />
              {errors.bairro && <p className="text-sm text-red-500">{errors.bairro}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço completo (opcional)</Label>
              <Input
                id="endereco"
                placeholder="Rua, número"
                value={formData.endereco}
                onChange={(e) => updateField('endereco', e.target.value)}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="horarioAbertura">Abre às</Label>
                <Input
                  id="horarioAbertura"
                  type="time"
                  value={formData.horarioAbertura}
                  onChange={(e) => updateField('horarioAbertura', e.target.value)}
                  className={errors.horarioAbertura ? 'border-red-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horarioFechamento">Fecha às</Label>
                <Input
                  id="horarioFechamento"
                  type="time"
                  value={formData.horarioFechamento}
                  onChange={(e) => updateField('horarioFechamento', e.target.value)}
                  className={errors.horarioFechamento ? 'border-red-500' : ''}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Dias de funcionamento</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'funcionaSegunda', label: 'Segunda' },
                  { key: 'funcionaTerca', label: 'Terça' },
                  { key: 'funcionaQuarta', label: 'Quarta' },
                  { key: 'funcionaQuinta', label: 'Quinta' },
                  { key: 'funcionaSexta', label: 'Sexta' },
                  { key: 'funcionaSabado', label: 'Sábado' },
                  { key: 'funcionaDomingo', label: 'Domingo' },
                ].map((dia) => (
                  <div
                    key={dia.key}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-2"
                  >
                    <span className="text-sm">{dia.label}</span>
                    <Switch
                      checked={formData[dia.key as keyof FormData] as boolean}
                      onCheckedChange={(checked) => updateField(dia.key as keyof FormData, checked)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-gray-600" />
                <span>Faz entrega (delivery)</span>
              </div>
              <Switch
                checked={formData.aceitaEntrega}
                onCheckedChange={(checked) => updateField('aceitaEntrega', checked)}
              />
            </div>

            {formData.aceitaEntrega && (
              <div className="space-y-4 rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxaEntrega">Taxa de entrega (R$)</Label>
                    <Input
                      id="taxaEntrega"
                      type="number"
                      placeholder="5.00"
                      value={formData.taxaEntrega}
                      onChange={(e) => updateField('taxaEntrega', e.target.value)}
                      className={errors.taxaEntrega ? 'border-red-500' : ''}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tempoEntregaMin">Tempo estimado (min)</Label>
                    <Input
                      id="tempoEntregaMin"
                      type="number"
                      placeholder="45"
                      value={formData.tempoEntregaMin}
                      onChange={(e) => updateField('tempoEntregaMin', e.target.value)}
                      className={errors.tempoEntregaMin ? 'border-red-500' : ''}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pedidoMinimo">Pedido mínimo (R$)</Label>
                    <Input
                      id="pedidoMinimo"
                      type="number"
                      placeholder="30.00"
                      value={formData.pedidoMinimo}
                      onChange={(e) => updateField('pedidoMinimo', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="raioEntregaKm">Raio de entrega (km)</Label>
                    <Input
                      id="raioEntregaKm"
                      type="number"
                      placeholder="5"
                      value={formData.raioEntregaKm}
                      onChange={(e) => updateField('raioEntregaKm', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-gray-600" />
                <span>Aceita retirada no local</span>
              </div>
              <Switch
                checked={formData.aceitaRetirada}
                onCheckedChange={(checked) => updateField('aceitaRetirada', checked)}
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Cor da sua marca</Label>
              <div className="grid grid-cols-3 gap-3">
                {CORES_PRESET.map((cor, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      updateField('corPreset', index)
                      updateField('corPrimaria', cor.primary)
                    }}
                    className={`rounded-lg border-2 p-3 transition-all ${
                      formData.corPreset === index
                        ? 'border-gray-900 ring-2 ring-gray-900/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="mb-2 h-8 rounded-md" style={{ backgroundColor: cor.primary }} />
                    <span className="text-xs text-gray-600">{cor.nome}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview do site */}
            <div className="mt-6 rounded-lg border p-4">
              <p className="mb-3 text-sm text-gray-500">Preview do seu site:</p>
              <div
                className="rounded-lg p-4 text-white"
                style={{ backgroundColor: CORES_PRESET[formData.corPreset].primary }}
              >
                <div className="flex items-center gap-2">
                  <PizzaIcon className="h-6 w-6" />
                  <span className="font-bold">{formData.nome || 'Sua Pizzaria'}</span>
                </div>
                <p className="mt-2 text-sm opacity-90">
                  {formData.bairro ? `📍 ${formData.bairro}, ${formData.cidade}` : '📍 Sua cidade'}
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const stepInfo = [
    { icon: Store, title: 'Dados da Pizzaria', desc: 'Nome, URL e WhatsApp' },
    { icon: MapPin, title: 'Localização', desc: 'Cidade e bairro' },
    { icon: Clock, title: 'Funcionamento', desc: 'Horários e dias' },
    { icon: Truck, title: 'Delivery', desc: 'Entrega e retirada' },
    { icon: Palette, title: 'Visual', desc: 'Cores da marca' },
  ]

  const currentStepInfo = stepInfo[step - 1]
  const StepIcon = currentStepInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <PizzaIcon className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold text-gray-900">PizzaDigital</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Criar sua Pizzaria</h1>
          <p className="text-gray-500">Seu site estará pronto em minutos!</p>
        </div>

        {/* Progress */}
        <div className="mb-6 flex items-center justify-between">
          {stepInfo.map((info, index) => {
            const Icon = info.icon
            const stepNum = index + 1
            const isActive = stepNum === step
            const isCompleted = stepNum < step

            return (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`mt-1 text-xs ${isActive ? 'font-medium text-orange-600' : 'text-gray-400'}`}
                >
                  {stepNum}
                </span>
              </div>
            )
          })}
        </div>

        {/* Card principal */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <StepIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{currentStepInfo.title}</CardTitle>
                <CardDescription>{currentStepInfo.desc}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {renderStepContent()}

            {/* Botões de navegação */}
            <div className="mt-6 flex gap-3">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              )}

              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-orange-500 hover:bg-orange-600"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Criar minha Pizzaria
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info sobre o que será criado */}
        {step === totalSteps && (
          <div className="mt-6 rounded-lg border bg-white p-4">
            <h3 className="mb-2 flex items-center gap-2 font-medium text-gray-900">
              <Sparkles className="h-4 w-4 text-orange-500" />O que será criado automaticamente:
            </h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✅ Site profissional com sua URL própria</li>
              <li>✅ Categorias: Pizzas Salgadas, Doces, Especiais, Bebidas</li>
              <li>✅ Tamanhos: Broto, Média, Grande, Família</li>
              <li>✅ Bordas: Tradicional, Catupiry, Cheddar, Chocolate</li>
              <li>✅ QR Code para divulgação</li>
              <li>✅ 7 dias grátis para testar</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * POST /api/afiliados/registrar
 * Cria conta de afiliado para o usuário logado.
 * Body: { nome: string, chave_pix?: string, lider_code?: string }
 *
 * Se lider_code for informado (ou existir no cookie aff_ref),
 * o novo afiliado é vinculado como vendedor daquele líder.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Validação de chave PIX ─────────────────────────────────────────────────

/** Formatos aceitos pelo Banco Central para chaves PIX. */
const PIX_PATTERNS = [
  { type: 'cpf', regex: /^\d{11}$/ },
  { type: 'cnpj', regex: /^\d{14}$/ },
  { type: 'email', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  { type: 'telefone', regex: /^\+55\d{10,11}$/ },
  {
    type: 'chave_aleatoria',
    regex: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },
]

/**
 * Normaliza a chave PIX removendo máscaras comuns antes da validação.
 * - CPF  "123.456.789-00" → "12345678900"
 * - CNPJ "12.345.678/0001-90" → "12345678000190"
 * - Fone "+55 (11) 9 9999-9999" → "+5511999999999"
 * - UUID e e-mail: sem alteração.
 */
export function normalizePixKey(key: string): string {
  const trimmed = key.trim()
  // E-mail: não modificar
  if (trimmed.includes('@')) return trimmed
  // UUID (chave aleatória): apenas normalizar casing
  if (/^[0-9a-f-]{36}$/i.test(trimmed)) return trimmed.toLowerCase()
  // Telefone com prefixo +: remover espaços, parênteses e hífens
  if (trimmed.startsWith('+')) return trimmed.replace(/[\s\-()]/g, '')
  // CPF / CNPJ / outros: remover pontos, traços, barras, espaços e parênteses
  return trimmed.replace(/[\s.\-/()]/g, '')
}

export function validatePixKey(key: string): { valid: boolean; type: string } {
  const normalized = normalizePixKey(key)
  for (const { type, regex } of PIX_PATTERNS) {
    if (regex.test(normalized)) return { valid: true, type }
  }
  return { valid: false, type: 'desconhecido' }
}

function generateCode(nome: string): string {
  const base = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 10)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}${suffix}`
}

export async function POST(req: NextRequest) {
  const authSupabase = await createServerClient()
  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const nome = String(body.nome ?? '')
    .trim()
    .slice(0, 100)
  const rawPix = String(body.chave_pix ?? '').trim()
  let chave_pix: string | null = rawPix.slice(0, 200) || null

  // Valida e normaliza chave PIX se fornecida
  if (chave_pix) {
    const pixResult = validatePixKey(chave_pix)
    if (!pixResult.valid) {
      return NextResponse.json(
        {
          error:
            'Chave PIX inválida. Formatos aceitos: CPF (11 dígitos), CNPJ (14 dígitos), e-mail, telefone (+55 seguido de DDD+número) ou chave aleatória (UUID). Pode cadastrar depois em Configurações.',
        },
        { status: 400 }
      )
    }
    // Armazena a forma normalizada (sem máscara) para consistência
    chave_pix = normalizePixKey(chave_pix).slice(0, 200)
  }
  // lider_code: quem recrutou este afiliado (pode vir do body ou do cookie aff_ref)
  const lider_code =
    (String(body.lider_code ?? '').trim() || req.cookies.get('aff_ref')?.value || '').slice(
      0,
      100
    ) || null

  if (!nome) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verifica se já é afiliado
  const { data: existing } = await admin
    .from('affiliates')
    .select('id, code')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ affiliate: existing })
  }

  // Cria novo afiliado com código único (verifica colisão antes de usar)
  let code = generateCode(nome)
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: conflict } = await admin.from('affiliates').select('id').eq('code', code).single()
    if (!conflict) break
    // Só gera novo código se ainda há tentativas restantes
    if (attempt < 4) code = generateCode(nome)
  }

  // Resolve lider_id a partir do lider_code (se fornecido e válido)
  let lider_id: string | null = null
  if (lider_code) {
    const { data: lider } = await admin
      .from('affiliates')
      .select('id, user_id')
      .eq('code', lider_code)
      .eq('status', 'ativo')
      .single()
    // Não deixa o usuário ser líder de si mesmo
    if (lider && lider.user_id !== user.id) {
      lider_id = lider.id
    }
  }

  const { data: affiliate, error } = await admin
    .from('affiliates')
    .insert({ user_id: user.id, nome, chave_pix, code, lider_id })
    .select('id, code, nome, chave_pix, status, tier, lider_id, created_at')
    .single()

  if (error) {
    console.error('[afiliados/registrar] INSERT error:', error)
    return NextResponse.json(
      { error: `Erro ao criar afiliado: ${error.message}`, code: error.code },
      { status: 500 }
    )
  }

  return NextResponse.json({ affiliate }, { status: 201 })
}

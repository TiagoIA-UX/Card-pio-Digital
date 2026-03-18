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
    data: { session },
  } = await authSupabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const nome = String(body.nome ?? '')
    .trim()
    .slice(0, 100)
  const chave_pix =
    String(body.chave_pix ?? '')
      .trim()
      .slice(0, 200) || null
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
    .eq('user_id', session.user.id)
    .single()

  if (existing) {
    return NextResponse.json({ affiliate: existing })
  }

  // Cria novo afiliado com código único
  let code = generateCode(nome)
  let attempts = 0
  while (attempts < 5) {
    const { data: conflict } = await admin.from('affiliates').select('id').eq('code', code).single()
    if (!conflict) break
    code = generateCode(nome)
    attempts++
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
    if (lider && lider.user_id !== session.user.id) {
      lider_id = lider.id
    }
  }

  const { data: affiliate, error } = await admin
    .from('affiliates')
    .insert({ user_id: session.user.id, nome, chave_pix, code, lider_id })
    .select('id, code, nome, chave_pix, status, tier, lider_id, created_at')
    .single()

  if (error) {
    console.error('[afiliados/registrar]', error)
    return NextResponse.json({ error: 'Erro ao criar afiliado' }, { status: 500 })
  }

  return NextResponse.json({ affiliate }, { status: 201 })
}

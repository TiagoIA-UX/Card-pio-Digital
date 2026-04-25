import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/domains/auth/admin-auth'
import { createAdminClient } from '@/lib/shared/supabase/admin'

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? ''
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Limites de segurança
const MAX_PRODUCTS_PER_BATCH = 30
const GROQ_TIMEOUT_MS = 20_000

type PhotoAuditResult = {
  product_id: string
  nome: string
  categoria: string
  imagem_url: string
  width: number | null
  height: number | null
  status: 'ok' | 'mismatch' | 'low_quality' | 'error' | 'no_image'
  confidence: number
  reason: string
}

async function probeImageDimensions(
  url: string
): Promise<{ width: number | null; height: number | null }> {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    // We can't get dimensions from HEAD alone — just check if accessible
    if (!res.ok) return { width: null, height: null }
    return { width: null, height: null }
  } catch {
    return { width: null, height: null }
  }
}

async function analyzeImageWithVision(
  imageUrl: string,
  productName: string,
  productCategory: string,
  productDescription: string | null
): Promise<{ status: 'ok' | 'mismatch' | 'low_quality'; confidence: number; reason: string }> {
  if (!GROQ_API_KEY) {
    return { status: 'error' as any, confidence: 0, reason: 'GROQ_API_KEY não configurada' }
  }

  const prompt = `Você é um auditor de fotos de cardápio digital de delivery.

Analise esta foto e compare com o produto descrito abaixo:
- Nome: "${productName}"
- Categoria: "${productCategory}"
${productDescription ? `- Descrição: "${productDescription}"` : ''}

Responda APENAS com um JSON (sem markdown, sem backticks) neste formato exato:
{"match": true/false, "confidence": 0-100, "reason": "explicação curta em português"}

Regras:
- "match": true se a foto mostra algo compatível com o nome do produto
- "match": false se a foto claramente NÃO corresponde (ex: foto de pizza para um produto chamado "Suco de Laranja")
- "confidence": 0-100 quão certo você está
- "reason": explicação concisa em português do porquê
- Se a imagem parece genérica demais (stock photo de comida aleatória), marque match=false com reason explicando
- Se a imagem está muito escura, desfocada ou com qualidade ruim, inclua isso na reason`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return {
        status: 'error' as any,
        confidence: 0,
        reason: `Groq API error ${response.status}: ${errorText.slice(0, 200)}`,
      }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) {
      return { status: 'error' as any, confidence: 0, reason: 'Resposta vazia da IA' }
    }

    // Parse JSON response — handle potential markdown wrapping
    const jsonStr = content.replace(/^```json?\s*/, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(jsonStr)

    const match = Boolean(parsed.match)
    const confidence = Math.max(0, Math.min(100, Number(parsed.confidence) || 0))
    const reason = String(parsed.reason || 'Sem explicação')

    if (!match) {
      return { status: 'mismatch', confidence, reason }
    }

    // Check if confidence is very low even with match
    if (confidence < 40) {
      return { status: 'low_quality', confidence, reason: `Confiança baixa: ${reason}` }
    }

    return { status: 'ok', confidence, reason }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('abort')) {
      return { status: 'error' as any, confidence: 0, reason: 'Timeout na análise da imagem' }
    }
    return { status: 'error' as any, confidence: 0, reason: `Erro: ${message.slice(0, 200)}` }
  } finally {
    clearTimeout(timeout)
  }
}

// GET: Listar produtos com fotos de um delivery para auditoria
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req, 'admin')
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get('tenant_id')

  if (!tenantId) {
    // Return list of tenants with product counts
    const admin = createAdminClient()
    const { data: tenants } = await admin.from('restaurants').select('id, nome, slug').order('nome')

    if (!tenants?.length) {
      return NextResponse.json({ tenants: [] })
    }

    const tenantsWithCounts = await Promise.all(
      tenants.map(async (t) => {
        const { count } = await admin
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', t.id)
        const { count: withImage } = await admin
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', t.id)
          .not('imagem_url', 'is', null)
        return { ...t, total_products: count ?? 0, products_with_image: withImage ?? 0 }
      })
    )

    return NextResponse.json({ tenants: tenantsWithCounts })
  }

  // Return products for a specific tenant
  const admin = createAdminClient()
  const { data: products, error } = await admin
    .from('products')
    .select('id, nome, descricao, imagem_url, preco_base, disponivel, tenant_id')
    .eq('tenant_id', tenantId)
    .not('imagem_url', 'is', null)
    .order('nome')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also fetch category info
  const { data: categories } = await admin
    .from('categories')
    .select('id, nome')
    .eq('tenant_id', tenantId)

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.nome]))

  // Get full product data with categories
  const { data: fullProducts } = await admin
    .from('products')
    .select('id, nome, descricao, imagem_url, preco_base, disponivel, categoria_id')
    .eq('tenant_id', tenantId)
    .not('imagem_url', 'is', null)
    .order('nome')

  const enriched = (fullProducts ?? []).map((p) => ({
    ...p,
    categoria: categoryMap.get(p.categoria_id) ?? 'Sem categoria',
  }))

  return NextResponse.json({ products: enriched })
}

// POST: Executar auditoria de fotos com Vision AI
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req, 'owner')
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY não configurada no servidor' }, { status: 503 })
  }

  let body: { product_ids: string[]; tenant_id: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { product_ids, tenant_id } = body

  if (!tenant_id || !Array.isArray(product_ids) || product_ids.length === 0) {
    return NextResponse.json(
      { error: 'Envie tenant_id e product_ids (array de UUIDs)' },
      { status: 400 }
    )
  }

  if (product_ids.length > MAX_PRODUCTS_PER_BATCH) {
    return NextResponse.json(
      { error: `Máximo ${MAX_PRODUCTS_PER_BATCH} produtos por batch` },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data: products, error } = await admin
    .from('products')
    .select('id, nome, descricao, imagem_url, categoria_id')
    .eq('tenant_id', tenant_id)
    .in('id', product_ids)

  if (error || !products) {
    return NextResponse.json(
      { error: error?.message ?? 'Produtos não encontrados' },
      { status: 500 }
    )
  }

  const { data: categories } = await admin
    .from('categories')
    .select('id, nome')
    .eq('tenant_id', tenant_id)

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.nome]))

  const results: PhotoAuditResult[] = []

  // Process sequentially to avoid rate limits
  for (const product of products) {
    if (!product.imagem_url) {
      results.push({
        product_id: product.id,
        nome: product.nome,
        categoria: categoryMap.get(product.categoria_id) ?? 'Sem categoria',
        imagem_url: '',
        width: null,
        height: null,
        status: 'no_image',
        confidence: 0,
        reason: 'Produto sem imagem',
      })
      continue
    }

    const dimensions = await probeImageDimensions(product.imagem_url)
    const analysis = await analyzeImageWithVision(
      product.imagem_url,
      product.nome,
      categoryMap.get(product.categoria_id) ?? '',
      product.descricao
    )

    results.push({
      product_id: product.id,
      nome: product.nome,
      categoria: categoryMap.get(product.categoria_id) ?? 'Sem categoria',
      imagem_url: product.imagem_url,
      width: dimensions.width,
      height: dimensions.height,
      status: analysis.status,
      confidence: analysis.confidence,
      reason: analysis.reason,
    })
  }

  const summary = {
    total: results.length,
    ok: results.filter((r) => r.status === 'ok').length,
    mismatch: results.filter((r) => r.status === 'mismatch').length,
    low_quality: results.filter((r) => r.status === 'low_quality').length,
    error: results.filter((r) => r.status === 'error').length,
    no_image: results.filter((r) => r.status === 'no_image').length,
  }

  return NextResponse.json({ summary, results })
}


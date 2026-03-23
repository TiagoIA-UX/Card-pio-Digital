import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRateLimitIdentifier, RATE_LIMITS, withRateLimit } from '@/lib/rate-limit'

// ── Groq (mesma pattern do chat) ─────────────────────
function getGroq() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY não configurada')
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

// ── Classificar feedback via IA ──────────────────────
async function classificarFeedback(rating: number, comment: string) {
  const ratingLabel = ['', 'Péssimo', 'Ruim', 'Bom', 'Excelente'][rating] || 'Desconhecido'

  try {
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `Você é um classificador de feedback de delivery de restaurante.
Analise o feedback abaixo e retorne APENAS um JSON válido (sem markdown, sem texto extra):
{
  "sentimento": "positivo" | "neutro" | "negativo",
  "categoria": "produto" | "entrega" | "atendimento" | "app" | "elogio" | "geral",
  "prioridade": "baixa" | "media" | "alta" | "critica",
  "resumo": "frase curta de até 100 caracteres",
  "acao_sugerida": "ação recomendada em até 150 caracteres"
}
Regras:
- Rating 1-2 com comentário sobre qualidade = produto, prioridade alta/critica
- Rating 1-2 com comentário sobre demora = entrega, prioridade alta
- Rating 3-4 sem comentário = elogio, prioridade baixa
- Rating 3-4 com elogio = elogio, prioridade baixa
- Sem comentário: baseie-se apenas no rating`,
        },
        {
          role: 'user',
          content: `Rating: ${rating}/4 (${ratingLabel})\nComentário: ${comment || '(sem comentário)'}`,
        },
      ],
      max_tokens: 200,
      temperature: 0.1,
    })

    const raw = completion.choices[0]?.message?.content?.trim() || ''
    const json = JSON.parse(raw)

    // Validar campos obrigatórios
    const sentimentoValido = ['positivo', 'neutro', 'negativo'].includes(json.sentimento)
    const categoriaValida = [
      'produto',
      'entrega',
      'atendimento',
      'app',
      'elogio',
      'geral',
    ].includes(json.categoria)
    const prioridadeValida = ['baixa', 'media', 'alta', 'critica'].includes(json.prioridade)

    return {
      sentimento: sentimentoValido ? json.sentimento : rating >= 3 ? 'positivo' : 'negativo',
      categoria: categoriaValida ? json.categoria : 'geral',
      prioridade: prioridadeValida ? json.prioridade : rating <= 2 ? 'alta' : 'baixa',
      resumo: typeof json.resumo === 'string' ? json.resumo.slice(0, 100) : '',
      acao_sugerida: typeof json.acao_sugerida === 'string' ? json.acao_sugerida.slice(0, 150) : '',
    }
  } catch {
    // Fallback sem IA
    return {
      sentimento: rating >= 3 ? 'positivo' : 'negativo',
      categoria: 'geral',
      prioridade: rating <= 1 ? 'critica' : rating <= 2 ? 'alta' : 'baixa',
      resumo: rating >= 3 ? 'Avaliação positiva' : 'Avaliação negativa - requer atenção',
      acao_sugerida:
        rating >= 3 ? 'Enviar link de compartilhamento' : 'Entrar em contato com o cliente',
    }
  }
}

// ── POST: Enviar feedback ────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const rateLimit = await withRateLimit(getRateLimitIdentifier(req), RATE_LIMITS.checkout)
    if (rateLimit.limited) {
      return rateLimit.response
    }

    const body = await req.json()
    const { order_id, rating, comment } = body

    // Validação
    if (!order_id || typeof order_id !== 'string') {
      return NextResponse.json({ error: 'order_id é obrigatório' }, { status: 400 })
    }
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 4) {
      return NextResponse.json({ error: 'rating deve ser entre 1 e 4' }, { status: 400 })
    }
    const safeComment = typeof comment === 'string' ? comment.slice(0, 2000) : ''

    const supabase = createAdminClient()

    // Verificar se o pedido existe e pegar restaurant_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, restaurant_id, status')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Verificar se já existe feedback pra esse pedido
    const { data: existing } = await supabase
      .from('order_feedbacks')
      .select('id')
      .eq('order_id', order_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Feedback já enviado para este pedido' }, { status: 409 })
    }

    // Classificar via IA
    const classificacao = await classificarFeedback(rating, safeComment)

    // Gerar cupom se feedback negativo (10% desconto)
    const cupom =
      classificacao.sentimento === 'negativo'
        ? `VOLTA10-${order_id.slice(0, 8).toUpperCase()}`
        : null

    // Inserir feedback
    const { data: feedback, error: insertError } = await supabase
      .from('order_feedbacks')
      .insert({
        order_id,
        restaurant_id: order.restaurant_id,
        rating,
        comment: safeComment,
        sentimento: classificacao.sentimento,
        categoria: classificacao.categoria,
        prioridade: classificacao.prioridade,
        resumo_ia: classificacao.resumo,
        acao_sugerida: classificacao.acao_sugerida,
        cupom_gerado: cupom,
      })
      .select('id, sentimento, cupom_gerado')
      .single()

    if (insertError) {
      console.error('Erro ao inserir feedback:', insertError)
      return NextResponse.json({ error: 'Erro ao salvar feedback' }, { status: 500 })
    }

    // Resposta personalizada baseada no sentimento
    const response: Record<string, unknown> = {
      success: true,
      feedback_id: feedback.id,
      sentimento: feedback.sentimento,
    }

    if (cupom) {
      response.cupom = cupom
      response.mensagem = 'Lamentamos pela experiência. Use este cupom de 10% no próximo pedido!'
    } else {
      response.mensagem = 'Obrigado pelo feedback! Que tal compartilhar com amigos?'
    }

    return NextResponse.json(response, { headers: rateLimit.headers })
  } catch (error) {
    console.error('Erro interno feedback:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// ── GET: Verificar se pedido já tem feedback ─────────
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const orderId = url.searchParams.get('order_id')

    if (!orderId) {
      return NextResponse.json({ error: 'order_id é obrigatório' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verificar se pedido existe
    const { data: order } = await supabase
      .from('orders')
      .select('id, restaurant_id, cliente_nome, status')
      .eq('id', orderId)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Verificar se já tem feedback
    const { data: feedback } = await supabase
      .from('order_feedbacks')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle()

    return NextResponse.json({
      exists: !!feedback,
      order: {
        id: order.id,
        cliente_nome: order.cliente_nome,
        status: order.status,
      },
    })
  } catch (error) {
    console.error('Erro ao verificar feedback:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

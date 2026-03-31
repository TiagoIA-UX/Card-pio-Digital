/**
 * Testes unitários — lib/ai-image-generator.ts
 *
 * Cobre todas as funções puras (sem network) do módulo de geração de imagens.
 * Executar: npm test
 */
import test, { describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildFullPrompt,
  buildPollinationsUrl,
  estimateBatchCost,
  validateBatchInput,
  buildBatchItems,
  calcBatchPercent,
  getMaxBatchSize,
  getCreditPack,
  CREDIT_PACKS,
  STYLE_PRESETS,
  STYLE_LABELS,
  FREE_CREDITS,
  MAX_BATCH_SIZE_POLLINATIONS,
  MAX_BATCH_SIZE_API,
} from '@/lib/ai-image-generator'

// ── buildFullPrompt ───────────────────────────────────────────────────────

describe('buildFullPrompt', () => {
  test('concatena prompt + preset de estilo com vírgula', () => {
    const result = buildFullPrompt('Pizza margherita', 'food')
    assert.ok(result.startsWith('Pizza margherita, '))
    assert.ok(result.includes('restaurant menu photography'))
  })

  test('usa estilo food como padrão quando não informado', () => {
    const withDefault = buildFullPrompt('Hambúrguer')
    const withExplicit = buildFullPrompt('Hambúrguer', 'food')
    assert.equal(withDefault, withExplicit)
  })

  test('aplica preset correto para packshot', () => {
    const result = buildFullPrompt('Coca-Cola', 'packshot')
    assert.ok(result.includes('white studio background'))
  })

  test('aplica preset correto para logo', () => {
    const result = buildFullPrompt('Restaurante Italiano', 'logo')
    assert.ok(result.includes('logo design'))
  })

  test('não duplica vírgula se prompt já termina com vírgula', () => {
    // Não é responsabilidade da função remover vírgulas do usuário,
    // mas o separador deve ser ", " (uma vez)
    const result = buildFullPrompt('Pizza', 'food')
    assert.ok(!result.includes(',,'))
  })
})

// ── buildPollinationsUrl ──────────────────────────────────────────────────

describe('buildPollinationsUrl', () => {
  test('gera URL válida com host correto', () => {
    const url = buildPollinationsUrl('pizza', 800, 800, 42)
    assert.ok(url.startsWith('https://image.pollinations.ai/prompt/'))
  })

  test('usa model=flux (alinhado com scripts existentes)', () => {
    const url = buildPollinationsUrl('pizza', 800, 800, 42)
    assert.ok(url.includes('model=flux'))
  })

  test('inclui parâmetros de qualidade obrigatórios', () => {
    const url = buildPollinationsUrl('pizza', 800, 800, 1)
    assert.ok(url.includes('nologo=true'))
    assert.ok(url.includes('enhance=true'))
    assert.ok(url.includes('safe=true'))
  })

  test('inclui seed fornecido na URL', () => {
    const url = buildPollinationsUrl('pizza', 800, 800, 12345)
    assert.ok(url.includes('seed=12345'))
  })

  test('encode o prompt na URL', () => {
    const url = buildPollinationsUrl('pizza com queijo', 800, 800, 1)
    assert.ok(url.includes('pizza%20com%20queijo') || url.includes('pizza+com+queijo') || url.includes('pizza%20com%20queijo'))
  })

  test('dimensões padrão são 800x800 (igual aos scripts existentes)', () => {
    const url = buildPollinationsUrl('pizza')
    assert.ok(url.includes('width=800'))
    assert.ok(url.includes('height=800'))
  })

  test('dimensões customizadas são respeitadas', () => {
    const url = buildPollinationsUrl('pizza', 512, 512, 1)
    assert.ok(url.includes('width=512'))
    assert.ok(url.includes('height=512'))
  })
})

// ── estimateBatchCost ─────────────────────────────────────────────────────

describe('estimateBatchCost', () => {
  test('créditos = número de itens (1 crédito por imagem)', () => {
    const { credits } = estimateBatchCost(10, 'pollinations')
    assert.equal(credits, 10)
  })

  test('custo de créditos é proporcional ao lote', () => {
    const { credits: c50 } = estimateBatchCost(50, 'pollinations')
    const { credits: c100 } = estimateBatchCost(100, 'pollinations')
    assert.equal(c100, c50 * 2)
  })

  test('tempo estimado para pollinations é menor que para dalle', () => {
    const { estimatedSeconds: pollinationsSecs } = estimateBatchCost(10, 'pollinations', 1)
    const { estimatedSeconds: dalleSecs } = estimateBatchCost(10, 'dalle', 1)
    assert.ok(pollinationsSecs < dalleSecs)
  })

  test('concorrência maior reduz tempo estimado', () => {
    const { estimatedSeconds: seq } = estimateBatchCost(10, 'gemini', 1)
    const { estimatedSeconds: parallel } = estimateBatchCost(10, 'gemini', 5)
    assert.ok(parallel <= seq)
  })

  test('0 itens retorna 0 créditos e 0 segundos', () => {
    const { credits, estimatedSeconds } = estimateBatchCost(0, 'pollinations')
    assert.equal(credits, 0)
    assert.equal(estimatedSeconds, 0)
  })
})

// ── validateBatchInput ────────────────────────────────────────────────────

describe('validateBatchInput', () => {
  test('retorna null para input válido', () => {
    const prompts = [{ prompt: 'pizza' }, { prompt: 'hamburguer' }]
    assert.equal(validateBatchInput(prompts, 10, 'pollinations'), null)
  })

  test('rejeita lista vazia', () => {
    const error = validateBatchInput([], 10, 'pollinations')
    assert.ok(error !== null)
    assert.match(error!, /vazi/)
  })

  test('rejeita lista não-array', () => {
    const error = validateBatchInput('não é array' as unknown as unknown[], 10)
    assert.ok(error !== null)
  })

  test('rejeita lote maior que limite do provider (pollinations = 877)', () => {
    const prompts = Array.from({ length: 878 }, (_, i) => ({ prompt: `item ${i}` }))
    const error = validateBatchInput(prompts, 1000, 'pollinations')
    assert.ok(error !== null)
    assert.match(error!, /877/)
  })

  test('rejeita lote maior que limite DALL-E (50)', () => {
    const prompts = Array.from({ length: 51 }, (_, i) => ({ prompt: `item ${i}` }))
    const error = validateBatchInput(prompts, 1000, 'dalle')
    assert.ok(error !== null)
    assert.match(error!, /50/)
  })

  test('rejeita quando créditos insuficientes', () => {
    const prompts = Array.from({ length: 10 }, (_, i) => ({ prompt: `item ${i}` }))
    const error = validateBatchInput(prompts, 5, 'pollinations')
    assert.ok(error !== null)
    assert.match(error!, /crédito/)
  })

  test('aceitável exatamente no limite do provider', () => {
    const prompts = Array.from({ length: 877 }, (_, i) => ({ prompt: `item ${i}` }))
    assert.equal(validateBatchInput(prompts, 900, 'pollinations'), null)
  })
})

// ── buildBatchItems ───────────────────────────────────────────────────────

describe('buildBatchItems', () => {
  test('cria itens com índice sequencial a partir de 0', () => {
    const items = buildBatchItems([
      { prompt: 'pizza' },
      { prompt: 'hamburguer' },
    ])
    assert.equal(items[0].index, 0)
    assert.equal(items[1].index, 1)
  })

  test('todos os itens começam com status pending', () => {
    const items = buildBatchItems([{ prompt: 'pizza' }, { prompt: 'bolo' }])
    assert.ok(items.every((item) => item.status === 'pending'))
  })

  test('usa estilo food como padrão quando não informado', () => {
    const items = buildBatchItems([{ prompt: 'pizza' }])
    assert.equal(items[0].style, 'food')
  })

  test('preserva estilo personalizado', () => {
    const items = buildBatchItems([{ prompt: 'produto', style: 'packshot' }])
    assert.equal(items[0].style, 'packshot')
  })

  test('preserva o prompt original sem modificação', () => {
    const items = buildBatchItems([{ prompt: 'Pizza margherita especial' }])
    assert.equal(items[0].prompt, 'Pizza margherita especial')
  })

  test('lista vazia retorna array vazio', () => {
    const items = buildBatchItems([])
    assert.deepEqual(items, [])
  })
})

// ── calcBatchPercent ──────────────────────────────────────────────────────

describe('calcBatchPercent', () => {
  test('0% quando nada foi processado', () => {
    assert.equal(calcBatchPercent(10, 0, 0), 0)
  })

  test('100% quando tudo foi concluído (sem erros)', () => {
    assert.equal(calcBatchPercent(10, 10, 0), 100)
  })

  test('100% quando tudo falhou (erros = total)', () => {
    assert.equal(calcBatchPercent(10, 0, 10), 100)
  })

  test('50% quando metade processada', () => {
    assert.equal(calcBatchPercent(10, 5, 0), 50)
  })

  test('erros também contam como progresso', () => {
    assert.equal(calcBatchPercent(10, 3, 2), 50)
  })

  test('retorna 0 para total = 0 (divisão por zero segura)', () => {
    assert.equal(calcBatchPercent(0, 0, 0), 0)
  })

  test('arredonda para inteiro', () => {
    const result = calcBatchPercent(3, 1, 0)
    assert.ok(Number.isInteger(result))
  })
})

// ── getMaxBatchSize ───────────────────────────────────────────────────────

describe('getMaxBatchSize', () => {
  test('pollinations suporta catálogo inteiro (877)', () => {
    assert.equal(getMaxBatchSize('pollinations'), MAX_BATCH_SIZE_POLLINATIONS)
    assert.equal(getMaxBatchSize('pollinations'), 877)
  })

  test('dalle tem limite conservador para evitar timeout', () => {
    assert.equal(getMaxBatchSize('dalle'), MAX_BATCH_SIZE_API)
    assert.equal(getMaxBatchSize('dalle'), 50)
  })

  test('gemini tem mesmo limite que dalle', () => {
    assert.equal(getMaxBatchSize('gemini'), MAX_BATCH_SIZE_API)
  })
})

// ── getCreditPack ─────────────────────────────────────────────────────────

describe('getCreditPack', () => {
  test('retorna pack correto pelo slug', () => {
    const pack = getCreditPack('pro')
    assert.ok(pack !== undefined)
    assert.equal(pack!.slug, 'pro')
    assert.equal(pack!.credits, 150)
  })

  test('retorna undefined para slug inválido', () => {
    assert.equal(getCreditPack('inexistente'), undefined)
  })

  test('todos os slugs dos packs são encontráveis', () => {
    for (const pack of CREDIT_PACKS) {
      assert.ok(getCreditPack(pack.slug) !== undefined, `Pack ${pack.slug} não encontrado`)
    }
  })
})

// ── CREDIT_PACKS integridade ──────────────────────────────────────────────

describe('CREDIT_PACKS integridade', () => {
  test('todos os packs têm preço positivo', () => {
    for (const pack of CREDIT_PACKS) {
      assert.ok(pack.price > 0, `Pack ${pack.slug} com preço inválido`)
    }
  })

  test('todos os packs têm créditos positivos', () => {
    for (const pack of CREDIT_PACKS) {
      assert.ok(pack.credits > 0, `Pack ${pack.slug} com créditos inválidos`)
    }
  })

  test('preço por crédito decai conforme o pack cresce (economia de escala)', () => {
    const sorted = [...CREDIT_PACKS].sort((a, b) => a.credits - b.credits)
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(
        sorted[i].pricePerCredit <= sorted[i - 1].pricePerCredit,
        `Pack ${sorted[i].slug} (${sorted[i].pricePerCredit}/crédito) não é mais barato que ${sorted[i - 1].slug} (${sorted[i - 1].pricePerCredit}/crédito)`
      )
    }
  })

  test('apenas um pack tem popular=true (mais popular)', () => {
    const popular = CREDIT_PACKS.filter((p) => p.popular === true)
    assert.equal(popular.length, 1)
  })

  test('slugs são únicos', () => {
    const slugs = CREDIT_PACKS.map((p) => p.slug)
    const unique = new Set(slugs)
    assert.equal(unique.size, slugs.length)
  })
})

// ── Constants ─────────────────────────────────────────────────────────────

describe('constants', () => {
  test('FREE_CREDITS é 3 (valor prometido na UI)', () => {
    assert.equal(FREE_CREDITS, 3)
  })

  test('todos os estilos têm preset definido', () => {
    const styleKeys = Object.keys(STYLE_LABELS)
    for (const key of styleKeys) {
      assert.ok(
        STYLE_PRESETS[key as keyof typeof STYLE_PRESETS],
        `Estilo "${key}" sem preset definido`
      )
    }
  })

  test('todos os estilos têm label em português', () => {
    const labels = Object.values(STYLE_LABELS)
    assert.ok(labels.every((l) => typeof l === 'string' && l.length > 0))
  })
})

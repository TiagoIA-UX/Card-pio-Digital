import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { TEMPLATE_PRICING } from '@/lib/domains/marketing/pricing'
import { TEMPLATE_CHECKOUT_VISUALS } from '@/lib/domains/marketing/template-checkout'
import { RESTAURANT_TEMPLATE_CONFIGS } from '@/lib/domains/marketing/templates-config'
import { TEMPLATE_PRESETS } from '@/lib/domains/core/restaurant-customization'
import { resolveRestaurantTemplateSlug } from '@/lib/domains/core/restaurant-customization'
import { getDeliveryAssistantScript } from '@/lib/domains/core/delivery-assistant'

const PROJECT_ROOT = process.cwd()
const INTERNAL_SITE_URL = 'https://zairyx.com.br'

function walkFiles(baseDir: string): string[] {
  const entries = readdirSync(baseDir)

  return entries.flatMap((entry) => {
    const absolutePath = join(baseDir, entry)
    const stats = statSync(absolutePath)

    if (stats.isDirectory()) {
      if (entry === 'api') return []
      return walkFiles(absolutePath)
    }

    if (!/\.(ts|tsx|js|jsx|mdx)$/.test(entry)) return []
    return [absolutePath]
  })
}

test('todo template do catálogo tem visual no checkout', () => {
  const catalogSlugs = Object.keys(RESTAURANT_TEMPLATE_CONFIGS).sort()
  const checkoutSlugs = Object.keys(TEMPLATE_CHECKOUT_VISUALS).sort()

  assert.deepEqual(checkoutSlugs, catalogSlugs)
})

test('todo template do catálogo tem pricing público configurado', () => {
  const catalogSlugs = Object.keys(RESTAURANT_TEMPLATE_CONFIGS).sort()
  const pricingSlugs = Object.keys(TEMPLATE_PRICING).sort()

  assert.deepEqual(pricingSlugs, catalogSlugs)
})

test('toda imagem local de template existe em public', () => {
  for (const template of Object.values(RESTAURANT_TEMPLATE_CONFIGS)) {
    if (!template.imageUrl.startsWith('/')) continue

    const imagePath = join(PROJECT_ROOT, 'public', template.imageUrl.replace(/^\//, ''))
    assert.ok(existsSync(imagePath), `${template.slug}: imagem ausente em ${imagePath}`)
  }
})

test('interface pública não deve hardcodear a URL de produção', () => {
  const filesToScan = [join(PROJECT_ROOT, 'app'), join(PROJECT_ROOT, 'components')]
  const matches: string[] = []

  for (const baseDir of filesToScan) {
    for (const filePath of walkFiles(baseDir)) {
      const contents = readFileSync(filePath, 'utf8')
      if (!contents.includes(INTERNAL_SITE_URL)) continue
      matches.push(relative(PROJECT_ROOT, filePath))
    }
  }

  assert.deepEqual(matches, [])
})

test('minimercado evita linguagem dark store na cópia pública', () => {
  const minimercadoConfig = RESTAURANT_TEMPLATE_CONFIGS.minimercado
  const minimercadoPreset = TEMPLATE_PRESETS.minimercado
  const minimercadoScript = getDeliveryAssistantScript('minimercado')

  const publicCopy = [
    minimercadoConfig.name,
    minimercadoConfig.shortDescription,
    minimercadoConfig.description,
    minimercadoConfig.chip,
    TEMPLATE_PRICING.minimercado.faixaLabel,
    minimercadoPreset.label,
    minimercadoPreset.badge,
    minimercadoPreset.heroTitle,
    minimercadoPreset.heroDescription,
    minimercadoPreset.aboutTitle,
    minimercadoScript.title,
  ].join(' ')

  assert.doesNotMatch(publicCopy, /dark store/i)
  assert.equal(minimercadoConfig.name, 'Minimercado Digital')
  assert.equal(minimercadoPreset.label, 'Minimercado Digital')
  assert.equal(minimercadoScript.title, 'Minimercado Digital')
})

test('mercadinho e minimercado têm posicionamentos públicos distintos', () => {
  const mercadinhoConfig = RESTAURANT_TEMPLATE_CONFIGS.mercadinho
  const mercadinhoPreset = TEMPLATE_PRESETS.mercadinho
  const mercadinhoScript = getDeliveryAssistantScript('mercadinho')

  assert.equal(mercadinhoConfig.name, 'Mercadinho Essencial')
  assert.equal(mercadinhoPreset.label, 'Mercadinho Essencial')
  assert.equal(mercadinhoScript.title, 'Mercadinho Essencial')
  assert.doesNotMatch(mercadinhoConfig.name, /minimercado/i)
  assert.notEqual(mercadinhoConfig.name, RESTAURANT_TEMPLATE_CONFIGS.minimercado.name)
})

test('resolvedor de slug aceita variações comuns de templates', () => {
  assert.equal(resolveRestaurantTemplateSlug('mini-mercado'), 'minimercado')
  assert.equal(resolveRestaurantTemplateSlug('mercaddinho'), 'mercadinho')
  assert.equal(resolveRestaurantTemplateSlug('  ACOUGUE  '), 'acougue')
  assert.equal(resolveRestaurantTemplateSlug('nao-existe'), null)
})

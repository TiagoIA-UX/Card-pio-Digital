import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { getCategoryFallbackImage, getRestaurantTemplateConfig, type TemplateSampleProduct } from '../lib/domains/marketing/templates-config'
import { getTemplateProductImageKey, resolveTemplateProductImage, type TemplateProductImageSource } from '../lib/domains/image/template-product-images'

type AuditEntry = {
  key: string
  nome: string
  categoria: string
  ordem: number
  url: string
  source: TemplateProductImageSource
}

type Signature = {
  contentHash: string
  perceptualHash: string
  width: number | null
  height: number | null
  format: string | null
  bytes: number
}

type UrlDiagnostic =
  | ({ normalizedUrl: string; downloadError?: undefined } & Signature)
  | {
      normalizedUrl: string
      downloadError: string
      contentHash?: undefined
      perceptualHash?: undefined
      width?: undefined
      height?: undefined
      format?: undefined
      bytes?: undefined
    }

const ROOT = process.cwd()
const args = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, ...rest] = arg.slice(2).split('=')
      return [key, rest.length ? rest.join('=') : true]
    })
)

const TEMPLATE = String(args.template || 'minimercado').trim().toLowerCase()
const NEAR_THRESHOLD = Math.max(0, Number(args['near-threshold'] || 6))
const REPORT_DIR = path.join(ROOT, 'private', 'image-audits')
const REPORT_JSON = path.join(REPORT_DIR, `${TEMPLATE}-image-audit.json`)
const REPORT_MD = path.join(REPORT_DIR, `${TEMPLATE}-image-audit.md`)

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function tokenize(value: string) {
  const stopwords = new Set([
    'de',
    'da',
    'do',
    'das',
    'dos',
    'com',
    'sem',
    'para',
    'kg',
    'g',
    'ml',
    'l',
    'un',
    'und',
    'tipo',
    'tradicional',
  ])

  return normalizeText(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3 && !stopwords.has(token))
}

function stripUrlNoise(url: string) {
  try {
    const parsed = new URL(url)
    return `${parsed.origin}${parsed.pathname}`
  } catch {
    return url
  }
}

async function downloadBuffer(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem: ${response.status} ${response.statusText}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

async function getImageSignature(buffer: Buffer): Promise<Signature> {
  const image = sharp(buffer, { failOn: 'none' })
  const metadata = await image.metadata()
  const resized = await image.resize(8, 8, { fit: 'fill' }).grayscale().raw().toBuffer()
  const average = resized.reduce((sum, value) => sum + value, 0) / resized.length
  const perceptualHash = Array.from(resized, (value) => (value >= average ? '1' : '0')).join('')

  return {
    contentHash: crypto.createHash('sha256').update(buffer).digest('hex'),
    perceptualHash,
    width: metadata.width || null,
    height: metadata.height || null,
    format: metadata.format || null,
    bytes: buffer.length,
  }
}

function hammingDistance(left: string, right: string) {
  if (left.length !== right.length) return Number.POSITIVE_INFINITY
  let distance = 0
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) distance += 1
  }
  return distance
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>()
  for (const item of items) {
    const key = getKey(item)
    const bucket = grouped.get(key)
    if (bucket) bucket.push(item)
    else grouped.set(key, [item])
  }
  return grouped
}

function buildSuspicionLevel(group: Array<AuditEntry & Signature & { normalizedUrl: string }>) {
  const categories = new Set(group.map((entry) => entry.categoria))
  const tokenSets = group.map((entry) => new Set(tokenize(entry.nome)))
  const sharedTokens = tokenSets.length
    ? [...tokenSets[0]].filter((token) => tokenSets.every((set) => set.has(token)))
    : []

  if (categories.size >= 3 && sharedTokens.length === 0) return 'alta'
  if (categories.size >= 2 && sharedTokens.length === 0) return 'media'
  if (group.length >= 5) return 'media'
  return 'baixa'
}

function toEntryPreview(entry: AuditEntry & Signature & { normalizedUrl: string }) {
  return {
    key: entry.key,
    categoria: entry.categoria,
    nome: entry.nome,
    url: entry.url,
    source: entry.source,
  }
}

function resolveEntry(templateSlug: string, fallbackTemplateImageUrl: string, product: TemplateSampleProduct): AuditEntry {
  const key = getTemplateProductImageKey(templateSlug, product)
  const resolvedImage = resolveTemplateProductImage({
    templateSlug,
    product,
    fallbackTemplateImageUrl,
  })

  return {
    key,
    nome: product.nome,
    categoria: product.categoria,
    ordem: product.ordem,
    url: resolvedImage.url,
    source: resolvedImage.source,
  }
}

async function main() {
  const template = getRestaurantTemplateConfig(TEMPLATE)
  const entries = template.sampleProducts.map((product) =>
    resolveEntry(template.slug, template.imageUrl, product)
  )

  const uniqueUrls = [...new Set(entries.map((entry) => entry.url))]
  const diagnostics = new Map<string, UrlDiagnostic>()

  for (const url of uniqueUrls) {
    try {
      const buffer = await downloadBuffer(url)
      diagnostics.set(url, {
        normalizedUrl: stripUrlNoise(url),
        ...(await getImageSignature(buffer)),
      })
    } catch (error) {
      diagnostics.set(url, {
        normalizedUrl: stripUrlNoise(url),
        downloadError: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const enrichedEntries = entries.map((entry) => ({ ...entry, ...diagnostics.get(entry.url)! }))
  const validEntries = enrichedEntries.filter(
    (entry): entry is AuditEntry & Signature & { normalizedUrl: string } => !entry.downloadError
  )
  const brokenEntries = enrichedEntries.filter((entry) => entry.downloadError)

  const duplicateByUrl = [...groupBy(enrichedEntries, (entry) => entry.normalizedUrl).values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      type: 'url',
      suspicion: buildSuspicionLevel(group.filter((entry): entry is AuditEntry & Signature & { normalizedUrl: string } => !entry.downloadError)),
      count: group.length,
      categories: [...new Set(group.map((entry) => entry.categoria))],
      sources: [...new Set(group.map((entry) => entry.source))],
      entries: group.map((entry) => ({
        key: entry.key,
        categoria: entry.categoria,
        nome: entry.nome,
        url: entry.url,
        source: entry.source,
        downloadError: entry.downloadError,
      })),
    }))

  const duplicateByContent = [...groupBy(validEntries, (entry) => entry.contentHash).values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      type: 'content',
      suspicion: buildSuspicionLevel(group),
      count: group.length,
      categories: [...new Set(group.map((entry) => entry.categoria))],
      sources: [...new Set(group.map((entry) => entry.source))],
      entries: group.map(toEntryPreview),
    }))

  const uniqueImages = [...groupBy(validEntries, (entry) => entry.contentHash).values()].map(
    (group) => group[0]
  )

  const nearDuplicatePairs = [] as Array<{
    suspicion: string
    distance: number
    left: { url: string; entries: ReturnType<typeof toEntryPreview>[] }
    right: { url: string; entries: ReturnType<typeof toEntryPreview>[] }
  }>

  for (let leftIndex = 0; leftIndex < uniqueImages.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < uniqueImages.length; rightIndex += 1) {
      const left = uniqueImages[leftIndex]
      const right = uniqueImages[rightIndex]
      const distance = hammingDistance(left.perceptualHash, right.perceptualHash)
      if (distance > NEAR_THRESHOLD) continue

      const leftGroup = validEntries.filter((entry) => entry.contentHash === left.contentHash)
      const rightGroup = validEntries.filter((entry) => entry.contentHash === right.contentHash)
      const merged = [...leftGroup, ...rightGroup]

      nearDuplicatePairs.push({
        suspicion: buildSuspicionLevel(merged),
        distance,
        left: { url: left.url, entries: leftGroup.map(toEntryPreview) },
        right: { url: right.url, entries: rightGroup.map(toEntryPreview) },
      })
    }
  }

  nearDuplicatePairs.sort((left, right) => left.distance - right.distance)

  const sourceBreakdown = Object.entries(
    enrichedEntries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + 1
      return acc
    }, {})
  )
    .sort((left, right) => right[1] - left[1])
    .map(([source, count]) => ({ source, count }))

  const suspiciousGroups = [...duplicateByUrl, ...duplicateByContent].filter(
    (group) => group.suspicion !== 'baixa'
  )

  const summary = {
    template: TEMPLATE,
    generatedAt: new Date().toISOString(),
    totalMappedProducts: enrichedEntries.length,
    uniqueImageUrls: uniqueUrls.length,
    brokenImageUrls: [...new Set(brokenEntries.map((entry) => entry.url))].length,
    exactDuplicateGroupsByUrl: duplicateByUrl.length,
    exactDuplicateGroupsByContent: duplicateByContent.length,
    nearDuplicatePairs: nearDuplicatePairs.length,
    suspiciousGroups: suspiciousGroups.length,
    sourceBreakdown,
    thresholds: {
      nearDuplicateHammingDistance: NEAR_THRESHOLD,
    },
  }

  const report = {
    summary,
    suspiciousGroups,
    brokenEntries: brokenEntries.map((entry) => ({
      key: entry.key,
      categoria: entry.categoria,
      nome: entry.nome,
      url: entry.url,
      source: entry.source,
      downloadError: entry.downloadError,
    })),
    duplicateByUrl,
    duplicateByContent,
    nearDuplicatePairs: nearDuplicatePairs.slice(0, 200),
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true })
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2))

  const markdown = [
    `# Auditoria de imagens: ${TEMPLATE}`,
    '',
    `- Produtos mapeados: ${summary.totalMappedProducts}`,
    `- URLs unicas renderizadas: ${summary.uniqueImageUrls}`,
    `- URLs quebradas: ${summary.brokenImageUrls}`,
    `- Grupos duplicados por URL: ${summary.exactDuplicateGroupsByUrl}`,
    `- Grupos duplicados por conteudo: ${summary.exactDuplicateGroupsByContent}`,
    `- Pares visualmente parecidos: ${summary.nearDuplicatePairs}`,
    `- Grupos suspeitos: ${summary.suspiciousGroups}`,
    '',
    '## Origem das imagens',
    '',
    ...summary.sourceBreakdown.map((item) => `- ${item.source}: ${item.count}`),
    '',
    '## Grupos suspeitos',
    '',
    ...(suspiciousGroups.length === 0
      ? ['Nenhum grupo suspeito encontrado.']
      : suspiciousGroups.slice(0, 50).flatMap((group, index) => [
          `### ${index + 1}. ${group.type.toUpperCase()} | suspeicao ${group.suspicion} | ${group.count} usos`,
          '',
          `Categorias: ${group.categories.join(', ')}`,
          `Origens: ${group.sources.join(', ')}`,
          '',
          ...group.entries.slice(0, 12).map(
            (entry) => `- ${entry.categoria} -> ${entry.nome} | ${entry.source} | ${entry.url}`
          ),
          '',
        ])),
    '## URLs quebradas',
    '',
    ...(brokenEntries.length === 0
      ? ['Nenhuma URL quebrada encontrada.']
      : brokenEntries.slice(0, 50).map(
          (entry) => `- ${entry.categoria} -> ${entry.nome} | ${entry.url} | ${entry.downloadError}`
        )),
  ].join('\n')

  fs.writeFileSync(REPORT_MD, markdown)

  console.log(`Auditoria concluida para ${TEMPLATE}.`)
  console.log(`Produtos mapeados: ${summary.totalMappedProducts}`)
  console.log(`URLs unicas renderizadas: ${summary.uniqueImageUrls}`)
  console.log(`URLs quebradas: ${summary.brokenImageUrls}`)
  console.log(`Grupos duplicados por URL: ${summary.exactDuplicateGroupsByUrl}`)
  console.log(`Grupos duplicados por conteudo: ${summary.exactDuplicateGroupsByContent}`)
  console.log(`Pares visualmente parecidos: ${summary.nearDuplicatePairs}`)
  console.log(`Grupos suspeitos: ${summary.suspiciousGroups}`)
  console.log(`Origem das imagens: ${summary.sourceBreakdown.map((item) => `${item.source}=${item.count}`).join(', ')}`)
  console.log(`Relatorio JSON: ${REPORT_JSON}`)
  console.log(`Relatorio Markdown: ${REPORT_MD}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
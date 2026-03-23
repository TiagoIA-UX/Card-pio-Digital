#!/usr/bin/env npx tsx
/**
 * Gera um conjunto consistente de imagens individuais para TODOS os produtos
 * dos templates, fazendo download (da imagem própria do produto ou fallback por categoria)
 * e re-upload no R2.
 *
 * Objetivo:
 * - Hoje o software usa `imagem_url` do produto; se faltar, cai em fallback por categoria.
 * - Com este script, cada produto passa a ter uma imagem própria (mesmo que o conteúdo
 *   seja o fallback da categoria, agora como asset individual no R2).
 *
 * Requer:
 * - Credenciais R2 definidas via .env.local (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL, etc)
 * - O app já contém `lib/r2.ts` (S3 compatível).
 *
 * Uso:
 *   npm run doctor (opcional) + npx tsx scripts/generate-template-product-images.ts
 *
 * Opções:
 *   --dry-run              Não faz upload; só valida download e monta o mapa.
 *   --no-skip-existing    Reupload mesmo se já existir no `lib/generated-template-product-images.ts`.
 *   --limit N             Gera apenas N jobs (para testes).
 *   --concurrency N      Quantidade de uploads/downloads simultâneos (default: 3).
 */

import { writeFileSync } from 'node:fs'
import path from 'node:path'

import { uploadFile, R2_FOLDERS } from '../lib/r2'
import { RESTAURANT_TEMPLATE_CONFIGS, getCategoryFallbackImage } from '../lib/templates-config'
import { getTemplateProductImageKey } from '../lib/template-product-images'
import { TEMPLATE_PRODUCT_IMAGE_URLS } from '../lib/generated-template-product-images'

type Job = {
  key: string
  templateSlug: string
  sourceUrl: string
  existingUrl?: string
}

function getArgValue(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0) return process.argv[idx + 1]

  // suporte `--name=value`
  const withEq = process.argv.find((v) => v.startsWith(`--${name}=`))
  if (!withEq) return undefined
  return withEq.split('=')[1]
}

function getFlag(name: string) {
  return process.argv.includes(`--${name}`)
}

function resolveMimeType(contentType: string | null): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  const normalized = (contentType ?? '').toLowerCase()
  if (normalized.includes('image/png')) return 'image/png'
  if (normalized.includes('image/jpeg')) return 'image/jpeg'
  if (normalized.includes('image/webp')) return 'image/webp'
  return null
}

async function asyncPool<T, R>(
  limit: number,
  items: T[],
  iteratorFn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (true) {
      const current = nextIndex
      nextIndex += 1
      if (current >= items.length) break
      results[current] = await iteratorFn(items[current], current)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

async function main() {
  const dryRun = getFlag('dry-run')
  const skipExisting = !getFlag('no-skip-existing')

  const limitRaw = getArgValue('limit')
  const limit = limitRaw ? Number(limitRaw) : undefined

  const concurrencyRaw = getArgValue('concurrency')
  const concurrency = concurrencyRaw ? Math.max(1, Number(concurrencyRaw)) : 3

  const templates = Object.values(RESTAURANT_TEMPLATE_CONFIGS)

  const jobs: Job[] = []
  for (const template of templates) {
    for (const product of template.sampleProducts) {
      const key = getTemplateProductImageKey(template.slug, product)
      const existingUrl = TEMPLATE_PRODUCT_IMAGE_URLS[key]
      const sourceUrl =
        product.imagem_url ?? getCategoryFallbackImage(product.categoria) ?? template.imageUrl

      if (!sourceUrl) {
        throw new Error(`Sem fonte de imagem para template=${template.slug}, product=${product.nome}`)
      }

      jobs.push({ key, templateSlug: template.slug, sourceUrl, existingUrl })
    }
  }

  const selectedJobs = typeof limit === 'number' ? jobs.slice(0, limit) : jobs

  console.log(`Total jobs: ${jobs.length}`)
  console.log(`Selecionados: ${selectedJobs.length}`)
  console.log(`Modo: ${dryRun ? 'DRY-RUN (sem upload)' : 'UPLOAD real'}`)
  console.log(`skipExisting: ${skipExisting}`)
  console.log(`concurrency: ${concurrency}`)

  const outputMap: Record<string, string> = { ...TEMPLATE_PRODUCT_IMAGE_URLS }

  const results = await asyncPool(concurrency, selectedJobs, async (job, i) => {
    if (skipExisting && job.existingUrl) {
      outputMap[job.key] = job.existingUrl
      console.log(`[${i + 1}/${selectedJobs.length}] já existe: ${job.key}`)
      return job.existingUrl
    }

    console.log(`[${i + 1}/${selectedJobs.length}] baixando: ${job.sourceUrl}`)
    const res = await fetch(job.sourceUrl)
    if (!res.ok) {
      throw new Error(`Falha download (${res.status}) para: ${job.sourceUrl}`)
    }

    const contentType = res.headers.get('content-type')
    let mimeType = resolveMimeType(contentType)

    // Unsplash às vezes pode retornar AVIF/HEIC dependendo do ambiente.
    // Tentamos forçar `format=webp` quando o MIME não for suportado pelo R2.
    if (!mimeType) {
      const altUrl =
        job.sourceUrl.includes('format=webp') || job.sourceUrl.includes('image/webp')
          ? null
          : `${job.sourceUrl}${job.sourceUrl.includes('?') ? '&' : '?'}format=webp`

      if (!altUrl) {
        throw new Error(`MIME não suportado no download: ${contentType}`)
      }

      console.log(`[${i + 1}/${selectedJobs.length}] retry format=webp...`)
      const resAlt = await fetch(altUrl)
      if (!resAlt.ok) {
        throw new Error(`Falha download (retry) (${resAlt.status}) para: ${altUrl}`)
      }

      const altContentType = resAlt.headers.get('content-type')
      mimeType = resolveMimeType(altContentType)
      if (!mimeType) {
        throw new Error(`MIME ainda não suportado após retry: ${altContentType}`)
      }

      const arrayBufferAlt = await resAlt.arrayBuffer()
      const bufferAlt = Buffer.from(arrayBufferAlt)
      if (bufferAlt.byteLength === 0) {
        throw new Error(`Download vazio (retry) para: ${altUrl}`)
      }

      if (dryRun) {
        outputMap[job.key] = job.sourceUrl
        return job.sourceUrl
      }

      console.log(`[${i + 1}/${selectedJobs.length}] upload R2 (${mimeType})...`)
      const folder: (typeof R2_FOLDERS)[number] = 'pratos'
      const result = await uploadFile({
        buffer: bufferAlt,
        mimeType,
        folder,
        ownerId: 'template-product-assets',
      })

      outputMap[job.key] = result.url
      return result.url
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    if (buffer.byteLength === 0) {
      throw new Error(`Download vazio para: ${job.sourceUrl}`)
    }

    if (dryRun) {
      // Em dry-run, mantemos o sourceUrl (não subimos para o R2).
      outputMap[job.key] = job.sourceUrl
      return job.sourceUrl
    }

    console.log(`[${i + 1}/${selectedJobs.length}] upload R2 (${mimeType})...`)
    const folder: (typeof R2_FOLDERS)[number] = 'pratos'
    const result = await uploadFile({
      buffer,
      mimeType,
      folder,
      ownerId: 'template-product-assets',
    })

    outputMap[job.key] = result.url
    return result.url
  })

  void results

  // Ordena chaves para gerar arquivo determinístico
  const ordered: Record<string, string> = {}
  Object.keys(outputMap)
    .sort()
    .forEach((k) => {
      ordered[k] = outputMap[k]
    })

  const outputPath = path.join(process.cwd(), 'lib', 'generated-template-product-images.ts')

  if (dryRun) {
    console.log('Dry-run: não escrevendo arquivo de mapeamento.')
    return
  }

  const fileContent =
    `// AUTO-GENERATED by scripts/generate-template-product-images.ts\n` +
    `// Gere novamente quando houver novos templates/produtos.\n` +
    `// Data: ${new Date().toISOString()}\n\n` +
    `export const TEMPLATE_PRODUCT_IMAGE_URLS: Record<string, string> = ${JSON.stringify(ordered, null, 2)}\n`

  writeFileSync(outputPath, fileContent, 'utf-8')
  console.log(`Mapa atualizado em: ${outputPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


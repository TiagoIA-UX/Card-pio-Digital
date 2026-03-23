/**
 * Gera CSV com prompts otimizados para geração de imagens AI
 * (funciona com DALL-E, Midjourney, Leonardo.ai, Canva AI, Stable Diffusion)
 *
 * Uso: node scripts/generate-image-prompts.js
 * Output: scripts/image-prompts.csv
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const content = fs.readFileSync(path.join(ROOT, 'lib/templates-config.ts'), 'utf-8')

const STYLE =
  'professional food photography, overhead flat lay, white marble background, natural lighting, high resolution, appetizing, commercial quality, no text, no watermark, no people'

const PET_STYLE =
  'professional product photo, white background, studio lighting, high resolution, commercial quality, no text, no watermark'

const TEMPLATE_CONTEXT = {
  restaurante: 'traditional brazilian restaurant dish',
  pizzaria: 'italian pizza, pizzeria',
  lanchonete: 'fast food, snack bar',
  bar: 'bar food, pub snack, brazilian boteco',
  cafeteria: 'cafe bakery food',
  acai: 'brazilian acai bowl smoothie',
  sushi: 'japanese sushi restaurant',
  adega: 'wine shop, wine bottle, drinks',
  mercadinho: 'grocery store product, supermarket',
  padaria: 'bakery, bread, pastry shop',
  sorveteria: 'ice cream shop, gelato',
  acougue: 'butcher shop, fresh meat cut',
  hortifruti: 'fresh produce, fruits and vegetables market',
  petshop: 'pet store',
  doceria: 'confectionery, sweets shop, candy store',
}

// Helper: normalize for filename
function toFilename(nome) {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const blocks = [
  ...content.matchAll(
    /slug:\s*'([^']+)'[\s\S]*?sampleProducts:\s*\[([\s\S]*?)\](?:\s*,\s*\n|\s*\.map)/g
  ),
]

const rows = []

for (const b of blocks) {
  const slug = b[1]
  const block = b[2]
  const prodBlocks = [
    ...block.matchAll(
      /\{[^{}]*?nome:\s*'([^']+)'[^{}]*?categoria:\s*'([^']+)'[^{}]*?ordem:\s*(\d+)[^{}]*?\}/gs
    ),
  ]
  for (const pm of prodBlocks) {
    const nome = pm[1]
    const cat = pm[2]
    const ordem = pm[3]
    const ctx = TEMPLATE_CONTEXT[slug] || 'food product'
    const style = slug === 'petshop' ? PET_STYLE : STYLE
    const prompt = nome + ', ' + ctx + ', ' + style
    const filename = slug + '-' + toFilename(nome) + '.jpg'
    rows.push({ template: slug, categoria: cat, ordem, nome, filename, prompt })
  }
}

// ---- Write CSV ----
const safeCSV = (s) => '"' + String(s).replace(/"/g, '""') + '"'
let csv = 'template,categoria,ordem,nome,filename,prompt\n'
for (const r of rows) {
  csv +=
    [
      safeCSV(r.template),
      safeCSV(r.categoria),
      r.ordem,
      safeCSV(r.nome),
      safeCSV(r.filename),
      safeCSV(r.prompt),
    ].join(',') + '\n'
}
fs.writeFileSync(path.join(ROOT, 'scripts/image-prompts.csv'), csv, 'utf-8')

// ---- Write per-template MD (for manual use in Canva / Midjourney) ----
const byTemplate = {}
for (const r of rows) {
  if (!byTemplate[r.template]) byTemplate[r.template] = []
  byTemplate[r.template].push(r)
}

let md = '# Prompts de Imagem — Todos os Templates\n\n'
md += '**Uso:** Cole cada prompt em DALL-E 3, Leonardo.ai, Midjourney ou Canva AI.\n\n'
md +=
  '**Estilo base:** Professional food photography, overhead flat lay, white marble background, natural lighting\n\n'
md += '---\n\n'

for (const [tmpl, prods] of Object.entries(byTemplate)) {
  md += '## ' + tmpl.toUpperCase() + ' (' + prods.length + ' imagens)\n\n'
  md += '| # | Produto | Arquivo | Prompt |\n'
  md += '|---|---------|---------|--------|\n'
  for (const p of prods) {
    md += '| ' + p.ordem + ' | ' + p.nome + ' | `' + p.filename + '` | ' + p.prompt + ' |\n'
  }
  md += '\n'
}
fs.writeFileSync(path.join(ROOT, 'scripts/image-prompts.md'), md, 'utf-8')

console.log('Gerado: scripts/image-prompts.csv (' + rows.length + ' produtos)')
console.log('Gerado: scripts/image-prompts.md')
console.log('\nPrimeiros 3 prompts de exemplo:')
rows.slice(0, 3).forEach((r) => {
  console.log('  [' + r.template + '] ' + r.nome + ':')
  console.log('    ' + r.prompt)
})

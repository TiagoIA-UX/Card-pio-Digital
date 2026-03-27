/**
 * Após gerar as imagens com generate-images-dalle.js,
 * este script atualiza lib/generated-template-product-images.ts
 * para usar os caminhos locais em /public/template-images/
 *
 * USO: node scripts/update-image-map-local.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const CSV_PATH = path.join(ROOT, 'scripts', 'image-prompts.csv')
const OUTPUT_DIR = path.join(ROOT, 'public', 'template-images')
const GEN_FILE = path.join(ROOT, 'lib', 'generated-template-product-images.ts')
const CURRENT_GEN = fs.readFileSync(GEN_FILE, 'utf-8')

// Parse CSV
const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
const lines = csvContent.trim().split('\n').slice(1)

const products = lines.map((line) => {
  const cols = []
  let cur = '',
    inQuote = false
  for (const ch of line) {
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      cols.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  cols.push(cur)
  return { template: cols[0], categoria: cols[1], ordem: cols[2], nome: cols[3], filename: cols[4] }
})

// Build key map (reuse same key logic as generate-template-images.js)
function normalizeKeyPart(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

let updated = 0
let missing = 0
let currentMap = {}

// Parse existing map
const mapMatch = CURRENT_GEN.match(/=\s*(\{[\s\S]+\})\s*;?\s*$/)
if (mapMatch) {
  try {
    currentMap = JSON.parse(mapMatch[1])
  } catch (e) {}
}

for (const p of products) {
  const imgPath = path.join(OUTPUT_DIR, p.filename)
  if (!fs.existsSync(imgPath)) {
    missing++
    continue
  }
  const key =
    normalizeKeyPart(p.template) +
    '::' +
    normalizeKeyPart(p.categoria) +
    '::' +
    p.ordem +
    '::' +
    normalizeKeyPart(p.nome)
  currentMap[key] = '/template-images/' + p.filename
  updated++
}

// Write updated file
const sorted = Object.fromEntries(Object.entries(currentMap).sort(([a], [b]) => a.localeCompare(b)))
const output =
  '// AUTO-GENERATED — DO NOT EDIT MANUALLY\n' +
  '// Generated from scripts/image-prompts.csv + local image files\n' +
  '// Last updated: ' +
  new Date().toISOString() +
  '\n\n' +
  'export const TEMPLATE_PRODUCT_IMAGE_URLS: Record<string, string> =\n' +
  JSON.stringify(sorted, null, 2) +
  ';\n'

fs.writeFileSync(GEN_FILE, output, 'utf-8')

console.log('Atualizado: ' + GEN_FILE)
console.log('  Entradas atualizadas com caminho local:', updated)
console.log('  Imagens ainda não geradas (manteve Pexels):', missing)

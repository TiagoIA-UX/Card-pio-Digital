/**
 * Verifica qualidade do arquivo generated-template-product-images.ts
 */
const fs = require('fs')
const content = fs.readFileSync('lib/generated-template-product-images.ts', 'utf-8')

// Parse the JSON object
const match = content.match(/=\s*(\{[\s\S]+\})/)
if (!match) {
  console.log('ERROR: Could not parse')
  process.exit(1)
}
const map = JSON.parse(match[1])
const keys = Object.keys(map)
console.log('Total entries:', keys.length)

// Check per-template uniqueness
const byTemplate = {}
for (const [key, url] of Object.entries(map)) {
  const slug = key.split('::')[0]
  if (!byTemplate[slug]) byTemplate[slug] = { urls: new Set(), keys: [] }
  byTemplate[slug].keys.push(key)
  if (byTemplate[slug].urls.has(url)) {
    console.log('DUPLICATE in', slug, ':', key)
  }
  byTemplate[slug].urls.add(url)
}

console.log('\nPer-template stats:')
let totalDupes = 0
for (const [slug, data] of Object.entries(byTemplate).sort()) {
  const dupeCount = data.keys.length - data.urls.size
  if (dupeCount > 0) totalDupes += dupeCount
  console.log(
    `  ${slug}: ${data.keys.length} products, ${data.urls.size} unique URLs${dupeCount > 0 ? ' (' + dupeCount + ' DUPLICATES!)' : ' ✓'}`
  )
}
console.log('\nTotal duplicates within templates:', totalDupes)
console.log(
  'Status:',
  totalDupes === 0 ? 'PERFEITO - todas imagens únicas por template!' : 'ATENÇÃO - há duplicatas!'
)

const fs = require('fs');
const content = fs.readFileSync('lib/templates-config.ts', 'utf-8');
const genContent = fs.readFileSync('lib/generated-template-product-images.ts', 'utf-8');

const existingKeys = new Set();
const keyRegex = /"([^"]+)":\s*"https/g;
let m;
while ((m = keyRegex.exec(genContent)) !== null) existingKeys.add(m[1]);
console.log('Existing keys:', existingKeys.size);

function normalizeKeyPart(value) {
  return value.trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const slugRegex = /slug:\s*'(\w+)'/g;
const slugPositions = [];
while ((m = slugRegex.exec(content)) !== null) {
  slugPositions.push({ slug: m[1], pos: m.index });
}

const missing = [];
let totalConfig = 0;
for (let i = 0; i < slugPositions.length; i++) {
  const slug = slugPositions[i].slug;
  const start = slugPositions[i].pos;
  const end = i < slugPositions.length - 1 ? slugPositions[i + 1].pos : content.length;
  const section = content.substring(start, end);

  const prodRegex = /nome:\s*'([^']+)'[^}]*?categoria:\s*'([^']+)'[^}]*?ordem:\s*(\d+)/gs;
  let pm;
  let templateCount = 0;
  while ((pm = prodRegex.exec(section)) !== null) {
    templateCount++;
    totalConfig++;
    const nome = pm[1];
    const categoria = pm[2];
    const ordem = pm[3];
    const key = `${normalizeKeyPart(slug)}::${normalizeKeyPart(categoria)}::${ordem}::${normalizeKeyPart(nome)}`;
    if (!existingKeys.has(key)) {
      missing.push({ slug, nome, categoria, ordem, key });
    }
  }
  console.log(`${slug}: ${templateCount} products in config`);
}

console.log(`\nTotal in config: ${totalConfig}`);
console.log(`Missing products: ${missing.length}\n`);
for (const p of missing) {
  console.log(`${p.slug} | ${p.categoria} | ordem ${p.ordem} | ${p.nome}`);
  console.log(`  KEY: ${p.key}`);
}

// Write missing to JSON for the fix script
fs.writeFileSync('scripts/missing-products.json', JSON.stringify(missing, null, 2));
console.log('\nWritten to scripts/missing-products.json');

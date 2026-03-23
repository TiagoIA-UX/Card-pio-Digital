/**
 * Corrige URLs de produtos no banco que retornam 404.
 * Usa a REST API do Supabase com credenciais vindas do ambiente.
 */
const { config } = require('dotenv')

config({ path: '.env.local' })
config()

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SB_URL || !SB_KEY) {
  throw new Error(
    'Variáveis obrigatórias ausentes: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY'
  )
}

const SB_HOST = new URL(SB_URL).host

const P = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`

// Broken ID → working replacement ID
const fixes = [
  { oldId: '2566459', newId: '3186654' }, // Feijão
  { oldId: '50593', newId: '327090' }, // Coca-Cola 2L (×3)
  { oldId: '158053', newId: '416528' }, // Suco Laranja 1L
  { oldId: '1536868', newId: '3819969' }, // Suco Natural 1L (×3)
  { oldId: '1476224203', newId: '1565982' }, // Combo Família (×3)
  { oldId: '60616', newId: '1352274' }, // Porção Frango à Passarinha
  { oldId: '1536869', newId: '1556679' }, // Suco Laranja 500ml
]

async function patch(oldUrl, newUrl) {
  const response = await fetch(
    `${SB_URL}/rest/v1/products?imagem_url=eq.${encodeURIComponent(oldUrl)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
      },
      body: JSON.stringify({ imagem_url: newUrl }),
    }
  )

  const raw = await response.text()

  try {
    const rows = JSON.parse(raw)
    return {
      status: response.status,
      count: Array.isArray(rows) ? rows.length : 0,
      ok: response.ok,
      raw: response.ok ? undefined : raw.substring(0, 200),
    }
  } catch {
    return {
      status: response.status,
      count: 0,
      ok: response.ok,
      raw: raw.substring(0, 200),
    }
  }
}

async function main() {
  let totalFixed = 0
  console.log(`Conectando em ${SB_HOST}`)

  for (const f of fixes) {
    const oldUrl = P(f.oldId)
    const newUrl = P(f.newId)
    const result = await patch(oldUrl, newUrl)
    console.log(`${f.oldId} → ${f.newId}: status=${result.status}, rows=${result.count}`)
    if (!result.ok && result.raw) {
      console.error(`Falha ao atualizar ${f.oldId}: ${result.raw}`)
    }
    totalFixed += result.count
  }

  console.log(`\nTotal rows fixed: ${totalFixed}`)
}

main().catch(console.error)

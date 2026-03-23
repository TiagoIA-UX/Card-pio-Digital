import 'dotenv/config'

const token = process.env.SUPABASE_MANAGEMENT_TOKEN
const ref = process.env.SUPABASE_PROJECT_REF

if (!token || !ref) {
  console.error('Missing required env vars: SUPABASE_MANAGEMENT_TOKEN, SUPABASE_PROJECT_REF')
  process.exit(1)
}

async function main() {
  // Check table
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query:
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_feedbacks' ORDER BY ordinal_position",
    }),
  })
  const data = await res.json()

  if (data.length === 0) {
    console.log('ERROR: Table order_feedbacks NOT found!')
  } else {
    console.log('Table order_feedbacks columns:')
    data.forEach((r) => console.log(`  ${r.column_name} - ${r.data_type}`))
  }

  // Check RLS
  const res2 = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: "SELECT policyname, cmd FROM pg_policies WHERE tablename = 'order_feedbacks'",
    }),
  })
  const policies = await res2.json()
  console.log('\nRLS Policies:')
  policies.forEach((p) => console.log(`  ${p.policyname} (${p.cmd})`))

  // Check orders new columns
  const res3 = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query:
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name LIKE 'feedback%'",
    }),
  })
  const ordCols = await res3.json()
  console.log('\nOrders feedback columns:')
  ordCols.forEach((c) => console.log(`  ${c.column_name}`))
}

main().catch(console.error)

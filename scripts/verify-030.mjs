import 'dotenv/config'

const token = process.env.SUPABASE_MANAGEMENT_TOKEN
const projectRef = process.env.SUPABASE_PROJECT_REF

if (!token || !projectRef) {
  console.error('Missing required env vars: SUPABASE_MANAGEMENT_TOKEN, SUPABASE_PROJECT_REF')
  process.exit(1)
}

const sql = `SELECT column_name FROM information_schema.columns 
WHERE table_name = 'restaurants' 
AND column_name IN ('referred_by','last_active_at')
ORDER BY 1`

fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: sql }),
})
  .then((r) => r.text())
  .then((d) => {
    console.log('Result:', d)
  })
  .catch((e) => console.error(e))

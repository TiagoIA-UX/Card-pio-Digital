require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env.production', override: false })

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const migrationFile = process.argv[2] || 'supabase/migrations/032_financial_ledger_payouts.sql'
const sql = fs.readFileSync(migrationFile, 'utf8')

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const managementToken = process.env.SUPABASE_MANAGEMENT_TOKEN
const projectRef = process.env.SUPABASE_PROJECT_REF

if (!projectUrl || !serviceRoleKey || !managementToken || !projectRef) {
  console.error(
    'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_MANAGEMENT_TOKEN, SUPABASE_PROJECT_REF'
  )
  process.exit(1)
}

const sb = createClient(projectUrl, serviceRoleKey)

async function run() {
  // Test connection first
  const { data, error } = await sb.from('restaurants').select('id').limit(1)
  if (error) {
    console.log('Connection error:', error.message)
    return
  }
  console.log('Connected OK, restaurants found:', data.length)

  // Execute each statement via rpc
  // Since exec_sql doesn't exist, we'll need to use the SQL editor approach
  // Let's try direct pg connection via fetch to the management API

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  )

  const result = await response.text()
  console.log('Status:', response.status)
  console.log('Result:', result.substring(0, 500))
}

run().catch(console.error)

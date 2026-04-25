import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/shared/supabase/admin'

export const dynamic = 'force-dynamic'

interface DomainHealth {
  healthy: boolean
  latencyMs: number
  error?: string
}

async function checkDomain(name: string, fn: () => Promise<void>): Promise<[string, DomainHealth]> {
  const start = Date.now()
  try {
    await fn()
    return [name, { healthy: true, latencyMs: Date.now() - start }]
  } catch (err) {
    return [
      name,
      {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    ]
  }
}

export async function GET() {
  const supabase = createAdminClient()

  const results = await Promise.allSettled([
    // Core: verifica tabela restaurants (pilar do sistema)
    checkDomain('core', async () => {
      const { error } = await supabase.from('restaurants').select('id').limit(1)
      if (error) throw new Error(error.message)
    }),

    // Auth: verifica tabela admin_users
    checkDomain('auth', async () => {
      const { error } = await supabase.from('admin_users').select('id').limit(1)
      if (error) throw new Error(error.message)
    }),

    // ZAEA: verifica tabela agent_tasks
    checkDomain('zaea', async () => {
      const { error } = await supabase.from('agent_tasks').select('id').limit(1)
      if (error) throw new Error(error.message)
    }),

    // Marketing: verifica tabela template_orders
    checkDomain('marketing', async () => {
      const { error } = await supabase.from('template_orders').select('id').limit(1)
      if (error) throw new Error(error.message)
    }),

    // Affiliate: verifica tabela affiliates (pode não existir se desativado)
    checkDomain('affiliate', async () => {
      const { error } = await supabase.from('affiliates').select('id').limit(1)
      if (error) throw new Error(error.message)
    }),
  ])

  const domains: Record<string, DomainHealth> = {}
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const [name, health] = result.value
      domains[name] = health
    }
  }

  const overall = Object.values(domains).every((d) => d.healthy)

  return NextResponse.json(
    {
      overall,
      domains,
      timestamp: new Date().toISOString(),
    },
    { status: overall ? 200 : 503 }
  )
}


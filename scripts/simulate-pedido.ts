#!/usr/bin/env tsx
/**
 * Simula um pedido para testar o painel /painel/pedidos
 *
 * Uso:
 *   npx tsx scripts/simulate-pedido.ts
 *   npx tsx scripts/simulate-pedido.ts --slug meu-restaurante
 *
 * Requer: restaurante existente no banco (faça onboarding ou use simulate-onboarding primeiro)
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { createAdminClient } from '@/lib/shared/supabase/admin'

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const sep = line.indexOf('=')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    const value = line.slice(sep + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

function ensureEnv() {
  const root = process.cwd()
  loadEnvFile(path.join(root, '.env.local'))
  loadEnvFile(path.join(root, '.env.production'))
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length) throw new Error(`Variáveis ausentes: ${missing.join(', ')}`)
}

async function main() {
  ensureEnv()
  const admin = createAdminClient()
  const slugArg = process.argv.find((a) => a.startsWith('--slug='))
  const slug = slugArg ? slugArg.replace('--slug=', '') : null

  // Buscar restaurante
  let query = admin.from('restaurants').select('id, nome, slug').eq('ativo', true)
  if (slug) query = query.eq('slug', slug)
  const { data: restaurants, error: restErr } = await query.limit(1)

  if (restErr || !restaurants?.length) {
    console.error(
      slug
        ? `Restaurante com slug "${slug}" não encontrado.`
        : 'Nenhum restaurante ativo encontrado. Faça o onboarding primeiro (npm run simulate:onboarding).'
    )
    process.exit(1)
  }

  const rest = restaurants[0]
  const restaurantId = rest.id

  // Buscar produtos do restaurante
  const { data: products } = await admin
    .from('products')
    .select('id, nome, preco')
    .eq('restaurant_id', restaurantId)
    .eq('ativo', true)
    .limit(5)

  if (!products?.length) {
    console.error('Restaurante sem produtos. Adicione produtos no painel primeiro.')
    process.exit(1)
  }

  const total = products.reduce((s, p) => s + Number(p.preco), 0)

  const { data: lastOrder, error: lastOrderErr } = await admin
    .from('orders')
    .select('numero_pedido')
    .eq('restaurant_id', restaurantId)
    .order('numero_pedido', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastOrderErr) {
    console.error('Erro ao buscar último número do pedido:', lastOrderErr)
    process.exit(1)
  }

  const nextNum = (lastOrder?.numero_pedido ?? 0) + 1

  // Criar pedido
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      restaurant_id: restaurantId,
      numero_pedido: nextNum,
      cliente_nome: 'Cliente Teste',
      cliente_telefone: '11999999999',
      tipo_entrega: 'retirada',
      origem_pedido: 'online',
      forma_pagamento: 'online',
      total: Math.round(total * 100) / 100,
      status: 'confirmed',
      observacoes: 'Pedido de teste - script simulate-pedido',
    })
    .select('id, numero_pedido, total, status')
    .single()

  if (orderErr || !order) {
    console.error('Erro ao criar pedido:', orderErr)
    process.exit(1)
  }

  // Criar itens
  const items = products.map((p) => ({
    order_id: order.id,
    product_id: p.id,
    nome_snapshot: p.nome,
    preco_snapshot: Number(p.preco),
    quantidade: 1,
  }))

  const { error: itemsErr } = await admin.from('order_items').insert(items)
  if (itemsErr) {
    console.error('Erro ao criar itens:', itemsErr)
    await admin.from('orders').delete().eq('id', order.id)
    process.exit(1)
  }

  console.log(`
✅ Pedido de teste criado com sucesso!

   Restaurante: ${rest.nome} (${rest.slug})
   Pedido #${order.numero_pedido}
   Total: R$ ${Number(order.total).toFixed(2)}
   Status: ${order.status}

   Para ver no painel:
   1. Faça login com o usuário dono do restaurante
   2. Acesse: /painel/pedidos

   Ou abra: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/painel/pedidos
`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

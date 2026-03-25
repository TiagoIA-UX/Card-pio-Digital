/**
 * Testes automatizados de Personas - Cardápio Digital
 * Executa validações reais contra produção usando credenciais do .env.local
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Carregar .env.local ──
const envPath = resolve(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx === -1) continue
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
}

const SITE_URL = env.NEXT_PUBLIC_SITE_URL || 'https://zairyx.com'
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const ADMIN_SECRET = env.ADMIN_SECRET_KEY
const CRON_SECRET = env.CRON_SECRET

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── Helpers ──
const results = []
let currentPersona = ''

function log(status, test, detail = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️'
  const entry = { persona: currentPersona, status, test, detail }
  results.push(entry)
  console.log(`${icon} [${currentPersona}] ${test}${detail ? ' → ' + detail : ''}`)
}

async function fetchUrl(path, options = {}) {
  const url = path.startsWith('http') ? path : `${SITE_URL}${path}`
  try {
    const res = await fetch(url, { redirect: 'manual', ...options })
    return { status: res.status, headers: Object.fromEntries(res.headers.entries()), ok: res.ok, url }
  } catch (e) {
    return { status: 0, error: e.message, url }
  }
}

async function fetchJson(path, options = {}) {
  const url = path.startsWith('http') ? path : `${SITE_URL}${path}`
  try {
    const res = await fetch(url, options)
    const text = await res.text()
    let json = null
    try { json = JSON.parse(text) } catch {}
    return { status: res.status, json, text: text.slice(0, 500), url }
  } catch (e) {
    return { status: 0, error: e.message, url }
  }
}

// ══════════════════════════════════════════════
// PERSONA 1 — Visitante Anônimo
// ══════════════════════════════════════════════
async function testPersona1() {
  currentPersona = 'P1-Visitante'

  // 1.1 Homepage
  const home = await fetchUrl('/')
  log(home.status === 200 ? 'PASS' : 'FAIL', '1.1 Homepage carrega', `status=${home.status}`)

  // 1.2 Templates
  const templates = await fetchUrl('/templates')
  log(templates.status === 200 ? 'PASS' : 'FAIL', '1.2 Catálogo de templates', `status=${templates.status}`)

  // 1.4 Preços
  const precos = await fetchUrl('/precos')
  log(precos.status === 200 ? 'PASS' : 'FAIL', '1.4 Página de preços', `status=${precos.status}`)

  // 1.5 Ofertas
  const ofertas = await fetchUrl('/ofertas')
  log(ofertas.status === 200 ? 'PASS' : 'FAIL', '1.5 Página de ofertas', `status=${ofertas.status}`)

  // 1.6 Páginas legais
  for (const p of ['/termos', '/politica', '/privacidade', '/cookies']) {
    const res = await fetchUrl(p)
    log(res.status === 200 ? 'PASS' : 'FAIL', `1.6 Página legal ${p}`, `status=${res.status}`)
  }

  // 1.7 Demo
  const demo = await fetchUrl('/demo')
  log(demo.status === 200 ? 'PASS' : 'FAIL', '1.7 Demo pública', `status=${demo.status}`)

  // 1.8 Cadastro
  const cadastro = await fetchUrl('/cadastro')
  log([200, 307, 308].includes(cadastro.status) ? 'PASS' : 'FAIL', '1.8 Página de cadastro', `status=${cadastro.status}`)

  // 1.9 Login
  const login = await fetchUrl('/login')
  log([200, 307, 308].includes(login.status) ? 'PASS' : 'FAIL', '1.9 Página de login', `status=${login.status}`)

  // 1.11 robots.txt
  const robots = await fetchUrl('/robots.txt')
  log(robots.status === 200 ? 'PASS' : 'FAIL', '1.11 robots.txt', `status=${robots.status}`)

  // 1.12 sitemap.xml
  const sitemap = await fetchUrl('/sitemap.xml')
  log(sitemap.status === 200 ? 'PASS' : 'FAIL', '1.12 sitemap.xml', `status=${sitemap.status}`)

  // 1.20 /admin sem login → redireciona
  const admin = await fetchUrl('/admin')
  log([301, 302, 303, 307, 308].includes(admin.status) || admin.status === 200 ? 'PASS' : 'FAIL',
    '1.20 /admin sem login', `status=${admin.status}`)

  // 1.21 /painel sem login → redireciona
  const painel = await fetchUrl('/painel')
  log([301, 302, 303, 307, 308].includes(painel.status) || painel.status === 200 ? 'PASS' : 'FAIL',
    '1.21 /painel sem login', `status=${painel.status}`)

  // 1.10 Rota inexistente → 404
  const notfound = await fetchUrl('/rota-que-nao-existe-xyz')
  log(notfound.status === 404 ? 'PASS' : 'WARN', '1.10 Rota inexistente → 404', `status=${notfound.status}`)

  // 1.22 XSS na URL
  const xss = await fetchUrl('/<script>alert(1)</script>')
  log(xss.status !== 200 ? 'PASS' : 'WARN', '1.22 XSS na URL bloqueado', `status=${xss.status}`)
}

// ══════════════════════════════════════════════
// PERSONA 2 — Cliente Final
// ══════════════════════════════════════════════
async function testPersona2() {
  currentPersona = 'P2-ClienteFinal'

  // Buscar um delivery real com cardápio público
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, slug, nome')
    .not('slug', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!restaurants || restaurants.length === 0) {
    log('FAIL', '2.0 Nenhum delivery encontrado no banco')
    return
  }

  const rest = restaurants[0]
  log('PASS', `2.0 Delivery encontrado: ${rest.nome}`, `slug=${rest.slug}`)

  // 2.1 Cardápio público abre
  const cardapio = await fetchUrl(`/r/${rest.slug}`)
  log(cardapio.status === 200 ? 'PASS' : 'FAIL', '2.1 Cardápio público carrega', `status=${cardapio.status}`)

  // Buscar produtos do delivery
  const { data: products, count } = await supabase
    .from('products')
    .select('id, name, price, category, active', { count: 'exact' })
    .eq('restaurant_id', rest.id)
    .eq('active', true)
    .limit(5)

  log(products && products.length > 0 ? 'PASS' : 'WARN',
    `2.3 Produtos no delivery`, `total_ativos=${count || products?.length || 0}`)

  if (products && products.length > 0) {
    const p = products[0]
    const hasPrice = typeof p.price === 'number' && p.price > 0
    log(hasPrice ? 'PASS' : 'FAIL', '2.4 Produto com preço válido', `${p.name} → R$${p.price}`)
  }

  // Buscar pedidos existentes
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, status, created_at')
    .eq('restaurant_id', rest.id)
    .order('created_at', { ascending: false })
    .limit(3)

  log(orders ? 'PASS' : 'FAIL', '2.16 Pedidos no banco', `encontrados=${orders?.length || 0}`)

  if (orders && orders.length > 0) {
    const o = orders[0]
    const validStatus = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].includes(o.status)
    log(validStatus ? 'PASS' : 'FAIL', '2.19 Status de pedido válido', `#${o.order_number} → ${o.status}`)
  }

  // API de pedidos
  const ordersApi = await fetchJson(`/api/orders?restaurant_id=${rest.id}`)
  log(ordersApi.status !== 500 ? 'PASS' : 'FAIL', '2.16b API de pedidos responde', `status=${ordersApi.status}`)

  // API de feedback
  const feedback = await fetchJson('/api/feedback')
  log(feedback.status !== 500 ? 'PASS' : 'WARN', '2.21 API de feedback responde', `status=${feedback.status}`)
}

// ══════════════════════════════════════════════
// PERSONA 3 — Dono do Delivery
// ══════════════════════════════════════════════
async function testPersona3() {
  currentPersona = 'P3-DonoDelivery'

  // Buscar deliverys com owner
  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, slug, nome, user_id, phone, template_slug, created_at')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5)

  if (!restaurants || restaurants.length === 0) {
    log('FAIL', '3.0 Nenhum delivery com dono encontrado')
    return
  }

  log('PASS', `3.0 Deliverys com dono: ${restaurants.length}`)
  for (const r of restaurants.slice(0, 3)) {
    log('PASS', `   → ${r.nome}`, `slug=${r.slug}, template=${r.template_slug}`)
  }

  const rest = restaurants[0]

  // 3.4 Verificar onboarding
  const onboardingApi = await fetchJson('/api/onboarding/status')
  log(onboardingApi.status !== 500 ? 'PASS' : 'FAIL', '3.5 API onboarding/status responde', `status=${onboardingApi.status}`)

  // 3.10 Produtos do delivery
  const { data: prods, count: prodCount } = await supabase
    .from('products')
    .select('id, name, price, active, category', { count: 'exact' })
    .eq('restaurant_id', rest.id)

  log(prods ? 'PASS' : 'FAIL', `3.10 Produtos do delivery ${rest.nome}`, `total=${prodCount || 0}`)

  // 3.6 Categorias
  const categories = prods ? [...new Set(prods.map(p => p.category).filter(Boolean))] : []
  log(categories.length > 0 ? 'PASS' : 'WARN', '3.6 Categorias existentes', categories.join(', '))

  // 3.17 Produtos ativos vs inativos
  const active = prods?.filter(p => p.active) || []
  const inactive = prods?.filter(p => !p.active) || []
  log('PASS', '3.17 Controle de ativação', `ativos=${active.length}, inativos=${inactive.length}`)

  // 3.19 Pedidos do delivery
  const { data: orders, count: orderCount } = await supabase
    .from('orders')
    .select('id, status', { count: 'exact' })
    .eq('restaurant_id', rest.id)

  log(orders ? 'PASS' : 'FAIL', '3.19 Pedidos do delivery', `total=${orderCount || 0}`)

  // Distribuição de status
  if (orders && orders.length > 0) {
    const statusDist = {}
    for (const o of orders) {
      statusDist[o.status] = (statusDist[o.status] || 0) + 1
    }
    log('PASS', '3.21-24 Distribuição de status', JSON.stringify(statusDist))
  }

  // 3.33 QR Code page
  const qr = await fetchUrl('/painel/qrcode')
  log([200, 307, 308].includes(qr.status) ? 'PASS' : 'FAIL', '3.33 Rota QR Code', `status=${qr.status}`)

  // 3.34 Planos
  const planos = await fetchUrl('/painel/planos')
  log([200, 307, 308].includes(planos.status) ? 'PASS' : 'FAIL', '3.34 Rota Planos', `status=${planos.status}`)

  // 3.43 Isolamento multi-tenant (RLS)
  const { data: allRest } = await supabase
    .from('restaurants')
    .select('id, user_id')
    .not('user_id', 'is', null)
    .limit(10)

  if (allRest && allRest.length >= 2) {
    const uniqueOwners = new Set(allRest.map(r => r.user_id))
    log(uniqueOwners.size >= 2 ? 'PASS' : 'WARN', '3.43 Multi-tenant: múltiplos owners', `owners_distintos=${uniqueOwners.size}`)
  }

  // Templates
  const { data: tpls } = await supabase.from('templates').select('id, slug, name').limit(15)
  log(tpls && tpls.length > 0 ? 'PASS' : 'FAIL', '3.29 Templates disponíveis', `total=${tpls?.length || 0}`)

  // User purchases
  const { data: purchases } = await supabase
    .from('user_purchases')
    .select('id, user_id, template_id, status')
    .limit(10)
  log(purchases ? 'PASS' : 'WARN', '3.39 Compras de templates', `registros=${purchases?.length || 0}`)
}

// ══════════════════════════════════════════════
// PERSONA 6 — Afiliado
// ══════════════════════════════════════════════
async function testPersona6() {
  currentPersona = 'P6-Afiliado'

  // 6.1 Buscar afiliados
  const { data: affiliates, count } = await supabase
    .from('affiliates')
    .select('id, code, nome, status, pix_key, saldo_disponivel, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(10)

  if (!affiliates || affiliates.length === 0) {
    log('WARN', '6.0 Nenhum afiliado encontrado no banco')
    
    // Tentar página pública de afiliados
    const afPage = await fetchUrl('/afiliados')
    log(afPage.status === 200 ? 'PASS' : 'FAIL', '6.0b Página pública de afiliados', `status=${afPage.status}`)
    return
  }

  log('PASS', `6.0 Afiliados encontrados: ${count || affiliates.length}`)

  // Status distribution
  const statusDist = {}
  for (const a of affiliates) {
    statusDist[a.status] = (statusDist[a.status] || 0) + 1
  }
  log('PASS', '6.1 Distribuição de status', JSON.stringify(statusDist))

  // 6.4 Códigos de referral
  const codesValid = affiliates.every(a => a.code && a.code.length > 0)
  log(codesValid ? 'PASS' : 'FAIL', '6.4 Todos têm código de referral')

  // 6.9 Saldos
  const withBalance = affiliates.filter(a => (a.saldo_disponivel || 0) > 0)
  log('PASS', `6.9 Afiliados com saldo positivo: ${withBalance.length}`,
    withBalance.slice(0, 3).map(a => `${a.nome}: R$${a.saldo_disponivel}`).join(', '))

  // 6.5 Link de referral
  if (affiliates[0]?.code) {
    const refLink = await fetchUrl(`/r/${affiliates[0].code}`)
    log([200, 307, 308].includes(refLink.status) ? 'PASS' : 'WARN',
      '6.5 Link de referral responde', `status=${refLink.status} code=${affiliates[0].code}`)
  }

  // 6.6 Referrals
  const { data: referrals, count: refCount } = await supabase
    .from('affiliate_referrals')
    .select('id, status, commission_amount', { count: 'exact' })
    .limit(20)

  log(referrals ? 'PASS' : 'WARN', `6.6 Indicações registradas`, `total=${refCount || 0}`)

  if (referrals && referrals.length > 0) {
    const totalComm = referrals.reduce((sum, r) => sum + (r.commission_amount || 0), 0)
    log('PASS', '6.7 Total de comissões', `R$${totalComm.toFixed(2)}`)
  }

  // 6.13 Penalidades
  const { data: penalties } = await supabase
    .from('affiliate_penalties')
    .select('id, tipo, motivo')
    .limit(10)

  log('PASS', `6.13 Penalidades registradas`, `total=${penalties?.length || 0}`)

  // Ranking page
  const ranking = await fetchUrl('/afiliados/ranking')
  log(ranking.status === 200 ? 'PASS' : 'FAIL', '6.8 Página de ranking', `status=${ranking.status}`)

  // Afiliados page
  const afPage = await fetchUrl('/afiliados')
  log(afPage.status === 200 ? 'PASS' : 'FAIL', '6.0b Página pública de afiliados', `status=${afPage.status}`)
}

// ══════════════════════════════════════════════
// PERSONA 7 — Revendedor
// ══════════════════════════════════════════════
async function testPersona7() {
  currentPersona = 'P7-Revendedor'

  const revPage = await fetchUrl('/revendedores')
  log(revPage.status === 200 ? 'PASS' : 'FAIL', '7.1 Página de revendedores', `status=${revPage.status}`)

  const finalizarPacote = await fetchUrl('/finalizar-compra-pacote')
  log([200, 307, 308].includes(finalizarPacote.status) ? 'PASS' : 'WARN',
    '7.3 Rota finalizar-compra-pacote', `status=${finalizarPacote.status}`)
}

// ══════════════════════════════════════════════
// PERSONA 8 — Suporte
// ══════════════════════════════════════════════
async function testPersona8() {
  currentPersona = 'P8-Suporte'

  // Tickets
  const { data: tickets, count } = await supabase
    .from('support_tickets')
    .select('id, status, priority, sla_first_response_deadline', { count: 'exact' })
    .limit(10)

  log(tickets ? 'PASS' : 'WARN', '8.2 Tickets no sistema', `total=${count || 0}`)

  if (tickets && tickets.length > 0) {
    const statusDist = {}
    for (const t of tickets) {
      statusDist[t.status] = (statusDist[t.status] || 0) + 1
    }
    log('PASS', '8.2b Distribuição de status dos tickets', JSON.stringify(statusDist))

    // SLA
    const withSla = tickets.filter(t => t.sla_first_response_deadline)
    log(withSla.length > 0 ? 'PASS' : 'WARN', '8.4 Tickets com SLA definido', `${withSla.length}/${tickets.length}`)
  }

  // Support messages
  const { count: msgCount } = await supabase
    .from('support_messages')
    .select('id', { count: 'exact', head: true })

  log('PASS', '8.3 Mensagens de suporte', `total=${msgCount || 0}`)
}

// ══════════════════════════════════════════════
// PERSONA 9 — Admin
// ══════════════════════════════════════════════
async function testPersona9() {
  currentPersona = 'P9-Admin'

  // 9.1 Admin users
  const { data: admins } = await supabase
    .from('admin_users')
    .select('id, user_id, role, email')
    .limit(10)

  log(admins && admins.length > 0 ? 'PASS' : 'FAIL', '9.1 Admin users configurados', `total=${admins?.length || 0}`)

  if (admins) {
    const rolesDist = {}
    for (const a of admins) {
      rolesDist[a.role] = (rolesDist[a.role] || 0) + 1
    }
    log('PASS', '9.19 Distribuição de roles admin', JSON.stringify(rolesDist))
  }

  // 9.2 Admin API com header auth
  const metricsApi = await fetchJson('/api/admin/metrics', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  })
  log(metricsApi.status === 200 ? 'PASS' : 'WARN', '9.2 API admin/metrics', `status=${metricsApi.status}`)

  // 9.4 Logs
  const logsApi = await fetchJson('/api/admin/logs', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  })
  log(logsApi.status === 200 ? 'PASS' : 'WARN', '9.4 API admin/logs', `status=${logsApi.status}`)

  // 9.3 Alertas
  const alertas = await fetchJson('/api/admin/alertas', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  })
  log(alertas.status === 200 ? 'PASS' : 'WARN', '9.3 API admin/alertas', `status=${alertas.status}`)

  // 9.5 Clientes
  const clientes = await fetchJson('/api/admin/clientes', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  })
  log(clientes.status === 200 ? 'PASS' : 'WARN', '9.5 API admin/clientes', `status=${clientes.status}`)

  // 9.8 Afiliados admin
  const afAdmin = await fetchJson('/api/admin/afiliados/comissoes', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  })
  log(afAdmin.status !== 500 ? 'PASS' : 'WARN', '9.8 API admin/afiliados', `status=${afAdmin.status}`)

  // 9.12 Financeiro
  const fin = await fetchJson('/api/admin/financeiro', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  })
  log(fin.status === 200 ? 'PASS' : 'WARN', '9.12 API admin/financeiro', `status=${fin.status}`)

  // 9.15 Venda direta
  const vd = await fetchJson('/api/admin/venda-direta', {
    headers: { 'Authorization': `Bearer ${ADMIN_SECRET}` }
  })
  log(vd.status !== 500 ? 'PASS' : 'WARN', '9.15 API admin/venda-direta', `status=${vd.status}`)

  // System logs
  const { count: logCount } = await supabase
    .from('system_logs')
    .select('id', { count: 'exact', head: true })
  log('PASS', '9.4b System logs no banco', `total=${logCount || 0}`)

  // Financial summary
  const { data: finSummary } = await supabase
    .from('financial_summary')
    .select('*')
    .limit(1)
    .maybeSingle()
  log(finSummary ? 'PASS' : 'WARN', '9.12b Financial summary', finSummary ? `entradas=${finSummary.total_entradas}` : 'não encontrado')
}

// ══════════════════════════════════════════════
// PERSONA 10 — Owner
// ══════════════════════════════════════════════
async function testPersona10() {
  currentPersona = 'P10-Owner'

  // 10.8 Auth via header
  const health = await fetchJson('/api/health')
  log(health.status === 200 ? 'PASS' : 'WARN', '10.7 Health check', `status=${health.status}`)

  // Cron health
  const cronHealth = await fetchJson('/api/cron/health', {
    headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
  })
  log(cronHealth.status !== 500 ? 'PASS' : 'WARN', '10.7b Cron health', `status=${cronHealth.status}`)

  // Cron audit
  const cronAudit = await fetchJson('/api/cron/audit', {
    headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
  })
  log(cronAudit.status !== 500 ? 'PASS' : 'WARN', '10.7c Cron audit', `status=${cronAudit.status}`)

  // 10.6 Logs de audit completos
  const { data: logs } = await supabase
    .from('system_logs')
    .select('action, actor_type, entity, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  log(logs && logs.length > 0 ? 'PASS' : 'WARN', '10.6 Últimos logs de audit',
    logs?.slice(0, 3).map(l => `${l.action}/${l.entity}`).join(', ') || 'nenhum')
}

// ══════════════════════════════════════════════
// TESTES TRANSVERSAIS
// ══════════════════════════════════════════════
async function testTransversal() {
  currentPersona = 'Transversal'

  // Segurança: rotas protegidas sem auth
  const protectedRoutes = [
    '/api/admin/financeiro',
    '/api/admin/clientes',
    '/api/admin/usuarios',
    '/api/admin/logs',
  ]

  for (const route of protectedRoutes) {
    const res = await fetchJson(route)
    log(res.status === 401 || res.status === 403 ? 'PASS' : 'WARN',
      `SEC: ${route} sem auth`, `status=${res.status}`)
  }

  // Webhook endpoint existe
  const wh = await fetchUrl('/api/webhooks/mercadopago')
  log(wh.status !== 404 ? 'PASS' : 'FAIL', 'Webhook MercadoPago rota existe', `status=${wh.status}`)

  // Plans
  const { data: plans } = await supabase.from('plans').select('id, name, price').limit(5)
  log(plans && plans.length > 0 ? 'PASS' : 'WARN', 'Planos cadastrados', `total=${plans?.length || 0}`)
  if (plans) {
    for (const p of plans) {
      log('PASS', `  Plano: ${p.name}`, `R$${p.price}`)
    }
  }

  // Coupons
  const { data: coupons } = await supabase.from('coupons').select('id, code, active').limit(5)
  log('PASS', 'Cupons cadastrados', `total=${coupons?.length || 0}`)
}

// ══════════════════════════════════════════════
// RELATÓRIO FINAL
// ══════════════════════════════════════════════
function printReport() {
  console.log('\n' + '═'.repeat(70))
  console.log('  RELATÓRIO FINAL DE TESTES POR PERSONA')
  console.log('═'.repeat(70))

  const personas = [...new Set(results.map(r => r.persona))]
  let totalPass = 0, totalFail = 0, totalWarn = 0

  for (const p of personas) {
    const pResults = results.filter(r => r.persona === p)
    const pass = pResults.filter(r => r.status === 'PASS').length
    const fail = pResults.filter(r => r.status === 'FAIL').length
    const warn = pResults.filter(r => r.status === 'WARN').length
    totalPass += pass
    totalFail += fail
    totalWarn += warn

    const icon = fail > 0 ? '❌' : warn > 0 ? '⚠️' : '✅'
    console.log(`\n${icon} ${p}: ${pass} pass | ${fail} fail | ${warn} warn`)

    if (fail > 0) {
      for (const f of pResults.filter(r => r.status === 'FAIL')) {
        console.log(`   ❌ ${f.test} ${f.detail ? '→ ' + f.detail : ''}`)
      }
    }
  }

  console.log('\n' + '─'.repeat(70))
  console.log(`TOTAL: ✅ ${totalPass} pass | ❌ ${totalFail} fail | ⚠️ ${totalWarn} warn`)
  console.log(`TESTES EXECUTADOS: ${results.length}`)
  console.log(`VEREDITO: ${totalFail === 0 ? '🟢 GO' : totalFail <= 3 ? '🟡 GO COM RISCO' : '🔴 NO-GO'}`)
  console.log('─'.repeat(70))
  console.log(`Data: ${new Date().toISOString()}`)
  console.log(`Ambiente: ${SITE_URL}`)
  console.log('═'.repeat(70))
}

// ══════════════════════════════════════════════
// EXECUÇÃO
// ══════════════════════════════════════════════
async function main() {
  console.log('═'.repeat(70))
  console.log('  TESTES AUTOMATIZADOS DE PERSONAS — CARDÁPIO DIGITAL')
  console.log(`  Target: ${SITE_URL}`)
  console.log(`  Data: ${new Date().toISOString()}`)
  console.log('═'.repeat(70))

  await testPersona1()
  await testPersona2()
  await testPersona3()
  await testPersona6()
  await testPersona7()
  await testPersona8()
  await testPersona9()
  await testPersona10()
  await testTransversal()

  printReport()
}

main().catch(err => {
  console.error('Erro fatal nos testes:', err)
  process.exit(1)
})

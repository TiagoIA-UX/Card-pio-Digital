import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

function isAuthorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.ADMIN_SECRET_KEY
  const authHeader = request.headers.get('authorization')

  if (secret && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    return Promise.resolve(token === secret)
  }

  return (async () => {
    const supabase = await createClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return false

    const admin = createAdminClient()
    const { data: adminData } = await admin
      .from('admin_users')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    return !!adminData
  })()
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await isAuthorized(request)
    if (!authorized) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]

    const [
      restaurantsRes,
      ordersTodayRes,
      ordersMonthRes,
      ordersAllRes,
      ordersTotalRes,
      ticketRes,
      productsRes,
      templatesRes,
      activatedRes,
    ] = await Promise.all([
      supabase
        .from('restaurants')
        .select('id, ativo, template_slug, nome, slug', { count: 'exact' }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart),
      supabase.from('orders').select('id, total, restaurant_id, created_at').limit(5000),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('total'),
      supabase.from('products').select('id, restaurant_id', { count: 'exact' }),
      supabase.from('restaurants').select('template_slug'),
      supabase
        .from('activation_events')
        .select('restaurant_id')
        .eq('event_type', 'received_first_order'),
    ])

    const restaurants = restaurantsRes.data || []
    const totalRestaurants = restaurantsRes.count ?? restaurants.length
    const activeRestaurants = restaurants.filter((r) => r.ativo).length

    const ordersToday = ordersTodayRes.count ?? 0
    const ordersMonth = ordersMonthRes.count ?? 0
    const totalOrders = ordersTotalRes.count ?? (ordersAllRes.data || []).length

    const totals = (ticketRes.data || []).map((o) => Number(o.total)).filter(Number.isFinite)
    const ticketMedio = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0

    const totalProducts = productsRes.count ?? 0
    const productsPerRestaurant =
      totalRestaurants > 0 ? (productsRes.count ?? 0) / totalRestaurants : 0

    const templateCounts: Record<string, number> = {}
    ;(templatesRes.data || []).forEach((r: { template_slug?: string }) => {
      const slug = r.template_slug || 'restaurante'
      templateCounts[slug] = (templateCounts[slug] || 0) + 1
    })
    const templatesMaisUsados = Object.entries(templateCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([slug, count]) => ({ slug, count }))

    const ordersAll = ordersAllRes.data || []
    const restaurantsWithOrders = new Set(
      ordersAll.map((o: { restaurant_id: string }) => o.restaurant_id)
    ).size
    const activatedCount = activatedRes.data
      ? new Set((activatedRes.data || []).map((e: { restaurant_id: string }) => e.restaurant_id))
          .size
      : restaurantsWithOrders
    const activationRate =
      totalRestaurants > 0 ? Math.round((activatedCount / totalRestaurants) * 100) : 0

    const withOrders = new Set(
      (ordersAllRes.data || []).map((o: { restaurant_id: string }) => o.restaurant_id)
    )
    const restaurantesSemPedidoList = (restaurantsRes.data || [])
      .filter((r) => r.ativo && !withOrders.has(r.id))
      .map((r) => ({ id: r.id, nome: r.nome, slug: r.slug }))
      .slice(0, 10)

    const lastOrderByRestaurant = new Map<string, string>()
    ;(ordersAllRes.data || []).forEach((o: { restaurant_id: string; created_at?: string }) => {
      const existing = lastOrderByRestaurant.get(o.restaurant_id)
      if (!existing || (o.created_at && o.created_at > existing)) {
        lastOrderByRestaurant.set(o.restaurant_id, o.created_at || '')
      }
    })

    const now = Date.now()
    const restaurantesEmRisco = (restaurantsRes.data || [])
      .filter((r) => r.ativo && withOrders.has(r.id))
      .map((r) => {
        const lastOrder = lastOrderByRestaurant.get(r.id) || ''
        const diasSemPedido = lastOrder
          ? Math.floor((now - new Date(lastOrder).getTime()) / (24 * 60 * 60 * 1000))
          : 999
        return { ...r, dias_sem_pedido: diasSemPedido }
      })
      .filter((r) => r.dias_sem_pedido >= 7)
      .sort((a, b) => b.dias_sem_pedido - a.dias_sem_pedido)
      .slice(0, 10)
      .map(({ id, nome, slug, dias_sem_pedido }) => ({
        id,
        nome,
        slug,
        dias_sem_pedido,
      }))

    return NextResponse.json({
      restaurantes: {
        total: totalRestaurants,
        ativos: activeRestaurants,
        comPedido: restaurantsWithOrders,
        semPedido: restaurantesSemPedidoList.length,
      },
      pedidos: {
        hoje: ordersToday,
        esteMes: ordersMonth,
        total: totalOrders,
      },
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      ativacao: {
        taxa: activationRate,
        comPrimeiroPedido: activatedCount,
      },
      produtos: {
        total: totalProducts,
        porRestaurante: Math.round(productsPerRestaurant * 10) / 10,
      },
      templatesMaisUsados,
      restaurantesSemPedido: restaurantesSemPedidoList.slice(0, 10),
      restaurantesEmRisco: restaurantesEmRisco.slice(0, 10),
    })
  } catch (error) {
    console.error('Erro ao buscar métricas admin:', error)
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 })
  }
}

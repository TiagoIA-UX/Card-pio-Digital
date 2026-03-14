'use client'

/**
 * Página de demonstração do produto para captura de screenshots.
 * Usada na landing page para mostrar fotos reais do painel e editor.
 * Acesse /demo para visualizar.
 */
import Image from 'next/image'
import Link from 'next/link'
import {
  Store,
  Package,
  ClipboardList,
  Settings,
  LayoutTemplate,
  QrCode,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'

export default function DemoPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="border-border bg-muted/30 border-b px-4 py-2 text-center text-sm">
        Demonstração do produto — use para capturar screenshots da landing page
      </div>

      <div className="flex">
        {/* Sidebar - igual ao painel real */}
        <aside className="bg-card border-border fixed top-0 bottom-0 left-0 hidden w-64 flex-col border-r lg:flex">
          <div className="border-border border-b p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-full">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-foreground truncate font-bold">Pizzaria do João</h2>
                <span className="text-primary text-xs">Ver cardápio</span>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-2 p-4">
            {[
              { icon: Store, label: 'Dashboard', active: true },
              { icon: LayoutTemplate, label: 'Editor Visual' },
              { icon: Package, label: 'Produtos' },
              { icon: ClipboardList, label: 'Pedidos' },
              { icon: QrCode, label: 'QR Code' },
              { icon: Settings, label: 'Configurações' },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
                  item.active ? 'bg-primary/10 text-primary' : 'text-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </div>
            ))}
          </nav>
        </aside>

        {/* Conteúdo - Dashboard */}
        <main className="min-h-screen flex-1 lg:ml-64">
          <div className="p-6 md:p-8">
            <h1 className="text-foreground mb-6 text-2xl font-bold">Dashboard</h1>

            {/* Cards de estatísticas */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Package, label: 'Produtos', value: '24', color: 'bg-blue-500/10 text-blue-600' },
                { icon: ClipboardList, label: 'Pedidos hoje', value: '8', color: 'bg-green-500/10 text-green-600' },
                { icon: Clock, label: 'Pendentes', value: '2', color: 'bg-amber-500/10 text-amber-600' },
                { icon: DollarSign, label: 'Faturamento hoje', value: 'R$ 340', color: 'bg-emerald-500/10 text-emerald-600' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-card border-border rounded-xl border p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">{stat.label}</span>
                    <stat.icon className="text-muted-foreground h-4 w-4" />
                  </div>
                  <p className="text-foreground mt-2 text-2xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Pedidos recentes */}
            <div className="bg-card border-border rounded-xl border p-6 shadow-sm">
              <h2 className="text-foreground mb-4 text-lg font-semibold">Pedidos recentes</h2>
              <div className="space-y-3">
                {[
                  { id: '#1042', total: 'R$ 45,00', status: 'Preparando' },
                  { id: '#1041', total: 'R$ 32,00', status: 'Entregue' },
                  { id: '#1040', total: 'R$ 78,00', status: 'Entregue' },
                ].map((order) => (
                  <div
                    key={order.id}
                    className="border-border flex items-center justify-between rounded-lg border px-4 py-3"
                  >
                    <div>
                      <span className="text-foreground font-medium">{order.id}</span>
                      <span className="text-muted-foreground ml-2 text-sm">{order.total}</span>
                    </div>
                    <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

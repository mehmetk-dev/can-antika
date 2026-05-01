"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { ShoppingCart, Users, Package, TrendingUp, ArrowUpRight, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAdminDashboardStats } from "@/hooks/useAdminDashboardStats"
import ExchangeRateTicker from "@/components/dashboard/exchange-rate-ticker"
import PendingTasksGrid from "@/components/dashboard/pending-tasks-grid"
import RecentOrderCard from "@/components/dashboard/recent-order-card"
import RevenueSummary from "@/components/dashboard/revenue-summary"
import ActivityLogTimeline from "@/components/dashboard/activity-log-timeline"
import { formatDateTR } from "@/lib/utils"
import { CHART_RANGES } from "@/lib/constants"

const RevenueChart = dynamic(() => import("@/components/dashboard/revenue-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-sm text-stone-400">
      <div className="flex flex-col items-center gap-2">
        <BarChart3 className="h-8 w-8 animate-pulse opacity-40" />
        <span>Grafik yükleniyor...</span>
      </div>
    </div>
  ),
})

const heroCards = [
  {
    label: "Toplam Sipariş",
    key: "totalOrders" as const,
    icon: ShoppingCart,
    gradient: "from-amber-50 to-orange-50",
    borderColor: "border-l-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    format: (v: number | string) => String(v || "0"),
  },
  {
    label: "Toplam Ciro",
    key: "totalRevenue" as const,
    icon: TrendingUp,
    gradient: "from-emerald-50 to-teal-50",
    borderColor: "border-l-emerald-500",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    format: (v: number | string) =>
      v ? `₺${Number(v).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}` : "₺0",
  },
  {
    label: "Toplam Üye",
    key: "totalCustomers" as const,
    icon: Users,
    gradient: "from-sky-50 to-blue-50",
    borderColor: "border-l-sky-500",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
    format: (v: number | string) => String(v || "0"),
  },
  {
    label: "Toplam Ürün",
    key: "totalProducts" as const,
    icon: Package,
    gradient: "from-stone-50 to-stone-100",
    borderColor: "border-l-stone-400",
    iconBg: "bg-stone-200",
    iconColor: "text-stone-600",
    format: (v: number | string) => String(v || "0"),
  },
] as const

const shortcuts = [
  { href: "/admin/urunler", label: "Ürün Yönetimi", icon: Package },
  { href: "/admin/siparisler", label: "Siparişler", icon: ShoppingCart },
  { href: "/admin/musteriler", label: "Müşteriler", icon: Users },
  { href: "/admin/kuponlar", label: "Kuponlar", icon: TrendingUp },
] as const

export default function AdminDashboard() {
  const { stats, recentOrders, activityLogs, pendingTasks, chartRange, setChartRange, chartData } = useAdminDashboardStats()

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">

      {/* Hero Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {heroCards.map((card) => {
          const Icon = card.icon
          const value = stats?.[card.key]
          return (
            <Card
              key={card.key}
              className={`group relative overflow-hidden border border-stone-200 bg-gradient-to-br ${card.gradient} border-l-4 ${card.borderColor} shadow-sm hover:shadow-md transition-shadow duration-300`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-9 w-9 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${card.iconColor}`} />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-amber-500 transition-colors duration-300" />
                </div>
                <p className="text-2xl font-bold tracking-tight text-stone-800 tabular-nums">
                  {card.format(value as number)}
                </p>
                <p className="text-xs text-stone-500 mt-1 tracking-wide uppercase font-medium">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {shortcuts.map(({ href, label, icon: Icon }) => (
          <Link key={href} prefetch={false} href={href}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-stone-300 text-stone-700 bg-white hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 transition-all duration-200 whitespace-nowrap rounded-lg shadow-none"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left Column */}
        <div className="lg:col-span-8 space-y-5">

          {/* Sipariş Raporları Chart */}
          <Card className="shadow-sm border-stone-200 overflow-hidden bg-white">
            <CardHeader className="py-3.5 px-5 border-b border-stone-200 flex flex-row items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 text-amber-700" />
                </div>
                <CardTitle className="text-sm font-semibold tracking-tight text-stone-800">Sipariş Raporları</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center gap-1.5 mb-5 flex-wrap">
                {CHART_RANGES.map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={chartRange === value ? "default" : "ghost"}
                    size="sm"
                    className={`h-7 px-3 text-[11px] font-medium rounded-md transition-all duration-200 ${
                      chartRange === value
                        ? "bg-stone-800 hover:bg-stone-700 text-white shadow-sm"
                        : "text-stone-500 hover:text-stone-800 hover:bg-stone-100"
                    }`}
                    onClick={() => setChartRange(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <div className="h-[260px] w-full">
                <RevenueChart data={chartData} />
              </div>
            </CardContent>
          </Card>

          <ExchangeRateTicker />

          <PendingTasksGrid stats={stats} pendingTasks={pendingTasks} />

          {/* Row: Sipariş Akışı & Kampanya Ürünleri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <RecentOrderCard recentOrders={recentOrders} />

            <Card className="shadow-sm border-stone-200 bg-white">
              <CardHeader className="py-3 px-5 border-b border-stone-200 bg-stone-50">
                <CardTitle className="text-sm font-semibold tracking-tight text-stone-800">Kampanya Süresi Tanımlı Ürünler</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="text-center py-8 text-sm text-stone-400">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Henüz kampanya tanımlı ürün yok.
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-5">

          <RevenueSummary stats={stats} />

          {/* İşlem Günlükleri */}
          <Card className="shadow-sm border-stone-200 bg-white">
            <CardHeader className="py-3 px-5 border-b border-stone-200 bg-stone-50">
              <CardTitle className="text-sm font-semibold tracking-tight text-stone-800">
                İşlem Günlükleri <span className="text-stone-400 font-normal">· {formatDateTR(new Date(), "full")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="text-center py-6 text-sm text-stone-400">
                Henüz işlem kaydı bulunmuyor.
              </div>
            </CardContent>
          </Card>

          <ActivityLogTimeline activityLogs={activityLogs} />

        </div>
      </div>
    </div>
  )
}

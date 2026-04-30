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
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      <div className="flex flex-col items-center gap-2">
        <BarChart3 className="h-8 w-8 animate-pulse opacity-40" />
        <span>Grafik yükleniyor...</span>
      </div>
    </div>
  ),
})

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
        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-stone-900 to-stone-800 text-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <ShoppingCart className="h-4.5 w-4.5 text-amber-300" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/30 group-hover:text-amber-300 transition-colors duration-300" />
            </div>
            <p className="font-serif text-2xl font-bold tracking-tight">{stats?.totalOrders || "0"}</p>
            <p className="text-[11px] text-white/50 mt-0.5 tracking-wide uppercase">Toplam Sipariş</p>
          </CardContent>
          <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors duration-500" />
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-800 to-emerald-700 text-white shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <TrendingUp className="h-4.5 w-4.5 text-emerald-200" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-white/30 group-hover:text-emerald-200 transition-colors duration-300" />
            </div>
            <p className="font-serif text-2xl font-bold tracking-tight">
              {stats?.totalRevenue ? `₺${Number(stats.totalRevenue).toLocaleString("tr-TR", { maximumFractionDigits: 0 })}` : "₺0"}
            </p>
            <p className="text-[11px] text-white/50 mt-0.5 tracking-wide uppercase">Toplam Ciro</p>
          </CardContent>
          <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors duration-500" />
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-900 dark:to-stone-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-stone-200 dark:bg-white/10 flex items-center justify-center">
                <Users className="h-4.5 w-4.5 text-stone-600 dark:text-stone-300" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-stone-300 dark:text-white/30 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors duration-300" />
            </div>
            <p className="font-serif text-2xl font-bold tracking-tight text-foreground">{stats?.totalCustomers || "0"}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wide uppercase">Toplam Üye</p>
          </CardContent>
          <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors duration-500" />
        </Card>

        <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-900 dark:to-stone-800 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-4 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-lg bg-stone-200 dark:bg-white/10 flex items-center justify-center">
                <Package className="h-4.5 w-4.5 text-stone-600 dark:text-stone-300" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-stone-300 dark:text-white/30 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors duration-300" />
            </div>
            <p className="font-serif text-2xl font-bold tracking-tight text-foreground">{stats?.totalProducts || "0"}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 tracking-wide uppercase">Toplam Ürün</p>
          </CardContent>
          <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors duration-500" />
        </Card>
      </div>

      {/* Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {shortcuts.map(({ href, label, icon: Icon }) => (
          <Link key={href} prefetch={false} href={href}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white hover:border-stone-300 dark:hover:border-stone-600 transition-all duration-200 whitespace-nowrap rounded-lg shadow-none"
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
          <Card className="shadow-sm border-stone-200/60 dark:border-stone-800 overflow-hidden">
            <CardHeader className="py-3.5 px-5 border-b border-stone-100 dark:border-stone-800 flex flex-row items-center justify-between bg-stone-50/50 dark:bg-stone-900/30">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
                </div>
                <CardTitle className="text-sm font-semibold tracking-tight">Sipariş Raporları</CardTitle>
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
                        ? "bg-stone-900 hover:bg-stone-800 text-white dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100 shadow-sm"
                        : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800"
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

            <Card className="shadow-sm border-stone-200/60 dark:border-stone-800">
              <CardHeader className="py-3 px-5 border-b border-stone-100 dark:border-stone-800">
                <CardTitle className="text-sm font-semibold tracking-tight">Kampanya Süresi Tanımlı Ürünler</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="text-center py-8 text-sm text-stone-400 dark:text-stone-500">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
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
          <Card className="shadow-sm border-stone-200/60 dark:border-stone-800">
            <CardHeader className="py-3 px-5 border-b border-stone-100 dark:border-stone-800">
              <CardTitle className="text-sm font-semibold tracking-tight">
                İşlem Günlükleri <span className="text-muted-foreground font-normal">· {formatDateTR(new Date(), "full")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="text-center py-6 text-sm text-stone-400 dark:text-stone-500">
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

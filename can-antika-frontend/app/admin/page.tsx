"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { ShoppingCart, Users, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAdminDashboardStats } from "@/hooks/useAdminDashboardStats"
import ExchangeRateTicker from "@/components/dashboard/exchange-rate-ticker"
import PendingTasksGrid from "@/components/dashboard/pending-tasks-grid"
import RecentOrderCard from "@/components/dashboard/recent-order-card"
import RevenueSummary from "@/components/dashboard/revenue-summary"
import ActivityLogTimeline from "@/components/dashboard/activity-log-timeline"
import { formatDateTR } from "@/lib/utils"

const RevenueChart = dynamic(() => import("@/components/dashboard/revenue-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      Grafik yÃ¼kleniyor...
    </div>
  ),
})

export default function AdminDashboard() {
  const { stats, recentOrders, activityLogs, pendingTasks, chartRange, setChartRange, chartData } = useAdminDashboardStats()

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">

      {/* 1. KÄ±sayollar */}
      <Card className="shadow-xs border-border/50">
        <CardHeader className="py-3 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">KÄ±sayollar</CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex items-center overflow-x-auto gap-2">
          <Link href="/admin/urunler">
            <Button variant="outline" size="sm" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50 transition-colors whitespace-nowrap">ÃœrÃ¼n YÃ¶netimi</Button>
          </Link>
          <Link href="/admin/siparisler">
            <Button variant="outline" size="sm" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50 transition-colors whitespace-nowrap">SipariÅŸler</Button>
          </Link>
          <Link href="/admin/musteriler">
            <Button variant="outline" size="sm" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50 transition-colors whitespace-nowrap">MÃ¼ÅŸteriler</Button>
          </Link>
          <Link href="/admin/ayarlar">
            <Button variant="outline" size="sm" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50 transition-colors whitespace-nowrap">Site AyarlarÄ±</Button>
          </Link>
          <Link href="/admin/kuponlar">
            <Button variant="outline" size="sm" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50 transition-colors whitespace-nowrap">Kuponlar</Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">

          {/* SipariÅŸ RaporlarÄ± Chart */}
          <Card className="shadow-xs border-border/50">
            <CardHeader className="py-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">SipariÅŸ RaporlarÄ±</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {(["7D", "30D", "90D", "6M", "1Y"] as const).map(range => (
                  <Button
                    key={range}
                    variant={chartRange === range ? "default" : "outline"}
                    size="sm"
                    className={`h-7 px-3 text-xs rounded-full ${chartRange === range ? "bg-teal-500 hover:bg-teal-600 text-white" : ""}`}
                    onClick={() => setChartRange(range)}
                  >
                    {range === "7D" ? "7 GÃœNLÃœK" : range === "30D" ? "30 GÃœNLÃœK" : range === "90D" ? "90 GÃœNLÃœK" : range === "6M" ? "6 AYLIK" : "1 YILLIK"}
                  </Button>
                ))}
              </div>
              <div className="h-[250px] w-full">
                <RevenueChart data={chartData} />
              </div>
            </CardContent>
          </Card>

          <ExchangeRateTicker />

          <PendingTasksGrid stats={stats} pendingTasks={pendingTasks} />

          {/* Row: SipariÅŸ AkÄ±ÅŸÄ± & Kampanya ÃœrÃ¼nleri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentOrderCard recentOrders={recentOrders} />

            <Card className="shadow-xs border-border/50">
              <CardHeader className="py-3 border-b border-border/50">
                <CardTitle className="text-sm font-semibold">Kampanya SÃ¼resi TanÄ±mlÄ± ÃœrÃ¼nler</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center py-4 text-sm bg-amber-50/70 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200/70 dark:border-amber-900/30">
                  KayÄ±t bulunamadÄ±.
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">

          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-xs border-border/50 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100 dark:border-indigo-900">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 bg-indigo-100/80 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-2">
                  <ShoppingCart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="font-serif text-2xl font-bold text-foreground">{stats?.totalOrders || "0"}</p>
                <p className="text-xs text-muted-foreground mt-1">Toplam SipariÅŸ</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border/50 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950/20 dark:to-background border-slate-200/70 dark:border-slate-800">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 bg-slate-200/80 dark:bg-slate-800/60 rounded-full flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                </div>
                <p className="font-serif text-2xl font-bold text-foreground">{stats?.totalCustomers || "0"}</p>
                <p className="text-xs text-muted-foreground mt-1">Toplam Ãœye</p>
              </CardContent>
            </Card>
          </div>

          <RevenueSummary stats={stats} />

          {/* Ä°ÅŸlem GÃ¼nlÃ¼kleri */}
          <Card className="shadow-xs border-border/50">
            <CardHeader className="py-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Ä°ÅŸlem GÃ¼nlÃ¼kleri ({formatDateTR(new Date(), "full")})</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-center py-4 text-sm bg-amber-50/70 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-md border border-amber-200/70 dark:border-amber-900/30">
                KayÄ±t bulunamadÄ±.
              </div>
            </CardContent>
          </Card>

          <ActivityLogTimeline activityLogs={activityLogs} />

        </div>
      </div>
    </div>
  )
}



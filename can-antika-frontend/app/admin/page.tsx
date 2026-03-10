"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  TrendingUp, ShoppingCart, Users, Package,
  AlertTriangle, Clock, UserPlus, Activity,
  Monitor, RefreshCw, Box, FileText, CheckCircle,
  HelpCircle, MessageSquare, Phone, XCircle, HandCoins, Info
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { statsApi, orderApi, activityLogApi, contactApi, bankTransferApi } from "@/lib/api"
import type { StatsResponse, OrderResponse } from "@/lib/types"

const RevenueChart = dynamic(() => import("@/components/dashboard/revenue-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
      Grafik yükleniyor...
    </div>
  ),
})

const statusLabels: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Ödeme Onayı Bekliyor", className: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  SHIPPED: { label: "Kargoda", className: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400" },
  DELIVERED: { label: "Teslim Edildi", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  PAID: { label: "Ödendi", className: "bg-primary/15 text-primary" },
  CANCELLED: { label: "İptal", className: "bg-destructive/15 text-destructive" },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([])
  const [chartRange, setChartRange] = useState<"7D" | "30D" | "90D" | "6M" | "1Y">("30D")

  const [exchangeRates, setExchangeRates] = useState<{ name: string, value: string }[]>([])
  const [activityLogs, setActivityLogs] = useState<any[]>([])

  const [pendingTasks, setPendingTasks] = useState({ contactRequests: 0, bankTransfers: 0 })

  const RANGE_DAYS: Record<string, number> = { "7D": 7, "30D": 30, "90D": 90, "6M": 180, "1Y": 365 }

  // Fetch stats when chartRange changes
  useEffect(() => {
    statsApi.getStats(RANGE_DAYS[chartRange]).then(setStats).catch((e) => console.error("İstatistik alınamadı:", e))
  }, [chartRange])

  // Fetch other data on mount
  useEffect(() => {
    Promise.all([
      orderApi.getAllOrders(0, 5).catch(() => ({ items: [], totalElement: 0, pageNumber: 0, pageSize: 5 })),
      activityLogApi.getAll(0, 5).catch(() => ({ items: [] })),
      contactApi.getUnreadCount().catch(() => ({ count: 0 })),
      bankTransferApi.getPendingCount().catch(() => ({ count: 0 }))
    ]).then(([ordersData, logsData, contactCount, transferCount]) => {
      setRecentOrders(ordersData.items)
      setActivityLogs(logsData.items || [])
      setPendingTasks({ contactRequests: contactCount?.count || 0, bankTransfers: transferCount?.count || 0 })
    })

    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.TRY) {
          const tryRate = data.rates.TRY
          const eurRate = tryRate / data.rates.EUR
          const chfRate = tryRate / data.rates.CHF
          const audRate = tryRate / data.rates.AUD
          const gbpRate = tryRate / data.rates.GBP

          setExchangeRates([
            { name: "USD Satış", value: `₺${tryRate.toFixed(4)}` },
            { name: "EUR Satış", value: `₺${eurRate.toFixed(4)}` },
            { name: "GBP Satış", value: `₺${gbpRate.toFixed(4)}` },
            { name: "CHF Satış", value: `₺${chfRate.toFixed(4)}` },
            { name: "AUD Satış", value: `₺${audRate.toFixed(4)}` },
          ])
        }
      }).catch(() => { /* silently ignore exchange rate errors */ })
  }, [])

  const chartData = stats?.dailyStats?.length
    ? stats.dailyStats.map(d => ({ name: new Date(d.date).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short' }), revenue: d.revenue }))
    : []

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: flex;
          animation: ticker 30s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* 1. Kısayollar */}
      <Card className="shadow-xs border-border/50">
        <CardHeader className="py-3 border-b border-border/50">
          <CardTitle className="text-sm font-semibold">Kısayollar</CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex items-center overflow-x-auto gap-2">
          <Link href="/admin/urunler">
            <Button variant="outline" size="sm" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50 transition-colors whitespace-nowrap">Ürün Yönetimi</Button>
          </Link>
          <Link href="/admin/siparisler">
            <Button variant="outline" size="sm" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50 transition-colors whitespace-nowrap">Siparişler</Button>
          </Link>
          <Link href="/admin/musteriler">
            <Button variant="outline" size="sm" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50 transition-colors whitespace-nowrap">Müşteriler</Button>
          </Link>
          <Link href="/admin/ayarlar">
            <Button variant="outline" size="sm" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50 transition-colors whitespace-nowrap">Site Ayarları</Button>
          </Link>
          <Link href="/admin/kuponlar">
            <Button variant="outline" size="sm" className="bg-blue-50/50 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200/50 transition-colors whitespace-nowrap">Kuponlar</Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (Chart, Exchange, Pending Tasks, Flow, License) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Sipariş Raporları Chart */}
          <Card className="shadow-xs border-border/50">
            <CardHeader className="py-4 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Sipariş Raporları</CardTitle>
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
                    {range === "7D" ? "7 GÜNLÜK" : range === "30D" ? "30 GÜNLÜK" : range === "90D" ? "90 GÜNLÜK" : range === "6M" ? "6 AYLIK" : "1 YILLIK"}
                  </Button>
                ))}
              </div>
              <div className="h-[250px] w-full">
                <RevenueChart data={chartData} />}
              </div>
            </CardContent>
          </Card>

          {/* Döviz Kurları */}
          <Card className="shadow-xs border-border/50 overflow-hidden relative">
            <CardContent className="p-0 flex items-stretch">
              <div className="bg-indigo-600 text-white px-4 py-2 flex items-center gap-2 m-1 rounded-md shrink-0 text-sm font-medium z-10 relative shadow-sm">
                <RefreshCw className="h-4 w-4" />
                Döviz Kurları
              </div>
              <div className="flex-1 overflow-hidden flex items-center bg-transparent">
                <div className="flex items-center whitespace-nowrap gap-8 animate-ticker pr-8 relative">
                  {[...exchangeRates, ...exchangeRates, ...exchangeRates, ...exchangeRates].map((rate, i) => (
                    <span key={i} className="flex items-center gap-1 shrink-0">
                      <span className="font-semibold text-foreground">{rate.name}:</span>
                      <span className="text-emerald-500 font-medium">{rate.value}</span>
                    </span>
                  ))}
                  {exchangeRates.length === 0 && <span className="text-muted-foreground text-sm shrink-0">Yükleniyor...</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bekleyen İşler */}
          <Card className="shadow-xs border-border/50">
            <CardHeader className="py-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Bekleyen İşler</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link href="/admin/siparisler" className="flex items-center justify-between p-3 border rounded-lg border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 h-8 w-8 rounded-full flex items-center justify-center text-indigo-600"><Clock className="h-4 w-4" /></div>
                    <span className="text-sm text-foreground">Bekleyen Siparişler</span>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
                    {stats?.pendingOrders || 0}
                  </Badge>
                </Link>

                <Link href="/admin/urunler" className="flex items-center justify-between p-3 border rounded-lg border-rose-100 bg-rose-50/30 hover:bg-rose-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-100 h-8 w-8 rounded-full flex items-center justify-center text-rose-600"><AlertTriangle className="h-4 w-4" /></div>
                    <span className="text-sm text-foreground">Düşük Stoklu Ürünler</span>
                  </div>
                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                    {stats?.lowStockProducts || 0}
                  </Badge>
                </Link>

                <Link href="/admin/iletisim-talepleri" className="flex items-center justify-between p-3 border rounded-lg border-blue-100 bg-blue-50/30 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 h-8 w-8 rounded-full flex items-center justify-center text-blue-600"><MessageSquare className="h-4 w-4" /></div>
                    <span className="text-sm text-foreground">Yeni İletişim Talepleri</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {pendingTasks.contactRequests}
                  </Badge>
                </Link>

                <Link href="/admin/havale-bildirimleri" className="flex items-center justify-between p-3 border rounded-lg border-amber-100 bg-amber-50/30 hover:bg-amber-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 h-8 w-8 rounded-full flex items-center justify-center text-amber-600"><HandCoins className="h-4 w-4" /></div>
                    <span className="text-sm text-foreground">Havale Onayı Bekleyenler</span>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    {pendingTasks.bankTransfers}
                  </Badge>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Row: Sipariş Akışı & Kampanya Ürünleri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-xs border-border/50">
              <CardHeader className="py-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">Sipariş Akışı</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-6 w-6 rounded-full"><span className="text-xs">&lt;</span></Button>
                  <Button variant="outline" size="icon" className="h-6 w-6 rounded-full"><span className="text-xs">&gt;</span></Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-500 hover:bg-blue-600 rounded">Sipariş No: {recentOrders[0].id}</Badge>
                      <span className="text-xs text-muted-foreground">- Ödeme Onayı Bekliyor</span>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {recentOrders[0].user?.name || "Misafir Müşteri"} - ₺{recentOrders[0].totalAmount.toLocaleString("tr-TR")}
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded-md">
                      <div className="h-10 w-10 bg-muted/50 rounded flex items-center justify-center overflow-hidden">
                        {recentOrders[0].orderItems?.[0]?.product?.imageUrls?.[0] ? (
                          <img src={recentOrders[0].orderItems[0].product.imageUrls[0]} alt="ürün resmi" className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{recentOrders[0].orderItems?.[0]?.title}</p>
                        <p className="text-xs font-semibold text-blue-600">{recentOrders[0].orderItems?.[0]?.quantity} Adet</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-md border border-rose-100 dark:border-rose-900/30">
                    Kayıt bulunamadı.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border/50">
              <CardHeader className="py-3 border-b border-border/50">
                <CardTitle className="text-sm font-semibold">Kampanya Süresi Tanımlı Ürünler</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center py-4 text-sm bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-md border border-rose-100 dark:border-rose-900/30">
                  Kayıt bulunamadı.
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Right Column (Stat Cards Sidebar + Log Records) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Top Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-xs border-border/50 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-background border-indigo-100 dark:border-indigo-900">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 bg-indigo-100/80 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-2">
                  <ShoppingCart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="font-serif text-2xl font-bold text-foreground">{stats?.totalOrders || "0"}</p>
                <p className="text-xs text-muted-foreground mt-1">Toplam Sipariş</p>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border/50 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-background border-rose-100 dark:border-rose-900">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 bg-rose-100/80 dark:bg-rose-900/50 rounded-full flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                <p className="font-serif text-2xl font-bold text-foreground">{stats?.totalCustomers || "0"}</p>
                <p className="text-xs text-muted-foreground mt-1">Toplam Üye</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Summaries */}
          <Card className="shadow-xs border-border/50">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                  <p className="text-sm font-semibold text-foreground">Günlük Ciro</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{new Date().toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' })}</p>
                </div>
                <p className="text-sm font-bold text-rose-500">
                  {stats?.dailyStats?.[stats.dailyStats.length - 1]?.revenue
                    ? `₺${stats.dailyStats[stats.dailyStats.length - 1].revenue.toLocaleString("tr-TR")}`
                    : "0,00 TL"}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                  <p className="text-sm font-semibold text-foreground">Aylık Ciro</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{new Date().toLocaleDateString("tr-TR", { month: 'long', year: 'numeric' })}</p>
                </div>
                <p className="text-sm font-bold text-rose-500">
                  {stats?.monthlyTrends?.[stats.monthlyTrends.length - 1]?.revenue
                    ? `₺${stats.monthlyTrends[stats.monthlyTrends.length - 1].revenue.toLocaleString("tr-TR")}`
                    : "0,00 TL"}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                  <p className="text-sm font-semibold text-foreground">Yıllık Ciro</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{new Date().getFullYear()}</p>
                </div>
                <p className="text-sm font-bold text-rose-500">
                  {stats?.totalRevenue ? `₺${stats.totalRevenue.toLocaleString("tr-TR")}` : "0,00 TL"}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-rose-50/50 dark:bg-rose-950/10">
                <div>
                  <p className="text-sm font-semibold text-foreground">Geçen Ay</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Önceki Ayın Cirosu</p>
                </div>
                <p className="text-sm font-bold text-rose-500">
                  {stats?.monthlyTrends?.length && stats.monthlyTrends.length > 1
                    ? `₺${stats.monthlyTrends[stats.monthlyTrends.length - 2].revenue.toLocaleString("tr-TR")}`
                    : "0,00 TL"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* İşlem Günlükleri */}
          <Card className="shadow-xs border-border/50">
            <CardHeader className="py-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">İşlem Günlükleri ({new Date().toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', weekday: 'long', year: 'numeric' })})</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-center py-4 text-sm bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-md border border-rose-100 dark:border-rose-900/30">
                Kayıt bulunamadı.
              </div>
            </CardContent>
          </Card>

          {/* Günlük Log Kayıtları Timeline */}
          <Card className="shadow-xs border-border/50">
            <CardHeader className="py-3 border-b border-border/50">
              <CardTitle className="text-sm font-semibold">Günlük Log Kayıtları</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative border-l border-muted ml-3 space-y-6">
                {activityLogs.length > 0 ? activityLogs.map((log: any, i: number) => (
                  <div key={i} className="pl-6 relative">
                    <div className="absolute -left-[13px] top-1 h-6 w-6 rounded-full flex items-center justify-center border-4 border-background text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30">
                      <RefreshCw className="h-2.5 w-2.5" />
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{log.adminName || "Sistem"}</p>
                        <p className="text-[11px] font-medium text-amber-500 mt-0.5">{log.action}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{log.entityType && `${log.entityType} içeriği: `} {log.description}</p>
                  </div>
                )) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">Kayıt bulunamadı.</div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}

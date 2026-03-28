"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { BarChart3, Package, Users, TrendingUp, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { reportApi } from "@/lib/api"
import type { RevenueReport, SalesByCategoryReport, StockReport, CustomerReport } from "@/lib/types"

type Tab = "sales" | "stock" | "customers" | "revenue"

interface ReportData {
    revenue: RevenueReport[]
    sales: SalesByCategoryReport[]
    stock: StockReport[]
    customers: CustomerReport[]
}

export default function ReportsPage() {
    const [tab, setTab] = useState<Tab>("revenue")
    const [data, setData] = useState<ReportData>({ revenue: [], sales: [], stock: [], customers: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData(tab)
    }, [tab])

    const loadData = async (t: Tab) => {
        setLoading(true)
        try {
            switch (t) {
                case "sales": {
                    const sales = await reportApi.salesByCategory()
                    setData(prev => ({ ...prev, sales }))
                    break
                }
                case "stock": {
                    const stock = await reportApi.stockReport()
                    setData(prev => ({ ...prev, stock }))
                    break
                }
                case "customers": {
                    const customers = await reportApi.customerReport()
                    setData(prev => ({ ...prev, customers }))
                    break
                }
                case "revenue": {
                    const revenue = await reportApi.revenueReport(12)
                    setData(prev => ({ ...prev, revenue }))
                    break
                }
            }
        } catch { toast.error("Rapor yüklenemedi") }
        finally { setLoading(false) }
    }

    const tabs = [
        { key: "revenue" as Tab, label: "Gelir", icon: TrendingUp },
        { key: "sales" as Tab, label: "Kategori Satış", icon: BarChart3 },
        { key: "stock" as Tab, label: "Stok", icon: Package },
        { key: "customers" as Tab, label: "Müşteriler", icon: Users },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">Raporlar</h1>
                <p className="text-muted-foreground">Detaylı satış ve performans raporları</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {tabs.map((t) => (
                    <Button
                        key={t.key}
                        variant={tab === t.key ? "default" : "outline"}
                        className="gap-2"
                        onClick={() => setTab(t.key)}
                    >
                        <t.icon className="h-4 w-4" />
                        {t.label}
                    </Button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
                <>
                    {/* Revenue Report */}
                    {tab === "revenue" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-serif">Aylık Gelir Raporu</CardTitle>
                                <CardDescription>Son 12 aylık gelir ve sipariş verileri</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="pb-3 text-left font-medium text-muted-foreground">Dönem</th>
                                                <th className="pb-3 text-right font-medium text-muted-foreground">Gelir</th>
                                                <th className="pb-3 text-right font-medium text-muted-foreground">Sipariş</th>
                                                <th className="pb-3 text-right font-medium text-muted-foreground">Ort. Sipariş</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.revenue.map((r) => (
                                                <tr key={r.period} className="border-b border-border/50">
                                                    <td className="py-3 font-medium">{r.period}</td>
                                                    <td className="py-3 text-right">₺{Number(r.revenue).toLocaleString("tr-TR")}</td>
                                                    <td className="py-3 text-right">{r.orderCount}</td>
                                                    <td className="py-3 text-right">₺{Number(r.avgOrderValue).toLocaleString("tr-TR")}</td>
                                                </tr>
                                            ))}
                                            {data.revenue.length === 0 && (
                                                <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Veri yok</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sales by Category */}
                    {tab === "sales" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-serif">Kategoriye Göre Satış</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.sales.length === 0 && <p className="text-center text-muted-foreground py-8">Veri yok</p>}
                                    {data.sales.map((cat) => {
                                        const max = Math.max(...data.sales.map((c) => c.totalRevenue || 0), 1)
                                        const pct = ((cat.totalRevenue || 0) / max) * 100
                                        return (
                                            <div key={cat.categoryId} className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium">{cat.categoryName}</span>
                                                    <span className="text-muted-foreground">{cat.totalSold} adet · ₺{Number(cat.totalRevenue).toLocaleString("tr-TR")}</span>
                                                </div>
                                                <div className="h-3 rounded-full bg-muted overflow-hidden">
                                                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stock Report */}
                    {tab === "stock" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-serif flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-500" /> Düşük Stok Ürünleri
                                </CardTitle>
                                <CardDescription>Stoku 10 ve altında olan ürünler</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {data.stock.length === 0 && <p className="text-center text-muted-foreground py-8">Tüm ürünler yeterli stokta</p>}
                                    {data.stock.map((p, i) => (
                                        <div key={`${p.productId}-${i}`} className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                                            {p.imageUrl ? (
                                                <Image src={p.imageUrl} alt={p.productTitle} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" unoptimized />
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{p.productTitle}</p>
                                                <p className="text-xs text-muted-foreground">{p.categoryName}</p>
                                            </div>
                                            <Badge variant={p.stock === 0 ? "destructive" : "outline"} className="shrink-0">
                                                {p.stock === 0 ? "Tükendi" : `${p.stock} adet`}
                                            </Badge>
                                            <span className="text-sm font-medium shrink-0">₺{Number(p.price).toLocaleString("tr-TR")}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Customer Report */}
                    {tab === "customers" && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-serif">En İyi Müşteriler</CardTitle>
                                <CardDescription>En çok harcama yapan 20 müşteri</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="pb-3 text-left font-medium text-muted-foreground">#</th>
                                                <th className="pb-3 text-left font-medium text-muted-foreground">Müşteri</th>
                                                <th className="pb-3 text-right font-medium text-muted-foreground">Sipariş</th>
                                                <th className="pb-3 text-right font-medium text-muted-foreground">Toplam</th>
                                                <th className="pb-3 text-right font-medium text-muted-foreground">Kayıt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.customers.map((c, i) => (
                                                <tr key={c.userId} className="border-b border-border/50">
                                                    <td className="py-3 text-muted-foreground">{i + 1}</td>
                                                    <td className="py-3">
                                                        <p className="font-medium">{c.userName}</p>
                                                        <p className="text-xs text-muted-foreground">{c.userEmail}</p>
                                                    </td>
                                                    <td className="py-3 text-right">{c.totalOrders}</td>
                                                    <td className="py-3 text-right font-medium">₺{Number(c.totalSpent).toLocaleString("tr-TR")}</td>
                                                    <td className="py-3 text-right text-muted-foreground">{c.registeredAt || "—"}</td>
                                                </tr>
                                            ))}
                                            {data.customers.length === 0 && (
                                                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Veri yok</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}

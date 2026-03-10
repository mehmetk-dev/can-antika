"use client"

import { useState, useEffect } from "react"
import { Activity, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { activityLogApi } from "@/lib/api"

const actionLabels: Record<string, { label: string; color: string }> = {
    PRODUCT_CREATED: { label: "Ürün Eklendi", color: "bg-emerald-500/15 text-emerald-700" },
    PRODUCT_UPDATED: { label: "Ürün Güncellendi", color: "bg-blue-500/15 text-blue-700" },
    PRODUCT_DELETED: { label: "Ürün Silindi", color: "bg-red-500/15 text-red-700" },
    ORDER_STATUS_UPDATED: { label: "Sipariş Güncellendi", color: "bg-amber-500/15 text-amber-700" },
    ORDER_CANCELLED: { label: "Sipariş İptal", color: "bg-red-500/15 text-red-700" },
    CATEGORY_CREATED: { label: "Kategori Eklendi", color: "bg-emerald-500/15 text-emerald-700" },
    CATEGORY_UPDATED: { label: "Kategori Güncellendi", color: "bg-blue-500/15 text-blue-700" },
    CATEGORY_DELETED: { label: "Kategori Silindi", color: "bg-red-500/15 text-red-700" },
    COUPON_CREATED: { label: "Kupon Oluşturuldu", color: "bg-violet-500/15 text-violet-700" },
    SETTINGS_UPDATED: { label: "Ayarlar Güncellendi", color: "bg-gray-500/15 text-gray-700" },
    RETURN_APPROVED: { label: "İade Onaylandı", color: "bg-emerald-500/15 text-emerald-700" },
    RETURN_REJECTED: { label: "İade Reddedildi", color: "bg-red-500/15 text-red-700" },
    TICKET_RESPONDED: { label: "Ticket Yanıtlandı", color: "bg-blue-500/15 text-blue-700" },
    FAQ_CREATED: { label: "SSS Eklendi", color: "bg-emerald-500/15 text-emerald-700" },
    PAGE_CREATED: { label: "Sayfa Oluşturuldu", color: "bg-emerald-500/15 text-emerald-700" },
}

interface LogItem {
    id: number; adminId: number; adminName: string; action: string
    entityType?: string; entityId?: number; description?: string; createdAt: string
}

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<LogItem[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    useEffect(() => { load(0) }, [])

    const load = async (p: number) => {
        setLoading(true)
        try {
            const data = await activityLogApi.getAll(p, 30)
            const items = (data.items || []) as unknown as LogItem[]
            if (p === 0) setLogs(items)
            else setLogs(prev => [...prev, ...items])
            setHasMore((data.items?.length || 0) === 30)
            setPage(p)
        } catch { toast.error("Yüklenemedi") }
        finally { setLoading(false) }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">Aktivite Logları</h1>
                <p className="text-muted-foreground">Admin panelindeki son işlemler</p>
            </div>

            {logs.length === 0 && !loading ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">Henüz aktivite kaydı yok</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {logs.map((log) => {
                                const info = actionLabels[log.action] || { label: log.action, color: "bg-muted" }
                                return (
                                    <div key={log.id} className="flex items-start gap-4 p-4">
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0 mt-0.5">
                                            {log.adminName?.charAt(0)?.toUpperCase() || "A"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium">{log.adminName || "Admin"}</span>
                                                <Badge className={`text-xs ${info.color}`}>{info.label}</Badge>
                                            </div>
                                            {log.description && (
                                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{log.description}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {new Date(log.createdAt).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
            {!loading && hasMore && logs.length > 0 && (
                <div className="flex justify-center">
                    <button className="text-sm text-primary hover:underline" onClick={() => load(page + 1)}>Daha fazla yükle</button>
                </div>
            )}
        </div>
    )
}
